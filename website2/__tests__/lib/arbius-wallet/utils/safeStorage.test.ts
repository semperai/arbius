/**
 * Tests for safe localStorage wrapper
 */

import {
  safeLocalStorageGet,
  safeLocalStorageSet,
  safeLocalStorageRemove,
  isLocalStorageAvailable,
} from '@/lib/arbius-wallet/utils/safeStorage';

describe('safeStorage', () => {
  beforeEach(() => {
    // Reset localStorage mock
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  });

  describe('safeLocalStorageGet', () => {
    it('should return value when localStorage works', () => {
      const mockGetItem = vi.fn(() => 'test-value');
      Object.defineProperty(global, 'localStorage', {
        value: { getItem: mockGetItem },
        writable: true,
      });

      const result = safeLocalStorageGet('test-key');
      expect(result).toBe('test-value');
    });

    it('should return null when localStorage throws', () => {
      const mockGetItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });
      Object.defineProperty(global, 'localStorage', {
        value: { getItem: mockGetItem },
        writable: true,
      });

      const result = safeLocalStorageGet('test-key');
      expect(result).toBeNull();
    });

    it('should return null when localStorage is undefined', () => {
      Object.defineProperty(global, 'localStorage', {
        value: undefined,
        writable: true,
      });

      const result = safeLocalStorageGet('test-key');
      expect(result).toBeNull();
    });

    it('should return null when window is undefined', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const result = safeLocalStorageGet('test-key');
      expect(result).toBeNull();

      (global as any).window = originalWindow;
    });
  });

  describe('safeLocalStorageSet', () => {
    it('should return true when localStorage works', () => {
      const mockSetItem = vi.fn();
      Object.defineProperty(global, 'localStorage', {
        value: { setItem: mockSetItem },
        writable: true,
      });

      const result = safeLocalStorageSet('test-key', 'test-value');
      expect(result).toBe(true);
      expect(mockSetItem).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should return false when localStorage throws', () => {
      const mockSetItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });
      Object.defineProperty(global, 'localStorage', {
        value: { setItem: mockSetItem },
        writable: true,
      });

      const result = safeLocalStorageSet('test-key', 'test-value');
      expect(result).toBe(false);
    });

    it('should return false when localStorage is undefined', () => {
      Object.defineProperty(global, 'localStorage', {
        value: undefined,
        writable: true,
      });

      const result = safeLocalStorageSet('test-key', 'test-value');
      expect(result).toBe(false);
    });
  });

  describe('safeLocalStorageRemove', () => {
    it('should return true when localStorage works', () => {
      const mockRemoveItem = vi.fn();
      Object.defineProperty(global, 'localStorage', {
        value: { removeItem: mockRemoveItem },
        writable: true,
      });

      const result = safeLocalStorageRemove('test-key');
      expect(result).toBe(true);
      expect(mockRemoveItem).toHaveBeenCalledWith('test-key');
    });

    it('should return false when localStorage throws', () => {
      const mockRemoveItem = vi.fn(() => {
        throw new Error('Storage error');
      });
      Object.defineProperty(global, 'localStorage', {
        value: { removeItem: mockRemoveItem },
        writable: true,
      });

      const result = safeLocalStorageRemove('test-key');
      expect(result).toBe(false);
    });
  });

  describe('isLocalStorageAvailable', () => {
    it('should return true when localStorage works', () => {
      const mockSetItem = vi.fn();
      const mockRemoveItem = vi.fn();
      Object.defineProperty(global, 'localStorage', {
        value: { setItem: mockSetItem, removeItem: mockRemoveItem },
        writable: true,
      });

      const result = isLocalStorageAvailable();
      expect(result).toBe(true);
    });

    it('should return false when localStorage throws', () => {
      const mockSetItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });
      Object.defineProperty(global, 'localStorage', {
        value: { setItem: mockSetItem },
        writable: true,
      });

      const result = isLocalStorageAvailable();
      expect(result).toBe(false);
    });

    it('should return false when localStorage is undefined', () => {
      Object.defineProperty(global, 'localStorage', {
        value: undefined,
        writable: true,
      });

      const result = isLocalStorageAvailable();
      expect(result).toBe(false);
    });
  });
});
