/**
 * Nonce cleanup utilities
 * Removes expired nonces from localStorage to prevent memory leaks
 */

import { safeLocalStorageGet, safeLocalStorageRemove } from './safeStorage';

const NONCE_PREFIX = 'arbiuswallet_nonce_';
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Clean up expired nonces from localStorage
 * @returns Number of nonces cleaned up
 */
export function cleanupExpiredNonces(): number {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 0;
  }

  let cleanedCount = 0;
  const now = new Date();
  const keysToRemove: string[] = [];

  try {
    // Iterate through all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && key.startsWith(NONCE_PREFIX)) {
        const value = safeLocalStorageGet(key);

        if (value) {
          try {
            const data = JSON.parse(value);

            // Check if nonce has expired
            if (data.expiresAt && new Date(data.expiresAt) < now) {
              keysToRemove.push(key);
            }
          } catch (error) {
            // Invalid JSON, remove it
            keysToRemove.push(key);
          }
        }
      }
    }

    // Remove expired nonces
    keysToRemove.forEach((key) => {
      if (safeLocalStorageRemove(key)) {
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired nonce(s)`);
    }
  } catch (error) {
    console.warn('Failed to cleanup expired nonces:', error);
  }

  return cleanedCount;
}

/**
 * Start periodic nonce cleanup
 * Cleans up expired nonces every hour
 * @returns Cleanup interval ID (can be used to stop cleanup)
 */
export function startPeriodicNonceCleanup(): number | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Run initial cleanup
  cleanupExpiredNonces();

  // Set up periodic cleanup
  const intervalId = window.setInterval(() => {
    cleanupExpiredNonces();
  }, CLEANUP_INTERVAL_MS);

  return intervalId;
}

/**
 * Stop periodic nonce cleanup
 * @param intervalId The interval ID returned by startPeriodicNonceCleanup
 */
export function stopPeriodicNonceCleanup(intervalId: number | null): void {
  if (intervalId !== null && typeof window !== 'undefined') {
    window.clearInterval(intervalId);
  }
}

/**
 * Get count of nonces in localStorage
 * @returns Object with total and expired nonce counts
 */
export function getNonceStats(): { total: number; expired: number } {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { total: 0, expired: 0 };
  }

  let total = 0;
  let expired = 0;
  const now = new Date();

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && key.startsWith(NONCE_PREFIX)) {
        total++;
        const value = safeLocalStorageGet(key);

        if (value) {
          try {
            const data = JSON.parse(value);
            if (data.expiresAt && new Date(data.expiresAt) < now) {
              expired++;
            }
          } catch {
            expired++; // Count invalid entries as expired
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to get nonce stats:', error);
  }

  return { total, expired };
}
