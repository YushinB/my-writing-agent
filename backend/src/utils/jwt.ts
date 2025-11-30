import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { TokenPayload } from '../types/auth.types';
import logger from './logger';
import { TokenExpiredError, TokenInvalidError } from './errors';

/**
 * Generate an access token
 * @param payload - Token payload
 * @returns Access token string
 */
export function generateAccessToken(payload: TokenPayload): string {
  try {
    const token = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY,
      issuer: 'prosepolish-api',
      audience: 'prosepolish-app',
    });
    return token;
  } catch (error) {
    logger.error('Error generating access token:', error);
    throw new Error('Failed to generate access token');
  }
}

/**
 * Generate a refresh token
 * @param payload - Token payload
 * @returns Refresh token string
 */
export function generateRefreshToken(payload: TokenPayload): string {
  try {
    const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRY,
      issuer: 'prosepolish-api',
      audience: 'prosepolish-app',
    });
    return token;
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw new Error('Failed to generate refresh token');
  }
}

/**
 * Verify an access token
 * @param token - JWT token string
 * @returns Decoded token payload
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
 * Verify a refresh token
 * @param token - JWT token string
 * @returns Decoded token payload
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
 * Decode a token without verifying (useful for debugging)
 * @param token - JWT token string
 * @returns Decoded token or null
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
 * Get token expiration time
 * @param token - JWT token string
 * @returns Expiration timestamp or null
 */
export function getTokenExpiration(token: string): number | null {
  const decoded = decodeToken(token);
  if (!decoded || typeof decoded !== 'object') {
    return null;
  }
  return (decoded as any).exp || null;
}

/**
 * Check if token is expired
 * @param token - JWT token string
 * @returns True if expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  const exp = getTokenExpiration(token);
  if (!exp) {
    return true;
  }
  return Date.now() >= exp * 1000;
}
