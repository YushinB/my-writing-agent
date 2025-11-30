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

    it('should generate different tokens for each call', () => {
      const tokens1 = generateTokens(testUserId, testRole);
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
      expect(payload?.type).toBe('access');
    });

    it('should return null for invalid token', () => {
      const payload = verifyAccessToken('invalid-token');
      expect(payload).toBeNull();
    });

    it('should return null for refresh token', () => {
      const { refreshToken } = generateTokens(testUserId, testRole);
      const payload = verifyAccessToken(refreshToken);
      expect(payload).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const { refreshToken } = generateTokens(testUserId, testRole);
      const payload = verifyRefreshToken(refreshToken);

      expect(payload).toBeDefined();
      expect(payload?.userId).toBe(testUserId);
      expect(payload?.role).toBe(testRole);
      expect(payload?.type).toBe('refresh');
    });

    it('should return null for invalid token', () => {
      const payload = verifyRefreshToken('invalid-token');
      expect(payload).toBeNull();
    });

    it('should return null for access token', () => {
      const { accessToken } = generateTokens(testUserId, testRole);
      const payload = verifyRefreshToken(accessToken);
      expect(payload).toBeNull();
    });
  });
});
