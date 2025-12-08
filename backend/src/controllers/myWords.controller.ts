import { Request, Response } from 'express';
import { createSuccessResponse, createPaginatedResponse } from '../utils/transform';
import { asyncHandler } from '../middleware/errorHandler';

// Lazy-load service to avoid module loading issues
let serviceInstance: any = null;
const getService = async () => {
  if (!serviceInstance) {
    const module = await import('../services/myWords.service');
    serviceInstance = module.myWordsService;
  }
  return serviceInstance;
};

/**
 * Get user's saved words
 * GET /api/my-words?page=1&limit=10
 */
export const getUserWords = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const service = await getService();
  const result = await service.getUserWords(userId, page, limit);

  res.json(createPaginatedResponse(result.words, result.pagination.total, page, limit));
});

/**
 * Add word to user's dictionary
 * POST /api/my-words
 */
export const addWord = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { word, notes, tags, favorite } = req.body;

  const service = await getService();
  const savedWord = await service.addWord(userId, word, notes, tags, favorite);
  res.status(201).json(createSuccessResponse(savedWord, 'Word added'));
});

/**
 * Remove word from user's dictionary
 * DELETE /api/my-words/:id
 */
export const removeWord = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  const service = await getService();
  await service.removeWord(userId, id);
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

  const service = await getService();
  const updated = await service.updateNotes(userId, id, notes);
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

  const service = await getService();
  const result = await service.searchWords(userId, query, page, limit);

  res.json(createPaginatedResponse(result.words, result.pagination.total, page, limit));
});

/**
 * Get word count
 * GET /api/my-words/count
 */
export const getWordCount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const service = await getService();
  const count = await service.getWordCount(userId);
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

  const service = await getService();
  const updated = await service.updateWord(userId, id, { notes, tags, favorite });
  res.json(createSuccessResponse(updated, 'Word updated'));
});

/**
 * Toggle favorite status
 * POST /api/my-words/:id/favorite
 */
export const toggleFavorite = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  const service = await getService();
  const updated = await service.toggleFavorite(userId, id);
  res.json(createSuccessResponse(updated, 'Favorite status toggled'));
});

/**
 * Export user's words
 * GET /api/my-words/export?format=json|csv
 */
export const exportWords = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const format = (req.query.format as 'json' | 'csv') || 'json';

  const service = await getService();
  const exportedData = await service.exportWords(userId, format);

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
export const importWords = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const userId = req.userId!;
  const { words } = req.body;

  if (!Array.isArray(words)) {
    return res.status(400).json({ error: 'Words must be an array' });
  }

  const service = await getService();
  const stats = await service.importWords(userId, words);
  return res.json(createSuccessResponse(stats, 'Import completed'));
});
