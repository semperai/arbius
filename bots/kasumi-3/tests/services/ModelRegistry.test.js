"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const ModelRegistry_1 = require("../../src/services/ModelRegistry");
(0, globals_1.describe)('ModelRegistry', () => {
    let registry;
    (0, globals_1.beforeEach)(() => {
        registry = new ModelRegistry_1.ModelRegistry();
    });
    (0, globals_1.describe)('registerModel', () => {
        (0, globals_1.it)('should register a model', () => {
            const model = {
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
            (0, globals_1.expect)(retrieved).toBeDefined();
            (0, globals_1.expect)(retrieved?.name).toBe('test-model');
        });
        (0, globals_1.it)('should overwrite existing model with warning', () => {
            const model1 = {
                id: '0x123',
                name: 'test-model-v1',
                template: {
                    meta: { title: 'Test V1', description: '', git: '', docker: '', version: 1 },
                    input: [],
                    output: [],
                },
            };
            const model2 = {
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
            (0, globals_1.expect)(retrieved?.name).toBe('test-model-v2');
        });
    });
    (0, globals_1.describe)('getModelById', () => {
        (0, globals_1.it)('should retrieve model by ID', () => {
            const model = {
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
            (0, globals_1.expect)(retrieved).toBeDefined();
            (0, globals_1.expect)(retrieved?.id).toBe('0xabc');
        });
        (0, globals_1.it)('should return undefined for non-existent ID', () => {
            const retrieved = registry.getModelById('0xnonexistent');
            (0, globals_1.expect)(retrieved).toBeUndefined();
        });
    });
    (0, globals_1.describe)('getModelByName', () => {
        (0, globals_1.it)('should retrieve model by name (case insensitive)', () => {
            const model = {
                id: '0x123',
                name: 'TestModel',
                template: {
                    meta: { title: 'Test', description: '', git: '', docker: '', version: 1 },
                    input: [],
                    output: [],
                },
            };
            registry.registerModel(model);
            (0, globals_1.expect)(registry.getModelByName('testmodel')).toBeDefined();
            (0, globals_1.expect)(registry.getModelByName('TestModel')).toBeDefined();
            (0, globals_1.expect)(registry.getModelByName('TESTMODEL')).toBeDefined();
        });
        (0, globals_1.it)('should return undefined for non-existent name', () => {
            const retrieved = registry.getModelByName('nonexistent');
            (0, globals_1.expect)(retrieved).toBeUndefined();
        });
    });
    (0, globals_1.describe)('getAllModels', () => {
        (0, globals_1.it)('should return all registered models', () => {
            const model1 = {
                id: '0x111',
                name: 'model1',
                template: {
                    meta: { title: 'Model 1', description: '', git: '', docker: '', version: 1 },
                    input: [],
                    output: [],
                },
            };
            const model2 = {
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
            (0, globals_1.expect)(all).toHaveLength(2);
            (0, globals_1.expect)(all.map(m => m.name)).toContain('model1');
            (0, globals_1.expect)(all.map(m => m.name)).toContain('model2');
        });
        (0, globals_1.it)('should return empty array when no models', () => {
            const all = registry.getAllModels();
            (0, globals_1.expect)(all).toHaveLength(0);
        });
    });
    (0, globals_1.describe)('getModelNames', () => {
        (0, globals_1.it)('should return all model names', () => {
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
            (0, globals_1.expect)(names).toContain('model1');
            (0, globals_1.expect)(names).toContain('model2');
        });
    });
    (0, globals_1.describe)('hasModel', () => {
        (0, globals_1.it)('should return true for existing model ID', () => {
            registry.registerModel({
                id: '0x123',
                name: 'test',
                template: {
                    meta: { title: 'Test', description: '', git: '', docker: '', version: 1 },
                    input: [],
                    output: [],
                },
            });
            (0, globals_1.expect)(registry.hasModel('0x123')).toBe(true);
        });
        (0, globals_1.it)('should return false for non-existent model ID', () => {
            (0, globals_1.expect)(registry.hasModel('0xnonexistent')).toBe(false);
        });
    });
    (0, globals_1.describe)('hasModelByName', () => {
        (0, globals_1.it)('should return true for existing model name', () => {
            registry.registerModel({
                id: '0x123',
                name: 'TestModel',
                template: {
                    meta: { title: 'Test', description: '', git: '', docker: '', version: 1 },
                    input: [],
                    output: [],
                },
            });
            (0, globals_1.expect)(registry.hasModelByName('testmodel')).toBe(true);
            (0, globals_1.expect)(registry.hasModelByName('TestModel')).toBe(true);
        });
        (0, globals_1.it)('should return false for non-existent model name', () => {
            (0, globals_1.expect)(registry.hasModelByName('nonexistent')).toBe(false);
        });
    });
});
