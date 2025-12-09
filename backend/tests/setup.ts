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

// Mock uuid to avoid ES module issues
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-' + Date.now() + '-' + Math.random()),
}));

// Mock logger to suppress logs during tests
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  http: jest.fn(),
}));

// Mock the database module to prevent automatic connection on import
jest.mock('../src/config/database', () => {
  const { PrismaClient } = require('@prisma/client');
  const mockPrisma = new PrismaClient();

  return {
    __esModule: true,
    prisma: mockPrisma,
    default: mockPrisma,
    disconnectDatabase: jest.fn(),
    checkDatabaseHealth: jest.fn().mockResolvedValue(true),
  };
});

// Global Prisma client for tests
let testPrisma: PrismaClient;

// Initialize prisma client for all tests
beforeAll(async () => {
  const testPath = expect.getState().testPath || '';
  const isIntegrationTest = testPath.includes('integration');

  if (isIntegrationTest) {
    // For integration tests, connect to real database
    testPrisma = new PrismaClient();
    await testPrisma.$connect();
  } else {
    // For unit tests, create a client but don't connect
    testPrisma = new PrismaClient();
  }
});

afterAll(async () => {
  const testPath = expect.getState().testPath || '';
  const isIntegrationTest = testPath.includes('integration');

  if (isIntegrationTest && testPrisma) {
    await testPrisma.$disconnect();
  }
});

// Clean up database between tests (only for integration tests)
afterEach(async () => {
  const testPath = expect.getState().testPath || '';
  const isIntegrationTest = testPath.includes('integration');

  if (isIntegrationTest) {
    // Optional: Clean test data between tests
    // Uncomment if needed
    /*
    const deletePromises = [
      testPrisma.aIUsageLog.deleteMany(),
      testPrisma.session.deleteMany(),
      testPrisma.savedWord.deleteMany(),
      testPrisma.dictionaryEntry.deleteMany(),
      testPrisma.userSettings.deleteMany(),
      testPrisma.user.deleteMany(),
    ];
    await Promise.all(deletePromises);
    */
  }
});

export { testPrisma as prisma };
