import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { authRateLimiter } from '../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '../utils/validation';

const router = Router();

// Public routes
router.post(
  '/register',
  authRateLimiter,
  validateBody(registerSchema),
  authController.register
);

router.post(
  '/login',
  authRateLimiter,
  validateBody(loginSchema),
  authController.login
);

router.post(
  '/refresh',
  validateBody(refreshTokenSchema),
  authController.refreshToken
);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/me', authenticate, authController.getCurrentUser);
router.get('/sessions', authenticate, authController.getSessions);

export default router;
