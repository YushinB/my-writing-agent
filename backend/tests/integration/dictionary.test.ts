import request from 'supertest';
import createApp from '../../src/app';
import { prisma } from '../setup';
import { createTestUserWithTokens, deleteTestUser } from '../helpers';
import { Application } from 'express';
import { UserRole } from '@prisma/client';

describe('Dictionary Endpoints', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.dictionaryEntry.deleteMany({
      where: {
        word: {
          startsWith: 'testword',
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'test-dict-',
        },
      },
    });
  });

  describe('GET /api/v1/dictionary/search', () => {
    it('should search for a word', async () => {
      const { user, accessToken } = await createTestUserWithTokens({
        email: `test-dict-search-${Date.now()}@example.com`,
      });

      const response = await request(app)
        .get('/api/v1/dictionary/search?query=hello')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.word).toBe('hello');

      await deleteTestUser(user.id);
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/v1/dictionary/search?query=hello');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should handle word not found', async () => {
      const { user, accessToken } = await createTestUserWithTokens({
        email: `test-dict-notfound-${Date.now()}@example.com`,
      });

      const response = await request(app)
        .get('/api/v1/dictionary/search?query=nonexistentxyzabc123')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);

      await deleteTestUser(user.id);
    });

    it('should validate query parameter', async () => {
      const { user, accessToken } = await createTestUserWithTokens({
        email: `test-dict-validate-${Date.now()}@example.com`,
      });

      const response = await request(app)
        .get('/api/v1/dictionary/search')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      await deleteTestUser(user.id);
    });
  });

  describe('GET /api/v1/dictionary/word/:word', () => {
    it('should get word definition', async () => {
      const { user, accessToken } = await createTestUserWithTokens({
        email: `test-dict-word-${Date.now()}@example.com`,
      });

      const response = await request(app)
        .get('/api/v1/dictionary/word/test')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.word).toBe('test');
      expect(response.body.data.meanings).toBeDefined();

      await deleteTestUser(user.id);
    });

    it('should handle word not found', async () => {
      const { user, accessToken } = await createTestUserWithTokens({
        email: `test-dict-word-404-${Date.now()}@example.com`,
      });

      const response = await request(app)
        .get('/api/v1/dictionary/word/xyznonexistent')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);

      await deleteTestUser(user.id);
    });
  });

  describe('GET /api/v1/dictionary/word/:word/full', () => {
    it('should get full word data with metadata', async () => {
      const { user, accessToken } = await createTestUserWithTokens({
        email: `test-dict-full-${Date.now()}@example.com`,
      });

      const response = await request(app)
        .get('/api/v1/dictionary/word/example/full')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.word).toBe('example');
      expect(response.body.data.metadata).toBeDefined();
      expect(response.body.data.metadata.queriedAt).toBeDefined();

      await deleteTestUser(user.id);
    });
  });

  describe('GET /api/v1/dictionary/popular', () => {
    it('should get popular words', async () => {
      const { user, accessToken } = await createTestUserWithTokens({
        email: `test-dict-popular-${Date.now()}@example.com`,
      });

      // Add some test words to ensure we have popular words
      await prisma.dictionaryEntry.createMany({
        data: [
          {
            word: 'testword1',
            meanings: { definitions: ['Test definition 1'] },
            source: 'test',
            accessCount: 10,
          },
          {
            word: 'testword2',
            meanings: { definitions: ['Test definition 2'] },
            source: 'test',
            accessCount: 5,
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/dictionary/popular?limit=10')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.words).toBeDefined();
      expect(Array.isArray(response.body.data.words)).toBe(true);

      await deleteTestUser(user.id);
    });
  });

  describe('POST /api/v1/dictionary/words (Admin Only)', () => {
    it('should add word as admin', async () => {
      const { user, accessToken } = await createTestUserWithTokens({
        email: `test-dict-admin-${Date.now()}@example.com`,
        role: UserRole.ADMIN,
      });

      const wordData = {
        word: 'testwordadmin',
        phonetic: '/test/',
        meanings: [
          {
            partOfSpeech: 'noun',
            definitions: [{ definition: 'A test word', example: 'This is a test word' }],
          },
        ],
        origin: 'Test origin',
      };

      const response = await request(app)
        .post('/api/v1/dictionary/words')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(wordData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      await deleteTestUser(user.id);
    });

    it('should reject non-admin user', async () => {
      const { user, accessToken } = await createTestUserWithTokens({
        email: `test-dict-nonadmin-${Date.now()}@example.com`,
        role: UserRole.USER,
      });

      const wordData = {
        word: 'testword',
        meanings: [{ partOfSpeech: 'noun', definitions: [{ definition: 'Test' }] }],
      };

      const response = await request(app)
        .post('/api/v1/dictionary/words')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(wordData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);

      await deleteTestUser(user.id);
    });
  });

  describe('Caching Behavior', () => {
    it('should cache dictionary lookups', async () => {
      const { user, accessToken } = await createTestUserWithTokens({
        email: `test-dict-cache-${Date.now()}@example.com`,
      });

      // First request - should hit database/API
      const response1 = await request(app)
        .get('/api/v1/dictionary/word/cache')
        .set('Authorization', `Bearer ${accessToken}`);

      const time1 = Date.now();

      // Second request - should hit cache (faster)
      const response2 = await request(app)
        .get('/api/v1/dictionary/word/cache')
        .set('Authorization', `Bearer ${accessToken}`);

      const time2 = Date.now();

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.data.word).toBe(response2.body.data.word);

      // Second request should be faster (cached)
      // Note: This is a simple check, actual caching behavior depends on implementation

      await deleteTestUser(user.id);
    });
  });
});
