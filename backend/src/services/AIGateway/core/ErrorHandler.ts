import logger from '../../../utils/logger';
import {
  AIGatewayError,
  ProviderError,
  ProviderTimeoutError,
  RateLimitExceededError,
  ContextLengthExceededError,
  ContentFilteredError,
  ModelNotFoundError,
  InvalidRequestError,
  AIGatewayErrorCode,
} from '../errors';

/**
 * Provider error patterns for mapping
 */
interface ErrorPattern {
  pattern: RegExp;
  handler: (match: RegExpMatchArray, provider: string, originalError: any) => AIGatewayError;
}

/**
 * ErrorHandler
 *
 * Service responsible for handling and transforming provider-specific errors
 * into standardized AI Gateway errors.
 *
 * Maps various provider error formats to consistent error types with
 * appropriate status codes and metadata.
 */
export class ErrorHandler {
  /**
   * Error patterns for common provider errors
   */
  private errorPatterns: ErrorPattern[] = [
    // Timeout errors
    {
      pattern: /timeout|timed out|ETIMEDOUT|ECONNRESET/i,
      handler: (match, provider) =>
        new ProviderTimeoutError(provider, 30000, {
          originalError: match[0],
        }),
    },

    // Rate limit errors
    {
      pattern: /rate limit|too many requests|429/i,
      handler: (match, provider, originalError) => {
        const retryAfter = this.extractRetryAfter(originalError);
        return new RateLimitExceededError(retryAfter, {
          provider,
          originalError: match[0],
        });
      },
    },

    // Authentication errors
    {
      pattern: /unauthorized|invalid api key|401|authentication/i,
      handler: (match, provider) =>
        new ProviderError(
          provider,
          'Provider authentication failed - check API key',
          match[0],
          { code: AIGatewayErrorCode.UNAUTHORIZED }
        ),
    },

    // Model not found
    {
      pattern: /model.*not found|invalid model|unknown model/i,
      handler: (match, provider, originalError) => {
        const model = this.extractModelName(originalError);
        return new ModelNotFoundError(model || 'unknown', { provider });
      },
    },

    // Context length exceeded
    {
      pattern: /context length|maximum context|token limit|too long/i,
      handler: (match, provider, originalError) => {
        const { max, actual } = this.extractTokenCounts(originalError);
        return new ContextLengthExceededError(max, actual, { provider });
      },
    },

    // Content filtered
    {
      pattern: /content filter|safety|inappropriate content|policy violation/i,
      handler: (match, provider) =>
        new ContentFilteredError(match[0], { provider }),
    },

    // Model overloaded
    {
      pattern: /overloaded|capacity|service unavailable|503/i,
      handler: (match, provider) =>
        new ProviderError(
          provider,
          'Provider service is currently overloaded',
          match[0],
          { code: AIGatewayErrorCode.MODEL_OVERLOADED }
        ),
    },

    // Invalid parameters
    {
      pattern: /invalid parameter|invalid request|bad request|400/i,
      handler: (match, provider) =>
        new InvalidRequestError(match[0], { provider }),
    },
  ];

  /**
   * Handle provider error and convert to AI Gateway error
   *
   * @param error - Original error from provider
   * @param provider - Provider name
   * @returns Standardized AIGatewayError
   */
  public handleProviderError(error: unknown, provider: string): AIGatewayError {
    try {
      // If already an AI Gateway error, return as-is
      if (error instanceof AIGatewayError) {
        return error;
      }

      // Convert to Error if not already
      const errorObj = this.toError(error);
      const errorMessage = errorObj.message || String(error);

      // Log the original error
      logger.debug('Handling provider error', {
        provider,
        error: errorMessage,
        type: errorObj.constructor.name,
      });

      // Try to match error patterns
      for (const { pattern, handler } of this.errorPatterns) {
        const match = errorMessage.match(pattern);
        if (match) {
          logger.debug('Matched error pattern', {
            provider,
            pattern: pattern.source,
          });
          return handler(match, provider, error);
        }
      }

      // If no pattern matched, return generic provider error
      return new ProviderError(
        provider,
        'Provider request failed',
        errorMessage,
        { originalError: errorMessage }
      );
    } catch (handlingError) {
      // If error handling itself fails, return a safe error
      logger.error('Error handler failed', {
        provider,
        error: handlingError instanceof Error ? handlingError.message : String(handlingError),
      });

      return new ProviderError(
        provider,
        'An unexpected error occurred',
        undefined,
        { code: AIGatewayErrorCode.INTERNAL_ERROR }
      );
    }
  }

  /**
   * Log error with appropriate level
   *
   * @param error - Error to log
   * @param context - Additional context
   */
  public logError(error: AIGatewayError, context?: Record<string, any>): void {
    const logData = {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      metadata: error.metadata,
      ...context,
    };

    // Operational errors are expected - log as info/warn
    // Non-operational errors are unexpected - log as error
    if (error.isOperational) {
      if (error.statusCode >= 500) {
        logger.warn('AI Gateway operational error', logData);
      } else {
        logger.info('AI Gateway request error', logData);
      }
    } else {
      logger.error('AI Gateway unexpected error', logData);
    }
  }

  /**
   * Format error for response
   *
   * @param error - Error to format
   * @returns Formatted error response
   */
  public formatErrorResponse(error: AIGatewayError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.metadata && { details: error.metadata }),
      },
      timestamp: error.timestamp.toISOString(),
    };
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  /**
   * Convert unknown error to Error object
   */
  private toError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === 'string') {
      return new Error(error);
    }

    if (typeof error === 'object' && error !== null) {
      // Try to extract message from object
      const obj = error as any;
      if (obj.message) {
        return new Error(String(obj.message));
      }
      if (obj.error) {
        return new Error(String(obj.error));
      }
    }

    return new Error('Unknown error occurred');
  }

  /**
   * Extract retry-after value from error
   */
  private extractRetryAfter(error: any): number | undefined {
    try {
      // Check headers (common in HTTP errors)
      if (error?.response?.headers?.['retry-after']) {
        return parseInt(error.response.headers['retry-after']);
      }

      // Check error message for retry time
      const match = String(error).match(/retry after (\d+)/i);
      if (match) {
        return parseInt(match[1]);
      }
    } catch {
      // Ignore extraction errors
    }
    return undefined;
  }

  /**
   * Extract model name from error
   */
  private extractModelName(error: any): string | undefined {
    try {
      // Try to find model name in error message
      const errorStr = String(error);
      const match = errorStr.match(/model[:\s]+['"]?([a-zA-Z0-9-_.]+)['"]?/i);
      if (match) {
        return match[1];
      }
    } catch {
      // Ignore extraction errors
    }
    return undefined;
  }

  /**
   * Extract token counts from context length error
   */
  private extractTokenCounts(error: any): { max: number; actual: number } {
    const defaults = { max: 4096, actual: 5000 };

    try {
      const errorStr = String(error);

      // Try to extract max tokens
      const maxMatch = errorStr.match(/maximum[:\s]+(\d+)/i);
      const max = maxMatch ? parseInt(maxMatch[1]) : defaults.max;

      // Try to extract actual tokens
      const actualMatch = errorStr.match(/(\d+)\s+tokens?/i);
      const actual = actualMatch ? parseInt(actualMatch[1]) : defaults.actual;

      return { max, actual };
    } catch {
      return defaults;
    }
  }
}

/**
 * Singleton instance of ErrorHandler
 */
export const errorHandler = new ErrorHandler();

export default errorHandler;
