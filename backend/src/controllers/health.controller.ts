import { Request, Response } from 'express';
import { checkDatabaseHealth } from '../config/database';
import { checkRedisHealth } from '../config/redis';
import { testGeminiConnection } from '../config/gemini';
import { isDevelopment } from '../config/env';
import { createSuccessResponse } from '../utils/transform';
import { asyncHandler } from '../middleware/errorHandler';
import { redis } from '../config/redis';
import { prisma } from '../config/database';

/**
 * Health check endpoint
 * GET /api/health
 */
export const healthCheck = asyncHandler(async (_req: Request, res: Response) => {
  const startTime = Date.now();
  void _req;
  
  // Only test Gemini connection in development (to save API calls in production)
  const geminiHealthPromise = isDevelopment() 
    ? testGeminiConnection().catch(() => false)
    : Promise.resolve(true); // Skip in production, assume healthy
  
  // Check services
  const [dbHealthy, redisHealthy, geminiHealthy] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    geminiHealthPromise,
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
      geminiAi: isDevelopment() ? geminiHealthy : 'skipped',
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

/**
 * Metrics endpoint
 * GET /api/health/metrics
 * Provides application performance and usage metrics
 */
export const metricsCheck = asyncHandler(async (_req: Request, res: Response) => {
  void _req;

  // Get memory usage
  const memoryUsage = process.memoryUsage();
  const memoryMetrics = {
    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`, // Resident Set Size
    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
  };

  // Get CPU usage
  const cpuUsage = process.cpuUsage();
  const cpuMetrics = {
    user: `${Math.round(cpuUsage.user / 1000)}ms`,
    system: `${Math.round(cpuUsage.system / 1000)}ms`,
  };

  // Get Redis info (if available)
  let redisMetrics = {};
  try {
    const redisInfo = await redis.info('stats');
    const totalConnections = redisInfo.match(/total_connections_received:(\d+)/)?.[1] || '0';
    const totalCommands = redisInfo.match(/total_commands_processed:(\d+)/)?.[1] || '0';
    const keyspaceHits = redisInfo.match(/keyspace_hits:(\d+)/)?.[1] || '0';
    const keyspaceMisses = redisInfo.match(/keyspace_misses:(\d+)/)?.[1] || '0';

    const hits = parseInt(keyspaceHits);
    const misses = parseInt(keyspaceMisses);
    const hitRate = hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(2) : '0.00';

    redisMetrics = {
      totalConnections,
      totalCommands,
      cacheHitRate: `${hitRate}%`,
      keyspaceHits,
      keyspaceMisses,
    };
  } catch (error) {
    redisMetrics = { error: 'Redis metrics unavailable' };
  }

  // Get database metrics (query count)
  let databaseMetrics = {};
  try {
    const userCount = await prisma.user.count();
    const savedWordsCount = await prisma.savedWord.count();
    const dictionaryEntriesCount = await prisma.dictionaryEntry.count();

    databaseMetrics = {
      users: userCount,
      savedWords: savedWordsCount,
      dictionaryEntries: dictionaryEntriesCount,
    };
  } catch (error) {
    databaseMetrics = { error: 'Database metrics unavailable' };
  }

  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(process.uptime()),
      formatted: formatUptime(process.uptime()),
    },
    process: {
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    memory: memoryMetrics,
    cpu: cpuMetrics,
    redis: redisMetrics,
    database: databaseMetrics,
    environment: process.env.NODE_ENV,
  };

  res.json(createSuccessResponse(metrics));
});

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}
