import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';
import { env } from '../config/env';
import { RateLimitError } from '../utils/errors';
import { Request, Response } from 'express';
import logger from '../utils/logger';

/**
 * Custom rate limit handler
 */
const rateLimitHandler = (req: Request, res: Response) => {
  console.log('Rate limit exceeded for IP:', res.req?.ip, 'Path:', req.path);
  logger.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
  throw new RateLimitError('Too many requests, please try again later');
};

/**
 * General rate limiter
 * Default: 100 requests per 15 minutes
 * Disabled in test environment
 */
export const generalRateLimiter =
  env.NODE_ENV === 'test'
    ? (_req: Request, _res: Response, next: Function) => next()
    : rateLimit({
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        max: env.RATE_LIMIT_MAX_REQUESTS,
        message: 'Too many requests from this IP, please try again later',
        standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
        legacyHeaders: false, // Disable `X-RateLimit-*` headers
        handler: rateLimitHandler,
        store: new RedisStore({
          // @ts-ignore - Type mismatch but works correctly
          sendCommand: (...args: string[]) => redis.call(...args),
          prefix: 'rl:general:',
        }),
      });

/**
 * Auth rate limiter (stricter for login/register)
 * 5 requests per 15 minutes
 * Disabled in test environment
 */
export const authRateLimiter =
  env.NODE_ENV === 'test'
    ? (_req: Request, _res: Response, next: Function) => next()
    : rateLimit({
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        max: env.RATE_LIMIT_AUTH_MAX,
        message: 'Too many authentication attempts, please try again later',
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true, // Only count failed login attempts
        handler: rateLimitHandler,
        store: new RedisStore({
          // @ts-ignore
          sendCommand: (...args: string[]) => redis.call(...args),
          prefix: 'rl:auth:',
        }),
      });

/**
 * LLM/AI endpoints rate limiter
 * 20 requests per 15 minutes
 * Disabled in test environment
 */
export const llmRateLimiter =
  env.NODE_ENV === 'test'
    ? (_req: Request, _res: Response, next: Function) => next()
    : rateLimit({
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        max: env.RATE_LIMIT_LLM_MAX,
        message: 'Too many AI requests, please try again later',
        standardHeaders: true,
        legacyHeaders: false,
        handler: rateLimitHandler,
        store: new RedisStore({
          // @ts-ignore
          sendCommand: (...args: string[]) => redis.call(...args),
          prefix: 'rl:llm:',
        }),
      });

/**
 * Per-user rate limiter
 * Limits based on user ID instead of IP
 */
export const perUserRateLimiter = (windowMs: number, maxRequests: number) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise fall back to IP
      return req.userId || req.ip || 'unknown';
    },
    store: new RedisStore({
      // @ts-ignore
      sendCommand: (...args: string[]) => redis.call(...args),
      prefix: 'rl:user:',
    }),
  });
};

/**
 * Create custom rate limiter with specific settings
 */
export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  prefix?: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}) => {
  return rateLimit({
    windowMs: options.windowMs || env.RATE_LIMIT_WINDOW_MS,
    max: options.max || env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    keyGenerator: options.keyGenerator,
    store: new RedisStore({
      // @ts-ignore
      sendCommand: (...args: string[]) => redis.call(...args),
      prefix: options.prefix || 'rl:custom:',
    }),
  });
};
