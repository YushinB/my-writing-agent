import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { QuotaManager, QuotaExceededError } from '../QuotaManager';
import { AIQuota } from '@prisma/client';

// Mock logger
jest.mock('../../../../utils/logger', () => ({
  __esModule: true,
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Prisma client
const mockPrisma = {
  aIQuota: {
    findUnique: jest.fn() as any,
    create: jest.fn() as any,
    update: jest.fn() as any,
  },
};

// Mock database
jest.mock('../../../../config/database', () => ({
  prisma: mockPrisma,
}));

describe('QuotaManager', () => {
  let quotaManager: QuotaManager;
  const testUserId = 'test-user-123';

  const createMockQuota = (overrides?: Partial<AIQuota>): AIQuota => {
    const now = new Date();
    const dailyReset = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const monthlyReset = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      id: 'quota-123',
      userId: testUserId,
      dailyRequestLimit: 1000,
      dailyRequestCount: 0,
      dailyResetAt: dailyReset,
      monthlyRequestLimit: 10000,
      monthlyRequestCount: 0,
      monthlySpendLimit: 10.0,
      monthlySpendAmount: 0.0,
      monthlyResetAt: monthlyReset,
      tier: 'free',
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  };

  beforeEach(() => {
    quotaManager = new QuotaManager();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('checkQuota()', () => {
    it('should return quota status when quota is available', async () => {
      const mockQuota = createMockQuota();
      mockPrisma.aIQuota.findUnique.mockResolvedValue(mockQuota);

      const status = await quotaManager.checkQuota(testUserId);

      expect(status.hasQuota).toBe(true);
      expect(status.userId).toBe(testUserId);
      expect(status.tier).toBe('free');
      expect(status.daily.remaining).toBe(1000);
      expect(status.monthly.requests.remaining).toBe(10000);
    });

    it('should create default quota if none exists', async () => {
      mockPrisma.aIQuota.findUnique.mockResolvedValue(null);
      const mockQuota = createMockQuota();
      mockPrisma.aIQuota.create.mockResolvedValue(mockQuota);

      const status = await quotaManager.checkQuota(testUserId);

      expect(mockPrisma.aIQuota.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: testUserId,
          dailyRequestLimit: 1000,
          monthlyRequestLimit: 10000,
          monthlySpendLimit: 10.0,
          tier: 'free',
        }),
      });
      expect(status.hasQuota).toBe(true);
    });

    it('should calculate remaining quota correctly', async () => {
      const mockQuota = createMockQuota({
        dailyRequestCount: 250,
        monthlyRequestCount: 3000,
        monthlySpendAmount: 2.5,
      });
      mockPrisma.aIQuota.findUnique.mockResolvedValue(mockQuota);

      const status = await quotaManager.checkQuota(testUserId);

      expect(status.daily.remaining).toBe(750); // 1000 - 250
      expect(status.daily.used).toBe(250);
      expect(status.monthly.requests.remaining).toBe(7000); // 10000 - 3000
      expect(status.monthly.requests.used).toBe(3000);
      expect(status.monthly.spend.remaining).toBe(7.5); // 10.0 - 2.5
      expect(status.monthly.spend.used).toBe(2.5);
    });

    it('should throw QuotaExceededError when daily limit is exceeded', async () => {
      const mockQuota = createMockQuota({
        dailyRequestCount: 1000,
        dailyRequestLimit: 1000,
      });
      mockPrisma.aIQuota.findUnique.mockResolvedValue(mockQuota);

      await expect(quotaManager.checkQuota(testUserId)).rejects.toThrow(
        QuotaExceededError
      );
      await expect(quotaManager.checkQuota(testUserId)).rejects.toThrow(
        /Daily request limit exceeded/
      );
    });

    it('should throw QuotaExceededError when monthly request limit is exceeded', async () => {
      const mockQuota = createMockQuota({
        monthlyRequestCount: 10000,
        monthlyRequestLimit: 10000,
      });
      mockPrisma.aIQuota.findUnique.mockResolvedValue(mockQuota);

      await expect(quotaManager.checkQuota(testUserId)).rejects.toThrow(
        QuotaExceededError
      );
      await expect(quotaManager.checkQuota(testUserId)).rejects.toThrow(
        /Monthly request limit exceeded/
      );
    });

    it('should throw QuotaExceededError when monthly spend limit is exceeded', async () => {
      const mockQuota = createMockQuota({
        monthlySpendAmount: 10.0,
        monthlySpendLimit: 10.0,
      });
      mockPrisma.aIQuota.findUnique.mockResolvedValue(mockQuota);

      await expect(quotaManager.checkQuota(testUserId)).rejects.toThrow(
        QuotaExceededError
      );
      await expect(quotaManager.checkQuota(testUserId)).rejects.toThrow(
        /Monthly spend limit exceeded/
      );
    });

    it('should reset daily quota when reset time has passed', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const mockQuota = createMockQuota({
        dailyRequestCount: 500,
        dailyResetAt: yesterday,
      });
      const updatedQuota = createMockQuota({ dailyRequestCount: 0 });

      mockPrisma.aIQuota.findUnique.mockResolvedValue(mockQuota);
      mockPrisma.aIQuota.update.mockResolvedValue(updatedQuota);

      const status = await quotaManager.checkQuota(testUserId);

      expect(mockPrisma.aIQuota.update).toHaveBeenCalledWith({
        where: { userId: testUserId },
        data: expect.objectContaining({
          dailyRequestCount: 0,
        }),
      });
      expect(status.daily.used).toBe(0);
    });

    it('should reset monthly quota when reset time has passed', async () => {
      const lastMonth = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
      const mockQuota = createMockQuota({
        monthlyRequestCount: 5000,
        monthlySpendAmount: 5.0,
        monthlyResetAt: lastMonth,
      });
      const updatedQuota = createMockQuota({
        monthlyRequestCount: 0,
        monthlySpendAmount: 0,
      });

      mockPrisma.aIQuota.findUnique.mockResolvedValue(mockQuota);
      mockPrisma.aIQuota.update.mockResolvedValue(updatedQuota);

      const status = await quotaManager.checkQuota(testUserId);

      expect(mockPrisma.aIQuota.update).toHaveBeenCalledWith({
        where: { userId: testUserId },
        data: expect.objectContaining({
          monthlyRequestCount: 0,
          monthlySpendAmount: 0,
        }),
      });
      expect(status.monthly.requests.used).toBe(0);
      expect(status.monthly.spend.used).toBe(0);
    });

    it('should set exceeded flags correctly', async () => {
      const mockQuota = createMockQuota({
        dailyRequestCount: 999,
        monthlyRequestCount: 9999,
        monthlySpendAmount: 9.99,
      });
      mockPrisma.aIQuota.findUnique.mockResolvedValue(mockQuota);

      const status = await quotaManager.checkQuota(testUserId);

      expect(status.daily.exceeded).toBe(false);
      expect(status.monthly.requests.exceeded).toBe(false);
      expect(status.monthly.spend.exceeded).toBe(false);
    });

    it('should handle database errors', async () => {
      mockPrisma.aIQuota.findUnique.mockRejectedValue(new Error('DB Error'));

      await expect(quotaManager.checkQuota(testUserId)).rejects.toThrow('DB Error');
    });

    it('should include reset timestamps in QuotaExceededError', async () => {
      const mockQuota = createMockQuota({
        dailyRequestCount: 1000,
        dailyRequestLimit: 1000,
      });
      mockPrisma.aIQuota.findUnique.mockResolvedValue(mockQuota);

      try {
        await quotaManager.checkQuota(testUserId);
        fail('Should have thrown QuotaExceededError');
      } catch (error) {
        expect(error).toBeInstanceOf(QuotaExceededError);
        const quotaError = error as QuotaExceededError;
        expect(quotaError.quotaType).toBe('daily');
        expect(quotaError.limit).toBe(1000);
        expect(quotaError.used).toBe(1000);
        expect(quotaError.resetAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('incrementQuota()', () => {
    it('should increment quota counters', async () => {
      mockPrisma.aIQuota.update.mockResolvedValue(createMockQuota());

      await quotaManager.incrementQuota(testUserId, 0.005);

      expect(mockPrisma.aIQuota.update).toHaveBeenCalledWith({
        where: { userId: testUserId },
        data: {
          dailyRequestCount: { increment: 1 },
          monthlyRequestCount: { increment: 1 },
          monthlySpendAmount: { increment: 0.005 },
        },
      });
    });

    it('should handle different cost amounts', async () => {
      mockPrisma.aIQuota.update.mockResolvedValue(createMockQuota());

      await quotaManager.incrementQuota(testUserId, 0.1);

      expect(mockPrisma.aIQuota.update).toHaveBeenCalledWith({
        where: { userId: testUserId },
        data: expect.objectContaining({
          monthlySpendAmount: { increment: 0.1 },
        }),
      });
    });

    it('should not throw on database error', async () => {
      mockPrisma.aIQuota.update.mockRejectedValue(new Error('DB Error'));

      // Should not throw - increment failure shouldn't break the request
      await expect(quotaManager.incrementQuota(testUserId, 0.005)).resolves.toBeUndefined();
    });

    it('should handle zero cost', async () => {
      mockPrisma.aIQuota.update.mockResolvedValue(createMockQuota());

      await quotaManager.incrementQuota(testUserId, 0);

      expect(mockPrisma.aIQuota.update).toHaveBeenCalledWith({
        where: { userId: testUserId },
        data: expect.objectContaining({
          monthlySpendAmount: { increment: 0 },
        }),
      });
    });
  });

  describe('getQuota()', () => {
    it('should return quota status', async () => {
      const mockQuota = createMockQuota({
        dailyRequestCount: 100,
        monthlyRequestCount: 500,
        monthlySpendAmount: 1.5,
      });
      mockPrisma.aIQuota.findUnique.mockResolvedValue(mockQuota);

      const status = await quotaManager.getQuota(testUserId);

      expect(status).not.toBeNull();
      expect(status?.userId).toBe(testUserId);
      expect(status?.daily.used).toBe(100);
      expect(status?.monthly.requests.used).toBe(500);
      expect(status?.monthly.spend.used).toBe(1.5);
    });

    it('should return null when no quota exists', async () => {
      mockPrisma.aIQuota.findUnique.mockResolvedValue(null);

      const status = await quotaManager.getQuota(testUserId);

      expect(status).toBeNull();
    });

    it('should reset quota before returning if needed', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const mockQuota = createMockQuota({
        dailyRequestCount: 500,
        dailyResetAt: yesterday,
      });
      const updatedQuota = createMockQuota({ dailyRequestCount: 0 });

      mockPrisma.aIQuota.findUnique.mockResolvedValue(mockQuota);
      mockPrisma.aIQuota.update.mockResolvedValue(updatedQuota);

      const status = await quotaManager.getQuota(testUserId);

      expect(mockPrisma.aIQuota.update).toHaveBeenCalled();
      expect(status?.daily.used).toBe(0);
    });

    it('should return null on database error', async () => {
      mockPrisma.aIQuota.findUnique.mockRejectedValue(new Error('DB Error'));

      const status = await quotaManager.getQuota(testUserId);

      expect(status).toBeNull();
    });
  });

  describe('updateQuotaLimits()', () => {
    it('should update quota limits', async () => {
      const updatedQuota = createMockQuota({
        dailyRequestLimit: 2000,
        monthlyRequestLimit: 20000,
        monthlySpendLimit: 20.0,
      });
      mockPrisma.aIQuota.update.mockResolvedValue(updatedQuota);

      const result = await quotaManager.updateQuotaLimits(testUserId, {
        dailyRequestLimit: 2000,
        monthlyRequestLimit: 20000,
        monthlySpendLimit: 20.0,
      });

      expect(mockPrisma.aIQuota.update).toHaveBeenCalledWith({
        where: { userId: testUserId },
        data: {
          dailyRequestLimit: 2000,
          monthlyRequestLimit: 20000,
          monthlySpendLimit: 20.0,
        },
      });
      expect(result.dailyRequestLimit).toBe(2000);
    });

    it('should update tier', async () => {
      const updatedQuota = createMockQuota({ tier: 'premium' });
      mockPrisma.aIQuota.update.mockResolvedValue(updatedQuota);

      const result = await quotaManager.updateQuotaLimits(testUserId, {
        tier: 'premium',
      });

      expect(mockPrisma.aIQuota.update).toHaveBeenCalledWith({
        where: { userId: testUserId },
        data: { tier: 'premium' },
      });
      expect(result.tier).toBe('premium');
    });

    it('should update partial limits', async () => {
      const updatedQuota = createMockQuota({ dailyRequestLimit: 5000 });
      mockPrisma.aIQuota.update.mockResolvedValue(updatedQuota);

      await quotaManager.updateQuotaLimits(testUserId, {
        dailyRequestLimit: 5000,
      });

      expect(mockPrisma.aIQuota.update).toHaveBeenCalledWith({
        where: { userId: testUserId },
        data: { dailyRequestLimit: 5000 },
      });
    });

    it('should throw on database error', async () => {
      mockPrisma.aIQuota.update.mockRejectedValue(new Error('DB Error'));

      await expect(
        quotaManager.updateQuotaLimits(testUserId, { dailyRequestLimit: 2000 })
      ).rejects.toThrow('DB Error');
    });
  });

  describe('resetQuota()', () => {
    it('should reset all quota counters to zero', async () => {
      mockPrisma.aIQuota.update.mockResolvedValue(createMockQuota());

      await quotaManager.resetQuota(testUserId);

      expect(mockPrisma.aIQuota.update).toHaveBeenCalledWith({
        where: { userId: testUserId },
        data: expect.objectContaining({
          dailyRequestCount: 0,
          monthlyRequestCount: 0,
          monthlySpendAmount: 0,
        }),
      });
    });

    it('should set new reset timestamps', async () => {
      mockPrisma.aIQuota.update.mockResolvedValue(createMockQuota());

      await quotaManager.resetQuota(testUserId);

      const updateCall: any = mockPrisma.aIQuota.update.mock.calls[0][0];
      expect(updateCall.data.dailyResetAt).toBeInstanceOf(Date);
      expect(updateCall.data.monthlyResetAt).toBeInstanceOf(Date);
    });

    it('should throw on database error', async () => {
      mockPrisma.aIQuota.update.mockRejectedValue(new Error('DB Error'));

      await expect(quotaManager.resetQuota(testUserId)).rejects.toThrow('DB Error');
    });
  });

  describe('QuotaExceededError', () => {
    it('should create error with correct properties', () => {
      const resetAt = new Date();
      const error = new QuotaExceededError(
        'Test error',
        'daily',
        1000,
        1000,
        resetAt
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('QuotaExceededError');
      expect(error.message).toBe('Test error');
      expect(error.quotaType).toBe('daily');
      expect(error.limit).toBe(1000);
      expect(error.used).toBe(1000);
      expect(error.resetAt).toBe(resetAt);
    });

    it('should support different quota types', () => {
      const resetAt = new Date();

      const dailyError = new QuotaExceededError('Daily', 'daily', 100, 100, resetAt);
      expect(dailyError.quotaType).toBe('daily');

      const monthlyError = new QuotaExceededError(
        'Monthly',
        'monthly_requests',
        1000,
        1000,
        resetAt
      );
      expect(monthlyError.quotaType).toBe('monthly_requests');

      const spendError = new QuotaExceededError(
        'Spend',
        'monthly_spend',
        10,
        10,
        resetAt
      );
      expect(spendError.quotaType).toBe('monthly_spend');
    });
  });
});
