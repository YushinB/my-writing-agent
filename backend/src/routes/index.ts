import { Router } from 'express';
import authRoutes from './auth.routes';
import dictionaryRoutes from './dictionary.routes';
import myWordsRoutes from './myWords.routes';
import llmRoutes from './llm.routes';
import settingsRoutes from './settings.routes';
import healthRoutes from './health.routes';
import adminRoutes from './admin.routes';

const router = Router();

// API version prefix
const API_VERSION = '/v1';

// Mount routes
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/dictionary`, dictionaryRoutes);
router.use(`${API_VERSION}/my-words`, myWordsRoutes);
router.use(`${API_VERSION}/llm`, llmRoutes);
router.use(`${API_VERSION}/settings`, settingsRoutes);
router.use(`${API_VERSION}/admin`, adminRoutes);
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
