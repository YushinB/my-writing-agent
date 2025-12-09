import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { userSettingsSchema } from '../utils/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', settingsController.getSettings);

router.patch('/', validateBody(userSettingsSchema), settingsController.updateSettings);

router.post('/reset', settingsController.resetSettings);

export default router;
