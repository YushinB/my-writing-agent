import { prisma } from '../config/database';
import { cacheService } from './cache.service';
import { settingsService } from './settings.service';
import { User, UserRole } from '@prisma/client';
import { hashPassword } from '../utils/hash';
import { NotFoundError, ConflictError } from '../utils/errors';
import { env } from '../config/env';
import logger from '../utils/logger';

/**
 * User Service
 * Handles user-related database operations with caching
 */
class UserService {
  private readonly USER_CACHE_TTL = env.CACHE_TTL_USER;

  /**
   * Create a new user
   * @param email - User email
   * @param password - Plain text password
   * @param name - User name (optional)
   * @param role - User role (optional, defaults to USER)
   * @returns Created user
   */
  async createUser(
    email: string,
    password: string,
    name?: string,
    role: UserRole = UserRole.USER
  ): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        throw new ConflictError('Email already in use');
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name,
          role,
        },
      });

      logger.info(`User created: ${user.id} (${user.email})`);

      // Cache user
      await this.cacheUser(user);

      // Auto-create default settings for new user
      try {
        await settingsService.createDefaultSettings(user.id);
        logger.info(`Default settings created for new user ${user.id}`);
      } catch (error) {
        logger.warn(`Failed to create default settings for user ${user.id}:`, error);
        // Don't fail user creation if settings creation fails
      }

      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param userId - User ID
   * @returns User or null if not found
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      // Try cache first
      const cacheKey = cacheService.userKey(userId);
      const cachedUser = await cacheService.get<User>(cacheKey);

      if (cachedUser) {
        return cachedUser;
      }

      // Fetch from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return null;
      }

      // Cache the user
      await this.cacheUser(user);

      return user;
    } catch (error) {
      logger.error(`Error getting user by ID ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get user by email
   * @param email - User email
   * @returns User or null if not found
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (user) {
        await this.cacheUser(user);
      }

      return user;
    } catch (error) {
      logger.error(`Error getting user by email ${email}:`, error);
      return null;
    }
  }

  /**
   * Update user
   * @param userId - User ID
   * @param data - Data to update
   * @returns Updated user
   */
  async updateUser(
    userId: string,
    data: {
      name?: string;
      email?: string;
      role?: UserRole;
    }
  ): Promise<User> {
    try {
      // Check if user exists
      const existingUser = await this.getUserById(userId);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // If email is being changed, check if new email is already in use
      if (data.email && data.email !== existingUser.email) {
        const emailInUse = await this.getUserByEmail(data.email);
        if (emailInUse) {
          throw new ConflictError('Email already in use');
        }
      }

      // Update user
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.email && { email: data.email.toLowerCase() }),
          ...(data.role && { role: data.role }),
        },
      });

      logger.info(`User updated: ${user.id}`);

      // Update cache
      await this.cacheUser(user);

      return user;
    } catch (error) {
      logger.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Delete user
   * @param userId - User ID
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id: userId },
      });

      logger.info(`User deleted: ${userId}`);

      // Remove from cache
      await this.invalidateUserCache(userId);
    } catch (error) {
      logger.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Cache user data
   * @param user - User object
   */
  private async cacheUser(user: User): Promise<void> {
    try {
      const cacheKey = cacheService.userKey(user.id);
      await cacheService.setex(cacheKey, user, this.USER_CACHE_TTL);
    } catch (error) {
      // Don't throw error, just log it
      logger.warn(`Failed to cache user ${user.id}:`, error);
    }
  }

  /**
   * Invalidate user cache
   * @param userId - User ID
   */
  async invalidateUserCache(userId: string): Promise<void> {
    try {
      const cacheKey = cacheService.userKey(userId);
      await cacheService.delete(cacheKey);
    } catch (error) {
      logger.warn(`Failed to invalidate cache for user ${userId}:`, error);
    }
  }

  /**
   * Get all users (admin only)
   * @param skip - Number of records to skip
   * @param take - Number of records to take
   * @returns Array of users
   */
  async getAllUsers(skip: number = 0, take: number = 10): Promise<User[]> {
    try {
      return await prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error getting all users:', error);
      return [];
    }
  }

  /**
   * Count total users
   * @returns Total user count
   */
  async countUsers(): Promise<number> {
    try {
      return await prisma.user.count();
    } catch (error) {
      logger.error('Error counting users:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;
