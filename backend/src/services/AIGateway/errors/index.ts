/**
 * AI Gateway Error Classes
 *
 * Custom error types for the AI Gateway service with structured
 * error codes, messages, and metadata.
 */

/**
 * Error codes for AI Gateway errors
 */
export enum AIGatewayErrorCode {
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',

  // Request errors
  INVALID_REQUEST = 'INVALID_REQUEST',
  MISSING_PARAMETER = 'MISSING_PARAMETER',
  INVALID_PARAMETER = 'INVALID_PARAMETER',

  // Provider errors
  NO_ADAPTER_FOUND = 'NO_ADAPTER_FOUND',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  PROVIDER_TIMEOUT = 'PROVIDER_TIMEOUT',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  ALL_PROVIDERS_FAILED = 'ALL_PROVIDERS_FAILED',

  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Model errors
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  MODEL_OVERLOADED = 'MODEL_OVERLOADED',
  CONTEXT_LENGTH_EXCEEDED = 'CONTEXT_LENGTH_EXCEEDED',

  // Content errors
  CONTENT_FILTERED = 'CONTENT_FILTERED',
  INVALID_CONTENT = 'INVALID_CONTENT',
}

/**
 * HTTP status codes for different error types
 */
export const ERROR_STATUS_CODES: Record<AIGatewayErrorCode, number> = {
  [AIGatewayErrorCode.UNKNOWN_ERROR]: 500,
  [AIGatewayErrorCode.INTERNAL_ERROR]: 500,
  [AIGatewayErrorCode.CONFIGURATION_ERROR]: 500,

  [AIGatewayErrorCode.INVALID_REQUEST]: 400,
  [AIGatewayErrorCode.MISSING_PARAMETER]: 400,
  [AIGatewayErrorCode.INVALID_PARAMETER]: 400,

  [AIGatewayErrorCode.NO_ADAPTER_FOUND]: 503,
  [AIGatewayErrorCode.PROVIDER_UNAVAILABLE]: 503,
  [AIGatewayErrorCode.PROVIDER_TIMEOUT]: 504,
  [AIGatewayErrorCode.PROVIDER_ERROR]: 502,
  [AIGatewayErrorCode.ALL_PROVIDERS_FAILED]: 503,

  [AIGatewayErrorCode.UNAUTHORIZED]: 401,
  [AIGatewayErrorCode.FORBIDDEN]: 403,
  [AIGatewayErrorCode.QUOTA_EXCEEDED]: 429,

  [AIGatewayErrorCode.RATE_LIMIT_EXCEEDED]: 429,

  [AIGatewayErrorCode.MODEL_NOT_FOUND]: 404,
  [AIGatewayErrorCode.MODEL_OVERLOADED]: 503,
  [AIGatewayErrorCode.CONTEXT_LENGTH_EXCEEDED]: 400,

  [AIGatewayErrorCode.CONTENT_FILTERED]: 400,
  [AIGatewayErrorCode.INVALID_CONTENT]: 400,
};

/**
 * Base AIGatewayError class
 *
 * All AI Gateway errors extend this base class.
 */
export class AIGatewayError extends Error {
  public readonly code: AIGatewayErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly metadata?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: AIGatewayErrorCode = AIGatewayErrorCode.UNKNOWN_ERROR,
    metadata?: Record<string, any>,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AIGatewayError';
    this.code = code;
    this.statusCode = ERROR_STATUS_CODES[code] || 500;
    this.isOperational = isOperational;
    this.metadata = metadata;
    this.timestamp = new Date();

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON format
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      metadata: this.metadata,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

/**
 * Invalid Request Error
 *
 * Thrown when request parameters are invalid or missing.
 */
export class InvalidRequestError extends AIGatewayError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, AIGatewayErrorCode.INVALID_REQUEST, metadata);
    this.name = 'InvalidRequestError';
  }
}

/**
 * Provider Timeout Error
 *
 * Thrown when a provider request times out.
 */
export class ProviderTimeoutError extends AIGatewayError {
  public readonly provider: string;
  public readonly timeout: number;

  constructor(provider: string, timeout: number, metadata?: Record<string, any>) {
    super(
      `Provider '${provider}' request timed out after ${timeout}ms`,
      AIGatewayErrorCode.PROVIDER_TIMEOUT,
      { ...metadata, provider, timeout }
    );
    this.name = 'ProviderTimeoutError';
    this.provider = provider;
    this.timeout = timeout;
  }
}

/**
 * Provider Error
 *
 * Thrown when a provider returns an error.
 */
export class ProviderError extends AIGatewayError {
  public readonly provider: string;
  public readonly providerMessage?: string;

  constructor(
    provider: string,
    message: string,
    providerMessage?: string,
    metadata?: Record<string, any>
  ) {
    super(
      message,
      AIGatewayErrorCode.PROVIDER_ERROR,
      { ...metadata, provider, providerMessage }
    );
    this.name = 'ProviderError';
    this.provider = provider;
    this.providerMessage = providerMessage;
  }
}

/**
 * All Providers Failed Error
 *
 * Thrown when all configured providers fail.
 */
export class AllProvidersFailedError extends AIGatewayError {
  public readonly attempts: number;
  public readonly providerErrors: Array<{ provider: string; error: string }>;

  constructor(
    providerErrors: Array<{ provider: string; error: string }>,
    metadata?: Record<string, any>
  ) {
    const message = `All ${providerErrors.length} provider(s) failed`;
    super(message, AIGatewayErrorCode.ALL_PROVIDERS_FAILED, {
      ...metadata,
      providerErrors,
    });
    this.name = 'AllProvidersFailedError';
    this.attempts = providerErrors.length;
    this.providerErrors = providerErrors;
  }
}

/**
 * No Adapter Found Error
 *
 * Thrown when no suitable adapter is found for the request.
 */
export class NoAdapterFoundError extends AIGatewayError {
  constructor(message?: string, metadata?: Record<string, any>) {
    super(
      message || 'No suitable adapter found for the request',
      AIGatewayErrorCode.NO_ADAPTER_FOUND,
      metadata
    );
    this.name = 'NoAdapterFoundError';
  }
}

/**
 * Model Not Found Error
 *
 * Thrown when the requested model doesn't exist.
 */
export class ModelNotFoundError extends AIGatewayError {
  public readonly model: string;

  constructor(model: string, metadata?: Record<string, any>) {
    super(
      `Model '${model}' not found`,
      AIGatewayErrorCode.MODEL_NOT_FOUND,
      { ...metadata, model }
    );
    this.name = 'ModelNotFoundError';
    this.model = model;
  }
}

/**
 * Context Length Exceeded Error
 *
 * Thrown when the prompt exceeds model's context length.
 */
export class ContextLengthExceededError extends AIGatewayError {
  public readonly maxLength: number;
  public readonly actualLength: number;

  constructor(
    maxLength: number,
    actualLength: number,
    metadata?: Record<string, any>
  ) {
    super(
      `Context length exceeded: ${actualLength} tokens exceeds maximum of ${maxLength}`,
      AIGatewayErrorCode.CONTEXT_LENGTH_EXCEEDED,
      { ...metadata, maxLength, actualLength }
    );
    this.name = 'ContextLengthExceededError';
    this.maxLength = maxLength;
    this.actualLength = actualLength;
  }
}

/**
 * Content Filtered Error
 *
 * Thrown when content is filtered by provider's safety system.
 */
export class ContentFilteredError extends AIGatewayError {
  public readonly reason?: string;

  constructor(reason?: string, metadata?: Record<string, any>) {
    super(
      reason
        ? `Content was filtered: ${reason}`
        : 'Content was filtered by safety system',
      AIGatewayErrorCode.CONTENT_FILTERED,
      { ...metadata, reason }
    );
    this.name = 'ContentFilteredError';
    this.reason = reason;
  }
}

/**
 * Rate Limit Exceeded Error
 *
 * Thrown when rate limit is exceeded.
 */
export class RateLimitExceededError extends AIGatewayError {
  public readonly retryAfter?: number;

  constructor(retryAfter?: number, metadata?: Record<string, any>) {
    const message = retryAfter
      ? `Rate limit exceeded. Retry after ${retryAfter} seconds`
      : 'Rate limit exceeded';

    super(message, AIGatewayErrorCode.RATE_LIMIT_EXCEEDED, {
      ...metadata,
      retryAfter,
    });
    this.name = 'RateLimitExceededError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Check if an error is an operational error (expected/handled)
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AIGatewayError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Get HTTP status code from error
 */
export function getErrorStatusCode(error: Error): number {
  if (error instanceof AIGatewayError) {
    return error.statusCode;
  }
  return 500;
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: Error) {
  if (error instanceof AIGatewayError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        metadata: error.metadata,
      },
      timestamp: error.timestamp.toISOString(),
    };
  }

  // Generic error format
  return {
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
    },
    timestamp: new Date().toISOString(),
  };
}
