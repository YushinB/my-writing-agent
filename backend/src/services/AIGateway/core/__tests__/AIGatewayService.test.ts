import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { AIGatewayService } from '../AIGatewayService';
import type { ModelAdapter, GenerateRequest, GenerateResult } from '../../types';

// Mock the usageTracker
jest.mock('../UsageTracker', () => ({
  usageTracker: {
    recordSuccess: jest.fn().mockResolvedValue(undefined) as any,
    recordFailure: jest.fn().mockResolvedValue(undefined) as any,
  },
}));

describe('AIGatewayService', () => {
  let service: AIGatewayService;
  let mockAdapter: jest.Mocked<ModelAdapter>;

  beforeEach(() => {
    // Get fresh instance for each test
    service = AIGatewayService.getInstance();

    // Clear any existing adapters
    (service as any).adapters.clear();
    (service as any).defaultProvider = null;

    // Create mock adapter
    const mockGenerateResult: GenerateResult = {
      output: 'Test response',
      provider: 'test-provider',
      model: 'test-model',
      cached: false,
      latency: null,
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      },
      costEstimate: {
        amount: 0.001,
        currency: 'USD',
        breakdown: {
          promptCost: 0.0005,
          completionCost: 0.0005,
        },
      },
    };

    mockAdapter = {
      providerName: 'test-provider',
      modelId: 'test-model',
      capabilities: {
        maxTokens: 4096,
        supportsStreaming: true,
        supportsSystemPrompt: true,
        supportsFunctions: false,
      },
      generate: jest.fn().mockResolvedValue(mockGenerateResult),
      health: jest.fn().mockResolvedValue({
        healthy: true,
        lastChecked: new Date(),
      }),
      estimateCost: jest.fn().mockResolvedValue({
        amount: 0.001,
        currency: 'USD',
        breakdown: {
          promptCost: 0.0005,
          completionCost: 0.0005,
        },
      }),
      checkQuota: jest.fn().mockResolvedValue({
        remaining: 1000,
        limit: 1000,
        resetAt: new Date(),
      }),
      getRateLimit: jest.fn().mockReturnValue({
        requestsPerMinute: 60,
        requestsPerDay: 1000,
      }),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInstance()', () => {
    it('should return a singleton instance', () => {
      const instance1 = AIGatewayService.getInstance();
      const instance2 = AIGatewayService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should always return the same instance', () => {
      const instances = Array(5)
        .fill(null)
        .map(() => AIGatewayService.getInstance());
      const allSame = instances.every((instance) => instance === instances[0]);
      expect(allSame).toBe(true);
    });
  });

  describe('registerAdapter()', () => {
    it('should register an adapter successfully', () => {
      service.registerAdapter(mockAdapter);

      const providers = service.getRegisteredProviders();
      expect(providers).toHaveLength(1);
      expect(providers[0].provider).toBe('test-provider');
      expect(providers[0].model).toBe('test-model');
    });

    it('should set first adapter as default', () => {
      service.registerAdapter(mockAdapter);

      const providers = service.getRegisteredProviders();
      expect(providers[0].isDefault).toBe(true);
    });

    it('should set adapter as default when isDefault is true', () => {
      const adapter2: ModelAdapter = {
        ...mockAdapter,
        providerName: 'second-provider',
        modelId: 'second-model',
      } as any;

      service.registerAdapter(mockAdapter, false);
      service.registerAdapter(adapter2, true);

      const providers = service.getRegisteredProviders();
      const defaultProvider = providers.find((p) => p.isDefault);
      expect(defaultProvider?.provider).toBe('second-provider');
    });

    it('should register multiple adapters from the same provider', () => {
      const adapter2: ModelAdapter = {
        ...mockAdapter,
        modelId: 'test-model-2',
      } as any;

      service.registerAdapter(mockAdapter);
      service.registerAdapter(adapter2);

      const providers = service.getRegisteredProviders();
      expect(providers).toHaveLength(2);
      expect(providers.every((p) => p.provider === 'test-provider')).toBe(true);
    });
  });

  describe('setRequestTimeout()', () => {
    it('should set the request timeout', () => {
      service.setRequestTimeout(60000);
      expect((service as any).requestTimeout).toBe(60000);
    });

    it('should accept different timeout values', () => {
      service.setRequestTimeout(5000);
      expect((service as any).requestTimeout).toBe(5000);

      service.setRequestTimeout(120000);
      expect((service as any).requestTimeout).toBe(120000);
    });
  });

  describe('generate()', () => {
    const mockRequest: GenerateRequest = {
      prompt: 'Test prompt',
      options: {
        maxTokens: 100,
        temperature: 0.7,
      },
    };

    beforeEach(() => {
      service.registerAdapter(mockAdapter, true);
    });

    it('should generate text successfully', async () => {
      const response = await service.generate(mockRequest);

      expect(response.success).toBe(true);
      expect(response.data.output).toBe('Test response');
      expect(response.data.provider).toBe('test-provider');
      expect(response.data.model).toBe('test-model');
    });

    it('should call the adapter generate method', async () => {
      await service.generate(mockRequest);

      expect(mockAdapter.generate).toHaveBeenCalledWith(mockRequest);
      expect(mockAdapter.generate).toHaveBeenCalledTimes(1);
    });

    it('should include usage information in response', async () => {
      const response = await service.generate(mockRequest);

      expect(response.data.usage).toEqual({
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });
    });

    it('should include cost estimate in response', async () => {
      const response = await service.generate(mockRequest);

      expect(response.data.costEstimate).toEqual({
        amount: 0.001,
        currency: 'USD',
        breakdown: {
          promptCost: 0.0005,
          completionCost: 0.0005,
        },
      });
    });

    it('should include latency in response', async () => {
      const response = await service.generate(mockRequest);

      expect(response.data.latency).toBeGreaterThanOrEqual(0);
      expect(typeof response.data.latency).toBe('number');
    });

    it('should include timestamp in response', async () => {
      const response = await service.generate(mockRequest);

      expect(response.timestamp).toBeDefined();
      expect(new Date(response.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should handle generation with userId', async () => {
      const response = await service.generate(mockRequest, 'user-123');

      expect(response.success).toBe(true);
      expect(mockAdapter.generate).toHaveBeenCalled();
    });

    it('should throw error when no adapter is registered', async () => {
      (service as any).adapters.clear();
      (service as any).defaultProvider = null;

      await expect(service.generate(mockRequest)).rejects.toThrow(
        'No suitable adapter found for the request'
      );
    });

    it('should handle adapter errors gracefully', async () => {
      mockAdapter.generate = jest.fn().mockRejectedValue(new Error('API Error'));

      await expect(service.generate(mockRequest)).rejects.toThrow('API Error');
    });

    it('should timeout after configured duration', async () => {
      service.setRequestTimeout(100);
      mockAdapter.generate = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 200);
          })
      );

      await expect(service.generate(mockRequest)).rejects.toThrow('timed out');
    }, 10000);

    it('should use custom timeout from request', async () => {
      mockAdapter.generate = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 150);
          })
      );

      const requestWithTimeout = { ...mockRequest, timeout: 100 };

      await expect(service.generate(requestWithTimeout)).rejects.toThrow('timed out');
    }, 10000);

    it('should select adapter by provider name', async () => {
      const request = { ...mockRequest, provider: 'test-provider' };
      const response = await service.generate(request);

      expect(response.success).toBe(true);
      expect(mockAdapter.generate).toHaveBeenCalled();
    });

    it('should select adapter by model name', async () => {
      const request = { ...mockRequest, model: 'test-model' };
      const response = await service.generate(request);

      expect(response.success).toBe(true);
      expect(mockAdapter.generate).toHaveBeenCalled();
    });

    it('should select adapter by provider and model', async () => {
      const request = {
        ...mockRequest,
        provider: 'test-provider',
        model: 'test-model',
      };
      const response = await service.generate(request);

      expect(response.success).toBe(true);
      expect(mockAdapter.generate).toHaveBeenCalled();
    });

    it('should fall back to default provider', async () => {
      const request = { ...mockRequest };
      delete request.provider;
      delete request.model;

      const response = await service.generate(request);

      expect(response.success).toBe(true);
      expect(mockAdapter.generate).toHaveBeenCalled();
    });
  });

  describe('health()', () => {
    beforeEach(() => {
      service.registerAdapter(mockAdapter, true);
    });

    it('should check health of all providers', async () => {
      const health = await service.health();

      expect(health).toHaveProperty('test-provider');
      expect(health['test-provider'].healthy).toBe(true);
    });

    it('should call adapter health method', async () => {
      await service.health();

      expect(mockAdapter.health).toHaveBeenCalledTimes(1);
    });

    it('should return lastChecked timestamp', async () => {
      const health = await service.health();

      expect(health['test-provider'].lastChecked).toBeInstanceOf(Date);
    });

    it('should handle health check failures', async () => {
      mockAdapter.health = jest.fn().mockRejectedValue(new Error('Health check failed'));

      const health = await service.health();

      expect(health['test-provider'].healthy).toBe(false);
      expect(health['test-provider'].message).toBe('Health check failed');
    });

    it('should timeout health checks after 5 seconds', async () => {
      mockAdapter.health = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 6000);
          })
      );

      const health = await service.health();

      expect(health['test-provider'].healthy).toBe(false);
      expect(health['test-provider'].message).toContain('timed out');
    }, 10000);

    it('should check health of multiple providers', async () => {
      const adapter2: ModelAdapter = {
        ...mockAdapter,
        providerName: 'second-provider',
        modelId: 'second-model',
      } as any;

      service.registerAdapter(adapter2);

      const health = await service.health();

      expect(Object.keys(health)).toHaveLength(2);
      expect(health).toHaveProperty('test-provider');
      expect(health).toHaveProperty('second-provider');
    });

    it('should not duplicate provider checks', async () => {
      // Register the same provider with different models
      const adapter2: ModelAdapter = {
        ...mockAdapter,
        modelId: 'test-model-2',
      } as any;

      service.registerAdapter(adapter2);

      const health = await service.health();

      // Should only check once per provider, not per model
      expect(Object.keys(health)).toHaveLength(1);
      expect(mockAdapter.health).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRegisteredProviders()', () => {
    it('should return empty array when no providers registered', () => {
      const providers = service.getRegisteredProviders();
      expect(providers).toEqual([]);
    });

    it('should return registered providers', () => {
      service.registerAdapter(mockAdapter);

      const providers = service.getRegisteredProviders();
      expect(providers).toHaveLength(1);
      expect(providers[0]).toEqual({
        provider: 'test-provider',
        model: 'test-model',
        isDefault: true,
      });
    });

    it('should return multiple providers', () => {
      const adapter2: ModelAdapter = {
        ...mockAdapter,
        providerName: 'second-provider',
        modelId: 'second-model',
      } as any;

      service.registerAdapter(mockAdapter);
      service.registerAdapter(adapter2);

      const providers = service.getRegisteredProviders();
      expect(providers).toHaveLength(2);
    });

    it('should correctly indicate default provider', () => {
      const adapter2: ModelAdapter = {
        ...mockAdapter,
        providerName: 'second-provider',
        modelId: 'second-model',
      } as any;

      service.registerAdapter(mockAdapter, false);
      service.registerAdapter(adapter2, true);

      const providers = service.getRegisteredProviders();
      const defaultProviders = providers.filter((p) => p.isDefault);
      expect(defaultProviders).toHaveLength(1);
      expect(defaultProviders[0].provider).toBe('second-provider');
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      service.registerAdapter(mockAdapter, true);
    });

    it('should wrap errors in Error objects', async () => {
      mockAdapter.generate = jest.fn().mockRejectedValue('String error');

      await expect(service.generate({ prompt: 'test' })).rejects.toThrow(Error);
    });

    it('should preserve Error instances', async () => {
      const customError = new Error('Custom error message');
      mockAdapter.generate = jest.fn().mockRejectedValue(customError);

      await expect(service.generate({ prompt: 'test' })).rejects.toThrow(
        'Custom error message'
      );
    });

    it('should handle null errors', async () => {
      (mockAdapter.generate as any) = jest.fn().mockRejectedValue(null);

      await expect(service.generate({ prompt: 'test' })).rejects.toThrow();
    });

    it('should handle undefined errors', async () => {
      (mockAdapter.generate as any) = jest.fn().mockRejectedValue(undefined);

      await expect(service.generate({ prompt: 'test' })).rejects.toThrow();
    });
  });
});
