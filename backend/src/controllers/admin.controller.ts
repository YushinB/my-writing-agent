import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { adminService } from '../services/admin.service';
import { UserRole } from '@prisma/client';
import { BadRequestError } from '../utils/errors';

/**
 * @route   GET /api/admin/users
 * @desc    Get list of users with pagination and filters
 * @access  Admin
 */
export const getUserList = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, role, suspended } = req.query;

  const params = {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    search: search as string | undefined,
    role: role ? (role as UserRole) : undefined,
    suspended: suspended === 'true' ? true : suspended === 'false' ? false : undefined,
  };

  const result = await adminService.getUserList(params);
  res.json(result);
});

/**
 * @route   PUT /api/admin/users/:id/suspend
 * @desc    Suspend a user account
 * @access  Admin
 */
export const suspendUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const actorId = req.userId!;

  await adminService.suspendUser(id, reason, actorId);
  res.json({ message: 'User suspended successfully' });
});

/**
 * @route   PUT /api/admin/users/:id/enable
 * @desc    Enable a suspended user account
 * @access  Admin
 */
export const enableUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const actorId = req.userId!;

  await adminService.enableUser(id, actorId);
  res.json({ message: 'User enabled successfully' });
});

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Change a user's role
 * @access  Admin
 */
export const changeUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  const actorId = req.userId!;

  // Validate role
  if (!role || !Object.values(UserRole).includes(role)) {
    throw new BadRequestError('Invalid role. Must be ADMIN or USER');
  }

  await adminService.changeUserRole(id, role as UserRole, actorId);
  res.json({ message: 'User role changed successfully' });
});

/**
 * @route   GET /api/admin/system/status
 * @desc    Get system health and statistics
 * @access  Admin
 */
export const getSystemStatus = asyncHandler(async (_req: Request, res: Response) => {
  const status = await adminService.getSystemStatus();
  res.json(status);
});

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get audit logs with pagination
 * @access  Admin
 */
export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query;

  const pageNum = page ? parseInt(page as string) : 1;
  const limitNum = limit ? parseInt(limit as string) : 50;

  const result = await adminService.getAuditLogs(pageNum, limitNum);
  res.json(result);
});
