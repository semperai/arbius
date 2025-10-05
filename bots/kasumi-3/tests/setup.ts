// Test setup file
// Configure test environment
import * as dotenv from 'dotenv';
import { vi } from 'vitest';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock uuid module
vi.mock('uuid', () => ({
  v4: () => 'test-uuid-' + Math.random().toString(36).substring(7),
}));

// Mock logger module
vi.mock('../src/log', () => ({
  log: {
    info: () => {},
    debug: () => {},
    warn: () => {},
    error: () => {},
  },
  initializeLogger: () => Promise.resolve(undefined),
}));

// Mock console methods to reduce noise in tests
const noop = () => {};
global.console = {
  ...console,
  log: noop,
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
};
