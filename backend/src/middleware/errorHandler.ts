import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../utils/errors';
import { createErrorResponse } from '../utils/transform';
import logger from '../utils/logger';
import { env, isDevelopment } from '../config/env';
import { Prisma } from '@prisma/client';

/**
 * Global error handler middleware
 * Must be registered after all routes
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log the error
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.userId,
  });

  // Handle operational errors (known errors)
  if (error instanceof AppError) {
    const response = createErrorResponse(
      error.code,
      error.message,
      error.details,
      isDevelopment() ? error.stack : undefined
    );

    return res.status(error.statusCode).json(response);
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error, res);
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    const response = createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      'Invalid data provided to database',
      isDevelopment() ? { original: error.message } : undefined,
      isDevelopment() ? error.stack : undefined
    );

    return res.status(400).json(response);
  }

  // Handle JSON parse errors
  if (error instanceof SyntaxError && 'body' in error) {
    const response = createErrorResponse(
      ErrorCode.BAD_REQUEST,
      'Invalid JSON in request body',
      undefined,
      isDevelopment() ? error.stack : undefined
    );

    return res.status(400).json(response);
  }

  // Handle unknown/unexpected errors
  const response = createErrorResponse(
    ErrorCode.INTERNAL_SERVER_ERROR,
    isDevelopment() ? error.message : 'An unexpected error occurred',
    undefined,
    isDevelopment() ? error.stack : undefined
  );

  return res.status(500).json(response);
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError, res: Response) {
  let statusCode = 500;
  let errorCode = ErrorCode.DATABASE_ERROR;
  let message = 'Database error occurred';
  let details: any;

  switch (error.code) {
    // Unique constraint violation
    case 'P2002':
      statusCode = 409;
      errorCode = ErrorCode.ALREADY_EXISTS;
      message = 'A record with this value already exists';
      details = {
        fields: (error.meta?.target as string[]) || [],
      };
      break;

    // Foreign key constraint violation
    case 'P2003':
      statusCode = 400;
      errorCode = ErrorCode.BAD_REQUEST;
      message = 'Invalid reference to related record';
      break;

    // Record not found
    case 'P2025':
      statusCode = 404;
      errorCode = ErrorCode.NOT_FOUND;
      message = 'Record not found';
      break;

    // Constraint violation
    case 'P2014':
      statusCode = 400;
      errorCode = ErrorCode.VALIDATION_ERROR;
      message = 'The change violates a required relation';
      break;

    // Database connection error
    case 'P1001':
      statusCode = 503;
      errorCode = ErrorCode.SERVICE_UNAVAILABLE;
      message = 'Cannot reach database server';
      break;

    // Query timeout
    case 'P2024':
      statusCode = 504;
      errorCode = ErrorCode.SERVICE_UNAVAILABLE;
      message = 'Database query timeout';
      break;

    default:
      // Log unknown Prisma error codes
      logger.warn(`Unknown Prisma error code: ${error.code}`);
      details = isDevelopment() ? { code: error.code, meta: error.meta } : undefined;
  }

  const response = createErrorResponse(
    errorCode,
    message,
    details,
    isDevelopment() ? error.stack : undefined
  );

  return res.status(statusCode).json(response);
}

/**
 * 404 Not Found handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response) {
  const response = createErrorResponse(
    ErrorCode.NOT_FOUND,
    `Route ${req.method} ${req.path} not found`,
    {
      method: req.method,
      path: req.path,
    }
  );

  return res.status(404).json(response);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
