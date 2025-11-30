import cors, { CorsOptions } from 'cors';
import { getCorsOrigins, isDevelopment } from '../config/env';
import logger from '../utils/logger';

/**
 * CORS configuration
 */
const allowedOrigins = getCorsOrigins();

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) {
      return callback(null, true);
    }

    // In development, allow all origins
    if (isDevelopment()) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },

  // Allow credentials (cookies, authorization headers)
  credentials: true,

  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Allowed headers
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],

  // Exposed headers (accessible to client)
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],

  // Cache preflight requests for 24 hours
  maxAge: 86400,

  // Pass the CORS preflight response to the next handler
  preflightContinue: false,

  // Provide a status code for successful OPTIONS requests
  optionsSuccessStatus: 204,
};

/**
 * CORS middleware
 */
export const corsMiddleware = cors(corsOptions);

/**
 * Development CORS (allows all origins)
 */
export const devCorsMiddleware = cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
});

/**
 * Get appropriate CORS middleware based on environment
 */
export const getCorsMiddleware = () => {
  return isDevelopment() ? devCorsMiddleware : corsMiddleware;
};

export default getCorsMiddleware();
