import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { UserRole } from '@prisma/client';

/**
 * Admin Middleware
 * Ensures that only users with 'ADMIN' role can access protected routes
 */
export const requireAdmin = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated (set by auth middleware)
    if (!req.userId) {
      throw new UnauthorizedError('Authentication required');
    }

    // Check if user role is available (set by auth middleware)
    if (!req.userRole) {
      throw new ForbiddenError('User role not found');
    }

    // Check if user has admin role
    if (req.userRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Admin access required');
    }

    // User is admin, proceed
    next();
  } catch (error) {
    next(error);
  }
};
