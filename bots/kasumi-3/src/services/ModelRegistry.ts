import { ModelConfig, ModelTemplate } from '../types';
import { log } from '../log';
import * as fs from 'fs';
import * as path from 'path';

export class ModelRegistry {
  private models: Map<string, ModelConfig> = new Map();
  private modelsByName: Map<string, ModelConfig> = new Map();

  constructor() {}

  /**
   * Register a model with the registry
   */
  registerModel(config: ModelConfig): void {
    if (this.models.has(config.id)) {
      log.warn(`Model ${config.id} already registered, overwriting`);
    }

    this.models.set(config.id, config);
    this.modelsByName.set(config.name.toLowerCase(), config);
    log.info(`Registered model: ${config.name} (${config.id})`);
  }

  /**
   * Get model by ID (hash)
   */
  getModelById(id: string): ModelConfig | undefined {
    return this.models.get(id);
  }

  /**
   * Get model by name (for command routing)
   */
  getModelByName(name: string): ModelConfig | undefined {
    return this.modelsByName.get(name.toLowerCase());
  }

  /**
   * Get all registered models
   */
  getAllModels(): ModelConfig[] {
    return Array.from(this.models.values());
  }

  /**
   * Get model names for help text
   */
  getModelNames(): string[] {
    return Array.from(this.modelsByName.keys());
  }

  /**
   * Load model from template file
   */
  loadModelFromTemplate(
    modelId: string,
    modelName: string,
    templatePath: string,
    options?: {
      replicateModel?: string;
      cogUrl?: string;
    }
  ): void {
    try {
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const template: ModelTemplate = JSON.parse(templateContent);

      const config: ModelConfig = {
        id: modelId,
        name: modelName,
        template,
        replicateModel: options?.replicateModel,
        cogUrl: options?.cogUrl,
      };

      this.registerModel(config);
    } catch (err) {
      log.error(`Failed to load model template from ${templatePath}: ${err}`);
      throw err;
    }
  }

  /**
   * Load multiple models from configuration
   */
  loadModelsFromConfig(modelsConfig: Array<{
    id: string;
    name: string;
    templatePath: string;
    replicateModel?: string;
    cogUrl?: string;
  }>): void {
    for (const modelConfig of modelsConfig) {
      try {
        this.loadModelFromTemplate(
          modelConfig.id,
          modelConfig.name,
          modelConfig.templatePath,
          {
            replicateModel: modelConfig.replicateModel,
            cogUrl: modelConfig.cogUrl,
          }
        );
      } catch (err) {
        log.error(`Failed to load model ${modelConfig.name}: ${err}`);
      }
    }

    log.info(`Loaded ${this.models.size} models into registry`);
  }

  /**
   * Check if model exists by ID
   */
  hasModel(id: string): boolean {
    return this.models.has(id);
  }

  /**
   * Check if model exists by name
   */
  hasModelByName(name: string): boolean {
    return this.modelsByName.has(name.toLowerCase());
  }
}
