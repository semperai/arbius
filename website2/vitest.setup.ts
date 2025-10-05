import '@testing-library/jest-dom/vitest';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for jsdom
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as any;
}

// Mock window.crypto for tests
if (typeof window !== 'undefined') {
  if (!window.crypto) {
    Object.defineProperty(window, 'crypto', {
      value: {
        randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(7),
        getRandomValues: (arr: any) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
          }
          return arr;
        },
      },
    });
  }
}
