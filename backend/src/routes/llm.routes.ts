import { Router } from 'express';
import * as llmController from '../controllers/llm.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { llmRateLimiter } from '../middleware/rateLimiter';
import {
  correctTextSchema,
  defineWordSchema,
  generateSuggestionsSchema,
  analyzeWritingStyleSchema,
} from '../utils/validation';

const router = Router();

// All routes require authentication and rate limiting
router.use(authenticate);
router.use(llmRateLimiter);

router.post(
  '/correct',
  validateBody(correctTextSchema),
  llmController.correctText
);

router.post(
  '/define',
  validateBody(defineWordSchema),
  llmController.defineWord
);

router.post(
  '/suggestions',
  validateBody(generateSuggestionsSchema),
  llmController.generateSuggestions
);

router.post(
  '/analyze',
  validateBody(analyzeWritingStyleSchema),
  llmController.analyzeWritingStyle
);

export default router;
