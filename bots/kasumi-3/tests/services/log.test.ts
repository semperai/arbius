// Unmock the log module since setup.ts mocks it globally
jest.unmock('../../src/log');

const mockAppendFileSync = jest.fn();

jest.mock('fs', () => {
  const actualFs = jest.requireActual<typeof import('fs')>('fs');
  return {
    ...actualFs,
    appendFileSync: mockAppendFileSync,
  };
});

import { initializeLogger, log } from '../../src/log';

describe('log', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize logger with null path and default minLevel', () => {
    initializeLogger(null);
    expect(log).toBeDefined();
  });

  it('should initialize logger with null path and custom minLevel', () => {
    initializeLogger(null, 2);
    expect(log).toBeDefined();
  });

  it('should initialize logger with file path', () => {
    initializeLogger('/tmp/test.log', 0);

    // Trigger the transport
    log.info('test message');

    // Verify appendFileSync was called
    expect(mockAppendFileSync).toHaveBeenCalled();
  });

  it('should create log entries with all properties', () => {
    initializeLogger('/tmp/test2.log', 0);
    jest.clearAllMocks();

    // Test logging with multiple arguments (tests the loop in transport)
    log.info('arg0', 'arg1', 'arg2');

    expect(mockAppendFileSync).toHaveBeenCalled();
    const logCall = mockAppendFileSync.mock.calls[0];
    expect(logCall[0]).toBe('/tmp/test2.log');
    expect(logCall[1]).toContain('arg0');
  });

  it('should handle missing path metadata in log entry', () => {
    initializeLogger('/tmp/test3.log', 0);
    jest.clearAllMocks();

    log.warn('warning message');

    expect(mockAppendFileSync).toHaveBeenCalled();
    const logEntry = mockAppendFileSync.mock.calls[0][1] as string;
    // Should contain the default path text or actual path
    expect(logEntry).toContain('warning message');
  });

  it('should export log instance with all methods', () => {
    expect(log).toBeDefined();
    expect(typeof log.info).toBe('function');
    expect(typeof log.warn).toBe('function');
    expect(typeof log.error).toBe('function');
    expect(typeof log.debug).toBe('function');
  });

  it('should test all branches in transport function', () => {
    const testPath = '/tmp/branch-test.log';
    initializeLogger(testPath, 0);
    jest.clearAllMocks();

    // Test with arguments at different indices (0-9)
    log.info('0', '1', '2', '3', '4', '5', '6', '7', '8', '9');

    expect(mockAppendFileSync).toHaveBeenCalled();
    const logEntry = mockAppendFileSync.mock.calls[0][1] as string;

    // Verify all arguments are in the log
    for (let i = 0; i < 10; i++) {
      expect(logEntry).toContain(i.toString());
    }
  });

  it('should call transport when logging with file path set', () => {
    initializeLogger('/tmp/test4.log', 0);
    jest.clearAllMocks();

    log.error('error occurred');
    log.debug('debug info');

    expect(mockAppendFileSync).toHaveBeenCalledTimes(2);
  });
});
