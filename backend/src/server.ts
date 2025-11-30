import createApp from './app';
import { env, displayEnvInfo } from './config/env';
import { disconnectDatabase, checkDatabaseHealth } from './config/database';
import { checkRedisHealth } from './config/redis';
import logger from './utils/logger';

/**
 * Start the server
 */
async function startServer() {
  try {
    // Display environment info
    displayEnvInfo();

    // Create Express app
    const app = createApp();

    // Test database connection
    logger.info('🔄 Testing database connection...');
    const dbHealthy = await checkDatabaseHealth();
    if (!dbHealthy) {
      throw new Error('Database connection failed');
    }

    // Test Redis connection
    logger.info('🔄 Testing Redis connection...');
    const redisHealthy = await checkRedisHealth();
    if (!redisHealthy) {
      logger.warn('⚠️  Redis connection failed - continuing without cache');
    }

    // Start HTTP server
    const PORT = env.PORT;
    const server = app.listen(PORT, () => {
      logger.info(`\n🚀 Server started successfully!`);
      logger.info(`📡 Listening on port ${PORT}`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
      logger.info(`📝 API: http://localhost:${PORT}/api/v1`);
      logger.info(`💚 Health: http://localhost:${PORT}/api/v1/health\n`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        logger.info('✅ HTTP server closed');

        try {
          // Disconnect from database
          await disconnectDatabase();

          // Disconnect from Redis
          // Note: Redis disconnect is handled in the redis config

          logger.info('✅ All connections closed');
          process.exit(0);
        } catch (error) {
          logger.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception:', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
