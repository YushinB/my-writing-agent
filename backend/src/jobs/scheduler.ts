import cron from 'node-cron';
import { cacheCleanupJob, getCacheStats } from './cacheCleanup';
import logger from '../utils/logger';

/**
 * Job Scheduler
 * Manages scheduled background jobs using node-cron
 */
class JobScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;

  /**
   * Start all scheduled jobs
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Job scheduler is already running');
      return;
    }

    logger.info('🕐 Starting job scheduler...');

    // Schedule cache cleanup job (daily at 2 AM)
    const cacheCleanupTask = cron.schedule(
      '0 2 * * *',
      async () => {
        try {
          logger.info('⏰ Running scheduled cache cleanup job...');
          await cacheCleanupJob();
        } catch (error) {
          logger.error('Cache cleanup job failed:', error);
        }
      },
      {
        scheduled: true,
        timezone: 'UTC',
      }
    );

    this.jobs.set('cacheCleanup', cacheCleanupTask);

    // Log cache stats daily at 2:05 AM (after cleanup)
    const statsTask = cron.schedule(
      '5 2 * * *',
      async () => {
        try {
          const stats = await getCacheStats();
          logger.info(
            `📊 Cache statistics: Total=${stats.total}, Valid=${stats.valid}, Expired=${stats.expired}`
          );
        } catch (error) {
          logger.error('Failed to get cache stats:', error);
        }
      },
      {
        scheduled: true,
        timezone: 'UTC',
      }
    );

    this.jobs.set('cacheStats', statsTask);

    this.isRunning = true;
    logger.info(`✅ Job scheduler started with ${this.jobs.size} jobs`);
    this.listJobs();
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    if (!this.isRunning) {
      logger.warn('Job scheduler is not running');
      return;
    }

    logger.info('Stopping job scheduler...');

    this.jobs.forEach((task, name) => {
      task.stop();
      logger.info(`Stopped job: ${name}`);
    });

    this.jobs.clear();
    this.isRunning = false;

    logger.info('✅ Job scheduler stopped');
  }

  /**
   * Run a job immediately (for testing/manual execution)
   */
  async runJobNow(jobName: string): Promise<void> {
    logger.info(`Running job manually: ${jobName}`);

    switch (jobName) {
      case 'cacheCleanup':
        await cacheCleanupJob();
        break;
      default:
        logger.warn(`Unknown job: ${jobName}`);
    }
  }

  /**
   * List all registered jobs
   */
  listJobs(): void {
    logger.info('Registered jobs:');
    this.jobs.forEach((task, name) => {
      logger.info(`  - ${name}: ${task.getStatus()}`);
    });
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; jobCount: number } {
    return {
      isRunning: this.isRunning,
      jobCount: this.jobs.size,
    };
  }
}

// Export singleton instance
export const jobScheduler = new JobScheduler();
export default jobScheduler;