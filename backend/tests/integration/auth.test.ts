import request from 'supertest';
import createApp from '../../src/app';
import { prisma } from '../setup';
import { createTestUser, deleteTestUser } from '../helpers';
import { Application } from 'express';

describe('Auth Endpoints', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  afterEach(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'test-auth-',
        },
      },
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: `test-auth-register-${Date.now()}@example.com`,
        password: 'Test123!@#',
        name: 'Test User',
      };

      const response = await request(app).post('/api/v1/auth/register').send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      const email = `test-auth-duplicate-${Date.now()}@example.com`;
      const userData = {
        email,
        password: 'Test123!@#',
        name: 'Test User',
      };

      // Register first user
      await request(app).post('/api/v1/auth/register').send(userData);

      // Try to register again
      const response = await request(app).post('/api/v1/auth/register').send(userData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Test123!@#',
        name: 'Test User',
      };

      const response = await request(app).post('/api/v1/auth/register').send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject weak password', async () => {
      const userData = {
        email: `test-auth-weak-${Date.now()}@example.com`,
        password: '123',
        name: 'Test User',
      };

      const response = await request(app).post('/api/v1/auth/register').send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const password = 'Test123!@#';
      const user = await createTestUser({
        email: `test-auth-login-${Date.now()}@example.com`,
        password,
      });

      const response = await request(app).post('/api/v1/auth/login').send({
        email: user.email,
        password,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      await deleteTestUser(user.id);
    });

    it('should reject invalid credentials', async () => {
      const user = await createTestUser({
        email: `test-auth-invalid-${Date.now()}@example.com`,
        password: 'Test123!@#',
      });

      const response = await request(app).post('/api/v1/auth/login').send({
        email: user.email,
        password: 'WrongPassword123!',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);

      await deleteTestUser(user.id);
    });

    it('should reject non-existent user', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'Test123!@#',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should get current user with valid token', async () => {
      const password = 'Test123!@#';
      const user = await createTestUser({
        email: `test-auth-me-${Date.now()}@example.com`,
        password,
      });

      // Login to get token
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: user.email,
        password,
      });

      const { accessToken } = loginResponse.body.data;

      // Get current user
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(user.id);
      expect(response.body.data.email).toBe(user.email);

      await deleteTestUser(user.id);
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/v1/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
