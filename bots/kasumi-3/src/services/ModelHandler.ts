import { IModelHandler, ModelConfig, MiningConfig } from '../types';
import { TIMEOUTS } from '../constants';
import { log } from '../log';
import { hydrateInput, taskid2Seed, expretry } from '../utils';
import { pinFilesToIPFS } from '../ipfs';
import { base58 } from '@scure/base';
import { ethers } from 'ethers';
import axios from 'axios';
import * as fs from 'fs';

/**
 * Base class for model handlers
 */
export abstract class BaseModelHandler implements IModelHandler {
  protected modelConfig: ModelConfig;
  protected miningConfig: MiningConfig;

  constructor(modelConfig: ModelConfig, miningConfig: MiningConfig) {
    this.modelConfig = modelConfig;
    this.miningConfig = miningConfig;
  }

  abstract getFiles(taskid: string, input: Record<string, any>): Promise<string[]>;

  async getCid(taskid: string, input: Record<string, any>): Promise<string> {
    const paths = await expretry('getFiles', async () => await this.getFiles(taskid, input));
    if (!paths) {
      throw new Error('Failed to get files from model');
    }

    const cid58 = await expretry('pinFiles', async () =>
      await pinFilesToIPFS(this.miningConfig, taskid, paths)
    );

    if (!cid58) {
      throw new Error('Failed to pin files to IPFS');
    }

    log.debug(`Pinned files to IPFS: ${cid58}`);
    const cid = '0x' + Buffer.from(base58.decode(cid58)).toString('hex');
    return cid;
  }

  /**
   * Hydrate and validate input based on model template
   */
  protected hydrateAndValidate(input: Record<string, any>, taskid: string): Record<string, any> {
    const hydrated = hydrateInput(input, this.modelConfig.template);
    if (hydrated.err) {
      throw new Error(`Input validation failed: ${hydrated.errmsg}`);
    }

    // Add seed for deterministic generation
    hydrated.input.seed = taskid2Seed(taskid);
    return hydrated.input;
  }

  /**
   * Save file to cache directory
   */
  protected saveToCache(filename: string, buffer: Buffer): string {
    const cachePath = this.miningConfig.cache_path;
    const fullPath = `${cachePath}/${filename}`;
    fs.writeFileSync(fullPath, buffer);
    return filename;
  }
}

/**
 * Handler for Replicate-based models
 */
export class ReplicateModelHandler extends BaseModelHandler {
  private apiToken: string;

  constructor(modelConfig: ModelConfig, miningConfig: MiningConfig, apiToken: string) {
    super(modelConfig, miningConfig);
    this.apiToken = apiToken;

    if (!modelConfig.replicateModel) {
      throw new Error(`Model ${modelConfig.name} does not have a Replicate model configured`);
    }
  }

  async getFiles(taskid: string, input: Record<string, any>): Promise<string[]> {
    const validatedInput = this.hydrateAndValidate(input, taskid);

    const url = `https://api.replicate.com/v1/models/${this.modelConfig.replicateModel}/predictions`;

    log.debug(`Calling Replicate API for model ${this.modelConfig.replicateModel}`);

    let res;
    try {
      res = await axios.post(
        url,
        { input: validatedInput },
        {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
            Prefer: 'wait',
          },
          timeout: TIMEOUTS.REPLICATE_API,
        }
      );
    } catch (e: any) {
      log.error(`Replicate API error: ${e.message}`);
      throw new Error(`Replicate API failed: ${e.message}`);
    }

    if (!res.data.output) {
      throw new Error('Replicate response missing output');
    }

    // Handle different output types
    const output = res.data.output;
    const files: string[] = [];

    // Get expected output from template
    const expectedOutputs = this.modelConfig.template.output;

    if (Array.isArray(output)) {
      // Multiple outputs or array of URLs
      for (let i = 0; i < output.length; i++) {
        const item = output[i];
        const expectedOutput = expectedOutputs[i] || expectedOutputs[0];
        const filename = await this.downloadAndSave(item, expectedOutput.filename, taskid);
        files.push(filename);
      }
    } else if (typeof output === 'string') {
      // Single output (URL or text)
      const expectedOutput = expectedOutputs[0];
      if (expectedOutput.type === 'text') {
        // Save as text file
        const buffer = Buffer.from(output, 'utf-8');
        const filename = this.saveToCache(expectedOutput.filename, buffer);
        files.push(filename);
      } else {
        // Download as file
        const filename = await this.downloadAndSave(output, expectedOutput.filename, taskid);
        files.push(filename);
      }
    }

    return files;
  }

  private async downloadAndSave(url: string, filename: string, taskid: string): Promise<string> {
    log.debug(`Downloading file from ${url}`);

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: TIMEOUTS.REPLICATE_API,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to download file: status ${response.status}`);
    }

    const buffer = Buffer.from(response.data);
    return this.saveToCache(filename, buffer);
  }
}

/**
 * Handler for Cog-based models (self-hosted)
 */
export class CogModelHandler extends BaseModelHandler {
  private cogUrl: string;

  constructor(modelConfig: ModelConfig, miningConfig: MiningConfig, cogUrl: string) {
    super(modelConfig, miningConfig);
    this.cogUrl = cogUrl;
  }

  async getFiles(taskid: string, input: Record<string, any>): Promise<string[]> {
    const validatedInput = this.hydrateAndValidate(input, taskid);

    log.debug(`Calling Cog API at ${this.cogUrl}`);

    let res;
    try {
      res = await axios.post(this.cogUrl, { input: validatedInput });
    } catch (e: any) {
      log.error(`Cog API error: ${e.message}`);
      throw new Error(`Cog API failed: ${e.message}`);
    }

    if (!res.data.output) {
      throw new Error('Cog response missing output');
    }

    const output = res.data.output;
    const expectedOutputs = this.modelConfig.template.output;
    const files: string[] = [];

    if (Array.isArray(output)) {
      for (let i = 0; i < output.length; i++) {
        const data = output[i];
        const expectedOutput = expectedOutputs[i] || expectedOutputs[0];
        const buffer = Buffer.from(data, 'utf-8');
        const filename = this.saveToCache(expectedOutput.filename, buffer);
        files.push(filename);
      }
    } else {
      const expectedOutput = expectedOutputs[0];
      const buffer = Buffer.from(output, 'utf-8');
      const filename = this.saveToCache(expectedOutput.filename, buffer);
      files.push(filename);
    }

    return files;
  }
}

/**
 * Factory for creating model handlers
 */
export class ModelHandlerFactory {
  static createHandler(
    modelConfig: ModelConfig,
    miningConfig: MiningConfig
  ): IModelHandler {
    // Determine which handler to use based on configuration
    if (modelConfig.replicateModel && miningConfig.ml.strategy === 'replicate') {
      const apiToken = miningConfig.ml.replicate?.api_token;
      if (!apiToken) {
        throw new Error('Replicate API token not configured');
      }
      return new ReplicateModelHandler(modelConfig, miningConfig, apiToken);
    }

    if (modelConfig.cogUrl && miningConfig.ml.strategy === 'cog') {
      return new CogModelHandler(modelConfig, miningConfig, modelConfig.cogUrl);
    }

    // Fallback: try cog with model ID lookup
    if (miningConfig.ml.strategy === 'cog' && miningConfig.ml.cog) {
      const cogConfig = miningConfig.ml.cog[modelConfig.id];
      if (cogConfig) {
        return new CogModelHandler(modelConfig, miningConfig, cogConfig.url);
      }
    }

    throw new Error(`No handler available for model ${modelConfig.name}`);
  }
}
