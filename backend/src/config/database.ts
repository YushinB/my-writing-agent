import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

// Prisma Client singleton
class DatabaseClient {
  private static instance: PrismaClient | null = null;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new PrismaClient({
        log:
          process.env.NODE_ENV === 'development'
            ? ['query', 'info', 'warn', 'error']
            : ['error'],
      });

      // Handle connection events
      DatabaseClient.instance.$connect()
        .then(() => {
          logger.info('✅ Database connected successfully');
        })
        .catch((error) => {
          logger.error('❌ Failed to connect to database:', error);
          process.exit(1);
        });

      // Handle shutdown gracefully
      process.on('beforeExit', async () => {
        await DatabaseClient.disconnect();
      });

      process.on('SIGINT', async () => {
        await DatabaseClient.disconnect();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await DatabaseClient.disconnect();
        process.exit(0);
      });
    }

    return DatabaseClient.instance;
  }

  public static async disconnect(): Promise<void> {
    if (DatabaseClient.instance) {
      await DatabaseClient.instance.$disconnect();
      logger.info('🔌 Database disconnected');
      DatabaseClient.instance = null;
    }
  }

  public static async healthCheck(): Promise<boolean> {
    try {
      const client = DatabaseClient.getInstance();
      await client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

// Export the singleton instance
export const prisma = DatabaseClient.getInstance();

// Export utility functions
export const disconnectDatabase = DatabaseClient.disconnect;
export const checkDatabaseHealth = DatabaseClient.healthCheck;

export default prisma;
