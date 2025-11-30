import { User, SavedWord } from '@prisma/client';
import { UserResponse, SavedWordResponse } from '../types/auth.types';
import { FreeDictionaryApiResponse, DictionaryEntry, Meaning } from '../types/dictionary.types';

/**
 * Transform User model to UserResponse (remove password)
 * @param user - Prisma User model
 * @returns UserResponse without password
 */
export function transformUser(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Transform SavedWord model to SavedWordResponse
 * @param savedWord - Prisma SavedWord model
 * @returns SavedWordResponse
 */
export function transformSavedWord(savedWord: SavedWord): SavedWordResponse {
  return {
    id: savedWord.id,
    userId: savedWord.userId,
    word: savedWord.word,
    notes: savedWord.notes,
    createdAt: savedWord.createdAt,
    updatedAt: savedWord.updatedAt,
  };
}

/**
 * Transform Free Dictionary API response to DictionaryEntry
 * @param apiResponse - Response from Free Dictionary API
 * @returns Normalized DictionaryEntry
 */
export function transformFreeDictionaryResponse(
  apiResponse: FreeDictionaryApiResponse
): DictionaryEntry {
  // Extract the main phonetic
  const phonetic =
    apiResponse.phonetic || apiResponse.phonetics?.find((p) => p.text)?.text || undefined;

  // Extract phonetics with audio
  const phonetics = apiResponse.phonetics
    ?.filter((p) => p.text || p.audio)
    .map((p) => ({
      text: p.text || '',
      audio: p.audio,
    }));

  // Transform meanings
  const meanings: Meaning[] = apiResponse.meanings.map((meaning) => ({
    partOfSpeech: meaning.partOfSpeech,
    definitions: meaning.definitions.map((def) => ({
      definition: def.definition,
      example: def.example,
      synonyms: def.synonyms && def.synonyms.length > 0 ? def.synonyms : undefined,
      antonyms: def.antonyms && def.antonyms.length > 0 ? def.antonyms : undefined,
    })),
    synonyms: meaning.synonyms && meaning.synonyms.length > 0 ? meaning.synonyms : undefined,
    antonyms: meaning.antonyms && meaning.antonyms.length > 0 ? meaning.antonyms : undefined,
  }));

  return {
    word: apiResponse.word,
    phonetic,
    phonetics,
    meanings,
    origin: apiResponse.origin,
    sourceUrls: apiResponse.sourceUrls,
  };
}

/**
 * Create pagination metadata
 * @param total - Total number of items
 * @param page - Current page number
 * @param limit - Items per page
 * @returns Pagination metadata
 */
export function createPaginationMeta(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Calculate pagination offset
 * @param page - Current page number
 * @param limit - Items per page
 * @returns Offset for database query
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Sanitize error message for API response
 * @param error - Error object
 * @param includeStack - Whether to include stack trace (dev only)
 * @returns Sanitized error message
 */
export function sanitizeError(
  error: unknown,
  includeStack = false
): {
  message: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      ...(includeStack && { stack: error.stack }),
    };
  }
  return {
    message: 'An unknown error occurred',
  };
}

/**
 * Create success API response
 * @param data - Response data
 * @param message - Optional message
 * @returns Formatted API response
 */
export function createSuccessResponse<T>(data: T, message?: string) {
  return {
    success: true as const,
    data,
    ...(message && { message }),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create error API response
 * @param code - Error code
 * @param message - Error message
 * @param details - Optional error details
 * @param stack - Optional stack trace
 * @returns Formatted API error response
 */
export function createErrorResponse(code: string, message: string, details?: any, stack?: string) {
  return {
    success: false as const,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(stack && { stack }),
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create paginated API response
 * @param data - Array of data items
 * @param total - Total number of items
 * @param page - Current page
 * @param limit - Items per page
 * @returns Formatted paginated response
 */
export function createPaginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return {
    success: true as const,
    data,
    pagination: createPaginationMeta(total, page, limit),
    timestamp: new Date().toISOString(),
  };
}
