import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ConfigLoader } from '../../src/config';
import * as fs from 'fs';
import * as path from 'path';

describe('ConfigLoader', () => {
  const testConfigPath = path.join(__dirname, '../fixtures/test-config.json');
  const testCachePath = path.join(__dirname, '../fixtures/test-cache');

  beforeEach(() => {
    // Set up test environment variables
    process.env.TEST_RPC_URL = 'https://test.rpc.url';
    process.env.TEST_API_TOKEN = 'test-token-123';
    process.env.TEST_JWT = 'test-jwt-456';

    // Create test config
    const testConfig = {
      cache_path: testCachePath,
      blockchain: {
        rpc_url: 'ENV:TEST_RPC_URL',
      },
      ml: {
        strategy: 'replicate',
        replicate: {
          api_token: 'ENV:TEST_API_TOKEN',
        },
      },
      ipfs: {
        strategy: 'pinata',
        pinata: {
          jwt: 'ENV:TEST_JWT',
        },
      },
    };

    fs.mkdirSync(path.dirname(testConfigPath), { recursive: true });
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
    if (fs.existsSync(testCachePath)) {
      fs.rmSync(testCachePath, { recursive: true });
    }

    // Clean up env vars
    delete process.env.TEST_RPC_URL;
    delete process.env.TEST_API_TOKEN;
    delete process.env.TEST_JWT;
  });

  describe('constructor', () => {
    it('should load and parse config file', () => {
      const loader = new ConfigLoader(testConfigPath);
      const config = loader.getMiningConfig();

      expect(config).toBeDefined();
      expect(config.cache_path).toBe(testCachePath);
    });

    it('should throw error for non-existent file', () => {
      expect(() => {
        new ConfigLoader('/non/existent/path.json');
      }).toThrow();
    });

    it('should throw error for invalid JSON', () => {
      const invalidPath = path.join(__dirname, '../fixtures/invalid-config.json');
      fs.mkdirSync(path.dirname(invalidPath), { recursive: true });
      fs.writeFileSync(invalidPath, 'not valid json{');

      expect(() => {
        new ConfigLoader(invalidPath);
      }).toThrow();

      fs.unlinkSync(invalidPath);
    });
  });

  describe('resolveEnvVars', () => {
    it('should resolve ENV: prefixed values', () => {
      const loader = new ConfigLoader(testConfigPath);
      const config = loader.getMiningConfig();

      expect(config.blockchain.rpc_url).toBe('https://test.rpc.url');
      expect(config.ml.replicate?.api_token).toBe('test-token-123');
      expect(config.ipfs.pinata?.jwt).toBe('test-jwt-456');
    });

    it('should throw error for missing environment variable', () => {
      const configWithMissingEnv = {
        cache_path: testCachePath,
        blockchain: {
          rpc_url: 'ENV:MISSING_VAR',
        },
        ml: { strategy: 'replicate' },
        ipfs: { strategy: 'pinata' },
      };

      const missingEnvPath = path.join(__dirname, '../fixtures/missing-env-config.json');
      fs.writeFileSync(missingEnvPath, JSON.stringify(configWithMissingEnv));

      expect(() => {
        new ConfigLoader(missingEnvPath);
      }).toThrow('MISSING_VAR');

      fs.unlinkSync(missingEnvPath);
    });
  });

  describe('validateConfig', () => {
    it('should create cache directory if it does not exist', () => {
      const loader = new ConfigLoader(testConfigPath);

      expect(fs.existsSync(testCachePath)).toBe(true);
    });

    it('should throw error for missing required fields', () => {
      const invalidConfig = {
        cache_path: testCachePath,
        // Missing blockchain, ml, ipfs
      };

      const invalidPath = path.join(__dirname, '../fixtures/invalid-fields-config.json');
      fs.writeFileSync(invalidPath, JSON.stringify(invalidConfig));

      expect(() => {
        new ConfigLoader(invalidPath);
      }).toThrow();

      fs.unlinkSync(invalidPath);
    });
  });

  describe('getEnvVar', () => {
    it('should return environment variable value', () => {
      process.env.TEST_VAR = 'test-value';
      const value = ConfigLoader.getEnvVar('TEST_VAR', false);

      expect(value).toBe('test-value');
      delete process.env.TEST_VAR;
    });

    it('should throw error for missing required variable', () => {
      expect(() => {
        ConfigLoader.getEnvVar('MISSING_REQUIRED_VAR', true);
      }).toThrow('MISSING_REQUIRED_VAR');
    });

    it('should return empty string for missing optional variable', () => {
      const value = ConfigLoader.getEnvVar('MISSING_OPTIONAL_VAR', false);
      expect(value).toBe('');
    });
  });
});
