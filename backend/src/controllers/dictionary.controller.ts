import { Request, Response } from 'express';
import { dictionaryService } from '../services/dictionary.service';
import { createSuccessResponse } from '../utils/transform';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError } from '../utils/errors';

/**
 * Search for a word
 * GET /api/dictionary/search?query=word
 */
export const searchWord = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.query as { query: string };
  const result = await dictionaryService.searchWord(query);

  if (!result) {
    throw new NotFoundError(`Word "${query}" not found`);
  }

  res.json(createSuccessResponse(result));
});

/**
 * Get word definition
 * GET /api/dictionary/word/:word
 */
export const getWordDefinition = asyncHandler(async (req: Request, res: Response) => {
  const { word } = req.params;
  const result = await dictionaryService.searchWord(word);

  if (!result) {
    throw new NotFoundError(`Word "${word}" not found`);
  }

  res.json(createSuccessResponse(result));
});

/**
 * Add word to dictionary (admin only)
 * POST /api/dictionary/words
 */
export const addWord = asyncHandler(async (req: Request, res: Response) => {
  await dictionaryService.addWord(req.body);
  res.status(201).json(createSuccessResponse(null, 'Word added to dictionary'));
});

/**
 * Refresh cache entry (admin only)
 * POST /api/dictionary/word/:word/refresh
 */
export const refreshCacheEntry = asyncHandler(async (req: Request, res: Response) => {
  const { word } = req.params;
  const result = await dictionaryService.refreshCacheEntry(word);
  res.json(createSuccessResponse(result, 'Cache refreshed'));
});

/**
 * Get popular words
 * GET /api/dictionary/popular?limit=10
 */
export const getPopularWords = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const words = await dictionaryService.getPopularWords(limit);
  res.json(createSuccessResponse({ words }));
});
