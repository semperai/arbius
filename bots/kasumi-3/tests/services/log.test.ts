import * as fs from 'fs';

// Mock fs module
jest.mock('fs', () => ({
  appendFileSync: jest.fn(),
}));

const mockFs = fs as jest.Mocked<typeof fs>;

// We need to test the actual log module
describe('log', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize logger with default minLevel', () => {
    const { initializeLogger } = require('../../src/log');

    expect(() => initializeLogger(null)).not.toThrow();
  });

  it('should initialize logger with custom minLevel', () => {
    const { initializeLogger } = require('../../src/log');

    expect(() => initializeLogger(null, 2)).not.toThrow();
  });

  it('should initialize logger with log file path', () => {
    const { initializeLogger } = require('../../src/log');
    const logPath = '/tmp/test.log';

    expect(() => initializeLogger(logPath, 0)).not.toThrow();
  });

  it('should export log instance', () => {
    const { log } = require('../../src/log');

    expect(log).toBeDefined();
    expect(typeof log.info).toBe('function');
    expect(typeof log.warn).toBe('function');
    expect(typeof log.error).toBe('function');
    expect(typeof log.debug).toBe('function');
  });
});
