"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const config_1 = require("../../src/config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
(0, globals_1.describe)('ConfigLoader', () => {
    const testConfigPath = path.join(__dirname, '../fixtures/test-config.json');
    const testCachePath = path.join(__dirname, '../fixtures/test-cache');
    (0, globals_1.beforeEach)(() => {
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
    (0, globals_1.afterEach)(() => {
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
    (0, globals_1.describe)('constructor', () => {
        (0, globals_1.it)('should load and parse config file', () => {
            const loader = new config_1.ConfigLoader(testConfigPath);
            const config = loader.getMiningConfig();
            (0, globals_1.expect)(config).toBeDefined();
            (0, globals_1.expect)(config.cache_path).toBe(testCachePath);
        });
        (0, globals_1.it)('should throw error for non-existent file', () => {
            (0, globals_1.expect)(() => {
                new config_1.ConfigLoader('/non/existent/path.json');
            }).toThrow();
        });
        (0, globals_1.it)('should throw error for invalid JSON', () => {
            const invalidPath = path.join(__dirname, '../fixtures/invalid-config.json');
            fs.mkdirSync(path.dirname(invalidPath), { recursive: true });
            fs.writeFileSync(invalidPath, 'not valid json{');
            (0, globals_1.expect)(() => {
                new config_1.ConfigLoader(invalidPath);
            }).toThrow();
            fs.unlinkSync(invalidPath);
        });
    });
    (0, globals_1.describe)('resolveEnvVars', () => {
        (0, globals_1.it)('should resolve ENV: prefixed values', () => {
            const loader = new config_1.ConfigLoader(testConfigPath);
            const config = loader.getMiningConfig();
            (0, globals_1.expect)(config.blockchain.rpc_url).toBe('https://test.rpc.url');
            (0, globals_1.expect)(config.ml.replicate?.api_token).toBe('test-token-123');
            (0, globals_1.expect)(config.ipfs.pinata?.jwt).toBe('test-jwt-456');
        });
        (0, globals_1.it)('should throw error for missing environment variable', () => {
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
            (0, globals_1.expect)(() => {
                new config_1.ConfigLoader(missingEnvPath);
            }).toThrow('MISSING_VAR');
            fs.unlinkSync(missingEnvPath);
        });
    });
    (0, globals_1.describe)('validateConfig', () => {
        (0, globals_1.it)('should create cache directory if it does not exist', () => {
            const loader = new config_1.ConfigLoader(testConfigPath);
            (0, globals_1.expect)(fs.existsSync(testCachePath)).toBe(true);
        });
        (0, globals_1.it)('should throw error for missing required fields', () => {
            const invalidConfig = {
                cache_path: testCachePath,
                // Missing blockchain, ml, ipfs
            };
            const invalidPath = path.join(__dirname, '../fixtures/invalid-fields-config.json');
            fs.writeFileSync(invalidPath, JSON.stringify(invalidConfig));
            (0, globals_1.expect)(() => {
                new config_1.ConfigLoader(invalidPath);
            }).toThrow();
            fs.unlinkSync(invalidPath);
        });
    });
    (0, globals_1.describe)('getEnvVar', () => {
        (0, globals_1.it)('should return environment variable value', () => {
            process.env.TEST_VAR = 'test-value';
            const value = config_1.ConfigLoader.getEnvVar('TEST_VAR', false);
            (0, globals_1.expect)(value).toBe('test-value');
            delete process.env.TEST_VAR;
        });
        (0, globals_1.it)('should throw error for missing required variable', () => {
            (0, globals_1.expect)(() => {
                config_1.ConfigLoader.getEnvVar('MISSING_REQUIRED_VAR', true);
            }).toThrow('MISSING_REQUIRED_VAR');
        });
        (0, globals_1.it)('should return empty string for missing optional variable', () => {
            const value = config_1.ConfigLoader.getEnvVar('MISSING_OPTIONAL_VAR', false);
            (0, globals_1.expect)(value).toBe('');
        });
    });
});
