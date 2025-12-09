import { Router } from 'express';
import * as myWordsController from '../controllers/myWords.controller';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { savedWordSchema, searchQuerySchema } from '../utils/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET endpoints must come before parameterized routes
router.get('/export', myWordsController.exportWords);
router.get('/count', myWordsController.getWordCount);
router.get('/search', validateQuery(searchQuerySchema), myWordsController.searchWords);
router.get('/', myWordsController.getUserWords);

// POST endpoints
router.post('/import', myWordsController.importWords);
router.post('/:id/favorite', myWordsController.toggleFavorite);
router.post('/', validateBody(savedWordSchema), myWordsController.addWord);

// PUT/PATCH endpoints
router.put('/:id', myWordsController.updateWord);
router.patch('/:id', myWordsController.updateNotes);

// DELETE endpoints
router.delete('/:id', myWordsController.removeWord);

export default router;
