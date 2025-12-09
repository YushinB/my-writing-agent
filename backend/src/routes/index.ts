import { Router } from 'express';
import authRoutes from './auth.routes';
import dictionaryRoutes from './dictionary.routes';
import llmRoutes from './llm.routes';
import settingsRoutes from './settings.routes';
import healthRoutes from './health.routes';
import adminRoutes from './admin.routes';
import profileRoutes from './profile.routes';

const router = Router();

// API version prefix
const API_VERSION = '/v1';

// Mount routes
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/dictionary`, dictionaryRoutes);

// Lazy-load myWords routes to avoid circular dependency
router.use(`${API_VERSION}/my-words`, async (req, res, next) => {
  try {
    const { default: myWordsRoutes } = await import('./myWords.routes');
    myWordsRoutes(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.use(`${API_VERSION}/llm`, llmRoutes);
router.use(`${API_VERSION}/settings`, settingsRoutes);
router.use(`${API_VERSION}/admin`, adminRoutes);
router.use(`${API_VERSION}/profile`, profileRoutes);
router.use(`${API_VERSION}/health`, healthRoutes);

// Root health check (no version prefix)
router.get('/health', (_req, res) => {
  void _req;
  res.json({
    status: 'ok',
    message: 'ProsePolish API is running',
    version: API_VERSION,
  });
});

export default router;
