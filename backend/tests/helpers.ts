import { User, UserRole } from '@prisma/client';
import { prisma } from './setup';
import { hashPassword } from '../src/utils/hash';
import { generateTokens } from '../src/utils/jwt';

/**
 * Test Helpers
 * Utility functions for testing
 */

/**
 * Create a test user
 */
export async function createTestUser(data?: {
  email?: string;
  password?: string;
  name?: string;
  role?: UserRole;
}): Promise<User> {
  const timestamp = Date.now();
  const hashedPassword = await hashPassword(data?.password || 'Test123!@#');

  return prisma.user.create({
    data: {
      email: data?.email || `test-${timestamp}@example.com`,
      password: hashedPassword,
      name: data?.name || 'Test User',
      role: data?.role || UserRole.USER,
    },
  });
}

/**
 * Create test user with tokens
 */
export async function createTestUserWithTokens(data?: {
  email?: string;
  password?: string;
  name?: string;
  role?: UserRole;
}): Promise<{ user: User; accessToken: string; refreshToken: string }> {
  const user = await createTestUser(data);
  const tokens = generateTokens(user.id, user.role);

  return {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

/**
 * Clean up test user
 */
export async function deleteTestUser(userId: string): Promise<void> {
  await prisma.user.delete({ where: { id: userId } }).catch(() => {
    // Ignore if already deleted
  });
}

/**
 * Create test saved word
 */
export async function createTestSavedWord(userId: string, word: string, notes?: string) {
  return prisma.savedWord.create({
    data: {
      userId,
      word: word.toLowerCase(),
      notes,
    },
  });
}

/**
 * Wait for a specified time (useful for rate limiting tests)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate random string
 */
export function randomString(length = 10): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}
