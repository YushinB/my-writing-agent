import express from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import * as adminController from '../controllers/admin.controller';

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(authenticate);
router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get list of users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default: 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page (default: 10)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by email or name
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, USER]
 *         description: Filter by role
 *       - in: query
 *         name: suspended
 *         schema:
 *           type: boolean
 *         description: Filter by suspension status
 *     responses:
 *       200:
 *         description: User list retrieved successfully
 */
router.get('/users', adminController.getUserList);

/**
 * @swagger
 * /api/admin/users/{id}/suspend:
 *   put:
 *     tags: [Admin]
 *     summary: Suspend a user account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for suspension
 *     responses:
 *       200:
 *         description: User suspended successfully
 */
router.put('/users/:id/suspend', adminController.suspendUser);

/**
 * @swagger
 * /api/admin/users/{id}/enable:
 *   put:
 *     tags: [Admin]
 *     summary: Enable a suspended user account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User enabled successfully
 */
router.put('/users/:id/enable', adminController.enableUser);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   put:
 *     tags: [Admin]
 *     summary: Change a user's role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, USER]
 *                 description: New role for the user
 *     responses:
 *       200:
 *         description: User role changed successfully
 */
router.put('/users/:id/role', adminController.changeUserRole);

/**
 * @swagger
 * /api/admin/system/status:
 *   get:
 *     tags: [Admin]
 *     summary: Get system health and statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System status retrieved successfully
 */
router.get('/system/status', adminController.getSystemStatus);

/**
 * @swagger
 * /api/admin/audit-logs:
 *   get:
 *     tags: [Admin]
 *     summary: Get audit logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default: 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page (default: 50)
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 */
router.get('/audit-logs', adminController.getAuditLogs);

export default router;
