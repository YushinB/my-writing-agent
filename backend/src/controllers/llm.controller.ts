import { Request, Response } from 'express';
import { llmService } from '../services/llm.service';
import { createSuccessResponse } from '../utils/transform';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Correct text
 * POST /api/llm/correct
 */
export const correctText = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const result = await llmService.correctText(userId, req.body);
  res.json(createSuccessResponse(result));
});

/**
 * Define word using AI
 * POST /api/llm/define
 */
export const defineWord = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const result = await llmService.defineWord(userId, req.body);
  res.json(createSuccessResponse(result));
});

/**
 * Generate text suggestions
 * POST /api/llm/suggestions
 */
export const generateSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const result = await llmService.generateSuggestions(userId, req.body);
  res.json(createSuccessResponse(result));
});

/**
 * Analyze writing style
 * POST /api/llm/analyze
 */
export const analyzeWritingStyle = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const result = await llmService.analyzeWritingStyle(userId, req.body);
  res.json(createSuccessResponse(result));
});
