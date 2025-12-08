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
  const { word, notes, tags, favorite } = req.body;

  const savedWord = await myWordsService.addWord(userId, word, notes, tags, favorite);
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

/**
 * Update word (notes, tags, favorite)
 * PUT /api/my-words/:id
 */
export const updateWord = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  const { notes, tags, favorite } = req.body;

  const updated = await myWordsService.updateWord(userId, id, { notes, tags, favorite });
  res.json(createSuccessResponse(updated, 'Word updated'));
});

/**
 * Toggle favorite status
 * POST /api/my-words/:id/favorite
 */
export const toggleFavorite = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  const updated = await myWordsService.toggleFavorite(userId, id);
  res.json(createSuccessResponse(updated, 'Favorite status toggled'));
});

/**
 * Export user's words
 * GET /api/my-words/export?format=json|csv
 */
export const exportWords = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const format = (req.query.format as 'json' | 'csv') || 'json';

  const exportedData = await myWordsService.exportWords(userId, format);

  // Set appropriate headers
  const filename = `my-words-${new Date().toISOString().split('T')[0]}.${format}`;
  const contentType = format === 'json' ? 'application/json' : 'text/csv';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(exportedData);
});

/**
 * Import words
 * POST /api/my-words/import
 */
export const importWords = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { words } = req.body;

  if (!Array.isArray(words)) {
    return res.status(400).json({ error: 'Words must be an array' });
  }

  const stats = await myWordsService.importWords(userId, words);
  res.json(createSuccessResponse(stats, 'Import completed'));
});
