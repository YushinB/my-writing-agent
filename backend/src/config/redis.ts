import Redis, { RedisOptions } from 'ioredis';
import logger from '../utils/logger';

// Redis configuration
const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),

  // Retry strategy
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Redis connection retry attempt ${times}, waiting ${delay}ms`);
    return delay;
  },

  // Maximum retry attempts
  maxRetriesPerRequest: 3,

  // Enable offline queue
  enableOfflineQueue: true,

  // Connection timeout
  connectTimeout: 10000,

  // Command timeout
  commandTimeout: 5000,

  // Lazy connect (don't connect immediately)
  lazyConnect: true,

  // Show friendly error stack
  showFriendlyErrorStack: process.env.NODE_ENV === 'development',
};

// Create Redis client singleton
class RedisClient {
  private static instance: Redis | null = null;
  private static isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis(redisConfig);

      // Event listeners
      RedisClient.instance.on('connect', () => {
        logger.info('🔄 Connecting to Redis...');
      });

      RedisClient.instance.on('ready', () => {
        RedisClient.isConnected = true;
        logger.info('✅ Redis connected successfully');
      });

      RedisClient.instance.on('error', (error) => {
        logger.error('❌ Redis connection error:', error);
        RedisClient.isConnected = false;
      });

      RedisClient.instance.on('close', () => {
        logger.warn('🔌 Redis connection closed');
        RedisClient.isConnected = false;
      });

      RedisClient.instance.on('reconnecting', () => {
        logger.info('🔄 Redis reconnecting...');
      });

      RedisClient.instance.on('end', () => {
        logger.warn('🛑 Redis connection ended');
        RedisClient.isConnected = false;
      });

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        await RedisClient.disconnect();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await RedisClient.disconnect();
        process.exit(0);
      });

      // Connect to Redis
      RedisClient.instance
        .connect()
        .then(() => {
          logger.info('Redis client initialized');
        })
        .catch((error) => {
          logger.error('Failed to connect to Redis:', error);
        });
    }

    return RedisClient.instance;
  }

  public static async disconnect(): Promise<void> {
    if (RedisClient.instance) {
      await RedisClient.instance.quit();
      logger.info('🔌 Redis disconnected gracefully');
      RedisClient.instance = null;
      RedisClient.isConnected = false;
    }
  }

  public static async healthCheck(): Promise<boolean> {
    try {
      if (!RedisClient.instance) {
        return false;
      }
      const pong = await RedisClient.instance.ping();
      return pong === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  public static getConnectionStatus(): boolean {
    return RedisClient.isConnected;
  }

  public static async flushAll(): Promise<void> {
    if (RedisClient.instance && process.env.NODE_ENV !== 'production') {
      await RedisClient.instance.flushall();
      logger.warn('⚠️  Redis cache flushed (dev only)');
    }
  }
}

// Export singleton instance
export const redis = RedisClient.getInstance();

// Export utility functions
export const disconnectRedis = RedisClient.disconnect;
export const checkRedisHealth = RedisClient.healthCheck;
export const getRedisStatus = RedisClient.getConnectionStatus;
export const flushRedisCache = RedisClient.flushAll;

export default redis;
