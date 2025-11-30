import { Router } from 'express';
import * as dictionaryController from '../controllers/dictionary.controller';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validateQuery } from '../middleware/validation';
import { dictionarySearchSchema } from '../utils/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Search and lookup
router.get(
  '/search',
  validateQuery(dictionarySearchSchema),
  dictionaryController.searchWord
);

router.get('/word/:word', dictionaryController.getWordDefinition);

router.get('/popular', dictionaryController.getPopularWords);

// Admin only routes
router.post('/words', requireAdmin, dictionaryController.addWord);

router.post(
  '/word/:word/refresh',
  requireAdmin,
  dictionaryController.refreshCacheEntry
);

export default router;
