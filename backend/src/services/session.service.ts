import { cacheService } from './cache.service';
import { SessionData } from '../types/auth.types';
import { env } from '../config/env';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Session Service
 * Manages user sessions in Redis
 */
class SessionService {
  private readonly SESSION_EXPIRY = env.SESSION_EXPIRY;

  /**
   * Create a new session
   * @param userId - User ID
   * @param email - User email
   * @param role - User role
   * @returns Session ID
   */
  async createSession(userId: string, email: string, role: any): Promise<string> {
    try {
      const sessionId = uuidv4();
      const now = Date.now();

      const sessionData: SessionData = {
        userId,
        email,
        role,
        createdAt: now,
        expiresAt: now + this.SESSION_EXPIRY * 1000,
      };

      // Store session data
      const sessionKey = cacheService.sessionKey(sessionId);
      await cacheService.setex(sessionKey, sessionData, this.SESSION_EXPIRY);

      // Track session for user (add to user's sessions set)
      const userSessionsKey = cacheService.userSessionsKey(userId);
      await cacheService.addToSet(userSessionsKey, sessionId);

      logger.info(`Session created for user ${userId}: ${sessionId}`);
      return sessionId;
    } catch (error) {
      logger.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  /**
   * Get session data
   * @param sessionId - Session ID
   * @returns Session data or null if not found/expired
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const sessionKey = cacheService.sessionKey(sessionId);
      const sessionData = await cacheService.get<SessionData>(sessionKey);

      if (!sessionData) {
        return null;
      }

      // Check if session is expired
      if (sessionData.expiresAt < Date.now()) {
        await this.deleteSession(sessionId);
        return null;
      }

      return sessionData;
    } catch (error) {
      logger.error(`Error getting session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Delete a session
   * @param sessionId - Session ID
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      // Get session data to find user ID
      const sessionData = await cacheService.get<SessionData>(cacheService.sessionKey(sessionId));

      // Delete session
      const sessionKey = cacheService.sessionKey(sessionId);
      await cacheService.delete(sessionKey);

      // Remove from user's sessions set
      if (sessionData) {
        const userSessionsKey = cacheService.userSessionsKey(sessionData.userId);
        await cacheService.removeFromSet(userSessionsKey, sessionId);
      }

      logger.info(`Session deleted: ${sessionId}`);
    } catch (error) {
      logger.error(`Error deleting session ${sessionId}:`, error);
    }
  }

  /**
   * Refresh session expiry
   * @param sessionId - Session ID
   */
  async refreshSession(sessionId: string): Promise<boolean> {
    try {
      const sessionData = await this.getSession(sessionId);
      if (!sessionData) {
        return false;
      }

      // Update expiry
      sessionData.expiresAt = Date.now() + this.SESSION_EXPIRY * 1000;

      const sessionKey = cacheService.sessionKey(sessionId);
      await cacheService.setex(sessionKey, sessionData, this.SESSION_EXPIRY);

      return true;
    } catch (error) {
      logger.error(`Error refreshing session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Get all active sessions for a user
   * @param userId - User ID
   * @returns Array of session IDs
   */
  async getUserSessions(userId: string): Promise<string[]> {
    try {
      const userSessionsKey = cacheService.userSessionsKey(userId);
      const sessionIds = await cacheService.getSetMembers(userSessionsKey);

      // Filter out expired sessions
      const activeSessions: string[] = [];
      for (const sessionId of sessionIds) {
        const sessionData = await this.getSession(sessionId);
        if (sessionData) {
          activeSessions.push(sessionId);
        }
      }

      return activeSessions;
    } catch (error) {
      logger.error(`Error getting sessions for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Delete all sessions for a user (logout from all devices)
   * @param userId - User ID
   */
  async deleteAllUserSessions(userId: string): Promise<void> {
    try {
      const userSessionsKey = cacheService.userSessionsKey(userId);
      const sessionIds = await cacheService.getSetMembers(userSessionsKey);

      // Delete all sessions
      for (const sessionId of sessionIds) {
        await this.deleteSession(sessionId);
      }

      // Delete the sessions set
      await cacheService.delete(userSessionsKey);

      logger.info(`All sessions deleted for user ${userId}`);
    } catch (error) {
      logger.error(`Error deleting all sessions for user ${userId}:`, error);
    }
  }

  /**
   * Check if session is valid
   * @param sessionId - Session ID
   * @returns True if session exists and is not expired
   */
  async isValidSession(sessionId: string): Promise<boolean> {
    const sessionData = await this.getSession(sessionId);
    return sessionData !== null;
  }

  /**
   * Get session count for a user
   * @param userId - User ID
   * @returns Number of active sessions
   */
  async getSessionCount(userId: string): Promise<number> {
    const sessions = await this.getUserSessions(userId);
    return sessions.length;
  }
}

// Export singleton instance
export const sessionService = new SessionService();
export default sessionService;
