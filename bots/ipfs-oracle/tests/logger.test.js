import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { initializeLogger } from '../src/index.js';
import * as fs from 'fs';
import * as path from 'path';

describe('initializeLogger', () => {
  const testLogPath = './test-log.txt';

  afterEach(() => {
    // Clean up test log file
    if (fs.existsSync(testLogPath)) {
      fs.unlinkSync(testLogPath);
    }
  });

  test('should create logger with default minLevel', () => {
    const logger = initializeLogger(null);
    expect(logger).toBeTruthy();
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.warn).toBeDefined();
  });

  test('should create logger with custom minLevel', () => {
    const logger = initializeLogger(null, 3);
    expect(logger).toBeTruthy();
  });

  test('should create logger with file transport', () => {
    const logger = initializeLogger(testLogPath, 0);
    expect(logger).toBeTruthy();

    // Write a log message
    logger.info('Test message');

    // Check if file was created
    expect(fs.existsSync(testLogPath)).toBe(true);

    // Read and verify log content
    const logContent = fs.readFileSync(testLogPath, 'utf-8');
    expect(logContent).toContain('INFO');
    expect(logContent).toContain('Test message');
  });

  test('should append multiple log messages to file', () => {
    const logger = initializeLogger(testLogPath, 0);

    logger.info('First message');
    logger.warn('Second message');

    const logContent = fs.readFileSync(testLogPath, 'utf-8');
    expect(logContent).toContain('First message');
    expect(logContent).toContain('Second message');
    expect(logContent).toContain('INFO');
    expect(logContent).toContain('WARN');
  });

  test('should handle logger without file path', () => {
    const logger = initializeLogger(null);

    // Should not throw error
    expect(() => {
      logger.info('Test message');
    }).not.toThrow();

    // Should not create any file
    expect(fs.existsSync(testLogPath)).toBe(false);
  });
});
