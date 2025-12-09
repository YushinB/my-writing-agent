import { Request, Response } from 'express';
import { settingsService } from '../services/settings.service';
import { createSuccessResponse } from '../utils/transform';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Get user settings
 * GET /api/settings
 */
export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const settings = await settingsService.getUserSettings(userId);
  res.json(createSuccessResponse(settings));
});

/**
 * Update user settings
 * PATCH /api/settings
 */
export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const settings = await settingsService.updateUserSettings(userId, req.body);
  res.json(createSuccessResponse(settings, 'Settings updated'));
});

/**
 * Reset settings to default
 * POST /api/settings/reset
 */
export const resetSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const settings = await settingsService.resetToDefault(userId);
  res.json(createSuccessResponse(settings, 'Settings reset to default'));
});
