import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../auth';
import { ForbiddenError } from '../../utils/errors';
import { prisma } from '../../config/database';
import logger from '../../utils/logger';
import { quotaManager, QuotaExceededError } from '../../services/AIGateway/core/QuotaManager';

/**
 * AI Gateway Authentication Middleware
 *
 * Ensures the user is authenticated and has access to the AI Gateway.
 * This middleware should be applied to all AI Gateway endpoints.
 *
 * It performs the following checks:
 * 1. User is authenticated (via JWT token)
 * 2. User account is not suspended
 * 3. User has quota available (soft check - logs warning but doesn't block)
 */
export async function aiGatewayAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // First, ensure user is authenticated using the standard auth middleware
    await authenticate(req, res, (error?: any) => {
      if (error) {
        return next(error);
      }

      // Continue with AI Gateway specific checks
      aiGatewayPermissionCheck(req, res, next);
    });
  } catch (error) {
    next(error);
  }
}

/**
 * AI Gateway Permission Check
 *
 * Additional checks specific to AI Gateway access after authentication.
 */
async function aiGatewayPermissionCheck(req: Request, _res: Response, next: NextFunction) {
  void _res;
  try {
    // User should be set by authenticate middleware
    if (!req.user || !req.userId) {
      throw new ForbiddenError('User authentication required for AI Gateway access');
    }

    // Check if user is suspended
    if (req.user.suspended) {
      logger.warn(`Suspended user attempted AI Gateway access`, {
        userId: req.userId,
        email: req.user.email,
      });
      throw new ForbiddenError(
        'Account is suspended. AI Gateway access is not available. Please contact support.'
      );
    }

    // Check quota using QuotaManager
    try {
      const quotaStatus = await quotaManager.checkQuota(req.userId);

      // Attach quota status to request for use in controllers
      req.aiQuota = await prisma.aIQuota.findUnique({
        where: { userId: req.userId },
      }) || undefined;

      // Log quota status for monitoring
      logger.info(`AI Gateway access granted`, {
        userId: req.userId,
        tier: quotaStatus.tier,
        dailyUsage: `${quotaStatus.daily.used}/${quotaStatus.daily.limit}`,
        monthlyUsage: `${quotaStatus.monthly.requests.used}/${quotaStatus.monthly.requests.limit}`,
        monthlySpend: `$${quotaStatus.monthly.spend.used.toFixed(2)}/$${quotaStatus.monthly.spend.limit}`,
      });
    } catch (error) {
      if (error instanceof QuotaExceededError) {
        // Convert to ForbiddenError for consistent error handling
        logger.warn(`User quota exceeded`, {
          userId: req.userId,
          quotaType: error.quotaType,
          limit: error.limit,
          used: error.used,
        });
        throw new ForbiddenError(error.message);
      }
      // Re-throw other errors
      throw error;
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional AI Gateway Authentication
 *
 * Authenticates the user if token is provided, but doesn't require it.
 * Useful for endpoints that provide enhanced features for authenticated users.
 */
export async function optionalAiGatewayAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    // If no auth header, continue without authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    // Try to authenticate
    await authenticate(req, res, async (error?: any) => {
      if (error) {
        // Log the error but don't block the request
        logger.warn('Optional AI Gateway auth failed:', error);
        return next();
      }

      // If authentication succeeded, fetch quota status
      if (req.userId) {
        try {
          const quota = await prisma.aIQuota.findUnique({
            where: { userId: req.userId },
          });
          if (quota) {
            req.aiQuota = quota;
          }

          // Check quota but don't block if exceeded
          try {
            await quotaManager.checkQuota(req.userId);
          } catch (quotaError) {
            // Log but don't block for optional auth
            if (quotaError instanceof QuotaExceededError) {
              logger.debug('Optional auth: quota exceeded', { userId: req.userId });
            }
          }
        } catch (quotaError) {
          logger.warn('Failed to fetch quota for optional auth:', quotaError);
        }
      }

      next();
    });
  } catch (error) {
    // Don't propagate errors for optional auth
    logger.warn('Optional AI Gateway authentication error:', error);
    next();
  }
}

/**
 * Check if user has admin access for AI Gateway management
 */
export async function requireAiGatewayAdmin(req: Request, _res: Response, next: NextFunction) {
  void _res;
  try {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    // Only admins can access AI Gateway admin functions
    if (req.user.role !== 'ADMIN') {
      logger.warn(`Non-admin user attempted AI Gateway admin access`, {
        userId: req.userId,
        email: req.user.email,
        role: req.user.role,
      });
      throw new ForbiddenError('Admin access required for AI Gateway management');
    }

    next();
  } catch (error) {
    next(error);
  }
}

export default aiGatewayAuth;
