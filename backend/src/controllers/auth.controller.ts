import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { createSuccessResponse } from '../utils/transform';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res.status(201).json(createSuccessResponse(result, 'Registration successful'));
});

/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.json(createSuccessResponse(result, 'Login successful'));
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const tokens = await authService.refreshToken(refreshToken);
  res.json(createSuccessResponse(tokens, 'Token refreshed'));
});

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  await authService.logout(userId);
  res.json(createSuccessResponse(null, 'Logout successful'));
});

/**
 * Logout from all devices
 * POST /api/auth/logout-all
 */
export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  await authService.logoutAll(userId);
  res.json(createSuccessResponse(null, 'Logged out from all devices'));
});

/**
 * Get current user
 * GET /api/auth/me
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const user = await authService.getCurrentUser(userId);
  res.json(createSuccessResponse(user));
});

/**
 * Get user's active sessions
 * GET /api/auth/sessions
 */
export const getSessions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const sessions = await authService.getUserSessions(userId);
  res.json(createSuccessResponse({ sessions, count: sessions.length }));
});
