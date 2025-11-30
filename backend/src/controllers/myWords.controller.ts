import { Request, Response } from 'express';
import { myWordsService } from '../services/myWords.service';
import { createSuccessResponse, createPaginatedResponse } from '../utils/transform';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Get user's saved words
 * GET /api/my-words?page=1&limit=10
 */
export const getUserWords = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await myWordsService.getUserWords(userId, page, limit);

  res.json(createPaginatedResponse(result.words, result.pagination.total, page, limit));
});

/**
 * Add word to user's dictionary
 * POST /api/my-words
 */
export const addWord = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { word, notes } = req.body;

  const savedWord = await myWordsService.addWord(userId, word, notes);
  res.status(201).json(createSuccessResponse(savedWord, 'Word added'));
});

/**
 * Remove word from user's dictionary
 * DELETE /api/my-words/:id
 */
export const removeWord = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  await myWordsService.removeWord(userId, id);
  res.json(createSuccessResponse(null, 'Word removed'));
});

/**
 * Update word notes
 * PATCH /api/my-words/:id
 */
export const updateNotes = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  const { notes } = req.body;

  const updated = await myWordsService.updateNotes(userId, id, notes);
  res.json(createSuccessResponse(updated, 'Notes updated'));
});

/**
 * Search user's saved words
 * GET /api/my-words/search?query=test&page=1&limit=10
 */
export const searchWords = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { query } = req.query as { query: string };
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await myWordsService.searchWords(userId, query, page, limit);

  res.json(createPaginatedResponse(result.words, result.pagination.total, page, limit));
});

/**
 * Get word count
 * GET /api/my-words/count
 */
export const getWordCount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const count = await myWordsService.getWordCount(userId);
  res.json(createSuccessResponse({ count }));
});
