import { Router } from 'express';
import * as aiGatewayController from '../../controllers/aiGateway.controller';
import { aiGatewayAuth } from '../../middleware/AIGateway/auth';
import {
  validateGenerateRequest,
  validateHealthCheckQuery,
} from '../../middleware/AIGateway/validation';
import { llmRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

/**
 * AI Gateway Routes
 * Base path: /api/v1/ai
 *
 * All routes require authentication and are rate-limited.
 */

// ========================================
// Public Endpoints (with rate limiting)
// ========================================

/**
 * Generate Text
 * POST /api/v1/ai/generate
 *
 * Generates text using the AI Gateway.
 * Requires authentication and validates quota limits.
 *
 * @middleware aiGatewayAuth - Authenticates user and checks quota
 * @middleware validateGenerateRequest - Validates request body
 * @middleware llmRateLimiter - Rate limits requests
 */
router.post(
  '/generate',
  llmRateLimiter,
  aiGatewayAuth,
  validateGenerateRequest,
  aiGatewayController.generate
);

/**
 * Health Check
 * GET /api/v1/ai/health
 *
 * Checks the health status of AI providers.
 * Optional query params: provider (filter), detailed (boolean)
 *
 * @middleware validateHealthCheckQuery - Validates query parameters
 */
router.get('/health', validateHealthCheckQuery, aiGatewayController.health);

// ========================================
// Authenticated User Endpoints
// ========================================

/**
 * Get User Quota
 * GET /api/v1/ai/quota
 *
 * Returns the authenticated user's quota status.
 * Requires authentication.
 *
 * @middleware aiGatewayAuth - Authenticates user
 */
router.get('/quota', aiGatewayAuth, aiGatewayController.getQuota);

/**
 * Get User Usage History
 * GET /api/v1/ai/usage
 *
 * Returns the authenticated user's usage history.
 * Optional query params: limit, offset, provider, dateFrom, dateTo
 *
 * @middleware aiGatewayAuth - Authenticates user
 */
router.get('/usage', aiGatewayAuth, aiGatewayController.getUsage);

// ========================================
// Admin Endpoints (Future Phase)
// ========================================

/**
 * Admin endpoints for managing providers, quotas, and monitoring
 * These will be implemented in future phases.
 *
 * Examples:
 * - POST   /api/v1/ai/admin/providers          - Create provider
 * - PUT    /api/v1/ai/admin/providers/:id      - Update provider
 * - DELETE /api/v1/ai/admin/providers/:id      - Delete provider
 * - GET    /api/v1/ai/admin/usage              - Get all usage stats
 * - PUT    /api/v1/ai/admin/quotas/:userId     - Update user quota
 * - GET    /api/v1/ai/admin/health/history     - Get health history
 */

// Placeholder for future admin routes
// TODO Phase 2: Implement admin routes
// router.use('/admin/:path*', requireAiGatewayAdmin, (_req, res) => {
//   res.status(501).json({
//     success: false,
//     message: 'Admin endpoints are not yet implemented. Coming in Phase 2.',
//   });
// });

export default router;
