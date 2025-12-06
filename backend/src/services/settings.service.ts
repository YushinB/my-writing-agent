import { prisma } from '../config/database';
import { cacheService } from './cache.service';
import { UserSettings } from '@prisma/client';
import logger from '../utils/logger';

/**
 * Settings Service
 * Manages user settings with caching
 */
class SettingsService {
  private readonly SETTINGS_CACHE_TTL = 3600; // 1 hour

  /**
   * Get user settings
   * @param userId - User ID
   * @returns User settings
   */
  async getUserSettings(userId: string): Promise<UserSettings> {
    try {
      // Try cache first
      const cacheKey = cacheService.settingsKey(userId);
      const cached = await cacheService.get<UserSettings>(cacheKey);

      if (cached) {
        return cached;
      }

      // Get from database
      let settings = await prisma.userSettings.findUnique({
        where: { userId },
      });

      // If no settings exist, create default settings
      if (!settings) {
        settings = await this.createDefaultSettings(userId);
      }

      // Cache settings
      await cacheService.setex(cacheKey, settings, this.SETTINGS_CACHE_TTL);

      return settings;
    } catch (error) {
      logger.error(`Error getting settings for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update user settings
   * @param userId - User ID
   * @param data - Settings data to update
   * @returns Updated settings
   */
  async updateUserSettings(
    userId: string,
    data: {
      llmModel?: string;
      preferredLanguage?: string;
      theme?: string;
      emailNotifications?: boolean;
    }
  ): Promise<UserSettings> {
    try {
      // Check if settings exist
      const existing = await prisma.userSettings.findUnique({
        where: { userId },
      });

      let settings: UserSettings;

      if (!existing) {
        // Create new settings with provided data
        settings = await prisma.userSettings.create({
          data: {
            userId,
            llmModel: data.llmModel || 'gemini-2.0-flash',
            preferredLanguage: data.preferredLanguage || 'en',
            theme: data.theme || 'light',
            emailNotifications: data.emailNotifications ?? true,
          },
        });
      } else {
        // Update existing settings
        settings = await prisma.userSettings.update({
          where: { userId },
          data: {
            ...(data.llmModel !== undefined && { llmModel: data.llmModel }),
            ...(data.preferredLanguage !== undefined && {
              preferredLanguage: data.preferredLanguage,
            }),
            ...(data.theme !== undefined && { theme: data.theme }),
            ...(data.emailNotifications !== undefined && {
              emailNotifications: data.emailNotifications,
            }),
          },
        });
      }

      // Update cache
      const cacheKey = cacheService.settingsKey(userId);
      await cacheService.setex(cacheKey, settings, this.SETTINGS_CACHE_TTL);

      logger.info(`Settings updated for user ${userId}`);
      return settings;
    } catch (error) {
      logger.error(`Error updating settings for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Create default settings for a new user
   * @param userId - User ID
   * @returns Created settings
   */
  async createDefaultSettings(userId: string): Promise<UserSettings> {
    try {
      const settings = await prisma.userSettings.create({
        data: {
          userId,
          llmModel: 'gemini-2.0-flash',
          preferredLanguage: 'en',
          theme: 'light',
          emailNotifications: true,
        },
      });

      logger.info(`Default settings created for user ${userId}`);
      return settings;
    } catch (error) {
      logger.error(`Error creating default settings for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Delete user settings
   * @param userId - User ID
   */
  async deleteUserSettings(userId: string): Promise<void> {
    try {
      await prisma.userSettings.delete({
        where: { userId },
      });

      // Remove from cache
      const cacheKey = cacheService.settingsKey(userId);
      await cacheService.delete(cacheKey);

      logger.info(`Settings deleted for user ${userId}`);
    } catch (error) {
      logger.error(`Error deleting settings for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate settings cache
   * @param userId - User ID
   */
  async invalidateCache(userId: string): Promise<void> {
    try {
      const cacheKey = cacheService.settingsKey(userId);
      await cacheService.delete(cacheKey);
    } catch (error) {
      logger.warn(`Failed to invalidate settings cache for user ${userId}:`, error);
    }
  }

  /**
   * Reset settings to default
   * @param userId - User ID
   * @returns Reset settings
   */
  async resetToDefault(userId: string): Promise<UserSettings> {
    try {
      const settings = await prisma.userSettings.update({
        where: { userId },
        data: {
          llmModel: 'gemini-2.0-flash',
          preferredLanguage: 'en',
          theme: 'light',
          emailNotifications: true,
        },
      });

      // Update cache
      const cacheKey = cacheService.settingsKey(userId);
      await cacheService.setex(cacheKey, settings, this.SETTINGS_CACHE_TTL);

      logger.info(`Settings reset to default for user ${userId}`);
      return settings;
    } catch (error) {
      logger.error(`Error resetting settings for user ${userId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const settingsService = new SettingsService();
export default settingsService;
