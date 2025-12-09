import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { createSuccessResponse } from '../utils/transform';
import { aiGateway } from '../services/AIGateway';
import { prisma } from '../config/database';
import logger from '../utils/logger';
import type { GenerateRequest } from '../services/AIGateway/types';

/**
 * AI Gateway Generate Controller
 * POST /api/v1/ai/generate
 *
 * Generates text using the AI Gateway service.
 * Handles request routing, quota management, and usage tracking.
 */
export const generate = asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  const userId = req.userId!; // Set by aiGatewayAuth middleware
  const generateRequest: GenerateRequest = req.body; // Validated by middleware

  logger.info('AI Gateway generate request', {
    userId,
    provider: generateRequest.provider,
    model: generateRequest.model,
    promptLength: generateRequest.prompt?.length || 0,
  });

  try {
    // Generate text using AI Gateway
    const response = await aiGateway.generate(generateRequest, userId);

    // Track usage in database
    await trackUsage(userId, generateRequest, response, Date.now() - startTime);

    // Update user quota
    await updateQuota(userId, response.data.costEstimate.amount);

    // Return success response
    res.status(200).json(response);

    logger.info('AI Gateway generate success', {
      userId,
      provider: response.data.provider,
      model: response.data.model,
      tokens: response.data.usage.totalTokens,
      cost: response.data.costEstimate.amount,
      latency: response.data.latency,
    });
  } catch (error) {
    // Log the error
    logger.error('AI Gateway generate failed', {
      userId,
      error: error instanceof Error ? error.message : String(error),
      latency: Date.now() - startTime,
    });

    // Re-throw to be handled by error handler middleware
    throw error;
  }
});

/**
 * AI Gateway Health Check Controller
 * GET /api/v1/ai/health
 *
 * Checks the health status of all registered AI providers.
 */
export const health = asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { provider, detailed } = req.query;

  logger.info('AI Gateway health check', { provider, detailed });

  try {
    // Get health status from all providers
    const healthStatuses = await aiGateway.health();

    // Filter by provider if specified
    const filteredStatuses = provider
      ? { [provider as string]: healthStatuses[provider as string] }
      : healthStatuses;

    // Get registered providers info
    const registeredProviders = aiGateway.getRegisteredProviders();

    // Build response
    const healthData: any = {
      status: Object.values(filteredStatuses).every((s) => s.healthy) ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      providers: filteredStatuses,
    };

    // Add detailed info if requested
    if (detailed === 'true' || detailed === '1') {
      healthData.registered = registeredProviders;
      healthData.summary = {
        total: registeredProviders.length,
        healthy: Object.values(filteredStatuses).filter((s) => s.healthy).length,
        unhealthy: Object.values(filteredStatuses).filter((s) => !s.healthy).length,
      };
    }

    // Determine status code
    const statusCode = healthData.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json(createSuccessResponse(healthData));

    logger.info('AI Gateway health check complete', {
      status: healthData.status,
      providers: Object.keys(filteredStatuses).length,
      responseTime: healthData.responseTime,
    });
  } catch (error) {
    logger.error('AI Gateway health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
});

/**
 * Get User Quota Controller
 * GET /api/v1/ai/quota
 *
 * Returns the authenticated user's current quota status.
 */
export const getQuota = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;

  logger.info('AI Gateway get quota request', { userId });

  // Fetch user quota
  const quota = await prisma.aIQuota.findUnique({
    where: { userId },
  });

  if (!quota) {
    res.status(404).json(
      createSuccessResponse(null, 'No quota found for user. Please contact support.')
    );
    return;
  }

  // Calculate usage percentages
  const dailyUsagePercent = ((quota.dailyRequestCount / quota.dailyRequestLimit) * 100).toFixed(1);
  const monthlyUsagePercent = ((quota.monthlyRequestCount / quota.monthlyRequestLimit) * 100).toFixed(1);
  const monthlySpendPercent = ((quota.monthlySpendAmount / quota.monthlySpendLimit) * 100).toFixed(1);

  const quotaData = {
    tier: quota.tier,
    daily: {
      used: quota.dailyRequestCount,
      limit: quota.dailyRequestLimit,
      remaining: quota.dailyRequestLimit - quota.dailyRequestCount,
      usagePercent: parseFloat(dailyUsagePercent),
      resetAt: quota.dailyResetAt,
    },
    monthly: {
      requests: {
        used: quota.monthlyRequestCount,
        limit: quota.monthlyRequestLimit,
        remaining: quota.monthlyRequestLimit - quota.monthlyRequestCount,
        usagePercent: parseFloat(monthlyUsagePercent),
      },
      spend: {
        amount: quota.monthlySpendAmount,
        limit: quota.monthlySpendLimit,
        remaining: quota.monthlySpendLimit - quota.monthlySpendAmount,
        usagePercent: parseFloat(monthlySpendPercent),
        currency: 'USD',
      },
      resetAt: quota.monthlyResetAt,
    },
  };

  res.status(200).json(createSuccessResponse(quotaData));

  logger.info('AI Gateway quota retrieved', {
    userId,
    tier: quota.tier,
    dailyUsed: quota.dailyRequestCount,
    monthlyUsed: quota.monthlyRequestCount,
  });
});

/**
 * Get User Usage History Controller
 * GET /api/v1/ai/usage
 *
 * Returns the authenticated user's AI Gateway usage history.
 */
export const getUsage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { limit = '50', offset = '0', provider, dateFrom, dateTo } = req.query;

  logger.info('AI Gateway get usage request', { userId, limit, offset, provider });

  // Build query filters
  const where: any = { userId };
  if (provider) {
    const providerRecord = await prisma.aIProvider.findUnique({
      where: { name: provider as string },
    });
    if (providerRecord) {
      where.providerId = providerRecord.id;
    }
  }
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
    if (dateTo) where.createdAt.lte = new Date(dateTo as string);
  }

  // Fetch usage records
  const [usageRecords, totalCount] = await Promise.all([
    prisma.aIUsage.findMany({
      where,
      include: {
        provider: {
          select: {
            name: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    }),
    prisma.aIUsage.count({ where }),
  ]);

  // Calculate aggregates
  const aggregates = await prisma.aIUsage.aggregate({
    where,
    _sum: {
      totalTokens: true,
      estimatedCost: true,
    },
    _avg: {
      latency: true,
    },
    _count: {
      id: true,
    },
  });

  const usageData = {
    records: usageRecords.map((record) => ({
      id: record.id,
      provider: record.provider.displayName,
      providerName: record.provider.name,
      model: record.model,
      operation: record.operation,
      tokens: {
        prompt: record.promptTokens,
        completion: record.completionTokens,
        total: record.totalTokens,
      },
      latency: record.latency,
      cached: record.cached,
      successful: record.successful,
      cost: record.estimatedCost,
      error: record.errorCode
        ? {
            code: record.errorCode,
            message: record.errorMessage,
          }
        : null,
      createdAt: record.createdAt,
    })),
    pagination: {
      total: totalCount,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      hasMore: parseInt(offset as string) + usageRecords.length < totalCount,
    },
    summary: {
      totalRequests: aggregates._count.id,
      totalTokens: aggregates._sum.totalTokens || 0,
      totalCost: aggregates._sum.estimatedCost || 0,
      averageLatency: Math.round(aggregates._avg.latency || 0),
    },
  };

  res.status(200).json(createSuccessResponse(usageData));

  logger.info('AI Gateway usage retrieved', {
    userId,
    records: usageRecords.length,
    total: totalCount,
  });
});

// ========================================
// Helper Functions
// ========================================

/**
 * Track usage in the database
 */
async function trackUsage(
  userId: string,
  request: GenerateRequest,
  response: any,
  latency: number
): Promise<void> {
  try {
    // Find provider ID
    const provider = await prisma.aIProvider.findUnique({
      where: { name: response.data.provider },
    });

    if (!provider) {
      logger.warn('Provider not found in database', { provider: response.data.provider });
      return;
    }

    // Create usage record
    await prisma.aIUsage.create({
      data: {
        userId,
        providerId: provider.id,
        model: response.data.model,
        operation: 'generate',
        prompt: request.prompt?.substring(0, 1000), // Store first 1000 chars only
        promptTokens: response.data.usage.promptTokens,
        completionTokens: response.data.usage.completionTokens,
        totalTokens: response.data.usage.totalTokens,
        latency,
        cached: response.data.cached,
        successful: true,
        estimatedCost: response.data.costEstimate.amount,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        metadata: {
          temperature: request.options?.temperature,
          maxTokens: request.options?.maxTokens,
        },
      },
    });

    logger.debug('Usage tracked successfully', { userId, model: response.data.model });
  } catch (error) {
    // Don't fail the request if usage tracking fails
    logger.error('Failed to track usage', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Update user quota after successful generation
 */
async function updateQuota(userId: string, cost: number): Promise<void> {
  try {
    await prisma.aIQuota.update({
      where: { userId },
      data: {
        dailyRequestCount: { increment: 1 },
        monthlyRequestCount: { increment: 1 },
        monthlySpendAmount: { increment: cost },
      },
    });

    logger.debug('Quota updated successfully', { userId, cost });
  } catch (error) {
    // Don't fail the request if quota update fails
    logger.error('Failed to update quota', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
