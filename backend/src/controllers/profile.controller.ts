import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { createSuccessResponse } from '../utils/transform';
import { asyncHandler } from '../middleware/errorHandler';
import { BadRequestError } from '../utils/errors';
import path from 'path';
import fs from 'fs/promises';

/**
 * Get current user's profile
 * GET /api/profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const user = await userService.getUserById(userId);

  if (!user) {
    throw new BadRequestError('User not found');
  }

  // Return profile data without password
  const profile = {
    id: user.id,
    email: user.email,
    name: user.name,
    displayName: user.displayName,
    avatar: user.avatar,
    hobbies: user.hobbies,
    role: user.role.toLowerCase(),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  res.json(createSuccessResponse(profile, 'Profile retrieved successfully'));
});

/**
 * Update current user's profile
 * PUT /api/profile
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { displayName, hobbies } = req.body;

  const updatedUser = await userService.updateProfile(userId, {
    displayName,
    hobbies,
  });

  const profile = {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    displayName: updatedUser.displayName,
    avatar: updatedUser.avatar,
    hobbies: updatedUser.hobbies,
    role: updatedUser.role.toLowerCase(),
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
  };

  res.json(createSuccessResponse(profile, 'Profile updated successfully'));
});

/**
 * Upload avatar
 * POST /api/profile/avatar
 */
export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;

  if (!req.file) {
    throw new BadRequestError('No file uploaded');
  }

  // Get the uploaded file path (relative to uploads directory)
  const avatarPath = `/uploads/avatars/${req.file.filename}`;

  // Update user's avatar in database
  const updatedUser = await userService.updateProfile(userId, {
    avatar: avatarPath,
  });

  const profile = {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    displayName: updatedUser.displayName,
    avatar: updatedUser.avatar,
    hobbies: updatedUser.hobbies,
    role: updatedUser.role.toLowerCase(),
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
  };

  res.json(createSuccessResponse(profile, 'Avatar uploaded successfully'));
});

/**
 * Delete avatar
 * DELETE /api/profile/avatar
 */
export const deleteAvatar = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const user = await userService.getUserById(userId);

  if (!user) {
    throw new BadRequestError('User not found');
  }

  // Delete the old avatar file if it exists
  if (user.avatar) {
    try {
      const avatarFullPath = path.join(__dirname, '../../', user.avatar);
      await fs.unlink(avatarFullPath);
    } catch (error) {
      // Ignore error if file doesn't exist
      console.warn('Failed to delete old avatar file:', error);
    }
  }

  // Update user's avatar to null in database
  const updatedUser = await userService.updateProfile(userId, {
    avatar: null,
  });

  const profile = {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    displayName: updatedUser.displayName,
    avatar: updatedUser.avatar,
    hobbies: updatedUser.hobbies,
    role: updatedUser.role.toLowerCase(),
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
  };

  res.json(createSuccessResponse(profile, 'Avatar deleted successfully'));
});
