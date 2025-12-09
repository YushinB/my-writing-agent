import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { TokenPayload, TokenPair } from '../types/auth.types';
import { UserRole } from '@prisma/client';
import logger from './logger';
import { TokenExpiredError, TokenInvalidError } from './errors';

/**
 * Generate both access and refresh tokens for a user
 * @description Creates a pair of JWT tokens (access and refresh) for authenticated users.
 * The access token is short-lived (used for API requests) while the refresh token is
 * long-lived (used to obtain new access tokens). Both tokens include user ID and role.
 *
 * @param {string} userId - Unique identifier of the authenticated user
 * @param {UserRole} role - User's role for authorization purposes (ADMIN, USER, etc.)
 * @returns {TokenPair} Object containing access and refresh tokens
 * @returns {string} .accessToken - Short-lived JWT token for API authentication
 * @returns {string} .refreshToken - Long-lived JWT token for obtaining new access tokens
 * @throws {Error} If token generation fails (invalid secrets or configuration)
 *
 * @example
 * const tokens = generateTokens('user123', 'USER');
 * // Returns: { accessToken: 'eyJhbGc...', refreshToken: 'eyJhbGc...' }
 */
export function generateTokens(userId: string, role: UserRole): TokenPair {
  const payload: TokenPayload = {
    userId,
    email: '', // Email will be set by the auth service
    role,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

/**
 * Generate a short-lived access token
 * @description Creates a JWT access token with a short expiration time (typically 15 minutes).
 * Used for authenticating API requests. The token includes user ID and role information.
 * Includes issuer and audience claims for security validation.
 *
 * @param {TokenPayload} payload - Token payload containing user info and role
 * @param {string} payload.userId - User's unique identifier
 * @param {UserRole} payload.role - User's authorization role
 * @returns {string} Signed JWT access token
 * @throws {Error} If token signing fails (e.g., invalid secret key)
 *
 * @example
 * const accessToken = generateAccessToken({
 *   userId: 'user123',
 *   email: 'user@example.com',
 *   role: 'USER'
 * });
 */
export function generateAccessToken(payload: TokenPayload): string {
  try {
    const token = jwt.sign(
      payload as object,
      env.JWT_ACCESS_SECRET as jwt.Secret,
      {
        expiresIn: env.JWT_ACCESS_EXPIRY,
        issuer: 'prosepolish-api',
        audience: 'prosepolish-app',
      } as jwt.SignOptions
    );
    return token;
  } catch (error) {
    logger.error('Error generating access token:', error);
    throw new Error('Failed to generate access token');
  }
}

/**
 * Generate a long-lived refresh token
 * @description Creates a JWT refresh token with a long expiration time (typically 7-30 days).
 * Used only to obtain new access tokens and stored securely on the client. Should be refreshed
 * periodically or when requesting a new access token.
 *
 * @param {TokenPayload} payload - Token payload containing user info and role
 * @param {string} payload.userId - User's unique identifier
 * @param {UserRole} payload.role - User's authorization role
 * @returns {string} Signed JWT refresh token
 * @throws {Error} If token signing fails (e.g., invalid secret key)
 *
 * @example
 * const refreshToken = generateRefreshToken({
 *   userId: 'user123',
 *   email: 'user@example.com',
 *   role: 'USER'
 * });
 */
export function generateRefreshToken(payload: TokenPayload): string {
  try {
    const token = jwt.sign(
      payload as object,
      env.JWT_REFRESH_SECRET as jwt.Secret,
      {
        expiresIn: env.JWT_REFRESH_EXPIRY,
        issuer: 'prosepolish-api',
        audience: 'prosepolish-app',
      } as jwt.SignOptions
    );
    return token;
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw new Error('Failed to generate refresh token');
  }
}

/**
 * Verify the validity of an access token
 * @description Validates an access token's signature, expiration, issuer, and audience claims.
 * Throws specific errors for expired or invalid tokens to allow proper error handling.
 *
 * @param {string} token - The JWT access token to verify
 * @returns {TokenPayload} Decoded and verified token payload
 * @throws {TokenExpiredError} If token has expired
 * @throws {TokenInvalidError} If token signature is invalid or verification fails
 *
 * @example
 * try {
 *   const payload = verifyAccessToken(token);
 *   console.log(payload.userId); // Authenticated user ID
 * } catch (error) {
 *   if (error instanceof TokenExpiredError) {
 *     // Request new access token with refresh token
 *   }
 * }
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: 'prosepolish-api',
      audience: 'prosepolish-app',
    }) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new TokenExpiredError('Access token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new TokenInvalidError('Invalid access token');
    }
    logger.error('Error verifying access token:', error);
    throw new TokenInvalidError('Failed to verify access token');
  }
}

/**
 * Verify the validity of a refresh token
 * @description Validates a refresh token's signature, expiration, issuer, and audience claims.
 * Refresh tokens are used to obtain new access tokens without re-authentication.
 *
 * @param {string} token - The JWT refresh token to verify
 * @returns {TokenPayload} Decoded and verified token payload
 * @throws {TokenExpiredError} If token has expired
 * @throws {TokenInvalidError} If token signature is invalid or verification fails
 *
 * @example
 * try {
 *   const payload = verifyRefreshToken(refreshToken);
 *   const newAccessToken = generateAccessToken({
 *     userId: payload.userId,
 *     email: payload.email,
 *     role: payload.role
 *   });
 * } catch (error) {
 *   // Token invalid, require re-login
 * }
 */
export function verifyRefreshToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: 'prosepolish-api',
      audience: 'prosepolish-app',
    }) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new TokenExpiredError('Refresh token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new TokenInvalidError('Invalid refresh token');
    }
    logger.error('Error verifying refresh token:', error);
    throw new TokenInvalidError('Failed to verify refresh token');
  }
}

/**
 * Decode a token without verification
 * @description Decodes a JWT token without verifying its signature. Useful for debugging,
 * extracting claims, or checking expiration before calling verify. Does not validate signature.
 * Returns null if the token cannot be parsed as valid JWT structure.
 *
 * @param {string} token - The JWT token to decode
 * @returns {TokenPayload|null} Decoded token payload or null if invalid format
 *
 * @example
 * const payload = decodeToken(token);
 * if (payload?.exp && payload.exp * 1000 < Date.now()) {
 *   console.log('Token is expired');
 * }
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded;
  } catch (error) {
    logger.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Get token expiration time as a Unix timestamp
 * @description Extracts and returns the 'exp' claim from a token payload as a Unix timestamp
 * (seconds since epoch). Used to determine when a token will expire. Returns null if the
 * token cannot be decoded or has no exp claim.
 *
 * @param {string} token - The JWT token to inspect
 * @returns {number|null} Unix timestamp (in seconds) when token expires, or null if not found
 *
 * @example
 * const expirationTime = getTokenExpiration(token);
 * const expiresInMs = expirationTime ? expirationTime * 1000 : null;
 * const timeUntilExpiry = expiresInMs ? expiresInMs - Date.now() : 0;
 */
export function getTokenExpiration(token: string): number | null {
  const decoded = decodeToken(token);
  if (!decoded || typeof decoded !== 'object') {
    return null;
  }
  return (decoded as any).exp || null;
}

/**
 * Check if a token has expired
 * @description Compares token expiration time with current time to determine if the token
 * is still valid. Returns true if expired or if expiration cannot be determined.
 * Works without verifying token signature.
 *
 * @param {string} token - The JWT token to check
 * @returns {boolean} True if token is expired or invalid, false if still valid
 *
 * @example
 * if (isTokenExpired(accessToken)) {
 *   // Get new access token using refresh token
 *   const newAccessToken = generateAccessToken(refreshTokenPayload);
 * }
 */
export function isTokenExpired(token: string): boolean {
  const exp = getTokenExpiration(token);
  if (!exp) {
    return true;
  }
  return Date.now() >= exp * 1000;
}
