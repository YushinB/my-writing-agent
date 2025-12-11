// Set OPENAI_API_KEY before any imports so AI Gateway initializes correctly
process.env.OPENAI_API_KEY = 'test-api-key-for-mocking';

import request from 'supertest';
import { prisma } from '../setup';
import { createTestUserWithTokens, deleteTestUser } from '../helpers';
import { Application } from 'express';
import { User } from '@prisma/client';
import OpenAI from 'openai';

// Mock OpenAI SDK
jest.mock('openai');

// Mock OpenAI response at module level
const mockOpenAIResponse = {
  choices: [
    {
      message: {
        content: 'This is a test AI response.',
      },
    },
  ],
  usage: {
    prompt_tokens: 10,
    completion_tokens: 20,
    total_tokens: 30,
  },
};

// Set up OpenAI mock implementation at module level (before app import)
const mockCreate = jest.fn().mockResolvedValue(mockOpenAIResponse);
const mockRetrieve = jest.fn().mockResolvedValue({ id: 'gpt-3.5-turbo' });

(OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
  () =>
    ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
      models: {
        retrieve: mockRetrieve,
      },
    } as any)
);

// NOW import app after mocks are set up
import createApp from '../../src/app';

describe('AI Gateway Integration Tests', () => {
  let app: Application;
  let testUser: User;
  let accessToken: string;

  beforeAll(async () => {
    app = createApp();

    // Create test user with tokens
    const userData = await createTestUserWithTokens({
      email: `test-ai-gateway-${Date.now()}@example.com`,
    });
    testUser = userData.user;
    accessToken = userData.accessToken;

    // Create quota for user
    await prisma.aIQuota.create({
      data: {
        userId: testUser.id,
        dailyRequestLimit: 1000,
        dailyRequestCount: 0,
        dailyResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        monthlyRequestLimit: 10000,
        monthlyRequestCount: 0,
        monthlySpendLimit: 10.0,
        monthlySpendAmount: 0.0,
        monthlyResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        tier: 'free',
      },
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.aIUsage.deleteMany({ where: { userId: testUser.id } });
    await prisma.aIQuota.deleteMany({ where: { userId: testUser.id } });
    await deleteTestUser(testUser.id);

    // Clean up environment
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/ai/generate', () => {
    it('should generate text successfully with valid request', async () => {
      const response = await request(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          prompt: 'Write a haiku about coding',
          options: {
            maxTokens: 100,
            temperature: 0.7,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.output).toBeDefined();
      expect(response.body.data.provider).toBe('openai');
      expect(response.body.data.model).toBeDefined();
      expect(response.body.data.usage).toBeDefined();
      expect(response.body.data.costEstimate).toBeDefined();
      expect(response.body.data.latency).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app).post('/api/v1/ai/generate').send({
        prompt: 'Test prompt',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          prompt: 'Test prompt',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate required prompt field', async () => {
      const response = await request(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          options: {
            maxTokens: 100,
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject empty prompt', async () => {
      const response = await request(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          prompt: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate maxTokens range', async () => {
      const response = await request(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          prompt: 'Test prompt',
          options: {
            maxTokens: 100000, // Exceeds limit
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate temperature range', async () => {
      const response = await request(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          prompt: 'Test prompt',
          options: {
            temperature: 3.0, // Exceeds limit
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should track usage in database', async () => {
      await request(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          prompt: 'Test for usage tracking',
        });

      // Wait a bit for async usage tracking
      await new Promise((resolve) => setTimeout(resolve, 500));

      const usageRecords = await prisma.aIUsage.findMany({
        where: { userId: testUser.id },
      });

      expect(usageRecords.length).toBeGreaterThan(0);
      const latestUsage = usageRecords[usageRecords.length - 1];
      expect(latestUsage.successful).toBe(true);
      expect(latestUsage.promptTokens).toBeGreaterThan(0);
    });

    it('should increment quota after successful request', async () => {
      const quotaBefore = await prisma.aIQuota.findUnique({
        where: { userId: testUser.id },
      });

      await request(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          prompt: 'Test for quota increment',
        });

      // Wait a bit for async quota update
      await new Promise((resolve) => setTimeout(resolve, 500));

      const quotaAfter = await prisma.aIQuota.findUnique({
        where: { userId: testUser.id },
      });

      expect(quotaAfter!.dailyRequestCount).toBeGreaterThan(
        quotaBefore!.dailyRequestCount
      );
      expect(quotaAfter!.monthlyRequestCount).toBeGreaterThan(
        quotaBefore!.monthlyRequestCount
      );
    });

    it('should reject when daily quota is exceeded', async () => {
      // Set quota to limit
      await prisma.aIQuota.update({
        where: { userId: testUser.id },
        data: {
          dailyRequestCount: 1000,
          dailyRequestLimit: 1000,
        },
      });

      const response = await request(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          prompt: 'Test quota exceeded',
        });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Daily request limit exceeded');

      // Reset quota for other tests
      await prisma.aIQuota.update({
        where: { userId: testUser.id },
        data: {
          dailyRequestCount: 0,
        },
      });
    });

    it('should reject when monthly request quota is exceeded', async () => {
      // Set quota to limit
      await prisma.aIQuota.update({
        where: { userId: testUser.id },
        data: {
          monthlyRequestCount: 10000,
          monthlyRequestLimit: 10000,
        },
      });

      const response = await request(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          prompt: 'Test monthly quota exceeded',
        });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Monthly request limit exceeded');

      // Reset quota for other tests
      await prisma.aIQuota.update({
        where: { userId: testUser.id },
        data: {
          monthlyRequestCount: 0,
        },
      });
    });

    it('should reject when monthly spend quota is exceeded', async () => {
      // Set quota to limit
      await prisma.aIQuota.update({
        where: { userId: testUser.id },
        data: {
          monthlySpendAmount: 10.0,
          monthlySpendLimit: 10.0,
        },
      });

      const response = await request(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          prompt: 'Test spend limit exceeded',
        });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Monthly spend limit exceeded');

      // Reset quota for other tests
      await prisma.aIQuota.update({
        where: { userId: testUser.id },
        data: {
          monthlySpendAmount: 0,
        },
      });
    });

    it('should accept optional provider parameter', async () => {
      const response = await request(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          prompt: 'Test with provider',
          provider: 'openai',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should accept optional model parameter', async () => {
      const response = await request(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          prompt: 'Test with model',
          model: 'gpt-3.5-turbo',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle system prompt option', async () => {
      const response = await request(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          prompt: 'Test with system prompt',
          options: {
            systemPrompt: 'You are a helpful assistant',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return appropriate error on provider failure', async () => {
      // Mock OpenAI to throw an error
      const mockCreate = jest.fn().mockRejectedValue(new Error('API Error'));
      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
        () =>
          ({
            chat: {
              completions: {
                create: mockCreate,
              },
            },
          } as any)
      );

      const response = await request(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          prompt: 'Test error handling',
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);

      // Restore mock
      const mockCreateRestored = jest.fn().mockResolvedValue(mockOpenAIResponse);
      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
        () =>
          ({
            chat: {
              completions: {
                create: mockCreateRestored,
              },
            },
            models: {
              retrieve: jest.fn().mockResolvedValue({ id: 'gpt-3.5-turbo' }),
            },
          } as any)
      );
    });
  });

  describe('GET /api/v1/ai/health', () => {
    it('should return health status for all providers', async () => {
      const response = await request(app)
        .get('/api/v1/ai/health')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.providers).toBeDefined();
      expect(typeof response.body.data.providers).toBe('object');
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/v1/ai/health');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should include provider health status', async () => {
      const response = await request(app)
        .get('/api/v1/ai/health')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      const providers = response.body.data.providers;

      // Should have at least OpenAI provider
      Object.keys(providers).forEach((providerName) => {
        const provider = providers[providerName];
        expect(provider).toHaveProperty('healthy');
        expect(provider).toHaveProperty('lastChecked');
        expect(typeof provider.healthy).toBe('boolean');
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      // This test depends on rate limiting configuration
      // Make multiple rapid requests
      const requests = Array(10)
        .fill(null)
        .map(() =>
          request(app)
            .post('/api/v1/ai/generate')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ prompt: 'Rate limit test' })
        );

      const responses = await Promise.all(requests);

      // All requests should succeed (assuming rate limit is high enough)
      // Or some should fail with 429 if rate limit is reached
      const statuses = responses.map((r) => r.status);
      const hasRateLimitResponse = statuses.some((status) => status === 429);

      // Either all succeed or some are rate limited
      expect(
        statuses.every((s) => s === 200) || hasRateLimitResponse
      ).toBe(true);
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error format', async () => {
      const response = await request(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          prompt: '', // Invalid
        });

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
    });
  });

  describe('Success Response Format', () => {
    it('should return consistent success format', async () => {
      const response = await request(app)
        .post('/api/v1/ai/generate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          prompt: 'Test response format',
        });

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('output');
      expect(response.body.data).toHaveProperty('provider');
      expect(response.body.data).toHaveProperty('model');
      expect(response.body.data).toHaveProperty('usage');
      expect(response.body.data).toHaveProperty('costEstimate');
      expect(response.body.data).toHaveProperty('latency');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
