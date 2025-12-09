import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ValidationError } from '../../utils/errors';

/**
 * Zod Schema for GenerateOptions
 */
const GenerateOptionsSchema = z.object({
  maxTokens: z
    .number()
    .int()
    .min(1, 'maxTokens must be at least 1')
    .max(32000, 'maxTokens cannot exceed 32000')
    .optional()
    .default(1000),

  temperature: z
    .number()
    .min(0, 'temperature must be between 0 and 2')
    .max(2, 'temperature must be between 0 and 2')
    .optional()
    .default(0.7),

  topP: z
    .number()
    .min(0, 'topP must be between 0 and 1')
    .max(1, 'topP must be between 0 and 1')
    .optional()
    .default(1.0),

  stopSequences: z
    .array(z.string())
    .max(4, 'stopSequences cannot have more than 4 sequences')
    .optional(),

  systemPrompt: z
    .string()
    .max(4000, 'systemPrompt cannot exceed 4000 characters')
    .optional(),
});

/**
 * Zod Schema for RoutingPolicy
 */
const RoutingPolicySchema = z.enum([
  'user-preference',
  'cost-optimized',
  'performance',
  'quality',
  'round-robin',
  'fallback-chain',
]);

/**
 * Zod Schema for GenerateRequest
 *
 * This schema validates the request body for AI text generation.
 * It ensures all required fields are present and all values are within acceptable ranges.
 */
export const GenerateRequestSchema = z.object({
  prompt: z
    .string()
    .min(1, 'prompt is required and cannot be empty')
    .max(50000, 'prompt cannot exceed 50000 characters'),

  model: z
    .string()
    .min(1, 'model name cannot be empty')
    .max(100, 'model name cannot exceed 100 characters')
    .optional(),

  provider: z
    .string()
    .min(1, 'provider name cannot be empty')
    .max(50, 'provider name cannot exceed 50 characters')
    .optional(),

  useUserPreference: z.boolean().optional().default(true),

  routingPolicy: RoutingPolicySchema.optional(),

  options: GenerateOptionsSchema.optional(),

  useCache: z.boolean().optional().default(true),

  allowFallback: z.boolean().optional().default(true),

  timeout: z
    .number()
    .int()
    .min(1000, 'timeout must be at least 1000ms (1 second)')
    .max(300000, 'timeout cannot exceed 300000ms (5 minutes)')
    .optional()
    .default(30000),
});

/**
 * Type for validated GenerateRequest
 */
export type ValidatedGenerateRequest = z.infer<typeof GenerateRequestSchema>;

/**
 * Middleware to validate AI Gateway generate request
 *
 * Validates the request body against the GenerateRequestSchema.
 * If validation fails, returns a 400 error with detailed error messages.
 *
 * @example
 * ```typescript
 * router.post('/generate', validateGenerateRequest, generateController);
 * ```
 */
export function validateGenerateRequest(req: Request, _res: Response, next: NextFunction) {
  void _res;
  try {
    // Validate request body
    const validated = GenerateRequestSchema.parse(req.body);

    // Replace body with validated data (includes defaults)
    req.body = validated;

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      // Format Zod errors for better readability
      const formattedErrors = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
        received: (issue as any).received,
      }));

      next(
        new ValidationError('AI Gateway request validation failed', {
          errors: formattedErrors,
          target: 'body',
        })
      );
    } else {
      next(error);
    }
  }
}

/**
 * Schema for health check query parameters
 */
const HealthCheckQuerySchema = z.object({
  provider: z.string().optional(),
  detailed: z
    .string()
    .optional()
    .transform((val) => val === 'true' || val === '1'),
});

/**
 * Type for validated health check query
 */
export type ValidatedHealthCheckQuery = z.infer<typeof HealthCheckQuerySchema>;

/**
 * Middleware to validate health check query parameters
 */
export function validateHealthCheckQuery(req: Request, _res: Response, next: NextFunction) {
  void _res;
  try {
    const validated = HealthCheckQuerySchema.parse(req.query);
    req.query = validated as any;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));

      next(
        new ValidationError('Health check query validation failed', {
          errors: formattedErrors,
          target: 'query',
        })
      );
    } else {
      next(error);
    }
  }
}

/**
 * Schema for provider configuration (admin endpoints)
 */
export const ProviderConfigSchema = z.object({
  name: z.string().min(1, 'Provider name is required'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  priority: z.number().int().min(0).max(1000).default(0),
  config: z.record(z.any()).optional(),
  promptCostPer1k: z.number().min(0).default(0),
  completionCostPer1k: z.number().min(0).default(0),
  requestsPerMinute: z.number().int().min(1).default(60),
  requestsPerDay: z.number().int().min(1).default(10000),
});

/**
 * Type for validated provider config
 */
export type ValidatedProviderConfig = z.infer<typeof ProviderConfigSchema>;

/**
 * Middleware to validate provider configuration
 */
export function validateProviderConfig(req: Request, _res: Response, next: NextFunction) {
  void _res;
  try {
    const validated = ProviderConfigSchema.parse(req.body);
    req.body = validated;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));

      next(
        new ValidationError('Provider configuration validation failed', {
          errors: formattedErrors,
          target: 'body',
        })
      );
    } else {
      next(error);
    }
  }
}

/**
 * Schema for quota update (admin endpoints)
 */
export const QuotaUpdateSchema = z.object({
  dailyRequestLimit: z.number().int().min(0).optional(),
  monthlyRequestLimit: z.number().int().min(0).optional(),
  monthlySpendLimit: z.number().min(0).optional(),
  tier: z.enum(['free', 'pro', 'admin', 'enterprise']).optional(),
});

/**
 * Type for validated quota update
 */
export type ValidatedQuotaUpdate = z.infer<typeof QuotaUpdateSchema>;

/**
 * Middleware to validate quota update request
 */
export function validateQuotaUpdate(req: Request, _res: Response, next: NextFunction) {
  void _res;
  try {
    const validated = QuotaUpdateSchema.parse(req.body);
    req.body = validated;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));

      next(
        new ValidationError('Quota update validation failed', {
          errors: formattedErrors,
          target: 'body',
        })
      );
    } else {
      next(error);
    }
  }
}

/**
 * Export all schemas for reuse
 */
export {
  GenerateOptionsSchema,
  RoutingPolicySchema,
  HealthCheckQuerySchema,
};
