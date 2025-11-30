import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

/**
 * Validation target type
 */
type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Generic Zod validation middleware
 * @param schema - Zod schema to validate against
 * @param target - Which part of the request to validate (body, query, params)
 */
export function validate<T>(schema: z.ZodSchema<T>, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get the data to validate based on target
      let data: unknown;
      switch (target) {
        case 'body':
          data = req.body;
          break;
        case 'query':
          data = req.query;
          break;
        case 'params':
          data = req.params;
          break;
        default:
          data = req.body;
      }

      // Validate the data
      const validated = schema.parse(data);

      // Replace the original data with validated data
      switch (target) {
        case 'body':
          req.body = validated;
          break;
        case 'query':
          req.query = validated as any;
          break;
        case 'params':
          req.params = validated as any;
          break;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors for better readability
        const formattedErrors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));

        next(
          new ValidationError('Validation failed', {
            errors: formattedErrors,
            target,
          })
        );
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate request body
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return validate(schema, 'body');
}

/**
 * Validate query parameters
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return validate(schema, 'query');
}

/**
 * Validate route parameters
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return validate(schema, 'params');
}

/**
 * Validate multiple targets at once
 */
export function validateMultiple(schemas: {
  body?: z.ZodSchema<any>;
  query?: z.ZodSchema<any>;
  params?: z.ZodSchema<any>;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: any[] = [];

      // Validate body
      if (schemas.body) {
        try {
          req.body = schemas.body.parse(req.body);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push({
              target: 'body',
              issues: error.issues,
            });
          }
        }
      }

      // Validate query
      if (schemas.query) {
        try {
          req.query = schemas.query.parse(req.query) as any;
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push({
              target: 'query',
              issues: error.issues,
            });
          }
        }
      }

      // Validate params
      if (schemas.params) {
        try {
          req.params = schemas.params.parse(req.params) as any;
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push({
              target: 'params',
              issues: error.issues,
            });
          }
        }
      }

      // If there are any errors, throw ValidationError
      if (errors.length > 0) {
        throw new ValidationError('Validation failed', { errors });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
