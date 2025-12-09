// Custom Error Classes and Error Codes

// Error codes enum
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_FIELD = 'MISSING_FIELD',

  // Resources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // External Services
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',

  // General
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

// Base custom error class
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    isOperational = true,
    details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this);
  }
}

// 400 Bad Request
export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: any) {
    super(message, 400, ErrorCode.BAD_REQUEST, true, details);
  }
}

// 401 Unauthorized
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', details?: any) {
    super(message, 401, ErrorCode.UNAUTHORIZED, true, details);
  }
}

// 403 Forbidden
export class ForbiddenError extends AppError {
  constructor(message = 'Access denied', details?: any) {
    super(message, 403, ErrorCode.FORBIDDEN, true, details);
  }
}

// 404 Not Found
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: any) {
    super(message, 404, ErrorCode.NOT_FOUND, true, details);
  }
}

// 409 Conflict
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', details?: any) {
    super(message, 409, ErrorCode.CONFLICT, true, details);
  }
}

// 400 Validation / Bad Request
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: any) {
    super(message, 400, ErrorCode.INVALID_INPUT, true, details);
  }
}

// 429 Too Many Requests
export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', details?: any) {
    super(message, 429, ErrorCode.RATE_LIMIT_EXCEEDED, true, details);
  }
}

// 500 Internal Server Error
export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', details?: any) {
    super(message, 500, ErrorCode.INTERNAL_SERVER_ERROR, false, details);
  }
}

// 503 Service Unavailable
export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable', details?: any) {
    super(message, 503, ErrorCode.SERVICE_UNAVAILABLE, true, details);
  }
}

// Authentication specific errors
export class InvalidCredentialsError extends AppError {
  constructor(message = 'Invalid email or password') {
    super(message, 401, ErrorCode.INVALID_CREDENTIALS, true);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message = 'Token has expired') {
    super(message, 401, ErrorCode.TOKEN_EXPIRED, true);
  }
}

export class TokenInvalidError extends AppError {
  constructor(message = 'Invalid token') {
    super(message, 401, ErrorCode.TOKEN_INVALID, true);
  }
}

export class EmailAlreadyExistsError extends AppError {
  constructor(message = 'Email already in use') {
    super(message, 409, ErrorCode.EMAIL_ALREADY_EXISTS, true);
  }
}

// External service errors
export class ExternalApiError extends AppError {
  constructor(message = 'External API error', details?: any) {
    super(message, 502, ErrorCode.EXTERNAL_API_ERROR, true, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database error', details?: any) {
    super(message, 500, ErrorCode.DATABASE_ERROR, false, details);
  }
}

export class CacheError extends AppError {
  constructor(message = 'Cache error', details?: any) {
    super(message, 500, ErrorCode.CACHE_ERROR, true, details);
  }
}

export class AIServiceError extends AppError {
  constructor(message = 'AI service error', details?: any) {
    super(message, 502, ErrorCode.AI_SERVICE_ERROR, true, details);
  }
}
