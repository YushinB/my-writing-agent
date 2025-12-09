import { prisma } from '../config/database';
import logger from '../utils/logger';

/**
 * Cache Cleanup Job
 * Removes expired dictionary cache entries from PostgreSQL
 */
export async function cacheCleanupJob(): Promise<void> {
  try {
    logger.info('🧹 Starting cache cleanup job...');

    const startTime = Date.now();

    // Delete expired dictionary entries
    const result = await prisma.dictionaryEntry.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    const duration = Date.now() - startTime;

    logger.info(
      `✅ Cache cleanup completed: ${result.count} expired entries deleted in ${duration}ms`
    );

    // Return statistics for monitoring
    return;
  } catch (error) {
    logger.error('❌ Cache cleanup job failed:', error);
    throw error;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  total: number;
  expired: number;
  valid: number;
}> {
  try {
    const total = await prisma.dictionaryEntry.count();
    const expired = await prisma.dictionaryEntry.count({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return {
      total,
      expired,
      valid: total - expired,
    };
  } catch (error) {
    logger.error('Error getting cache stats:', error);
    return { total: 0, expired: 0, valid: 0 };
  }
}
