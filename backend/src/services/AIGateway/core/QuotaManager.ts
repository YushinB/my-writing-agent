import { prisma } from '../../../config/database';
import { AIQuota } from '@prisma/client';
import logger from '../../../utils/logger';

/**
 * Quota status information
 */
export interface QuotaStatus {
  hasQuota: boolean;
  userId: string;
  tier: string;
  daily: {
    remaining: number;
    limit: number;
    used: number;
    resetAt: Date;
    exceeded: boolean;
  };
  monthly: {
    requests: {
      remaining: number;
      limit: number;
      used: number;
      exceeded: boolean;
    };
    spend: {
      remaining: number;
      limit: number;
      used: number;
      exceeded: boolean;
    };
    resetAt: Date;
  };
}

/**
 * Quota exceeded error
 */
export class QuotaExceededError extends Error {
  public quotaType: 'daily' | 'monthly_requests' | 'monthly_spend';
  public limit: number;
  public used: number;
  public resetAt: Date;

  constructor(
    message: string,
    quotaType: 'daily' | 'monthly_requests' | 'monthly_spend',
    limit: number,
    used: number,
    resetAt: Date
  ) {
    super(message);
    this.name = 'QuotaExceededError';
    this.quotaType = quotaType;
    this.limit = limit;
    this.used = used;
    this.resetAt = resetAt;
  }
}

/**
 * QuotaManager
 *
 * Service responsible for managing user quotas, checking limits,
 * and updating usage counters.
 *
 * Handles:
 * - Daily request limits
 * - Monthly request limits
 * - Monthly spend limits
 * - Automatic quota resets
 * - Quota initialization for new users
 */
export class QuotaManager {
  /**
   * Check if user has available quota
   *
   * Verifies that the user hasn't exceeded their daily request limit,
   * monthly request limit, or monthly spend limit. Also handles automatic
   * quota resets when the reset time has passed.
   *
   * @param userId - User ID to check quota for
   * @returns QuotaStatus object with detailed quota information
   * @throws QuotaExceededError if any limit is exceeded
   */
  public async checkQuota(userId: string): Promise<QuotaStatus> {
    try {
      logger.debug('Checking quota', { userId });

      // Fetch user quota
      let quota = await prisma.aIQuota.findUnique({
        where: { userId },
      });

      // If no quota exists, create one with default values
      if (!quota) {
        logger.info('No quota found for user, creating default quota', { userId });
        quota = await this.createDefaultQuota(userId);
      }

      // Check if quotas need to be reset
      quota = await this.resetQuotaIfNeeded(quota);

      // Build quota status
      const status = this.buildQuotaStatus(quota);

      // Check for exceeded quotas
      if (status.daily.exceeded) {
        throw new QuotaExceededError(
          `Daily request limit exceeded (${status.daily.limit} requests). Resets at ${status.daily.resetAt.toISOString()}.`,
          'daily',
          status.daily.limit,
          status.daily.used,
          status.daily.resetAt
        );
      }

      if (status.monthly.requests.exceeded) {
        throw new QuotaExceededError(
          `Monthly request limit exceeded (${status.monthly.requests.limit} requests). Resets at ${status.monthly.resetAt.toISOString()}.`,
          'monthly_requests',
          status.monthly.requests.limit,
          status.monthly.requests.used,
          status.monthly.resetAt
        );
      }

      if (status.monthly.spend.exceeded) {
        throw new QuotaExceededError(
          `Monthly spend limit exceeded ($${status.monthly.spend.limit}). Resets at ${status.monthly.resetAt.toISOString()}.`,
          'monthly_spend',
          status.monthly.spend.limit,
          status.monthly.spend.used,
          status.monthly.resetAt
        );
      }

      logger.debug('Quota check passed', {
        userId,
        dailyRemaining: status.daily.remaining,
        monthlyRemaining: status.monthly.requests.remaining,
      });

      return status;
    } catch (error) {
      if (error instanceof QuotaExceededError) {
        // Re-throw quota exceeded errors
        throw error;
      }

      // Log and re-throw other errors
      logger.error('Failed to check quota', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Increment quota usage after a successful request
   *
   * Updates the daily and monthly request counters and adds to the
   * monthly spend total. This should be called after a successful
   * AI generation request.
   *
   * @param userId - User ID
   * @param cost - Cost of the request in USD
   */
  public async incrementQuota(userId: string, cost: number): Promise<void> {
    try {
      logger.debug('Incrementing quota', { userId, cost });

      await prisma.aIQuota.update({
        where: { userId },
        data: {
          dailyRequestCount: { increment: 1 },
          monthlyRequestCount: { increment: 1 },
          monthlySpendAmount: { increment: cost },
        },
      });

      logger.debug('Quota incremented successfully', { userId, cost });
    } catch (error) {
      logger.error('Failed to increment quota', {
        userId,
        cost,
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw - quota increment failure shouldn't break the request
    }
  }

  /**
   * Get quota information for a user
   *
   * Returns detailed quota status without throwing errors.
   * Useful for displaying quota info to users.
   *
   * @param userId - User ID
   * @returns QuotaStatus or null if no quota exists
   */
  public async getQuota(userId: string): Promise<QuotaStatus | null> {
    try {
      const quota = await prisma.aIQuota.findUnique({
        where: { userId },
      });

      if (!quota) {
        return null;
      }

      // Reset if needed before returning status
      const resetQuota = await this.resetQuotaIfNeeded(quota);
      return this.buildQuotaStatus(resetQuota);
    } catch (error) {
      logger.error('Failed to get quota', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Update user quota limits
   *
   * Allows admins to modify user quota limits.
   *
   * @param userId - User ID
   * @param updates - Quota fields to update
   */
  public async updateQuotaLimits(
    userId: string,
    updates: {
      dailyRequestLimit?: number;
      monthlyRequestLimit?: number;
      monthlySpendLimit?: number;
      tier?: string;
    }
  ): Promise<AIQuota> {
    try {
      logger.info('Updating quota limits', { userId, updates });

      const updatedQuota = await prisma.aIQuota.update({
        where: { userId },
        data: updates,
      });

      logger.info('Quota limits updated', { userId });
      return updatedQuota;
    } catch (error) {
      logger.error('Failed to update quota limits', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Reset user quota (admin function)
   *
   * Resets counters to zero. Useful for testing or manual resets.
   *
   * @param userId - User ID
   */
  public async resetQuota(userId: string): Promise<void> {
    try {
      logger.info('Manually resetting quota', { userId });

      const now = new Date();
      const dailyReset = new Date(now);
      dailyReset.setHours(24, 0, 0, 0);

      const monthlyReset = new Date(now);
      monthlyReset.setMonth(monthlyReset.getMonth() + 1, 1);
      monthlyReset.setHours(0, 0, 0, 0);

      await prisma.aIQuota.update({
        where: { userId },
        data: {
          dailyRequestCount: 0,
          monthlyRequestCount: 0,
          monthlySpendAmount: 0,
          dailyResetAt: dailyReset,
          monthlyResetAt: monthlyReset,
        },
      });

      logger.info('Quota reset complete', { userId });
    } catch (error) {
      logger.error('Failed to reset quota', {
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
   * Create default quota for a new user
   */
  private async createDefaultQuota(userId: string): Promise<AIQuota> {
    const now = new Date();
    const dailyReset = new Date(now);
    dailyReset.setHours(24, 0, 0, 0); // Reset at midnight

    const monthlyReset = new Date(now);
    monthlyReset.setMonth(monthlyReset.getMonth() + 1, 1); // Reset on 1st of next month
    monthlyReset.setHours(0, 0, 0, 0);

    const quota = await prisma.aIQuota.create({
      data: {
        userId,
        dailyRequestLimit: 1000,
        dailyRequestCount: 0,
        dailyResetAt: dailyReset,
        monthlyRequestLimit: 10000,
        monthlyRequestCount: 0,
        monthlySpendLimit: 10.0,
        monthlySpendAmount: 0.0,
        monthlyResetAt: monthlyReset,
        tier: 'free',
      },
    });

    logger.info('Created default quota', { userId, tier: 'free' });
    return quota;
  }

  /**
   * Reset quota counters if reset time has passed
   */
  private async resetQuotaIfNeeded(quota: AIQuota): Promise<AIQuota> {
    const now = new Date();
    let needsUpdate = false;
    const updates: any = {};

    // Check if daily quota needs reset
    if (now >= quota.dailyResetAt) {
      logger.info('Resetting daily quota', { userId: quota.userId });
      updates.dailyRequestCount = 0;
      updates.dailyResetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 hours
      updates.dailyResetAt.setHours(0, 0, 0, 0); // Set to midnight
      needsUpdate = true;
    }

    // Check if monthly quota needs reset
    if (now >= quota.monthlyResetAt) {
      logger.info('Resetting monthly quota', { userId: quota.userId });
      updates.monthlyRequestCount = 0;
      updates.monthlySpendAmount = 0;

      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
      nextMonth.setHours(0, 0, 0, 0);
      updates.monthlyResetAt = nextMonth;

      needsUpdate = true;
    }

    // Update database if needed
    if (needsUpdate) {
      return await prisma.aIQuota.update({
        where: { userId: quota.userId },
        data: updates,
      });
    }

    return quota;
  }

  /**
   * Build quota status object from quota record
   */
  private buildQuotaStatus(quota: AIQuota): QuotaStatus {
    return {
      hasQuota: true,
      userId: quota.userId,
      tier: quota.tier,
      daily: {
        remaining: Math.max(0, quota.dailyRequestLimit - quota.dailyRequestCount),
        limit: quota.dailyRequestLimit,
        used: quota.dailyRequestCount,
        resetAt: quota.dailyResetAt,
        exceeded: quota.dailyRequestCount >= quota.dailyRequestLimit,
      },
      monthly: {
        requests: {
          remaining: Math.max(0, quota.monthlyRequestLimit - quota.monthlyRequestCount),
          limit: quota.monthlyRequestLimit,
          used: quota.monthlyRequestCount,
          exceeded: quota.monthlyRequestCount >= quota.monthlyRequestLimit,
        },
        spend: {
          remaining: Math.max(0, quota.monthlySpendLimit - quota.monthlySpendAmount),
          limit: quota.monthlySpendLimit,
          used: quota.monthlySpendAmount,
          exceeded: quota.monthlySpendAmount >= quota.monthlySpendLimit,
        },
        resetAt: quota.monthlyResetAt,
      },
    };
  }
}

/**
 * Singleton instance of QuotaManager
 */
export const quotaManager = new QuotaManager();

export default quotaManager;
