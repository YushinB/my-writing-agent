import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define environment schema with Zod
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Server Configuration
  PORT: z.string().default('5000').transform(Number),
  API_VERSION: z.string().default('v1'),

  // Database Configuration
  DATABASE_URL: z.string().url().min(1, 'Database URL is required'),

  // Redis Configuration
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform(Number),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default('0').transform(Number),

  // JWT Configuration
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT access secret must be at least 32 characters')
    .refine(
      (val) => {
        // In production, enforce stronger secrets (no common patterns)
        if (process.env.NODE_ENV === 'production') {
          const weakPatterns = [
            'secret',
            'password',
            'change-this',
            'your-super-secret',
            '123456',
            'test',
          ];
          const lowerVal = val.toLowerCase();
          return !weakPatterns.some((pattern) => lowerVal.includes(pattern));
        }
        return true;
      },
      {
        message:
          'JWT access secret is too weak for production. Generate a strong random secret.',
      }
    ),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT refresh secret must be at least 32 characters')
    .refine(
      (val) => {
        // In production, enforce stronger secrets (no common patterns)
        if (process.env.NODE_ENV === 'production') {
          const weakPatterns = [
            'secret',
            'password',
            'change-this',
            'your-super-secret',
            '123456',
            'test',
          ];
          const lowerVal = val.toLowerCase();
          return !weakPatterns.some((pattern) => lowerVal.includes(pattern));
        }
        return true;
      },
      {
        message:
          'JWT refresh secret is too weak for production. Generate a strong random secret.',
      }
    )
    .refine(
      (val) => {
        // Ensure refresh secret is different from access secret
        return val !== process.env.JWT_ACCESS_SECRET;
      },
      {
        message: 'JWT refresh secret must be different from access secret',
      }
    ),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Google Gemini AI
  GEMINI_API_KEY: z.string().min(1, 'Gemini API key is required'),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),

  // CORS Configuration
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:3000')
    .refine(
      (val) => {
        // In production, enforce HTTPS origins
        if (process.env.NODE_ENV === 'production') {
          const origins = val.split(',').map((o) => o.trim());
          return origins.every((origin) => origin.startsWith('https://'));
        }
        return true;
      },
      {
        message: 'CORS origins must use HTTPS in production',
      }
    ),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
  RATE_LIMIT_AUTH_MAX: z.string().default('5').transform(Number),
  RATE_LIMIT_LLM_MAX: z.string().default('20').transform(Number),

  // Cache TTL (in seconds)
  CACHE_TTL_DICTIONARY: z.string().default('604800').transform(Number),
  CACHE_TTL_USER: z.string().default('3600').transform(Number),
  CACHE_TTL_LLM: z.string().default('86400').transform(Number),

  // External APIs
  FREE_DICTIONARY_API_URL: z
    .string()
    .url()
    .default('https://api.dictionaryapi.dev/api/v2/entries/en'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  LOG_FILE_ERROR: z.string().default('logs/error.log'),
  LOG_FILE_COMBINED: z.string().default('logs/combined.log'),

  // Session
  SESSION_EXPIRY: z.string().default('86400').transform(Number),
});

// Validate environment variables
function validateEnv() {
  try {
    const parsed = envSchema.parse(process.env);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      console.error(
        error.issues
          .map(
            (err: z.ZodIssue) =>
              `  - ${err.path.join('.')}: ${err.message}${err.code === 'invalid_type' ? ` (received: ${(err as any).received})` : ''}`
          )
          .join('\n')
      );
      process.exit(1);
    }
    throw error;
  }
}

// Export validated and type-safe environment object
export const env = validateEnv();

// Export type for use in other files
export type Env = z.infer<typeof envSchema>;

// Helper function to check if in production
export const isProduction = () => env.NODE_ENV === 'production';

// Helper function to check if in development
export const isDevelopment = () => env.NODE_ENV === 'development';

// Helper function to check if in test
export const isTest = () => env.NODE_ENV === 'test';

// Parse CORS origins
export const getCorsOrigins = (): string[] => {
  return env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
};

// Display environment info (non-sensitive)
export function displayEnvInfo() {
  console.log('\n📋 Environment Configuration:');
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Port: ${env.PORT}`);
  console.log(`   API Version: ${env.API_VERSION}`);
  console.log(`   Redis: ${env.REDIS_HOST}:${env.REDIS_PORT}`);
  console.log(`   CORS Origins: ${getCorsOrigins().join(', ')}`);
  console.log(`   Log Level: ${env.LOG_LEVEL}`);
  console.log(`   Gemini Model: ${env.GEMINI_MODEL}\n`);
}

export default env;
