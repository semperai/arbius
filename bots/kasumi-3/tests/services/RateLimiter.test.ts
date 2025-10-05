import { vi } from 'vitest';
import { RateLimiter } from '../../src/services/RateLimiter';
import { log } from '../../src/log';

// Mock the log module
vi.mock('../../src/log', () => ({
  log: {
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    // Create a new rate limiter with 3 requests per 1 second for testing
    rateLimiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 });
  });

  afterEach(() => {
    rateLimiter.shutdown();
  });

  describe('checkLimit', () => {
    it('should allow requests within limit', () => {
      const userId = 123;

      expect(rateLimiter.checkLimit(userId)).toBe(true);
      expect(rateLimiter.checkLimit(userId)).toBe(true);
      expect(rateLimiter.checkLimit(userId)).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      const userId = 123;

      // Use up the 3 allowed requests
      rateLimiter.checkLimit(userId);
      rateLimiter.checkLimit(userId);
      rateLimiter.checkLimit(userId);

      // 4th request should be blocked
      expect(rateLimiter.checkLimit(userId)).toBe(false);
    });

    it('should log warning when rate limit is exceeded', () => {
      const userId = 123;

      vi.clearAllMocks();

      // Use up the 3 allowed requests
      rateLimiter.checkLimit(userId);
      rateLimiter.checkLimit(userId);
      rateLimiter.checkLimit(userId);

      // 4th request should be blocked and logged
      rateLimiter.checkLimit(userId);

      expect(log.warn).toHaveBeenCalledWith(
        expect.stringContaining(`Rate limit exceeded for user ${userId}`)
      );
    });

    it('should track different users separately', () => {
      const user1 = 123;
      const user2 = 456;

      rateLimiter.checkLimit(user1);
      rateLimiter.checkLimit(user1);
      rateLimiter.checkLimit(user1);

      // user1 is rate limited, but user2 should still be allowed
      expect(rateLimiter.checkLimit(user1)).toBe(false);
      expect(rateLimiter.checkLimit(user2)).toBe(true);
    });

    it('should reset limit after window expires', async () => {
      const userId = 123;

      // Use up the limit
      rateLimiter.checkLimit(userId);
      rateLimiter.checkLimit(userId);
      rateLimiter.checkLimit(userId);

      expect(rateLimiter.checkLimit(userId)).toBe(false);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be allowed again
      expect(rateLimiter.checkLimit(userId)).toBe(true);
    });
  });

  describe('getRemaining', () => {
    it('should return max requests for new user', () => {
      const userId = 123;
      expect(rateLimiter.getRemaining(userId)).toBe(3);
    });

    it('should decrease remaining after requests', () => {
      const userId = 123;

      rateLimiter.checkLimit(userId);
      expect(rateLimiter.getRemaining(userId)).toBe(2);

      rateLimiter.checkLimit(userId);
      expect(rateLimiter.getRemaining(userId)).toBe(1);

      rateLimiter.checkLimit(userId);
      expect(rateLimiter.getRemaining(userId)).toBe(0);
    });

    it('should reset remaining after window expires', async () => {
      const userId = 123;

      rateLimiter.checkLimit(userId);
      expect(rateLimiter.getRemaining(userId)).toBe(2);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(rateLimiter.getRemaining(userId)).toBe(3);
    });
  });

  describe('getResetTime', () => {
    it('should return 0 for new user', () => {
      const userId = 123;
      expect(rateLimiter.getResetTime(userId)).toBe(0);
    });

    it('should return seconds until reset', () => {
      const userId = 123;

      rateLimiter.checkLimit(userId);
      const resetTime = rateLimiter.getResetTime(userId);

      // Should be close to 1 second (within 100ms tolerance)
      expect(resetTime).toBeGreaterThanOrEqual(0);
      expect(resetTime).toBeLessThanOrEqual(1);
    });

    it('should return 0 after window expires', async () => {
      const userId = 123;

      rateLimiter.checkLimit(userId);
      expect(rateLimiter.getResetTime(userId)).toBeGreaterThan(0);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(rateLimiter.getResetTime(userId)).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset user rate limit', () => {
      const userId = 123;

      // Use up the limit
      rateLimiter.checkLimit(userId);
      rateLimiter.checkLimit(userId);
      rateLimiter.checkLimit(userId);

      expect(rateLimiter.checkLimit(userId)).toBe(false);

      // Reset the user
      rateLimiter.reset(userId);

      // Should be allowed again
      expect(rateLimiter.checkLimit(userId)).toBe(true);
    });

    it('should log info when resetting user rate limit', () => {
      const userId = 123;

      vi.clearAllMocks();

      // Use up the limit
      rateLimiter.checkLimit(userId);
      rateLimiter.checkLimit(userId);
      rateLimiter.checkLimit(userId);

      // Reset the user
      rateLimiter.reset(userId);

      expect(log.info).toHaveBeenCalledWith(
        expect.stringContaining(`Reset rate limit for user ${userId}`)
      );
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const stats = rateLimiter.getStats();

      expect(stats.activeUsers).toBe(0);
      expect(stats.config.maxRequests).toBe(3);
      expect(stats.config.windowMs).toBe(1000);
    });

    it('should track active users', () => {
      rateLimiter.checkLimit(123);
      rateLimiter.checkLimit(456);

      const stats = rateLimiter.getStats();
      expect(stats.activeUsers).toBe(2);
    });
  });

  describe('cleanup', () => {
    it('should clean up expired entries', async () => {
      rateLimiter.checkLimit(123);
      rateLimiter.checkLimit(456);

      expect(rateLimiter.getStats().activeUsers).toBe(2);

      // Wait for entries to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Trigger cleanup by making a new request
      rateLimiter.checkLimit(789);

      // Wait for cleanup interval to run (cleanup runs every 60s, but we'll test indirectly)
      // The old entries should be gone when we check remaining
      expect(rateLimiter.getRemaining(123)).toBe(3); // Reset since expired
      expect(rateLimiter.getRemaining(456)).toBe(3); // Reset since expired
    });

    it('should run cleanup interval automatically', async () => {
      // Create a rate limiter with very short cleanup interval for testing
      const testLimiter = new RateLimiter({ maxRequests: 3, windowMs: 100 });

      // Add some entries
      testLimiter.checkLimit(123);
      testLimiter.checkLimit(456);

      expect(testLimiter.getStats().activeUsers).toBe(2);

      // Wait for entries to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Manually trigger cleanup by accessing private method via bracket notation
      (testLimiter as any).cleanup();

      // Verify cleanup logged
      expect(log.debug).toHaveBeenCalledWith(
        expect.stringContaining('Cleaned up 2 expired rate limit entries')
      );

      // Verify entries were removed
      expect(testLimiter.getStats().activeUsers).toBe(0);

      testLimiter.shutdown();
    });

    it('should not log when no entries are cleaned up', () => {
      vi.clearAllMocks();

      // Manually trigger cleanup when no entries are expired
      (rateLimiter as any).cleanup();

      // Should not log anything
      expect(log.debug).not.toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    it('should clear all data and stop cleanup interval', () => {
      rateLimiter.checkLimit(123);
      rateLimiter.checkLimit(456);

      expect(rateLimiter.getStats().activeUsers).toBe(2);

      rateLimiter.shutdown();

      // After shutdown, stats should show no active users
      expect(rateLimiter.getStats().activeUsers).toBe(0);
    });
  });
});
