import { describe, expect, test } from '@jest/globals';
import { cidify } from '../src/index.js';
import { ethers } from 'ethers';

describe('cidify', () => {
  test('should return empty string for null input', () => {
    expect(cidify(null)).toBe('');
  });

  test('should return empty string for undefined input', () => {
    expect(cidify(undefined)).toBe('');
  });

  test('should return empty string for empty string input', () => {
    expect(cidify('')).toBe('');
  });

  test('should encode valid CID bytes to base58', () => {
    // Example CID bytes (32 bytes)
    const testBytes = '0x' + '12'.repeat(32);
    const result = cidify(testBytes);

    // Result should be a non-empty string
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('should handle different length byte arrays', () => {
    const testBytes1 = '0x1234';
    const result1 = cidify(testBytes1);
    expect(result1).toBeTruthy();

    const testBytes2 = '0x' + 'ab'.repeat(20);
    const result2 = cidify(testBytes2);
    expect(result2).toBeTruthy();

    // Different inputs should produce different outputs
    expect(result1).not.toBe(result2);
  });

  test('should be consistent for same input', () => {
    const testBytes = '0x' + 'ff'.repeat(32);
    const result1 = cidify(testBytes);
    const result2 = cidify(testBytes);

    expect(result1).toBe(result2);
  });
});
