import express, { Application } from 'express';
import morgan from 'morgan';
import corsMiddleware from './middleware/cors';
import { generalRateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';
import { env, isDevelopment } from './config/env';
import logger from './utils/logger';

/**
 * Create and configure Express application
 */
function createApp(): Application {
  const app = express();

  // Trust proxy (for rate limiting behind reverse proxy)
  app.set('trust proxy', 1);

  // Body parser middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // CORS middleware
  app.use(corsMiddleware);

  // Request logging
  if (isDevelopment()) {
    app.use(morgan('dev'));
  } else {
    app.use(
      morgan('combined', {
        stream: {
          write: (message: string) => logger.http(message.trim()),
        },
      })
    );
  }

  // Rate limiting (general)
  app.use('/api', generalRateLimiter);

  // API routes
  app.use('/api', routes);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'ProsePolish API',
      version: '1.0.0',
      description: 'AI-Powered Writing Assistant Backend',
      documentation: '/api/v1/health',
    });
  });

  // 404 handler (must be after all routes)
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

export default createApp;
