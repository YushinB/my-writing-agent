import { userService } from './user.service';
import { sessionService } from './session.service';
import { comparePassword } from '../utils/hash';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import {
  InvalidCredentialsError,
  UnauthorizedError,
  EmailAlreadyExistsError,
} from '../utils/errors';
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  TokenPair,
  UserResponse,
} from '../types/auth.types';
import { transformUser } from '../utils/transform';
import logger from '../utils/logger';

/**
 * Auth Service
 * Handles authentication and authorization
 */
class AuthService {
  /**
   * Register a new user
   * @param data - Registration data
   * @returns Auth response with user and tokens
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await userService.getUserByEmail(data.email);
      if (existingUser) {
        throw new EmailAlreadyExistsError();
      }

      // Create user
      const user = await userService.createUser(
        data.email,
        data.password,
        data.name
      );

      // Generate tokens
      const tokens = this.generateTokenPair(user.id, user.email, user.role);

      // Create session
      await sessionService.createSession(user.id, user.email, user.role);

      logger.info(`User registered: ${user.email}`);

      return {
        user: transformUser(user),
        tokens,
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   * @param data - Login credentials
   * @returns Auth response with user and tokens
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      // Get user by email
      const user = await userService.getUserByEmail(data.email);
      if (!user) {
        throw new InvalidCredentialsError();
      }

      // Verify password
      const isPasswordValid = await comparePassword(data.password, user.password);
      if (!isPasswordValid) {
        throw new InvalidCredentialsError();
      }

      // Generate tokens
      const tokens = this.generateTokenPair(user.id, user.email, user.role);

      // Create session
      await sessionService.createSession(user.id, user.email, user.role);

      logger.info(`User logged in: ${user.email}`);

      return {
        user: transformUser(user),
        tokens,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken - Refresh token
   * @returns New token pair
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Get user to ensure they still exist
      const user = await userService.getUserById(payload.userId);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Generate new tokens
      const tokens = this.generateTokenPair(user.id, user.email, user.role);

      logger.info(`Token refreshed for user: ${user.email}`);

      return tokens;
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Logout user (delete session)
   * @param userId - User ID
   * @param sessionId - Session ID (optional, if provided will delete specific session)
   */
  async logout(userId: string, sessionId?: string): Promise<void> {
    try {
      if (sessionId) {
        await sessionService.deleteSession(sessionId);
      } else {
        // If no session ID provided, delete all sessions for user
        await sessionService.deleteAllUserSessions(userId);
      }

      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Logout from all devices
   * @param userId - User ID
   */
  async logoutAll(userId: string): Promise<void> {
    try {
      await sessionService.deleteAllUserSessions(userId);
      logger.info(`User logged out from all devices: ${userId}`);
    } catch (error) {
      logger.error('Logout all error:', error);
      throw error;
    }
  }

  /**
   * Get current user
   * @param userId - User ID
   * @returns User response
   */
  async getCurrentUser(userId: string): Promise<UserResponse> {
    try {
      const user = await userService.getUserById(userId);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      return transformUser(user);
    } catch (error) {
      logger.error('Get current user error:', error);
      throw error;
    }
  }

  /**
   * Generate access and refresh token pair
   * @param userId - User ID
   * @param email - User email
   * @param role - User role
   * @returns Token pair
   */
  private generateTokenPair(userId: string, email: string, role: any): TokenPair {
    const payload = { userId, email, role };

    return {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  /**
   * Verify user session
   * @param sessionId - Session ID
   * @returns True if session is valid
   */
  async verifySession(sessionId: string): Promise<boolean> {
    return await sessionService.isValidSession(sessionId);
  }

  /**
   * Get user's active sessions
   * @param userId - User ID
   * @returns Array of session IDs
   */
  async getUserSessions(userId: string): Promise<string[]> {
    return await sessionService.getUserSessions(userId);
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
