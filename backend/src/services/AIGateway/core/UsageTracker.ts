import { prisma } from '../../../config/database';
import logger from '../../../utils/logger';
import type { GenerateRequest, GenerateResult, CostEstimate } from '../types';

/**
 * Usage record data for tracking
 */
export interface UsageRecord {
  userId: string;
  provider: string;
  model: string;
  operation: string;
  request: GenerateRequest;
  result?: GenerateResult;
  error?: {
    code: string;
    message: string;
  };
  latency: number;
  successful: boolean;
}

/**
 * UsageTracker
 *
 * Service responsible for tracking AI Gateway usage, recording metrics,
 * costs, and performance data to the database.
 *
 * This service ensures that all AI requests are properly logged for:
 * - Billing and cost tracking
 * - Performance monitoring
 * - Usage analytics
 * - Quota management
 */
export class UsageTracker {
  /**
   * Record a usage event in the database
   *
   * This method saves detailed usage information including tokens, costs,
   * latency, and success/failure status. It's designed to be non-blocking
   * and will not throw errors to prevent disrupting the main request flow.
   *
   * @param record - Usage record containing all tracking data
   */
  public async recordUsage(record: UsageRecord): Promise<void> {
    try {
      logger.info('Recording usage', {
        userId: record.userId,
        provider: record.provider,
        model: record.model,
        successful: record.successful,
      });

      // Find provider ID from database
      const provider = await this.findOrCreateProvider(record.provider);
      if (!provider) {
        logger.error('Failed to find or create provider', { provider: record.provider });
        return;
      }

      // Calculate cost estimate
      const costEstimate = record.result
        ? record.result.costEstimate
        : await this.calculateCostForError(record);

      // Prepare usage data
      const usageData = {
        userId: record.userId,
        providerId: provider.id,
        model: record.model,
        operation: record.operation,

        // Store first 2000 chars of prompt (be mindful of PII)
        prompt: this.sanitizePrompt(record.request.prompt),

        // Token usage
        promptTokens: record.result?.usage.promptTokens || 0,
        completionTokens: record.result?.usage.completionTokens || 0,
        totalTokens: record.result?.usage.totalTokens || 0,

        // Performance metrics
        latency: Math.round(record.latency),
        cached: record.result?.cached || false,
        successful: record.successful,

        // Cost tracking
        estimatedCost: costEstimate.amount,

        // Error information (if failed)
        errorCode: record.error?.code || null,
        errorMessage: record.error?.message || null,

        // Request metadata
        requestId: this.generateRequestId(),
        metadata: this.extractMetadata(record),
      };

      // Save to database
      await prisma.aIUsage.create({ data: usageData });

      logger.debug('Usage recorded successfully', {
        userId: record.userId,
        model: record.model,
        tokens: usageData.totalTokens,
        cost: usageData.estimatedCost,
      });
    } catch (error) {
      // Log error but don't throw - usage tracking should never break the main flow
      logger.error('Failed to record usage', {
        userId: record.userId,
        provider: record.provider,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Record a successful generation request
   *
   * Convenience method for tracking successful requests.
   *
   * @param userId - User ID making the request
   * @param request - Original generation request
   * @param result - Generation result from the provider
   * @param latency - Request latency in milliseconds
   */
  public async recordSuccess(
    userId: string,
    request: GenerateRequest,
    result: GenerateResult,
    latency: number
  ): Promise<void> {
    await this.recordUsage({
      userId,
      provider: result.provider,
      model: result.model,
      operation: 'generate',
      request,
      result,
      latency,
      successful: true,
    });
  }

  /**
   * Record a failed generation request
   *
   * Convenience method for tracking failed requests.
   *
   * @param userId - User ID making the request
   * @param request - Original generation request
   * @param provider - Provider that failed
   * @param model - Model that was attempted
   * @param error - Error details
   * @param latency - Request latency in milliseconds
   */
  public async recordFailure(
    userId: string,
    request: GenerateRequest,
    provider: string,
    model: string,
    error: { code: string; message: string },
    latency: number
  ): Promise<void> {
    await this.recordUsage({
      userId,
      provider,
      model,
      operation: 'generate',
      request,
      error,
      latency,
      successful: false,
    });
  }

  /**
   * Get usage statistics for a user
   *
   * @param userId - User ID
   * @param period - Time period ('day', 'month', 'all')
   * @returns Usage statistics
   */
  public async getUserStats(
    userId: string,
    period: 'day' | 'month' | 'all' = 'month'
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalTokens: number;
    totalCost: number;
    averageLatency: number;
  }> {
    try {
      // Calculate date filter
      const dateFilter = this.getDateFilter(period);

      // Aggregate usage data
      const aggregates = await prisma.aIUsage.aggregate({
        where: {
          userId,
          ...dateFilter,
        },
        _count: { id: true },
        _sum: {
          totalTokens: true,
          estimatedCost: true,
        },
        _avg: {
          latency: true,
        },
      });

      // Count successful and failed requests
      const [successCount, failCount] = await Promise.all([
        prisma.aIUsage.count({
          where: { userId, successful: true, ...dateFilter },
        }),
        prisma.aIUsage.count({
          where: { userId, successful: false, ...dateFilter },
        }),
      ]);

      return {
        totalRequests: aggregates._count.id,
        successfulRequests: successCount,
        failedRequests: failCount,
        totalTokens: aggregates._sum.totalTokens || 0,
        totalCost: aggregates._sum.estimatedCost || 0,
        averageLatency: Math.round(aggregates._avg.latency || 0),
      };
    } catch (error) {
      logger.error('Failed to get user stats', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  /**
   * Find or create provider in database
   */
  private async findOrCreateProvider(providerName: string) {
    try {
      let provider = await prisma.aIProvider.findUnique({
        where: { name: providerName },
      });

      // If provider doesn't exist, create it with default values
      if (!provider) {
        logger.warn('Provider not found, creating with defaults', { provider: providerName });
        provider = await prisma.aIProvider.create({
          data: {
            name: providerName,
            displayName: providerName.charAt(0).toUpperCase() + providerName.slice(1),
            description: `Auto-created provider: ${providerName}`,
            enabled: true,
            priority: 0,
          },
        });
      }

      return provider;
    } catch (error) {
      logger.error('Error finding/creating provider', {
        provider: providerName,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Sanitize prompt for storage (truncate and remove sensitive data)
   */
  private sanitizePrompt(prompt: string): string {
    // Truncate to 2000 characters
    const truncated = prompt.substring(0, 2000);

    // In production, you might want to:
    // - Remove PII (emails, phone numbers, etc.)
    // - Remove API keys or tokens
    // - Remove other sensitive patterns

    return truncated;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `req_${timestamp}_${random}`;
  }

  /**
   * Extract metadata from usage record
   */
  private extractMetadata(record: UsageRecord): any {
    return {
      temperature: record.request.options?.temperature,
      maxTokens: record.request.options?.maxTokens,
      topP: record.request.options?.topP,
      useCache: record.request.useCache,
      allowFallback: record.request.allowFallback,
      routingPolicy: record.request.routingPolicy,
      systemPrompt: record.request.options?.systemPrompt ? 'provided' : 'none',
    };
  }

  /**
   * Calculate cost estimate for failed requests
   */
  private async calculateCostForError(record: UsageRecord): Promise<CostEstimate> {
    // For failed requests, we still might have incurred some cost
    // (e.g., if the request was sent but failed)
    // For now, return zero cost for errors
    return {
      amount: 0,
      currency: 'USD',
      breakdown: {
        promptCost: 0,
        completionCost: 0,
      },
    };
  }

  /**
   * Get date filter for aggregation queries
   */
  private getDateFilter(period: 'day' | 'month' | 'all'): any {
    if (period === 'all') {
      return {};
    }

    const now = new Date();
    let startDate: Date;

    if (period === 'day') {
      // Last 24 hours
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else {
      // Last 30 days
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
      createdAt: {
        gte: startDate,
      },
    };
  }
}

/**
 * Singleton instance of UsageTracker
 */
export const usageTracker = new UsageTracker();

export default usageTracker;
