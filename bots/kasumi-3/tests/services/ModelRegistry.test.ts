import { describe, it, expect, beforeEach } from '@jest/globals';
import { ModelRegistry } from '../../src/services/ModelRegistry';
import { ModelConfig } from '../../src/types';

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
});
