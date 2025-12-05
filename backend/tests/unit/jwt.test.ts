import { generateTokens, verifyAccessToken, verifyRefreshToken } from '../../src/utils/jwt';
import { UserRole } from '@prisma/client';

describe('JWT Utilities', () => {
  const testUserId = 'test-user-id-123';
  const testRole = UserRole.USER;

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      const tokens = generateTokens(testUserId, testRole);

      expect(tokens).toBeDefined();
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should generate different tokens for each call', async () => {
      const tokens1 = generateTokens(testUserId, testRole);
      // Add delay to ensure different iat timestamps (1 second)
      await new Promise(resolve => setTimeout(resolve, 1000));
      const tokens2 = generateTokens(testUserId, testRole);

      expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const { accessToken } = generateTokens(testUserId, testRole);
      const payload = verifyAccessToken(accessToken);

      expect(payload).toBeDefined();
      expect(payload?.userId).toBe(testUserId);
      expect(payload?.role).toBe(testRole);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow();
    });

    it('should throw error for refresh token', () => {
      const { refreshToken } = generateTokens(testUserId, testRole);
      expect(() => verifyAccessToken(refreshToken)).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const { refreshToken } = generateTokens(testUserId, testRole);
      const payload = verifyRefreshToken(refreshToken);

      expect(payload).toBeDefined();
      expect(payload?.userId).toBe(testUserId);
      expect(payload?.role).toBe(testRole);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow();
    });

    it('should throw error for access token', () => {
      const { accessToken } = generateTokens(testUserId, testRole);
      expect(() => verifyRefreshToken(accessToken)).toThrow();
    });
  });
});
