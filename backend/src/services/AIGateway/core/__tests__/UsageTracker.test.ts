import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { UsageTracker } from '../UsageTracker';
import type { GenerateRequest, GenerateResult } from '../../types';

// Mock Prisma client
const mockPrisma = {
  aIProvider: {
    findUnique: jest.fn() as any,
    create: jest.fn() as any,
  },
  aIUsage: {
    create: jest.fn() as any,
    aggregate: jest.fn() as any,
    count: jest.fn() as any,
  },
};

// Mock logger
jest.mock('../../../../utils/logger', () => ({
  __esModule: true,
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock database
jest.mock('../../../../config/database', () => ({
  prisma: mockPrisma,
}));

describe('UsageTracker', () => {
  let usageTracker: UsageTracker;
  const testUserId = 'test-user-123';
  const testProvider = 'openai';
  const testModel = 'gpt-3.5-turbo';

  const mockProvider = {
    id: 'provider-123',
    name: testProvider,
    displayName: 'OpenAI',
    description: 'OpenAI provider',
    enabled: true,
    priority: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRequest: GenerateRequest = {
    prompt: 'Test prompt',
    options: {
      maxTokens: 100,
      temperature: 0.7,
    },
  };

  const mockResult: GenerateResult = {
    output: 'Test response',
    provider: testProvider,
    model: testModel,
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

  beforeEach(() => {
    usageTracker = new UsageTracker();
    jest.clearAllMocks();
    mockPrisma.aIProvider.findUnique.mockResolvedValue(mockProvider);
    mockPrisma.aIUsage.create.mockResolvedValue({ id: 'usage-123' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('recordUsage()', () => {
    it('should record successful usage', async () => {
      await usageTracker.recordUsage({
        userId: testUserId,
        provider: testProvider,
        model: testModel,
        operation: 'generate',
        request: mockRequest,
        result: mockResult,
        latency: 150,
        successful: true,
      });

      expect(mockPrisma.aIUsage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: testUserId,
          providerId: mockProvider.id,
          model: testModel,
          operation: 'generate',
          successful: true,
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
          latency: 150,
          estimatedCost: 0.001,
        }),
      });
    });

    it('should find or create provider', async () => {
      await usageTracker.recordUsage({
        userId: testUserId,
        provider: testProvider,
        model: testModel,
        operation: 'generate',
        request: mockRequest,
        result: mockResult,
        latency: 150,
        successful: true,
      });

      expect(mockPrisma.aIProvider.findUnique).toHaveBeenCalledWith({
        where: { name: testProvider },
      });
    });

    it('should create provider if not found', async () => {
      mockPrisma.aIProvider.findUnique.mockResolvedValue(null);
      const newProvider = { ...mockProvider, name: 'new-provider' };
      mockPrisma.aIProvider.create.mockResolvedValue(newProvider);

      await usageTracker.recordUsage({
        userId: testUserId,
        provider: 'new-provider',
        model: testModel,
        operation: 'generate',
        request: mockRequest,
        result: mockResult,
        latency: 150,
        successful: true,
      });

      expect(mockPrisma.aIProvider.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'new-provider',
          enabled: true,
        }),
      });
    });

    it('should record failed usage with error info', async () => {
      await usageTracker.recordUsage({
        userId: testUserId,
        provider: testProvider,
        model: testModel,
        operation: 'generate',
        request: mockRequest,
        error: {
          code: 'TIMEOUT',
          message: 'Request timed out',
        },
        latency: 5000,
        successful: false,
      });

      expect(mockPrisma.aIUsage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          successful: false,
          errorCode: 'TIMEOUT',
          errorMessage: 'Request timed out',
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        }),
      });
    });

    it('should sanitize long prompts', async () => {
      const longPrompt = 'a'.repeat(3000);
      const requestWithLongPrompt = { ...mockRequest, prompt: longPrompt };

      await usageTracker.recordUsage({
        userId: testUserId,
        provider: testProvider,
        model: testModel,
        operation: 'generate',
        request: requestWithLongPrompt,
        result: mockResult,
        latency: 150,
        successful: true,
      });

      const createCall: any = mockPrisma.aIUsage.create.mock.calls[0][0];
      expect(createCall.data.prompt.length).toBeLessThanOrEqual(2000);
    });

    it('should generate unique request IDs', async () => {
      await usageTracker.recordUsage({
        userId: testUserId,
        provider: testProvider,
        model: testModel,
        operation: 'generate',
        request: mockRequest,
        result: mockResult,
        latency: 150,
        successful: true,
      });

      await usageTracker.recordUsage({
        userId: testUserId,
        provider: testProvider,
        model: testModel,
        operation: 'generate',
        request: mockRequest,
        result: mockResult,
        latency: 150,
        successful: true,
      });

      const call1: any = mockPrisma.aIUsage.create.mock.calls[0][0];
      const call2: any = mockPrisma.aIUsage.create.mock.calls[1][0];
      expect(call1.data.requestId).not.toBe(call2.data.requestId);
    });

    it('should include metadata', async () => {
      await usageTracker.recordUsage({
        userId: testUserId,
        provider: testProvider,
        model: testModel,
        operation: 'generate',
        request: mockRequest,
        result: mockResult,
        latency: 150,
        successful: true,
      });

      const createCall: any = mockPrisma.aIUsage.create.mock.calls[0][0];
      expect(createCall.data.metadata).toEqual(
        expect.objectContaining({
          temperature: 0.7,
          maxTokens: 100,
        })
      );
    });

    it('should handle provider lookup failure gracefully', async () => {
      mockPrisma.aIProvider.findUnique.mockRejectedValue(new Error('DB Error'));

      // Should not throw
      await expect(
        usageTracker.recordUsage({
          userId: testUserId,
          provider: testProvider,
          model: testModel,
          operation: 'generate',
          request: mockRequest,
          result: mockResult,
          latency: 150,
          successful: true,
        })
      ).resolves.toBeUndefined();

      expect(mockPrisma.aIUsage.create).not.toHaveBeenCalled();
    });

    it('should handle database insertion failure gracefully', async () => {
      mockPrisma.aIUsage.create.mockRejectedValue(new Error('DB Error'));

      // Should not throw
      await expect(
        usageTracker.recordUsage({
          userId: testUserId,
          provider: testProvider,
          model: testModel,
          operation: 'generate',
          request: mockRequest,
          result: mockResult,
          latency: 150,
          successful: true,
        })
      ).resolves.toBeUndefined();
    });

    it('should round latency to integer', async () => {
      await usageTracker.recordUsage({
        userId: testUserId,
        provider: testProvider,
        model: testModel,
        operation: 'generate',
        request: mockRequest,
        result: mockResult,
        latency: 123.456,
        successful: true,
      });

      const createCall: any = mockPrisma.aIUsage.create.mock.calls[0][0];
      expect(createCall.data.latency).toBe(123);
    });

    it('should set cached flag correctly', async () => {
      const cachedResult = { ...mockResult, cached: true };

      await usageTracker.recordUsage({
        userId: testUserId,
        provider: testProvider,
        model: testModel,
        operation: 'generate',
        request: mockRequest,
        result: cachedResult,
        latency: 10,
        successful: true,
      });

      const createCall: any = mockPrisma.aIUsage.create.mock.calls[0][0];
      expect(createCall.data.cached).toBe(true);
    });
  });

  describe('recordSuccess()', () => {
    it('should record successful request', async () => {
      await usageTracker.recordSuccess(testUserId, mockRequest, mockResult, 150);

      expect(mockPrisma.aIUsage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: testUserId,
          model: testModel,
          successful: true,
          totalTokens: 30,
        }),
      });
    });

    it('should extract provider and model from result', async () => {
      await usageTracker.recordSuccess(testUserId, mockRequest, mockResult, 150);

      const createCall: any = mockPrisma.aIUsage.create.mock.calls[0][0];
      expect(createCall.data.model).toBe(testModel);
    });
  });

  describe('recordFailure()', () => {
    it('should record failed request', async () => {
      await usageTracker.recordFailure(
        testUserId,
        mockRequest,
        testProvider,
        testModel,
        { code: 'TIMEOUT', message: 'Request timed out' },
        5000
      );

      expect(mockPrisma.aIUsage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: testUserId,
          model: testModel,
          successful: false,
          errorCode: 'TIMEOUT',
          errorMessage: 'Request timed out',
          latency: 5000,
        }),
      });
    });

    it('should set tokens to zero for failed requests', async () => {
      await usageTracker.recordFailure(
        testUserId,
        mockRequest,
        testProvider,
        testModel,
        { code: 'ERROR', message: 'Failed' },
        1000
      );

      const createCall: any = mockPrisma.aIUsage.create.mock.calls[0][0];
      expect(createCall.data.promptTokens).toBe(0);
      expect(createCall.data.completionTokens).toBe(0);
      expect(createCall.data.totalTokens).toBe(0);
    });
  });

  describe('getUserStats()', () => {
    beforeEach(() => {
      mockPrisma.aIUsage.aggregate.mockResolvedValue({
        _count: { id: 100 },
        _sum: {
          totalTokens: 50000,
          estimatedCost: 2.5,
        },
        _avg: {
          latency: 250,
        },
      });

      mockPrisma.aIUsage.count.mockImplementation(({ where }: any) => {
        if (where.successful === true) return Promise.resolve(90);
        if (where.successful === false) return Promise.resolve(10);
        return Promise.resolve(0);
      });
    });

    it('should return aggregated stats for user', async () => {
      const stats = await usageTracker.getUserStats(testUserId, 'month');

      expect(stats).toEqual({
        totalRequests: 100,
        successfulRequests: 90,
        failedRequests: 10,
        totalTokens: 50000,
        totalCost: 2.5,
        averageLatency: 250,
      });
    });

    it('should query with correct date filter for day period', async () => {
      await usageTracker.getUserStats(testUserId, 'day');

      const aggregateCall = mockPrisma.aIUsage.aggregate.mock.calls[0][0];
      expect(aggregateCall.where).toHaveProperty('createdAt');
      expect(aggregateCall.where.createdAt).toHaveProperty('gte');
    });

    it('should query with correct date filter for month period', async () => {
      await usageTracker.getUserStats(testUserId, 'month');

      const aggregateCall = mockPrisma.aIUsage.aggregate.mock.calls[0][0];
      expect(aggregateCall.where).toHaveProperty('createdAt');
    });

    it('should query without date filter for all period', async () => {
      await usageTracker.getUserStats(testUserId, 'all');

      const aggregateCall = mockPrisma.aIUsage.aggregate.mock.calls[0][0];
      expect(aggregateCall.where).not.toHaveProperty('createdAt');
    });

    it('should handle null values in aggregation', async () => {
      mockPrisma.aIUsage.aggregate.mockResolvedValue({
        _count: { id: 0 },
        _sum: {
          totalTokens: null,
          estimatedCost: null,
        },
        _avg: {
          latency: null,
        },
      });

      const stats = await usageTracker.getUserStats(testUserId);

      expect(stats.totalTokens).toBe(0);
      expect(stats.totalCost).toBe(0);
      expect(stats.averageLatency).toBe(0);
    });

    it('should default to month period', async () => {
      await usageTracker.getUserStats(testUserId);

      const aggregateCall = mockPrisma.aIUsage.aggregate.mock.calls[0][0];
      expect(aggregateCall.where).toHaveProperty('createdAt');
    });

    it('should throw on database error', async () => {
      mockPrisma.aIUsage.aggregate.mockRejectedValue(new Error('DB Error'));

      await expect(usageTracker.getUserStats(testUserId)).rejects.toThrow('DB Error');
    });

    it('should count successful and failed requests separately', async () => {
      await usageTracker.getUserStats(testUserId, 'month');

      expect(mockPrisma.aIUsage.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ successful: true }),
      });

      expect(mockPrisma.aIUsage.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ successful: false }),
      });
    });

    it('should round average latency', async () => {
      mockPrisma.aIUsage.aggregate.mockResolvedValue({
        _count: { id: 10 },
        _sum: { totalTokens: 1000, estimatedCost: 1.0 },
        _avg: { latency: 123.456 },
      });

      const stats = await usageTracker.getUserStats(testUserId);

      expect(stats.averageLatency).toBe(123);
    });
  });

  describe('Provider Management', () => {
    it('should create provider with correct display name', async () => {
      mockPrisma.aIProvider.findUnique.mockResolvedValue(null);
      mockPrisma.aIProvider.create.mockResolvedValue({
        ...mockProvider,
        name: 'anthropic',
        displayName: 'Anthropic',
      });

      await usageTracker.recordUsage({
        userId: testUserId,
        provider: 'anthropic',
        model: 'claude-3',
        operation: 'generate',
        request: mockRequest,
        result: { ...mockResult, provider: 'anthropic' },
        latency: 150,
        successful: true,
      });

      expect(mockPrisma.aIProvider.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'anthropic',
          displayName: 'Anthropic',
        }),
      });
    });

    it('should handle provider creation failure', async () => {
      mockPrisma.aIProvider.findUnique.mockResolvedValue(null);
      mockPrisma.aIProvider.create.mockRejectedValue(new Error('Creation failed'));

      // Should not throw
      await expect(
        usageTracker.recordUsage({
          userId: testUserId,
          provider: 'test',
          model: 'model',
          operation: 'generate',
          request: mockRequest,
          result: mockResult,
          latency: 150,
          successful: true,
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('Metadata Extraction', () => {
    it('should extract request options as metadata', async () => {
      const requestWithOptions: GenerateRequest = {
        prompt: 'Test',
        options: {
          temperature: 0.9,
          maxTokens: 500,
          topP: 0.95,
          systemPrompt: 'You are helpful',
        },
      };

      await usageTracker.recordUsage({
        userId: testUserId,
        provider: testProvider,
        model: testModel,
        operation: 'generate',
        request: requestWithOptions,
        result: mockResult,
        latency: 150,
        successful: true,
      });

      const createCall: any = mockPrisma.aIUsage.create.mock.calls[0][0];
      expect(createCall.data.metadata).toEqual(
        expect.objectContaining({
          temperature: 0.9,
          maxTokens: 500,
          topP: 0.95,
          systemPrompt: 'provided',
        })
      );
    });

    it('should indicate when system prompt is not provided', async () => {
      await usageTracker.recordUsage({
        userId: testUserId,
        provider: testProvider,
        model: testModel,
        operation: 'generate',
        request: mockRequest,
        result: mockResult,
        latency: 150,
        successful: true,
      });

      const createCall: any = mockPrisma.aIUsage.create.mock.calls[0][0];
      expect(createCall.data.metadata.systemPrompt).toBe('none');
    });
  });
});
