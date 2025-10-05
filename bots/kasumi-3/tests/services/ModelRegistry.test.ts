import { vi } from 'vitest';
import { describe, it, expect, beforeEach } from 'vitest';
import { ModelRegistry } from '../../src/services/ModelRegistry';
import { ModelConfig } from '../../src/types';
import * as fs from 'fs';

vi.mock('fs');

describe('ModelRegistry', () => {
  let registry: ModelRegistry;

  beforeEach(() => {
    registry = new ModelRegistry();
  });

  describe('registerModel', () => {
    it('should register a model', () => {
      const model: ModelConfig = {
        id: '0x123',
        name: 'test-model',
        template: {
          meta: { title: 'Test', description: '', git: '', docker: '', version: 1 },
          input: [],
          output: [],
        },
      };

      registry.registerModel(model);

      const retrieved = registry.getModelById('0x123');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('test-model');
    });

    it('should overwrite existing model with warning', () => {
      const model1: ModelConfig = {
        id: '0x123',
        name: 'test-model-v1',
        template: {
          meta: { title: 'Test V1', description: '', git: '', docker: '', version: 1 },
          input: [],
          output: [],
        },
      };

      const model2: ModelConfig = {
        id: '0x123',
        name: 'test-model-v2',
        template: {
          meta: { title: 'Test V2', description: '', git: '', docker: '', version: 2 },
          input: [],
          output: [],
        },
      };

      registry.registerModel(model1);
      registry.registerModel(model2);

      const retrieved = registry.getModelById('0x123');
      expect(retrieved?.name).toBe('test-model-v2');
    });
  });

  describe('getModelById', () => {
    it('should retrieve model by ID', () => {
      const model: ModelConfig = {
        id: '0xabc',
        name: 'test',
        template: {
          meta: { title: 'Test', description: '', git: '', docker: '', version: 1 },
          input: [],
          output: [],
        },
      };

      registry.registerModel(model);
      const retrieved = registry.getModelById('0xabc');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('0xabc');
    });

    it('should return undefined for non-existent ID', () => {
      const retrieved = registry.getModelById('0xnonexistent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getModelByName', () => {
    it('should retrieve model by name (case insensitive)', () => {
      const model: ModelConfig = {
        id: '0x123',
        name: 'TestModel',
        template: {
          meta: { title: 'Test', description: '', git: '', docker: '', version: 1 },
          input: [],
          output: [],
        },
      };

      registry.registerModel(model);

      expect(registry.getModelByName('testmodel')).toBeDefined();
      expect(registry.getModelByName('TestModel')).toBeDefined();
      expect(registry.getModelByName('TESTMODEL')).toBeDefined();
    });

    it('should return undefined for non-existent name', () => {
      const retrieved = registry.getModelByName('nonexistent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getAllModels', () => {
    it('should return all registered models', () => {
      const model1: ModelConfig = {
        id: '0x111',
        name: 'model1',
        template: {
          meta: { title: 'Model 1', description: '', git: '', docker: '', version: 1 },
          input: [],
          output: [],
        },
      };

      const model2: ModelConfig = {
        id: '0x222',
        name: 'model2',
        template: {
          meta: { title: 'Model 2', description: '', git: '', docker: '', version: 1 },
          input: [],
          output: [],
        },
      };

      registry.registerModel(model1);
      registry.registerModel(model2);

      const all = registry.getAllModels();
      expect(all).toHaveLength(2);
      expect(all.map(m => m.name)).toContain('model1');
      expect(all.map(m => m.name)).toContain('model2');
    });

    it('should return empty array when no models', () => {
      const all = registry.getAllModels();
      expect(all).toHaveLength(0);
    });
  });

  describe('getModelNames', () => {
    it('should return all model names', () => {
      registry.registerModel({
        id: '0x111',
        name: 'model1',
        template: {
          meta: { title: 'Model 1', description: '', git: '', docker: '', version: 1 },
          input: [],
          output: [],
        },
      });

      registry.registerModel({
        id: '0x222',
        name: 'model2',
        template: {
          meta: { title: 'Model 2', description: '', git: '', docker: '', version: 1 },
          input: [],
          output: [],
        },
      });

      const names = registry.getModelNames();
      expect(names).toContain('model1');
      expect(names).toContain('model2');
    });
  });

  describe('hasModel', () => {
    it('should return true for existing model ID', () => {
      registry.registerModel({
        id: '0x123',
        name: 'test',
        template: {
          meta: { title: 'Test', description: '', git: '', docker: '', version: 1 },
          input: [],
          output: [],
        },
      });

      expect(registry.hasModel('0x123')).toBe(true);
    });

    it('should return false for non-existent model ID', () => {
      expect(registry.hasModel('0xnonexistent')).toBe(false);
    });
  });

  describe('hasModelByName', () => {
    it('should return true for existing model name', () => {
      registry.registerModel({
        id: '0x123',
        name: 'TestModel',
        template: {
          meta: { title: 'Test', description: '', git: '', docker: '', version: 1 },
          input: [],
          output: [],
        },
      });

      expect(registry.hasModelByName('testmodel')).toBe(true);
      expect(registry.hasModelByName('TestModel')).toBe(true);
    });

    it('should return false for non-existent model name', () => {
      expect(registry.hasModelByName('nonexistent')).toBe(false);
    });
  });

  describe('loadModelFromTemplate', () => {
    beforeEach(() => {
      vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({
        meta: { title: 'Loaded Model', description: 'Test', git: '', docker: '', version: 1 },
        input: [{ variable: 'prompt', type: 'string', required: true }],
        output: [],
      }));
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should load model from template file', () => {
      registry.loadModelFromTemplate('0x456', 'loaded-model', '/path/to/template.json');

      const model = registry.getModelById('0x456');
      expect(model).toBeDefined();
      expect(model?.name).toBe('loaded-model');
      expect(model?.template.meta.title).toBe('Loaded Model');
    });

    it('should load model with replicate option', () => {
      registry.loadModelFromTemplate('0x789', 'replicate-model', '/path/to/template.json', {
        replicateModel: 'some/model',
      });

      const model = registry.getModelById('0x789');
      expect(model?.replicateModel).toBe('some/model');
    });

    it('should load model with cog URL option', () => {
      registry.loadModelFromTemplate('0xabc', 'cog-model', '/path/to/template.json', {
        cogUrl: 'http://localhost:5000',
      });

      const model = registry.getModelById('0xabc');
      expect(model?.cogUrl).toBe('http://localhost:5000');
    });

    it('should throw error if template file is invalid JSON', () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValue('invalid json');

      expect(() => {
        registry.loadModelFromTemplate('0xbad', 'bad-model', '/path/to/bad.json');
      }).toThrow();
    });

    it('should throw error if template file cannot be read', () => {
      vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('ENOENT: no such file');
      });

      expect(() => {
        registry.loadModelFromTemplate('0xmissing', 'missing-model', '/path/to/missing.json');
      }).toThrow();
    });
  });

  describe('loadModelsFromConfig', () => {
    beforeEach(() => {
      vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({
        meta: { title: 'Test Model', description: '', git: '', docker: '', version: 1 },
        input: [],
        output: [],
      }));
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should load multiple models from config', () => {
      const config = [
        { id: '0x111', name: 'model1', templatePath: '/path/to/template1.json' },
        { id: '0x222', name: 'model2', templatePath: '/path/to/template2.json' },
      ];

      registry.loadModelsFromConfig(config);

      expect(registry.hasModel('0x111')).toBe(true);
      expect(registry.hasModel('0x222')).toBe(true);
      expect(registry.getAllModels()).toHaveLength(2);
    });

    it('should continue loading even if one model fails', () => {
      let callCount = 0;
      vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          throw new Error('File not found');
        }
        return JSON.stringify({
          meta: { title: 'Test', description: '', git: '', docker: '', version: 1 },
          input: [],
          output: [],
        });
      });

      const config = [
        { id: '0x111', name: 'model1', templatePath: '/path/to/template1.json' },
        { id: '0x222', name: 'model2', templatePath: '/path/to/bad.json' },
        { id: '0x333', name: 'model3', templatePath: '/path/to/template3.json' },
      ];

      registry.loadModelsFromConfig(config);

      // Should have loaded model1 and model3, but not model2
      expect(registry.hasModel('0x111')).toBe(true);
      expect(registry.hasModel('0x222')).toBe(false);
      expect(registry.hasModel('0x333')).toBe(true);
      expect(registry.getAllModels()).toHaveLength(2);
    });

    it('should load models with options', () => {
      const config = [
        {
          id: '0x111',
          name: 'model1',
          templatePath: '/path/to/template.json',
          replicateModel: 'some/model',
          cogUrl: 'http://localhost:5000',
        },
      ];

      registry.loadModelsFromConfig(config);

      const model = registry.getModelById('0x111');
      expect(model?.replicateModel).toBe('some/model');
      expect(model?.cogUrl).toBe('http://localhost:5000');
    });
  });
});
