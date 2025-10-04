/**
 * Tests for nonce cleanup mechanism
 */

import {
  cleanupExpiredNonces,
  startPeriodicNonceCleanup,
  stopPeriodicNonceCleanup,
  getNonceStats,
} from '@/lib/arbius-wallet/utils/nonceCleanup';

describe('nonceCleanup', () => {
  beforeEach(() => {
    // Setup localStorage mock
    const storage: Record<string, string> = {};

    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => storage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          storage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete storage[key];
        }),
        clear: jest.fn(() => {
          for (const key in storage) {
            delete storage[key];
          }
        }),
        get length() {
          return Object.keys(storage).length;
        },
        key: jest.fn((index: number) => Object.keys(storage)[index] || null),
      },
      writable: true,
      configurable: true,
    });

    // Clear storage
    for (const key in storage) {
      delete storage[key];
    }
  });

  describe('cleanupExpiredNonces', () => {
    it('should remove expired nonces', () => {
      const now = new Date();
      const expired = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago

      // Add expired nonce
      localStorage.setItem(
        'arbiuswallet_nonce_expired',
        JSON.stringify({
          address: '0x123',
          issuedAt: expired.toISOString(),
          expiresAt: expired.toISOString(),
        })
      );

      const cleaned = cleanupExpiredNonces();
      expect(cleaned).toBe(1);
      expect(localStorage.getItem('arbiuswallet_nonce_expired')).toBeNull();
    });

    it('should not remove valid nonces', () => {
      const now = new Date();
      const future = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

      localStorage.setItem(
        'arbiuswallet_nonce_valid',
        JSON.stringify({
          address: '0x123',
          issuedAt: now.toISOString(),
          expiresAt: future.toISOString(),
        })
      );

      const cleaned = cleanupExpiredNonces();
      expect(cleaned).toBe(0);
      expect(localStorage.getItem('arbiuswallet_nonce_valid')).not.toBeNull();
    });

    it('should remove invalid JSON nonces', () => {
      localStorage.setItem('arbiuswallet_nonce_invalid', '{invalid json');

      const cleaned = cleanupExpiredNonces();
      expect(cleaned).toBe(1);
      expect(localStorage.getItem('arbiuswallet_nonce_invalid')).toBeNull();
    });

    it('should not affect non-nonce keys', () => {
      localStorage.setItem('other_key', 'value');
      localStorage.setItem('arbiuswallet_derivedWalletCache', 'cache');

      cleanupExpiredNonces();

      expect(localStorage.getItem('other_key')).toBe('value');
      expect(localStorage.getItem('arbiuswallet_derivedWalletCache')).toBe('cache');
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw
      Object.defineProperty(global, 'localStorage', {
        value: {
          ...global.localStorage,
          key: jest.fn(() => {
            throw new Error('Storage error');
          }),
        },
        writable: true,
      });

      const result = cleanupExpiredNonces();
      expect(result).toBe(0); // Should not crash
    });
  });

  describe('getNonceStats', () => {
    it('should count total and expired nonces', () => {
      const now = new Date();
      const expired = new Date(now.getTime() - 10 * 60 * 1000);
      const future = new Date(now.getTime() + 10 * 60 * 1000);

      // Add 2 expired, 1 valid
      localStorage.setItem(
        'arbiuswallet_nonce_1',
        JSON.stringify({ expiresAt: expired.toISOString() })
      );
      localStorage.setItem(
        'arbiuswallet_nonce_2',
        JSON.stringify({ expiresAt: expired.toISOString() })
      );
      localStorage.setItem(
        'arbiuswallet_nonce_3',
        JSON.stringify({ expiresAt: future.toISOString() })
      );

      const stats = getNonceStats();
      expect(stats.total).toBe(3);
      expect(stats.expired).toBe(2);
    });

    it('should return zero when no nonces exist', () => {
      const stats = getNonceStats();
      expect(stats.total).toBe(0);
      expect(stats.expired).toBe(0);
    });
  });

  describe('startPeriodicNonceCleanup', () => {
    it('should return interval ID', () => {
      const intervalId = startPeriodicNonceCleanup();
      expect(typeof intervalId).toBe('number');

      if (intervalId !== null) {
        stopPeriodicNonceCleanup(intervalId);
      }
    });

    it('should run initial cleanup', () => {
      const now = new Date();
      const expired = new Date(now.getTime() - 10 * 60 * 1000);

      localStorage.setItem(
        'arbiuswallet_nonce_expired',
        JSON.stringify({ expiresAt: expired.toISOString() })
      );

      const intervalId = startPeriodicNonceCleanup();

      // Initial cleanup should have run
      expect(localStorage.getItem('arbiuswallet_nonce_expired')).toBeNull();

      if (intervalId !== null) {
        stopPeriodicNonceCleanup(intervalId);
      }
    });
  });

  describe('stopPeriodicNonceCleanup', () => {
    it('should stop cleanup interval', () => {
      const intervalId = startPeriodicNonceCleanup();
      expect(() => stopPeriodicNonceCleanup(intervalId)).not.toThrow();
    });

    it('should handle null interval ID', () => {
      expect(() => stopPeriodicNonceCleanup(null)).not.toThrow();
    });
  });
});
