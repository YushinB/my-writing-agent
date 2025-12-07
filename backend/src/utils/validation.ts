import { z } from 'zod';

// Common validation schemas

// Email validation
export const emailSchema = z.string().email('Invalid email format').toLowerCase();

// Password validation (min 8 chars, at least 1 letter and 1 number)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Word validation (letters, numbers, hyphens, apostrophes, and spaces for phrases/idioms)
export const wordSchema = z
  .string()
  .min(1, 'Word cannot be empty')
  .max(100, 'Word is too long')
  .regex(/^[a-zA-Z0-9\-'\s]+$/, 'Word contains invalid characters')
  .transform((val) => val.trim());

// Name validation
export const nameSchema = z
  .string()
  .min(1, 'Name cannot be empty')
  .max(100, 'Name is too long')
  .regex(/^[a-zA-Z\s\-']+$/, 'Name contains invalid characters')
  .optional();

// Pagination validation
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1, 'Page must be at least 1')),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(100, 'Limit cannot exceed 100')),
});

// Search query validation
export const searchQuerySchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty').max(100, 'Query is too long'),
  ...paginationSchema.shape,
});

// Registration validation
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
});

// Login validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Refresh token validation
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Text correction validation
export const correctTextSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty').max(5000, 'Text is too long'),
  context: z.string().max(500, 'Context is too long').optional(),
  options: z
    .object({
      preserveFormatting: z.boolean().optional(),
      suggestAlternatives: z.boolean().optional(),
    })
    .optional(),
});

// Define word validation
export const defineWordSchema = z.object({
  word: wordSchema,
  context: z.string().max(500, 'Context is too long').optional(),
});

// Generate suggestions validation
export const generateSuggestionsSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty').max(2000, 'Text is too long'),
  type: z.enum(['paraphrase', 'expand', 'summarize', 'improve']),
  count: z.number().min(1).max(5).optional().default(3),
});

// Analyze writing style validation
export const analyzeWritingStyleSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty').max(5000, 'Text is too long'),
});

// Saved word validation
export const savedWordSchema = z.object({
  word: wordSchema,
  notes: z.string().max(500, 'Notes are too long').optional(),
});

// Dictionary search validation
export const dictionarySearchSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty').max(50, 'Query is too long'),
  limit: z.number().min(1).max(20).optional().default(10),
});

// User settings validation
export const userSettingsSchema = z.object({
  llmModel: z.string().optional(),
  preferredLanguage: z.string().length(2, 'Language code must be 2 characters').optional(),
  theme: z.enum(['light', 'dark']).optional(),
  emailNotifications: z.boolean().optional(),
});

// Helper function to validate data
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

// Helper function to safely validate data (returns error instead of throwing)
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
