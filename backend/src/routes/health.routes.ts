import { Router } from 'express';
import * as healthController from '../controllers/health.controller';

const router = Router();

// Health check routes (public)
router.get('/', healthController.healthCheck);
router.get('/ready', healthController.readinessCheck);
router.get('/live', healthController.livenessCheck);

export default router;
