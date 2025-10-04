import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ConfigLoader, loadModelsConfig } from '../../src/config';
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

    it('should resolve ENV vars in arrays', () => {
      process.env.TEST_GATEWAY = 'https://gateway.test.com';
      const configWithArray = {
        cache_path: testCachePath,
        blockchain: {
          rpc_url: 'https://test.rpc.url',
        },
        ml: { strategy: 'replicate' },
        ipfs: {
          strategy: 'pinata',
          pinata: { jwt: 'test-jwt' },
          gateways: ['ENV:TEST_GATEWAY', 'https://ipfs.io'],
        },
      };

      const arrayPath = path.join(__dirname, '../fixtures/array-config.json');
      fs.writeFileSync(arrayPath, JSON.stringify(configWithArray));

      const loader = new ConfigLoader(arrayPath);
      const config: any = loader.getMiningConfig();

      expect(config.ipfs.gateways).toEqual(['https://gateway.test.com', 'https://ipfs.io']);

      fs.unlinkSync(arrayPath);
      delete process.env.TEST_GATEWAY;
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

    it('should throw error for missing blockchain.rpc_url', () => {
      const invalidConfig = {
        cache_path: testCachePath,
        blockchain: {},
        ml: { strategy: 'replicate' },
        ipfs: { strategy: 'pinata' },
      };

      const invalidPath = path.join(__dirname, '../fixtures/no-rpc-config.json');
      fs.writeFileSync(invalidPath, JSON.stringify(invalidConfig));

      expect(() => {
        new ConfigLoader(invalidPath);
      }).toThrow('Missing blockchain.rpc_url in config');

      fs.unlinkSync(invalidPath);
    });

    it('should throw error for missing ml.strategy', () => {
      const invalidConfig = {
        cache_path: testCachePath,
        blockchain: { rpc_url: 'https://test.rpc' },
        ml: {},
        ipfs: { strategy: 'pinata' },
      };

      const invalidPath = path.join(__dirname, '../fixtures/no-ml-strategy-config.json');
      fs.writeFileSync(invalidPath, JSON.stringify(invalidConfig));

      expect(() => {
        new ConfigLoader(invalidPath);
      }).toThrow('Missing ml.strategy in config');

      fs.unlinkSync(invalidPath);
    });

    it('should throw error for missing ipfs.strategy', () => {
      const invalidConfig = {
        cache_path: testCachePath,
        blockchain: { rpc_url: 'https://test.rpc' },
        ml: { strategy: 'replicate' },
        ipfs: {},
      };

      const invalidPath = path.join(__dirname, '../fixtures/no-ipfs-strategy-config.json');
      fs.writeFileSync(invalidPath, JSON.stringify(invalidConfig));

      expect(() => {
        new ConfigLoader(invalidPath);
      }).toThrow('Missing ipfs.strategy in config');

      fs.unlinkSync(invalidPath);
    });

    it('should throw error for pinata strategy without jwt', () => {
      const invalidConfig = {
        cache_path: testCachePath,
        blockchain: { rpc_url: 'https://test.rpc' },
        ml: { strategy: 'replicate' },
        ipfs: {
          strategy: 'pinata',
          pinata: {},
        },
      };

      const invalidPath = path.join(__dirname, '../fixtures/no-pinata-jwt-config.json');
      fs.writeFileSync(invalidPath, JSON.stringify(invalidConfig));

      expect(() => {
        new ConfigLoader(invalidPath);
      }).toThrow('Pinata strategy selected but jwt not configured');

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

describe('loadModelsConfig', () => {
  const testModelsPath = path.join(__dirname, '../fixtures/test-models.json');

  afterEach(() => {
    if (fs.existsSync(testModelsPath)) {
      fs.unlinkSync(testModelsPath);
    }
  });

  it('should load models config successfully', () => {
    const modelsConfig = {
      models: [
        {
          id: '0xmodel1',
          name: 'test-model',
          templatePath: '/path/to/template.json',
          replicateModel: 'owner/model',
        },
      ],
    };

    fs.mkdirSync(path.dirname(testModelsPath), { recursive: true });
    fs.writeFileSync(testModelsPath, JSON.stringify(modelsConfig));

    const config = loadModelsConfig(testModelsPath);

    expect(config.models).toHaveLength(1);
    expect(config.models[0].id).toBe('0xmodel1');
    expect(config.models[0].name).toBe('test-model');
  });

  it('should throw error for non-existent file', () => {
    expect(() => {
      loadModelsConfig('/non/existent/models.json');
    }).toThrow('Failed to load models config');
  });

  it('should throw error for invalid JSON', () => {
    fs.mkdirSync(path.dirname(testModelsPath), { recursive: true });
    fs.writeFileSync(testModelsPath, 'invalid json{');

    expect(() => {
      loadModelsConfig(testModelsPath);
    }).toThrow('Failed to load models config');
  });
});
