import { Router } from 'express';
import * as myWordsController from '../controllers/myWords.controller';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { savedWordSchema, searchQuerySchema } from '../utils/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', myWordsController.getUserWords);

router.post('/', validateBody(savedWordSchema), myWordsController.addWord);

router.delete('/:id', myWordsController.removeWord);

router.patch('/:id', myWordsController.updateNotes);

router.get('/search', validateQuery(searchQuerySchema), myWordsController.searchWords);

router.get('/count', myWordsController.getWordCount);

export default router;
