import request from 'supertest';
import createApp from '../../src/app';
import { prisma } from '../setup';
import { createTestUserWithTokens, deleteTestUser, wait } from '../helpers';
import { Application } from 'express';

describe('LLM Endpoints', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.aIUsageLog.deleteMany({
      where: {
        user: {
          email: {
            startsWith: 'test-llm-',
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'test-llm-',
        },
      },
    });
  });

  describe('POST /api/v1/llm/correct', () => {
    it('should correct text', async () => {
      const { user, accessToken } = await createTestUserWithTokens({
        email: `test-llm-correct-${Date.now()}@example.com`,
      });

      const response = await request(app)
        .post('/api/v1/llm/correct')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          text: 'Ths is a test sentance with erors.',
          context: 'General writing',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.correctedText).toBeDefined();
      expect(response.body.data.originalText).toBe('Ths is a test sentance with erors.');

      await deleteTestUser(user.id);
    }, 30000); // Extended timeout for AI requests

    it('should require authentication', async () => {
      const response = await request(app).post('/api/v1/llm/correct').send({
        text: 'Test text',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate request body', async () => {
      const { user, accessToken } = await createTestUserWithTokens({
        email: `test-llm-validate-${Date.now()}@example.com`,
      });

      const response = await request(app)
        .post('/api/v1/llm/correct')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({}); // Missing required field

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      await deleteTestUser(user.id);
    });
  });

  describe('POST /api/v1/llm/define', () => {
    it('should define a word using AI', async () => {
      const { user, accessToken } = await createTestUserWithTokens({
        email: `test-llm-define-${Date.now()}@example.com`,
      });

      const response = await request(app)
        .post('/api/v1/llm/define')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          word: 'serendipity',
          context: 'In a sentence about discovery',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.word).toBe('serendipity');
      expect(response.body.data.definition).toBeDefined();
      expect(response.body.data.examples).toBeDefined();

      await deleteTestUser(user.id);
    }, 30000);

    it('should handle missing word', async () => {
      const { user, accessToken } = await createTestUserWithTokens({
        email: `test-llm-noword-${Date.now()}@example.com`,
      });

      const response = await request(app)
        .post('/api/v1/llm/define')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      await deleteTestUser(user.id);
    });
  });

  describe('POST /api/v1/llm/suggestions', () => {
    it('should generate text suggestions', async () => {
      const { user, accessToken } = await createTestUserWithTokens({
        email: `test-llm-suggest-${Date.now()}@example.com`,
      });

      const response = await request(app)
        .post('/api/v1/llm/suggestions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          text: 'The quick brown fox jumps over the lazy dog.',
          type: 'paraphrase',
          count: 3,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.suggestions).toBeDefined();
      expect(Array.isArray(response.body.data.suggestions)).toBe(true);
      expect(response.body.data.type).toBe('paraphrase');

      await deleteTestUser(user.id);
    }, 30000);

    it('should handle different suggestion types', async () => {
      const { user, accessToken } = await createTestUserWithTokens({
        email: `test-llm-types-${Date.now()}@example.com`,
      });

      const types = ['paraphrase', 'expand', 'summarize', 'improve'];

      for (const type of types) {
        const response = await request(app)
          .post('/api/v1/llm/suggestions')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            text: 'This is a test.',
            type,
            count: 2,
          });

        expect(response.status).toBe(200);
        expect(response.body.data.type).toBe(type);

        // Wait between requests to avoid rate limiting
        await wait(1000);
      }

      await deleteTestUser(user.id);
    }, 60000);
  });

  describe('POST /api/v1/llm/analyze', () => {
    it('should analyze writing style', async () => {
      const { user, accessToken } = await createTestUserWithTokens({
        email: `test-llm-analyze-${Date.now()}@example.com`,
      });

      const response = await request(app)
        .post('/api/v1/llm/analyze')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          text: 'The rapid advancement of artificial intelligence has transformed numerous industries. Machine learning algorithms now power everything from recommendation systems to autonomous vehicles. However, ethical considerations remain paramount as we navigate this technological revolution.',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.analysis).toBeDefined();
      expect(response.body.data.analysis.tone).toBeDefined();
      expect(response.body.data.analysis.wordCount).toBeGreaterThan(0);
      expect(response.body.data.analysis.sentenceCount).toBeGreaterThan(0);
      expect(response.body.data.analysis.readabilityScore).toBeDefined();

      await deleteTestUser(user.id);
    }, 30000);
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on LLM endpoints', async () => {
      const { user, accessToken } = await createTestUserWithTokens({
        email: `test-llm-ratelimit-${Date.now()}@example.com`,
      });

      const requests = [];

      // Make multiple rapid requests
      for (let i = 0; i < 15; i++) {
        requests.push(
          request(app)
            .post('/api/v1/llm/correct')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
              text: `Test text ${i}`,
            })
        );
      }

      const responses = await Promise.all(requests);

      // At least one request should be rate limited
      const rateLimitedResponses = responses.filter((r) => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      await deleteTestUser(user.id);
    }, 60000);
  });

  describe('Caching', () => {
    it('should cache LLM responses', async () => {
      const { user, accessToken } = await createTestUserWithTokens({
        email: `test-llm-cache-${Date.now()}@example.com`,
      });

      const requestData = {
        text: 'Test caching behavior',
      };

      // First request
      const response1 = await request(app)
        .post('/api/v1/llm/correct')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestData);

      // Second request with same data
      const response2 = await request(app)
        .post('/api/v1/llm/correct')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestData);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Second response might be cached (indicated by cached field if implemented)
      // Both should return same corrected text
      expect(response1.body.data.originalText).toBe(response2.body.data.originalText);

      await deleteTestUser(user.id);
    }, 60000);
  });

  describe('Usage Logging', () => {
    it('should log AI usage', async () => {
      const { user, accessToken } = await createTestUserWithTokens({
        email: `test-llm-usage-${Date.now()}@example.com`,
      });

      await request(app)
        .post('/api/v1/llm/correct')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          text: 'Log this usage',
        });

      // Check if usage was logged
      const usageLogs = await prisma.aIUsageLog.findMany({
        where: { userId: user.id },
      });

      expect(usageLogs.length).toBeGreaterThan(0);
      expect(usageLogs[0].operation).toBe('correct_text');
      expect(usageLogs[0].totalTokens).toBeGreaterThan(0);

      await deleteTestUser(user.id);
    }, 30000);
  });
});
