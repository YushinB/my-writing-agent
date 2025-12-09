import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../auth';
import { ForbiddenError } from '../../utils/errors';
import { prisma } from '../../config/database';
import logger from '../../utils/logger';

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

    // Fetch user's quota to check availability (soft check)
    const quota = await prisma.aIQuota.findUnique({
      where: { userId: req.userId },
    });

    if (quota) {
      // Check if user has exceeded daily limit
      if (quota.dailyRequestCount >= quota.dailyRequestLimit) {
        logger.warn(`User exceeded daily quota`, {
          userId: req.userId,
          daily: `${quota.dailyRequestCount}/${quota.dailyRequestLimit}`,
        });
        throw new ForbiddenError(
          `Daily request limit exceeded (${quota.dailyRequestLimit} requests). Resets at ${quota.dailyResetAt.toISOString()}.`
        );
      }

      // Check if user has exceeded monthly limit
      if (quota.monthlyRequestCount >= quota.monthlyRequestLimit) {
        logger.warn(`User exceeded monthly quota`, {
          userId: req.userId,
          monthly: `${quota.monthlyRequestCount}/${quota.monthlyRequestLimit}`,
        });
        throw new ForbiddenError(
          `Monthly request limit exceeded (${quota.monthlyRequestLimit} requests). Resets at ${quota.monthlyResetAt.toISOString()}.`
        );
      }

      // Check if user has exceeded monthly spend limit
      if (quota.monthlySpendAmount >= quota.monthlySpendLimit) {
        logger.warn(`User exceeded monthly spend limit`, {
          userId: req.userId,
          spend: `$${quota.monthlySpendAmount}/$${quota.monthlySpendLimit}`,
        });
        throw new ForbiddenError(
          `Monthly spend limit exceeded ($${quota.monthlySpendLimit}). Resets at ${quota.monthlyResetAt.toISOString()}.`
        );
      }

      // Attach quota to request for use in controllers
      req.aiQuota = quota;

      // Log usage info for monitoring
      logger.info(`AI Gateway access granted`, {
        userId: req.userId,
        dailyUsage: `${quota.dailyRequestCount}/${quota.dailyRequestLimit}`,
        monthlyUsage: `${quota.monthlyRequestCount}/${quota.monthlyRequestLimit}`,
        monthlySpend: `$${quota.monthlySpendAmount.toFixed(2)}/$${quota.monthlySpendLimit}`,
      });
    } else {
      // No quota found - this shouldn't happen but log a warning
      // We'll allow the request but log for investigation
      logger.warn(`User has no AI quota record`, {
        userId: req.userId,
        email: req.user.email,
      });
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

      // If authentication succeeded, fetch quota
      if (req.userId) {
        try {
          const quota = await prisma.aIQuota.findUnique({
            where: { userId: req.userId },
          });
          if (quota) {
            req.aiQuota = quota;
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
