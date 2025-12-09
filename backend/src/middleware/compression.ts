import compression from 'compression';
import { Request, Response } from 'express';

/**
 * Compression middleware configuration
 * Compresses response bodies for better performance
 */
export const compressionMiddleware = compression({
  // Compression level (0-9, 6 is default)
  level: 6,

  // Only compress responses larger than 1KB
  threshold: 1024,

  // Custom filter function
  filter: (req: Request, res: Response) => {
    // Don't compress if the client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Use compression filter function
    return compression.filter(req, res);
  },

  // Memory level (1-9, 8 is default)
  memLevel: 8,

  // Strategy
  strategy: 0, // Z_DEFAULT_STRATEGY
});

/**
 * Response caching headers for static content
 * Sets appropriate cache headers based on content type
 */
export const cacheHeaders = (req: Request, res: Response, next: () => void): void => {
  const path = req.path.toLowerCase();

  // Cache static assets for 1 year
  if (
    path.match(/\.(jpg|jpeg|png|gif|ico|svg|webp|woff|woff2|ttf|eot|otf)$/)
  ) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // Cache API responses for 5 minutes (if not authenticated)
  else if (path.startsWith('/api/') && !req.headers.authorization) {
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  }
  // No cache for authenticated requests
  else if (req.headers.authorization) {
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};
