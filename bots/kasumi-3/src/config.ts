import * as fs from 'fs';
import * as path from 'path';
import { MiningConfig } from './types';
import { log } from './log';

/**
 * Load and validate configuration
 */
export class ConfigLoader {
  private miningConfig: MiningConfig;

  constructor(configPath: string) {
    this.miningConfig = this.loadMiningConfig(configPath);
    this.validateConfig();
  }

  private loadMiningConfig(configPath: string): MiningConfig {
    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);
      return this.resolveEnvVars(config);
    } catch (err) {
      throw new Error(`Failed to load mining config from ${configPath}: ${err}`);
    }
  }

  /**
   * Recursively resolve ENV: prefixed values in config
   */
  private resolveEnvVars(obj: any): any {
    if (typeof obj === 'string' && obj.startsWith('ENV:')) {
      const envVar = obj.substring(4);
      const value = process.env[envVar];
      if (!value) {
        throw new Error(`Environment variable ${envVar} not set`);
      }
      return value;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.resolveEnvVars(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      const resolved: any = {};
      for (const key in obj) {
        resolved[key] = this.resolveEnvVars(obj[key]);
      }
      return resolved;
    }

    return obj;
  }

  private validateConfig(): void {
    const required = ['cache_path', 'blockchain', 'ml', 'ipfs'];
    for (const key of required) {
      if (!(key in this.miningConfig)) {
        throw new Error(`Missing required config key: ${key}`);
      }
    }

    // Validate blockchain config
    if (!this.miningConfig.blockchain.rpc_url) {
      throw new Error('Missing blockchain.rpc_url in config');
    }

    // Validate ML config
    if (!this.miningConfig.ml.strategy) {
      throw new Error('Missing ml.strategy in config');
    }

    // Validate IPFS config
    if (!this.miningConfig.ipfs.strategy) {
      throw new Error('Missing ipfs.strategy in config');
    }

    if (this.miningConfig.ipfs.strategy === 'pinata' && !this.miningConfig.ipfs.pinata?.jwt) {
      throw new Error('Pinata strategy selected but jwt not configured');
    }

    // Create cache directory if it doesn't exist
    if (!fs.existsSync(this.miningConfig.cache_path)) {
      fs.mkdirSync(this.miningConfig.cache_path, { recursive: true });
      log.info(`Created cache directory: ${this.miningConfig.cache_path}`);
    }
  }

  getMiningConfig(): MiningConfig {
    return this.miningConfig;
  }

  static getEnvVar(name: string, required: boolean = true): string {
    const value = process.env[name];
    if (required && !value) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return value || '';
  }
}

/**
 * Load models configuration
 */
export interface ModelConfigEntry {
  id: string;
  name: string;
  templatePath: string;
  replicateModel?: string;
  cogUrl?: string;
}

export interface ModelsConfig {
  models: ModelConfigEntry[];
}

export function loadModelsConfig(configPath: string): ModelsConfig {
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    throw new Error(`Failed to load models config from ${configPath}: ${err}`);
  }
}
