/**
 * Safe localStorage wrapper with error handling
 * Handles cases where localStorage is unavailable (incognito mode, disabled, etc.)
 */

/**
 * Safely get item from localStorage
 * @param key Storage key
 * @returns Value or null if unavailable/error
 */
export function safeLocalStorageGet(key: string): string | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`localStorage.getItem failed for key "${key}":`, error);
    return null;
  }
}

/**
 * Safely set item in localStorage
 * @param key Storage key
 * @param value Value to store
 * @returns true if successful, false otherwise
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`localStorage.setItem failed for key "${key}":`, error);
    return false;
  }
}

/**
 * Safely remove item from localStorage
 * @param key Storage key
 * @returns true if successful, false otherwise
 */
export function safeLocalStorageRemove(key: string): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`localStorage.removeItem failed for key "${key}":`, error);
    return false;
  }
}

/**
 * Check if localStorage is available
 * @returns true if localStorage can be used
 */
export function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    // Try to actually use it (some browsers lie about availability)
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
