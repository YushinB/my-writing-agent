import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { createSuccessResponse } from '../utils/transform';
import { aiGateway } from '../services/AIGateway';
import { quotaManager } from '../services/AIGateway/core/QuotaManager';
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
    // (Usage tracking is handled automatically by AIGatewayService)
    const response = await aiGateway.generate(generateRequest, userId);

    // Update user quota using QuotaManager
    await quotaManager.incrementQuota(userId, response.data.costEstimate.amount);

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

  // Get quota status using QuotaManager
  const quotaStatus = await quotaManager.getQuota(userId);

  if (!quotaStatus) {
    res.status(404).json(
      createSuccessResponse(null, 'No quota found for user. Please contact support.')
    );
    return;
  }

  // Format quota data with usage percentages
  const quotaData = {
    tier: quotaStatus.tier,
    daily: {
      used: quotaStatus.daily.used,
      limit: quotaStatus.daily.limit,
      remaining: quotaStatus.daily.remaining,
      usagePercent: parseFloat(((quotaStatus.daily.used / quotaStatus.daily.limit) * 100).toFixed(1)),
      resetAt: quotaStatus.daily.resetAt,
      exceeded: quotaStatus.daily.exceeded,
    },
    monthly: {
      requests: {
        used: quotaStatus.monthly.requests.used,
        limit: quotaStatus.monthly.requests.limit,
        remaining: quotaStatus.monthly.requests.remaining,
        usagePercent: parseFloat(
          ((quotaStatus.monthly.requests.used / quotaStatus.monthly.requests.limit) * 100).toFixed(1)
        ),
        exceeded: quotaStatus.monthly.requests.exceeded,
      },
      spend: {
        amount: quotaStatus.monthly.spend.used,
        limit: quotaStatus.monthly.spend.limit,
        remaining: quotaStatus.monthly.spend.remaining,
        usagePercent: parseFloat(
          ((quotaStatus.monthly.spend.used / quotaStatus.monthly.spend.limit) * 100).toFixed(1)
        ),
        currency: 'USD',
        exceeded: quotaStatus.monthly.spend.exceeded,
      },
      resetAt: quotaStatus.monthly.resetAt,
    },
  };

  res.status(200).json(createSuccessResponse(quotaData));

  logger.info('AI Gateway quota retrieved', {
    userId,
    tier: quotaStatus.tier,
    dailyUsed: quotaStatus.daily.used,
    monthlyUsed: quotaStatus.monthly.requests.used,
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
// Note: Quota management is now handled by QuotaManager service
// Usage tracking is handled automatically by AIGatewayService
