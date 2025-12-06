import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { isProduction } from '../config/env';

/**
 * Helmet.js security middleware configuration
 * Sets various HTTP headers to secure the application
 */
export const helmetMiddleware = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },

  // Cross-Origin-Embedder-Policy
  crossOriginEmbedderPolicy: true,

  // Cross-Origin-Opener-Policy
  crossOriginOpenerPolicy: { policy: 'same-origin' },

  // Cross-Origin-Resource-Policy
  crossOriginResourcePolicy: { policy: 'same-origin' },

  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },

  // Frameguard (X-Frame-Options)
  frameguard: { action: 'deny' },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // IE No Open
  ieNoOpen: true,

  // X-Content-Type-Options
  noSniff: true,

  // Origin-Agent-Cluster
  originAgentCluster: true,

  // Permitted Cross-Domain Policies
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },

  // Referrer Policy
  referrerPolicy: { policy: 'no-referrer' },

  // X-XSS-Protection (for older browsers)
  xssFilter: true,
});

/**
 * HTTPS redirect middleware (only for production)
 * Redirects HTTP requests to HTTPS
 */
export const httpsRedirect = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Skip in development or if behind a proxy that handles HTTPS
  if (!isProduction() || req.secure || req.headers['x-forwarded-proto'] === 'https') {
    return next();
  }

  // Skip for localhost/127.0.0.1 (for health checks and local testing)
  const host = req.headers.host || '';
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
    return next();
  }

  // Only redirect GET and HEAD requests
  if (req.method === 'GET' || req.method === 'HEAD') {
    res.redirect(301, `https://${host}${req.url}`);
  } else {
    res.status(403).json({
      success: false,
      error: {
        code: 'HTTPS_REQUIRED',
        message: 'Please use HTTPS',
      },
    });
  }
};

/**
 * Security headers middleware
 * Additional custom security headers
 */
export const securityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Disable client-side caching for sensitive endpoints
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Additional security headers
  res.setHeader('X-Request-ID', `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  next();
};

/**
 * Request size limit validation
 * Prevents DoS attacks via large payloads
 */
export const validateRequestSize = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    res.status(413).json({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload too large',
        maxSize: '10MB',
      },
    });
    return;
  }

  next();
};
