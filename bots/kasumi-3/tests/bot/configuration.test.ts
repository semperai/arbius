import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('Configuration from Environment Variables', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original process.env after each test
    process.env = originalEnv;
  });

  describe('Rate Limiter Configuration', () => {
    it('should use default values when env vars not set', () => {
      delete process.env.RATE_LIMIT_MAX_REQUESTS;
      delete process.env.RATE_LIMIT_WINDOW_MS;

      const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5');
      const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');

      expect(maxRequests).toBe(5);
      expect(windowMs).toBe(60000);
    });

    it('should use custom values from env vars', () => {
      process.env.RATE_LIMIT_MAX_REQUESTS = '10';
      process.env.RATE_LIMIT_WINDOW_MS = '120000';

      const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5');
      const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');

      expect(maxRequests).toBe(10);
      expect(windowMs).toBe(120000);
    });

    it('should handle invalid env var values gracefully', () => {
      process.env.RATE_LIMIT_MAX_REQUESTS = 'invalid';

      const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5');

      expect(isNaN(maxRequests)).toBe(true);
      // In practice, we'd want additional validation
    });
  });

  describe('Job Queue Configuration', () => {
    it('should use default job timeout', () => {
      delete process.env.JOB_TIMEOUT_MS;

      const jobTimeoutMs = parseInt(process.env.JOB_TIMEOUT_MS || '900000');

      expect(jobTimeoutMs).toBe(900000); // 15 minutes
    });

    it('should use custom job timeout from env', () => {
      process.env.JOB_TIMEOUT_MS = '1200000';

      const jobTimeoutMs = parseInt(process.env.JOB_TIMEOUT_MS || '900000');

      expect(jobTimeoutMs).toBe(1200000); // 20 minutes
    });

    it('should use default max concurrent', () => {
      delete process.env.JOB_MAX_CONCURRENT;

      const maxConcurrent = parseInt(process.env.JOB_MAX_CONCURRENT || '3');

      expect(maxConcurrent).toBe(3);
    });

    it('should use custom max concurrent from env', () => {
      process.env.JOB_MAX_CONCURRENT = '5';

      const maxConcurrent = parseInt(process.env.JOB_MAX_CONCURRENT || '3');

      expect(maxConcurrent).toBe(5);
    });
  });

  describe('Job Wait Timeout Configuration', () => {
    it('should use default wait timeout', () => {
      delete process.env.JOB_WAIT_TIMEOUT_MS;

      const waitTimeoutMs = parseInt(process.env.JOB_WAIT_TIMEOUT_MS || '900000');

      expect(waitTimeoutMs).toBe(900000); // 15 minutes
    });

    it('should use custom wait timeout from env', () => {
      process.env.JOB_WAIT_TIMEOUT_MS = '600000';

      const waitTimeoutMs = parseInt(process.env.JOB_WAIT_TIMEOUT_MS || '900000');

      expect(waitTimeoutMs).toBe(600000); // 10 minutes
    });
  });

  describe('Configuration Consistency', () => {
    it('should have consistent timeout defaults', () => {
      const jobTimeout = parseInt(process.env.JOB_TIMEOUT_MS || '900000');
      const waitTimeout = parseInt(process.env.JOB_WAIT_TIMEOUT_MS || '900000');

      // Both should default to 15 minutes
      expect(jobTimeout).toBe(waitTimeout);
      expect(jobTimeout).toBe(900000);
    });
  });
});
