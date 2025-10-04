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
    // Clear the module cache to get a fresh instance
    jest.resetModules();
  });

  it('should initialize logger with default minLevel', () => {
    const { initializeLogger } = require('../../src/log');

    expect(() => initializeLogger(null)).not.toThrow();
  });

  it('should initialize logger with custom minLevel', () => {
    const { initializeLogger } = require('../../src/log');

    expect(() => initializeLogger(null, 2)).not.toThrow();
  });

  it('should initialize logger without file path', () => {
    const { initializeLogger, log } = require('../../src/log');

    initializeLogger(null, 0);

    // Should be able to log without throwing
    expect(() => log.info('test message')).not.toThrow();

    // File should not be written to when path is null
    expect(mockFs.appendFileSync).not.toHaveBeenCalled();
  });

  it('should write logs to file when path is provided', () => {
    const { initializeLogger, log } = require('../../src/log');
    const logPath = '/tmp/test.log';

    initializeLogger(logPath, 0);

    log.info('test message');

    expect(mockFs.appendFileSync).toHaveBeenCalled();
    expect(mockFs.appendFileSync).toHaveBeenCalledWith(
      logPath,
      expect.stringContaining('test message')
    );
  });

  it('should format log entries correctly with metadata', () => {
    const { initializeLogger, log } = require('../../src/log');
    const logPath = '/tmp/test.log';

    initializeLogger(logPath, 0);

    log.info('test', 'message', 'with', 'multiple', 'args');

    expect(mockFs.appendFileSync).toHaveBeenCalled();
    const logEntry = mockFs.appendFileSync.mock.calls[0][1] as string;

    // Check format: timestamp logLevel [path] message
    expect(logEntry).toMatch(/^\d+\s+INFO\s+\[.*\]\s+test\s+message\s+with\s+multiple\s+args\n$/);
  });

  it('should handle missing fileNameWithLine in metadata', () => {
    const { initializeLogger, log } = require('../../src/log');
    const logPath = '/tmp/test.log';

    initializeLogger(logPath, 0);

    // Mock the transport to remove path metadata
    log.info('test without path');

    expect(mockFs.appendFileSync).toHaveBeenCalled();
    const logEntry = mockFs.appendFileSync.mock.calls[0][1] as string;

    // Should use default path when fileNameWithLine is missing
    expect(logEntry).toContain('[fileNameWithLine undefined]');
  });

  it('should support different log levels', () => {
    const { initializeLogger, log } = require('../../src/log');
    const logPath = '/tmp/test.log';

    initializeLogger(logPath, 0);

    mockFs.appendFileSync.mockClear();

    log.info('info message');
    log.warn('warn message');
    log.error('error message');
    log.debug('debug message');

    expect(mockFs.appendFileSync).toHaveBeenCalledTimes(4);

    const calls = mockFs.appendFileSync.mock.calls;
    expect(calls[0][1]).toContain('INFO');
    expect(calls[1][1]).toContain('WARN');
    expect(calls[2][1]).toContain('ERROR');
    expect(calls[3][1]).toContain('DEBUG');
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
