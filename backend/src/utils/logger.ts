import winston from 'winston';
import path from 'path';
import DailyRotateFile from 'winston-daily-rotate-file';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about our colors
winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : process.env.LOG_LEVEL || 'info';
};

// Check if in production
const isProduction = process.env.NODE_ENV === 'production';

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

// Define transports based on environment
const transports: winston.transport[] = [];

// Console transport (always enabled, but with different formats)
transports.push(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
  })
);

// File transports with log rotation (production)
if (isProduction) {
  // Error log with rotation
  transports.push(
    new DailyRotateFile({
      filename: path.join(process.cwd(), 'logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m', // Rotate when file reaches 20MB
      maxFiles: '30d', // Keep logs for 30 days
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.timestamp(),
        winston.format.json()
      ),
      zippedArchive: true, // Compress rotated files
    })
  );

  // Combined log with rotation
  transports.push(
    new DailyRotateFile({
      filename: path.join(process.cwd(), 'logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d', // Keep for 14 days
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.timestamp(),
        winston.format.json()
      ),
      zippedArchive: true,
    })
  );

  // HTTP access log with rotation
  transports.push(
    new DailyRotateFile({
      filename: path.join(process.cwd(), 'logs', 'access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxSize: '20m',
      maxFiles: '7d', // Keep for 7 days
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.timestamp(),
        winston.format.json()
      ),
      zippedArchive: true,
    })
  );
} else {
  // Development: Simple file transports without rotation
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), process.env.LOG_FILE_ERROR || 'logs/error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );

  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), process.env.LOG_FILE_COMBINED || 'logs/combined.log'),
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );
}

// Exception and rejection handlers
const exceptionHandlers: winston.transport[] = [];
const rejectionHandlers: winston.transport[] = [];

if (isProduction) {
  // Production: Use rotating file transports for exceptions and rejections
  exceptionHandlers.push(
    new DailyRotateFile({
      filename: path.join(process.cwd(), 'logs', 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
    })
  );

  rejectionHandlers.push(
    new DailyRotateFile({
      filename: path.join(process.cwd(), 'logs', 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
    })
  );
} else {
  // Development: Simple file transports
  exceptionHandlers.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs/exceptions.log'),
    })
  );

  rejectionHandlers.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs/rejections.log'),
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exceptionHandlers,
  rejectionHandlers,
  exitOnError: false,
});

export default logger;
