import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import OpenAI from 'openai';
import { OpenAIAdapter } from '../OpenAIAdapter';
import type { GenerateRequest } from '../../types';

// Mock the OpenAI client
jest.mock('openai');

describe('OpenAIAdapter', () => {
  let adapter: OpenAIAdapter;
  let mockClient: jest.Mocked<OpenAI>;
  const mockApiKey = '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';
  const mockModelId = 'gpt-3.5-turbo';

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock client with proper typing
    const mockCreate = jest.fn() as jest.MockedFunction<any>;
    const mockRetrieve = jest.fn() as jest.MockedFunction<any>;
    
    mockClient = {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
      models: {
        retrieve: mockRetrieve,
      },
    } as any;

    // Mock OpenAI constructor
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockClient);

    // Create adapter instance
    adapter = new OpenAIAdapter(mockApiKey, mockModelId);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct provider name', () => {
      expect(adapter.providerName).toBe('openai');
    });

    it('should initialize with provided model ID', () => {
      expect(adapter.modelId).toBe(mockModelId);
    });

    it('should set default model ID if not provided', () => {
      const defaultAdapter = new OpenAIAdapter(mockApiKey);
      expect(defaultAdapter.modelId).toBe('gpt-3.5-turbo');
    });

    it('should configure capabilities for GPT-3.5', () => {
      expect(adapter.capabilities).toEqual({
        maxTokens: 4096,
        supportsStreaming: true,
        supportsSystemPrompt: true,
        supportsFunctions: true,
      });
    });

    it('should configure capabilities for GPT-4', () => {
      const gpt4Adapter = new OpenAIAdapter(mockApiKey, 'gpt-4');
      expect(gpt4Adapter.capabilities).toEqual({
        maxTokens: 8192,
        supportsStreaming: true,
        supportsSystemPrompt: true,
        supportsFunctions: true,
      });
    });
  });

  describe('generate()', () => {
    const mockRequest: GenerateRequest = {
      prompt: 'Write a haiku about coding',
      options: {
        maxTokens: 100,
        temperature: 0.7,
      },
    };

    const mockOpenAIResponse = {
      choices: [
        {
          message: {
            content: 'Lines of code flow\nBugs hide in the shadows deep\nDebug and prevail',
          },
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
    };

    beforeEach(() => {
      (mockClient.chat.completions.create as jest.MockedFunction<any>).mockResolvedValue(mockOpenAIResponse);
    });

    it('should generate text successfully', async () => {
      const result = await adapter.generate(mockRequest);

      expect(result.provider).toBe('openai');
      expect(result.model).toBe(mockModelId);
      expect(result.output).toBe('Lines of code flow\nBugs hide in the shadows deep\nDebug and prevail');
      expect(result.cached).toBe(false);
    });

    it('should include token usage in result', async () => {
      const result = await adapter.generate(mockRequest);

      expect(result.usage).toEqual({
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });
    });

    it('should include cost estimate in result', async () => {
      const result = await adapter.generate(mockRequest);

      expect(result.costEstimate).toBeDefined();
      expect(result.costEstimate.amount).toBeGreaterThan(0);
      expect(result.costEstimate.currency).toBe('USD');
      expect(result.costEstimate.breakdown).toHaveProperty('promptCost');
      expect(result.costEstimate.breakdown).toHaveProperty('completionCost');
    });

    it('should pass maxTokens to OpenAI API', async () => {
      await adapter.generate(mockRequest);

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 100,
        })
      );
    });

    it('should pass temperature to OpenAI API', async () => {
      await adapter.generate(mockRequest);

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.7,
        })
      );
    });

    it('should use default values when options not provided', async () => {
      await adapter.generate({ prompt: 'Test prompt' });

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 1000,
          temperature: 0.7,
        })
      );
    });

    it('should include system prompt when provided', async () => {
      await adapter.generate({
        prompt: 'Test prompt',
        options: { systemPrompt: 'You are a helpful assistant' },
      });

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'system', content: 'You are a helpful assistant' },
            { role: 'user', content: 'Test prompt' },
          ],
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      const mockError = { status: 429, message: 'Rate limit exceeded' };
      (mockClient.chat.completions.create as jest.MockedFunction<any>).mockRejectedValue(mockError);

      await expect(adapter.generate(mockRequest)).rejects.toThrow('OpenAI: Rate limit exceeded');
    });

    it('should wrap unauthorized errors', async () => {
      const mockError = { status: 401, message: 'Invalid API key' };
      (mockClient.chat.completions.create as jest.MockedFunction<any>).mockRejectedValue(mockError);

      await expect(adapter.generate(mockRequest)).rejects.toThrow('OpenAI: Unauthorized - check API key');
    });

    it('should wrap timeout errors', async () => {
      const mockError = { code: 'ETIMEDOUT', message: 'Request timeout' };
      (mockClient.chat.completions.create as jest.MockedFunction<any>).mockRejectedValue(mockError);

      await expect(adapter.generate(mockRequest)).rejects.toThrow('OpenAI: Timeout');
    });
  });

  describe('health()', () => {
    it('should return healthy status when API is accessible', async () => {
      (mockClient.models.retrieve as jest.MockedFunction<any>).mockResolvedValue({ id: mockModelId });

      const status = await adapter.health();

      expect(status.healthy).toBe(true);
      expect(status.lastChecked).toBeInstanceOf(Date);
    });

    it('should return unhealthy status when API is not accessible', async () => {
      const mockError = new Error('API not reachable');
      (mockClient.models.retrieve as jest.MockedFunction<any>).mockRejectedValue(mockError);

      const status = await adapter.health();

      expect(status.healthy).toBe(false);
      expect(status.lastChecked).toBeInstanceOf(Date);
      expect(status.message).toBe('API not reachable');
    });

    it('should call models.retrieve with correct model ID', async () => {
      (mockClient.models.retrieve as jest.MockedFunction<any>).mockResolvedValue({ id: mockModelId });

      await adapter.health();

      expect(mockClient.models.retrieve).toHaveBeenCalledWith(mockModelId);
    });
  });

  describe('estimateCost()', () => {
    it('should estimate cost for GPT-3.5 turbo', async () => {
      const request: GenerateRequest = {
        prompt: 'Test prompt',
        options: { maxTokens: 1000 },
      };

      const estimate = await adapter.estimateCost(request);

      expect(estimate.currency).toBe('USD');
      expect(estimate.amount).toBeGreaterThan(0);
      expect(estimate.breakdown.promptCost).toBeGreaterThan(0);
      expect(estimate.breakdown.completionCost).toBeGreaterThan(0);
    });

    it('should use higher pricing for GPT-4', async () => {
      const gpt4Adapter = new OpenAIAdapter(mockApiKey, 'gpt-4');
      const request: GenerateRequest = {
        prompt: 'Test prompt',
        options: { maxTokens: 1000 },
      };

      const gpt4Estimate = await gpt4Adapter.estimateCost(request);
      const gpt35Estimate = await adapter.estimateCost(request);

      expect(gpt4Estimate.amount).toBeGreaterThan(gpt35Estimate.amount);
    });

    it('should use default maxTokens when not provided', async () => {
      const request: GenerateRequest = {
        prompt: 'Test prompt',
      };

      const estimate = await adapter.estimateCost(request);

      expect(estimate.amount).toBeGreaterThan(0);
    });

    it('should scale cost with token counts', async () => {
      const smallRequest: GenerateRequest = {
        prompt: 'Hi',
        options: { maxTokens: 100 },
      };

      const largeRequest: GenerateRequest = {
        prompt: 'Hi',
        options: { maxTokens: 2000 },
      };

      const smallEstimate = await adapter.estimateCost(smallRequest);
      const largeEstimate = await adapter.estimateCost(largeRequest);

      expect(largeEstimate.amount).toBeGreaterThan(smallEstimate.amount);
    });
  });

  describe('checkQuota()', () => {
    it('should return infinite quota (OpenAI does not expose quota endpoint)', async () => {
      const quota = await adapter.checkQuota();

      expect(quota.remaining).toBe(Infinity);
      expect(quota.limit).toBe(Infinity);
      expect(quota.resetAt).toBeInstanceOf(Date);
    });
  });

  describe('getRateLimit()', () => {
    it('should return rate limit info', () => {
      const rateLimit = adapter.getRateLimit();

      expect(rateLimit.requestsPerMinute).toBe(3500);
      expect(rateLimit.requestsPerDay).toBe(10000);
    });
  });

  describe('Token estimation', () => {
    it('should estimate tokens based on character count', async () => {
      const shortPrompt = 'Hi';
      const longPrompt = 'This is a much longer prompt that contains many more characters';

      const shortRequest: GenerateRequest = { prompt: shortPrompt };
      const longRequest: GenerateRequest = { prompt: longPrompt };

      const shortEstimate = await adapter.estimateCost(shortRequest);
      const longEstimate = await adapter.estimateCost(longRequest);

      expect(longEstimate.breakdown.promptCost).toBeGreaterThan(shortEstimate.breakdown.promptCost);
    });
  });

  describe('Error handling', () => {
    it('should handle unknown errors', async () => {
      (mockClient.chat.completions.create as jest.MockedFunction<any>).mockRejectedValue(null);

      await expect(adapter.generate({ prompt: 'test' })).rejects.toThrow('Unknown OpenAI error');
    });

    it('should preserve error messages for unhandled errors', async () => {
      const customError = { message: 'Custom error message', status: 500 };
      (mockClient.chat.completions.create as jest.MockedFunction<any>).mockRejectedValue(customError);

      await expect(adapter.generate({ prompt: 'test' })).rejects.toThrow('OpenAI error: Custom error message');
    });
  });
});
