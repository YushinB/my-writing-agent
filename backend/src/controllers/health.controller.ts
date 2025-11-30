import { Request, Response } from 'express';
import { checkDatabaseHealth } from '../config/database';
import { checkRedisHealth } from '../config/redis';
import { testGeminiConnection } from '../config/gemini';
import { createSuccessResponse } from '../utils/transform';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Health check endpoint
 * GET /api/health
 */
export const healthCheck = asyncHandler(async (_req: Request, res: Response) => {
  const startTime = Date.now();
  void _req;
  // Check services
  const [dbHealthy, redisHealthy, geminiHealthy] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    testGeminiConnection().catch(() => false),
  ]);

  const responseTime = Date.now() - startTime;
  const allHealthy = dbHealthy && redisHealthy;

  const healthData = {
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: dbHealthy,
      redis: redisHealthy,
      geminiAi: geminiHealthy,
    },
    version: process.env.npm_package_version || '1.0.0',
    responseTime: `${responseTime}ms`,
  };

  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json(createSuccessResponse(healthData));
});

/**
 * Readiness check (for Kubernetes)
 * GET /api/health/ready
 */
export const readinessCheck = asyncHandler(async (_req: Request, res: Response) => {
  void _req;
  const dbHealthy = await checkDatabaseHealth();
  const redisHealthy = await checkRedisHealth();

  if (dbHealthy && redisHealthy) {
    res.json(createSuccessResponse({ ready: true }));
  } else {
    res.status(503).json(createSuccessResponse({ ready: false }));
  }
});

/**
 * Liveness check (for Kubernetes)
 * GET /api/health/live
 */
export const livenessCheck = asyncHandler(async (_req: Request, res: Response) => {
  void _req;
  res.json(createSuccessResponse({ alive: true }));
});
