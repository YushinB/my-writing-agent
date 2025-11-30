import bcrypt from 'bcrypt';
import logger from './logger';

// Number of salt rounds for bcrypt
const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if passwords match, false otherwise
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    const match = await bcrypt.compare(password, hash);
    return match;
  } catch (error) {
    logger.error('Error comparing password:', error);
    throw new Error('Failed to compare password');
  }
}

/**
 * Verify if a hash is a valid bcrypt hash
 * @param hash - String to verify
 * @returns True if valid bcrypt hash, false otherwise
 */
export function isValidHash(hash: string): boolean {
  // Bcrypt hashes start with $2a$, $2b$, or $2y$
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(hash);
}
