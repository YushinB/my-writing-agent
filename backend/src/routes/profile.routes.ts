import { Router } from 'express';
import * as profileController from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// All profile routes require authentication
router.use(authenticate);

// Get current user's profile
router.get('/', profileController.getProfile);

// Update profile information
router.put('/', profileController.updateProfile);

// Upload avatar
router.post('/avatar', upload.single('avatar'), profileController.uploadAvatar);

// Delete avatar
router.delete('/avatar', profileController.deleteAvatar);

export default router;
