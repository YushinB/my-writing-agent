import { redis } from '../config/redis';
import logger from '../utils/logger';
import { CacheError } from '../utils/errors';

/**
 * Cache Service
 * Provides Redis caching functionality with JSON serialization
 */
class CacheService {
  /**
   * Generate cache key with prefix
   */
  private generateKey(prefix: string, identifier: string): string {
    return `${prefix}:${identifier}`;
  }

  /**
   * Get value from cache
   * @param key - Cache key
   * @returns Parsed value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null; // Fail gracefully
    }
  }

  /**
   * Set value in cache (no expiration)
   * @param key - Cache key
   * @param value - Value to cache
   */
  async set(key: string, value: any): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await redis.set(key, serialized);
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      // Fail gracefully in test environment
      if (process.env.NODE_ENV === 'test') {
        logger.warn('Cache unavailable in test mode, skipping set operation');
        return;
      }
      throw new CacheError('Failed to set cache');
    }
  }

  /**
   * Set value in cache with expiration (TTL)
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlSeconds - Time to live in seconds
   */
  async setex(key: string, value: any, ttlSeconds: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await redis.setex(key, ttlSeconds, serialized);
    } catch (error) {
      logger.error(`Cache setex error for key ${key}:`, error);
      // Fail gracefully in test environment
      if (process.env.NODE_ENV === 'test') {
        logger.warn('Cache unavailable in test mode, skipping setex operation');
        return;
      }
      throw new CacheError('Failed to set cache with expiration');
    }
  }

  /**
   * Delete value from cache
   * @param key - Cache key
   * @returns Number of keys deleted
   */
  async delete(key: string): Promise<number> {
    try {
      return await redis.del(key);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return 0; // Fail gracefully
    }
  }

  /**
   * Delete multiple keys matching a pattern
   * @param pattern - Key pattern (e.g., "user:*")
   * @returns Number of keys deleted
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      return await redis.del(...keys);
    } catch (error) {
      logger.error(`Cache deletePattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   * @param key - Cache key
   * @returns True if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   * @param key - Cache key
   * @returns TTL in seconds, -1 if no expiry, -2 if key doesn't exist
   */
  async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(key);
    } catch (error) {
      logger.error(`Cache ttl error for key ${key}:`, error);
      return -2;
    }
  }

  /**
   * Increment a numeric value
   * @param key - Cache key
   * @returns New value after increment
   */
  async increment(key: string, by: number = 1): Promise<number> {
    try {
      return await redis.incrby(key, by);
    } catch (error) {
      logger.error(`Cache increment error for key ${key}:`, error);
      throw new CacheError('Failed to increment cache value');
    }
  }

  /**
   * Add member to a set
   * @param key - Set key
   * @param members - Members to add
   */
  async addToSet(key: string, ...members: string[]): Promise<number> {
    try {
      return await redis.sadd(key, ...members);
    } catch (error) {
      logger.error(`Cache addToSet error for key ${key}:`, error);
      // Fail gracefully in test environment
      if (process.env.NODE_ENV === 'test') {
        logger.warn('Cache unavailable in test mode, skipping addToSet operation');
        return 0;
      }
      throw new CacheError('Failed to add to set');
    }
  }

  /**
   * Remove member from a set
   * @param key - Set key
   * @param members - Members to remove
   */
  async removeFromSet(key: string, ...members: string[]): Promise<number> {
    try {
      return await redis.srem(key, ...members);
    } catch (error) {
      logger.error(`Cache removeFromSet error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get all members of a set
   * @param key - Set key
   */
  async getSetMembers(key: string): Promise<string[]> {
    try {
      return await redis.smembers(key);
    } catch (error) {
      logger.error(`Cache getSetMembers error for key ${key}:`, error);
      return [];
    }
  }

  /**
   * Check if member exists in set
   * @param key - Set key
   * @param member - Member to check
   */
  async isInSet(key: string, member: string): Promise<boolean> {
    try {
      const result = await redis.sismember(key, member);
      return result === 1;
    } catch (error) {
      logger.error(`Cache isInSet error for key ${key}:`, error);
      return false;
    }
  }

  // Cache key generators for different entities

  userKey(userId: string): string {
    return this.generateKey('user', userId);
  }

  sessionKey(sessionId: string): string {
    return this.generateKey('session', sessionId);
  }

  userSessionsKey(userId: string): string {
    return this.generateKey('user:sessions', userId);
  }

  dictionaryKey(word: string): string {
    return this.generateKey('dictionary', word.toLowerCase());
  }

  llmCacheKey(operation: string, hash: string): string {
    return this.generateKey(`llm:${operation}`, hash);
  }

  userWordsKey(userId: string): string {
    return this.generateKey('user:words', userId);
  }

  settingsKey(userId: string): string {
    return this.generateKey('settings', userId);
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default cacheService;
