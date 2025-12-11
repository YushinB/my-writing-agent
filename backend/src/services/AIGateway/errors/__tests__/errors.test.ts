import { describe, it, expect } from '@jest/globals';
import {
  AIGatewayError,
  AIGatewayErrorCode,
  InvalidRequestError,
  ProviderTimeoutError,
  ProviderError,
  AllProvidersFailedError,
  NoAdapterFoundError,
  ModelNotFoundError,
  ContextLengthExceededError,
  ContentFilteredError,
  RateLimitExceededError,
  isOperationalError,
  getErrorStatusCode,
  formatErrorResponse,
  ERROR_STATUS_CODES,
} from '../index';

describe('AI Gateway Errors', () => {
  describe('AIGatewayError', () => {
    it('should create error with correct properties', () => {
      const error = new AIGatewayError(
        'Test error',
        AIGatewayErrorCode.INTERNAL_ERROR,
        { key: 'value' }
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AIGatewayError');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(AIGatewayErrorCode.INTERNAL_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.metadata).toEqual({ key: 'value' });
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should default to UNKNOWN_ERROR code', () => {
      const error = new AIGatewayError('Test error');

      expect(error.code).toBe(AIGatewayErrorCode.UNKNOWN_ERROR);
      expect(error.statusCode).toBe(500);
    });

    it('should allow non-operational errors', () => {
      const error = new AIGatewayError(
        'Critical error',
        AIGatewayErrorCode.INTERNAL_ERROR,
        undefined,
        false
      );

      expect(error.isOperational).toBe(false);
    });

    it('should capture stack trace', () => {
      const error = new AIGatewayError('Test error');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AIGatewayError');
    });

    it('should convert to JSON correctly', () => {
      const error = new AIGatewayError(
        'Test error',
        AIGatewayErrorCode.INVALID_REQUEST,
        { field: 'prompt' }
      );

      const json = error.toJSON();

      expect(json).toEqual({
        name: 'AIGatewayError',
        message: 'Test error',
        code: AIGatewayErrorCode.INVALID_REQUEST,
        statusCode: 400,
        metadata: { field: 'prompt' },
        timestamp: error.timestamp.toISOString(),
      });
    });

    it('should have correct status codes for all error codes', () => {
      expect(ERROR_STATUS_CODES[AIGatewayErrorCode.UNKNOWN_ERROR]).toBe(500);
      expect(ERROR_STATUS_CODES[AIGatewayErrorCode.INVALID_REQUEST]).toBe(400);
      expect(ERROR_STATUS_CODES[AIGatewayErrorCode.UNAUTHORIZED]).toBe(401);
      expect(ERROR_STATUS_CODES[AIGatewayErrorCode.FORBIDDEN]).toBe(403);
      expect(ERROR_STATUS_CODES[AIGatewayErrorCode.MODEL_NOT_FOUND]).toBe(404);
      expect(ERROR_STATUS_CODES[AIGatewayErrorCode.QUOTA_EXCEEDED]).toBe(429);
      expect(ERROR_STATUS_CODES[AIGatewayErrorCode.PROVIDER_ERROR]).toBe(502);
      expect(ERROR_STATUS_CODES[AIGatewayErrorCode.PROVIDER_UNAVAILABLE]).toBe(503);
      expect(ERROR_STATUS_CODES[AIGatewayErrorCode.PROVIDER_TIMEOUT]).toBe(504);
    });
  });

  describe('InvalidRequestError', () => {
    it('should create with correct code and status', () => {
      const error = new InvalidRequestError('Invalid prompt');

      expect(error.name).toBe('InvalidRequestError');
      expect(error.code).toBe(AIGatewayErrorCode.INVALID_REQUEST);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid prompt');
    });

    it('should support metadata', () => {
      const error = new InvalidRequestError('Missing field', { field: 'prompt' });

      expect(error.metadata).toEqual({ field: 'prompt' });
    });
  });

  describe('ProviderTimeoutError', () => {
    it('should create with provider and timeout info', () => {
      const error = new ProviderTimeoutError('openai', 30000);

      expect(error.name).toBe('ProviderTimeoutError');
      expect(error.code).toBe(AIGatewayErrorCode.PROVIDER_TIMEOUT);
      expect(error.statusCode).toBe(504);
      expect(error.provider).toBe('openai');
      expect(error.timeout).toBe(30000);
      expect(error.message).toContain('openai');
      expect(error.message).toContain('30000ms');
    });

    it('should include provider and timeout in metadata', () => {
      const error = new ProviderTimeoutError('openai', 30000, { requestId: '123' });

      expect(error.metadata).toEqual({
        provider: 'openai',
        timeout: 30000,
        requestId: '123',
      });
    });
  });

  describe('ProviderError', () => {
    it('should create with provider info', () => {
      const error = new ProviderError('openai', 'API Error', 'Rate limit exceeded');

      expect(error.name).toBe('ProviderError');
      expect(error.code).toBe(AIGatewayErrorCode.PROVIDER_ERROR);
      expect(error.statusCode).toBe(502);
      expect(error.provider).toBe('openai');
      expect(error.message).toBe('API Error');
      expect(error.providerMessage).toBe('Rate limit exceeded');
    });

    it('should work without provider message', () => {
      const error = new ProviderError('openai', 'API Error');

      expect(error.providerMessage).toBeUndefined();
    });

    it('should include provider info in metadata', () => {
      const error = new ProviderError('openai', 'API Error', 'Provider message');

      expect(error.metadata).toEqual({
        provider: 'openai',
        providerMessage: 'Provider message',
      });
    });
  });

  describe('AllProvidersFailedError', () => {
    it('should create with provider errors', () => {
      const providerErrors = [
        { provider: 'openai', error: 'Timeout' },
        { provider: 'anthropic', error: 'Rate limit' },
      ];

      const error = new AllProvidersFailedError(providerErrors);

      expect(error.name).toBe('AllProvidersFailedError');
      expect(error.code).toBe(AIGatewayErrorCode.ALL_PROVIDERS_FAILED);
      expect(error.statusCode).toBe(503);
      expect(error.attempts).toBe(2);
      expect(error.providerErrors).toEqual(providerErrors);
      expect(error.message).toContain('2 provider(s) failed');
    });

    it('should include provider errors in metadata', () => {
      const providerErrors = [{ provider: 'openai', error: 'Timeout' }];
      const error = new AllProvidersFailedError(providerErrors);

      expect(error.metadata).toEqual({
        providerErrors,
      });
    });

    it('should handle single provider failure', () => {
      const error = new AllProvidersFailedError([{ provider: 'openai', error: 'Error' }]);

      expect(error.attempts).toBe(1);
      expect(error.message).toContain('1 provider(s) failed');
    });
  });

  describe('NoAdapterFoundError', () => {
    it('should create with default message', () => {
      const error = new NoAdapterFoundError();

      expect(error.name).toBe('NoAdapterFoundError');
      expect(error.code).toBe(AIGatewayErrorCode.NO_ADAPTER_FOUND);
      expect(error.statusCode).toBe(503);
      expect(error.message).toBe('No suitable adapter found for the request');
    });

    it('should accept custom message', () => {
      const error = new NoAdapterFoundError('Custom message');

      expect(error.message).toBe('Custom message');
    });

    it('should support metadata', () => {
      const error = new NoAdapterFoundError('Not found', { requestedModel: 'gpt-5' });

      expect(error.metadata).toEqual({ requestedModel: 'gpt-5' });
    });
  });

  describe('ModelNotFoundError', () => {
    it('should create with model name', () => {
      const error = new ModelNotFoundError('gpt-5');

      expect(error.name).toBe('ModelNotFoundError');
      expect(error.code).toBe(AIGatewayErrorCode.MODEL_NOT_FOUND);
      expect(error.statusCode).toBe(404);
      expect(error.model).toBe('gpt-5');
      expect(error.message).toContain('gpt-5');
    });

    it('should include model in metadata', () => {
      const error = new ModelNotFoundError('gpt-5', { provider: 'openai' });

      expect(error.metadata).toEqual({
        model: 'gpt-5',
        provider: 'openai',
      });
    });
  });

  describe('ContextLengthExceededError', () => {
    it('should create with length info', () => {
      const error = new ContextLengthExceededError(4096, 5000);

      expect(error.name).toBe('ContextLengthExceededError');
      expect(error.code).toBe(AIGatewayErrorCode.CONTEXT_LENGTH_EXCEEDED);
      expect(error.statusCode).toBe(400);
      expect(error.maxLength).toBe(4096);
      expect(error.actualLength).toBe(5000);
      expect(error.message).toContain('5000');
      expect(error.message).toContain('4096');
    });

    it('should include lengths in metadata', () => {
      const error = new ContextLengthExceededError(4096, 5000, { model: 'gpt-3.5' });

      expect(error.metadata).toEqual({
        maxLength: 4096,
        actualLength: 5000,
        model: 'gpt-3.5',
      });
    });
  });

  describe('ContentFilteredError', () => {
    it('should create with reason', () => {
      const error = new ContentFilteredError('Inappropriate content');

      expect(error.name).toBe('ContentFilteredError');
      expect(error.code).toBe(AIGatewayErrorCode.CONTENT_FILTERED);
      expect(error.statusCode).toBe(400);
      expect(error.reason).toBe('Inappropriate content');
      expect(error.message).toContain('Inappropriate content');
    });

    it('should create without reason', () => {
      const error = new ContentFilteredError();

      expect(error.reason).toBeUndefined();
      expect(error.message).toBe('Content was filtered by safety system');
    });

    it('should include reason in metadata', () => {
      const error = new ContentFilteredError('Violence', { severity: 'high' });

      expect(error.metadata).toEqual({
        reason: 'Violence',
        severity: 'high',
      });
    });
  });

  describe('RateLimitExceededError', () => {
    it('should create with retry after', () => {
      const error = new RateLimitExceededError(60);

      expect(error.name).toBe('RateLimitExceededError');
      expect(error.code).toBe(AIGatewayErrorCode.RATE_LIMIT_EXCEEDED);
      expect(error.statusCode).toBe(429);
      expect(error.retryAfter).toBe(60);
      expect(error.message).toContain('60 seconds');
    });

    it('should create without retry after', () => {
      const error = new RateLimitExceededError();

      expect(error.retryAfter).toBeUndefined();
      expect(error.message).toBe('Rate limit exceeded');
    });

    it('should include retry after in metadata', () => {
      const error = new RateLimitExceededError(120, { endpoint: '/generate' });

      expect(error.metadata).toEqual({
        retryAfter: 120,
        endpoint: '/generate',
      });
    });
  });

  describe('isOperationalError()', () => {
    it('should return true for operational AIGatewayError', () => {
      const error = new AIGatewayError('Test', AIGatewayErrorCode.INVALID_REQUEST);

      expect(isOperationalError(error)).toBe(true);
    });

    it('should return false for non-operational AIGatewayError', () => {
      const error = new AIGatewayError(
        'Test',
        AIGatewayErrorCode.INTERNAL_ERROR,
        undefined,
        false
      );

      expect(isOperationalError(error)).toBe(false);
    });

    it('should return false for standard Error', () => {
      const error = new Error('Standard error');

      expect(isOperationalError(error)).toBe(false);
    });

    it('should return true for all specific error types', () => {
      expect(isOperationalError(new InvalidRequestError('test'))).toBe(true);
      expect(isOperationalError(new ProviderTimeoutError('test', 1000))).toBe(true);
      expect(isOperationalError(new ProviderError('test', 'test'))).toBe(true);
      expect(isOperationalError(new NoAdapterFoundError())).toBe(true);
      expect(isOperationalError(new ModelNotFoundError('test'))).toBe(true);
    });
  });

  describe('getErrorStatusCode()', () => {
    it('should return correct status code for AIGatewayError', () => {
      const error = new InvalidRequestError('Test');

      expect(getErrorStatusCode(error)).toBe(400);
    });

    it('should return 500 for standard Error', () => {
      const error = new Error('Standard error');

      expect(getErrorStatusCode(error)).toBe(500);
    });

    it('should return correct status codes for different error types', () => {
      expect(getErrorStatusCode(new InvalidRequestError('test'))).toBe(400);
      expect(getErrorStatusCode(new ModelNotFoundError('test'))).toBe(404);
      expect(getErrorStatusCode(new RateLimitExceededError())).toBe(429);
      expect(getErrorStatusCode(new ProviderError('test', 'test'))).toBe(502);
      expect(getErrorStatusCode(new NoAdapterFoundError())).toBe(503);
      expect(getErrorStatusCode(new ProviderTimeoutError('test', 1000))).toBe(504);
    });
  });

  describe('formatErrorResponse()', () => {
    it('should format AIGatewayError correctly', () => {
      const error = new InvalidRequestError('Missing prompt', { field: 'prompt' });
      const response = formatErrorResponse(error);

      expect(response.success).toBe(false);
      expect(response.error).toEqual({
        code: AIGatewayErrorCode.INVALID_REQUEST,
        message: 'Missing prompt',
        metadata: { field: 'prompt' },
      });
      expect(response.timestamp).toBeDefined();
      expect(new Date(response.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should format standard Error', () => {
      const error = new Error('Standard error');
      const response = formatErrorResponse(error);

      expect(response.success).toBe(false);
      expect(response.error).toEqual({
        code: 'UNKNOWN_ERROR',
        message: 'Standard error',
      });
      expect(response.timestamp).toBeDefined();
    });

    it('should handle errors without message', () => {
      const error = new Error();
      const response = formatErrorResponse(error);

      expect(response.error.message).toBe('An unexpected error occurred');
    });

    it('should preserve error metadata', () => {
      const error = new ProviderTimeoutError('openai', 30000, { requestId: '123' });
      const response = formatErrorResponse(error);

      expect(response.error.metadata).toEqual({
        provider: 'openai',
        timeout: 30000,
        requestId: '123',
      });
    });

    it('should include timestamp in ISO format', () => {
      const error = new AIGatewayError('Test');
      const response = formatErrorResponse(error);

      const timestamp = new Date(response.timestamp);
      expect(timestamp.toISOString()).toBe(response.timestamp);
    });
  });

  describe('Error inheritance', () => {
    it('should properly inherit from Error', () => {
      const error = new AIGatewayError('Test');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AIGatewayError);
    });

    it('should properly inherit chain for specific errors', () => {
      const error = new InvalidRequestError('Test');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AIGatewayError);
      expect(error).toBeInstanceOf(InvalidRequestError);
    });

    it('should maintain proper constructor names', () => {
      expect(new AIGatewayError('test').constructor.name).toBe('AIGatewayError');
      expect(new InvalidRequestError('test').constructor.name).toBe('InvalidRequestError');
      expect(new ProviderTimeoutError('p', 1).constructor.name).toBe(
        'ProviderTimeoutError'
      );
    });
  });

  describe('Error serialization', () => {
    it('should serialize to JSON string correctly', () => {
      const error = new InvalidRequestError('Test error', { field: 'prompt' });
      const json = JSON.stringify(error.toJSON());
      const parsed = JSON.parse(json);

      expect(parsed.name).toBe('InvalidRequestError');
      expect(parsed.message).toBe('Test error');
      expect(parsed.code).toBe(AIGatewayErrorCode.INVALID_REQUEST);
      expect(parsed.metadata).toEqual({ field: 'prompt' });
    });

    it('should include all required fields in JSON', () => {
      const error = new AIGatewayError('Test');
      const json = error.toJSON();

      expect(json).toHaveProperty('name');
      expect(json).toHaveProperty('message');
      expect(json).toHaveProperty('code');
      expect(json).toHaveProperty('statusCode');
      expect(json).toHaveProperty('timestamp');
    });
  });
});
