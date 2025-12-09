import bcrypt from 'bcrypt';
import logger from './logger';

/**
 * Number of salt rounds for bcrypt hashing
 * @description Higher values increase security but also increase computation time.
 * 10 rounds provides a good balance between security and performance.
 * @constant
 * @type {number}
 */
const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt
 * @description Generates a cryptographically secure hash of a password using bcrypt algorithm.
 * The hash includes a random salt and is deterministic - the same password can be verified
 * but not reversed. Essential for secure password storage in databases.
 *
 * @async
 * @param {string} password - Plain text password to hash (typically 8-128 characters)
 * @returns {Promise<string>} Bcrypt hash string in the format $2b$rounds$salthash
 * @throws {Error} If hashing fails due to invalid input or system error
 *
 * @example
 * const password = 'MySecurePassword123!';
 * const hashedPassword = await hashPassword(password);
 * // Returns: $2b$10$nOUIs5kJ7naTuTFkBy1He.SqbIZ3cP2PYeNyMpjlkDyJ64sJmj5IK
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
 * Compare a plain text password with a bcrypt hash
 * @description Securely compares a plain text password against a bcrypt hash without
 * exposing the original password or the hashing algorithm details. Used during authentication
 * to verify user credentials. Time-constant comparison prevents timing attacks.
 *
 * @async
 * @param {string} password - Plain text password to verify
 * @param {string} hash - Bcrypt hash from database to compare against
 * @returns {Promise<boolean>} True if password matches the hash, false otherwise
 * @throws {Error} If comparison fails (invalid hash format or system error)
 *
 * @example
 * const user = await db.users.findOne({ email: 'user@example.com' });
 * const isValid = await comparePassword(loginPassword, user.passwordHash);
 * if (isValid) {
 *   // Password is correct, authenticate user
 * } else {
 *   // Password is incorrect, deny access
 * }
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
 * Validate if a string is a properly formatted bcrypt hash
 * @description Checks if a string matches the bcrypt hash format without actually
 * verifying the hash. Useful for input validation before database operations.
 * Bcrypt hashes follow the pattern: $2[aby]$rounds$salt+hash
 *
 * @param {string} hash - String to validate as bcrypt hash
 * @returns {boolean} True if string is valid bcrypt hash format, false otherwise
 *
 * @example
 * if (isValidHash(storedHash)) {
 *   // Safe to use for password comparison
 *   const isMatch = await comparePassword(inputPassword, storedHash);
 * } else {
 *   // Invalid hash format, possible data corruption
 *   console.error('Invalid password hash in database');
 * }
 */
export function isValidHash(hash: string): boolean {
  // Bcrypt hashes start with $2a$, $2b$, or $2y$
  // Format: $2[aby]$rounds$salt(22 chars)+hash(31 chars)
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(hash);
}
