import { PrismaClient } from '@prisma/client';

/**
 * Jest Test Setup
 * Configuration for test environment
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

// Global test timeout
jest.setTimeout(30000);

// Mock logger to suppress logs during tests
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  http: jest.fn(),
}));

// Global Prisma client for tests
let prisma: PrismaClient;

beforeAll(async () => {
  prisma = new PrismaClient();
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Clean up database between tests
afterEach(async () => {
  // Optional: Clean test data between tests
  // Uncomment if needed
  /*
  const deletePromises = [
    prisma.aIUsageLog.deleteMany(),
    prisma.session.deleteMany(),
    prisma.savedWord.deleteMany(),
    prisma.dictionaryEntry.deleteMany(),
    prisma.userSettings.deleteMany(),
    prisma.user.deleteMany(),
  ];
  await Promise.all(deletePromises);
  */
});

export { prisma };
