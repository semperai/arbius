"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const utils_1 = require("../src/utils");
(0, globals_1.describe)('Utils', () => {
    (0, globals_1.describe)('taskid2Seed', () => {
        (0, globals_1.it)('should convert taskid to seed within safe range', () => {
            const taskid = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
            const seed = (0, utils_1.taskid2Seed)(taskid);
            (0, globals_1.expect)(seed).toBeGreaterThanOrEqual(0);
            (0, globals_1.expect)(seed).toBeLessThan(0x1FFFFFFFFFFFF0);
        });
        (0, globals_1.it)('should produce consistent results for same taskid', () => {
            const taskid = '0xaabbccdd';
            const seed1 = (0, utils_1.taskid2Seed)(taskid);
            const seed2 = (0, utils_1.taskid2Seed)(taskid);
            (0, globals_1.expect)(seed1).toBe(seed2);
        });
        (0, globals_1.it)('should produce different seeds for different taskids', () => {
            const taskid1 = '0xaabbccdd';
            const taskid2 = '0x11223344';
            (0, globals_1.expect)((0, utils_1.taskid2Seed)(taskid1)).not.toBe((0, utils_1.taskid2Seed)(taskid2));
        });
    });
    (0, globals_1.describe)('generateCommitment', () => {
        (0, globals_1.it)('should generate valid commitment hash', () => {
            const address = '0x1234567890123456789012345678901234567890';
            const taskid = '0xaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd';
            const cid = '0x1122334455667788';
            const commitment = (0, utils_1.generateCommitment)(address, taskid, cid);
            (0, globals_1.expect)(commitment).toMatch(/^0x[0-9a-f]{64}$/i);
        });
        (0, globals_1.it)('should produce consistent commitments', () => {
            const address = '0x1234567890123456789012345678901234567890';
            const taskid = '0xaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd';
            const cid = '0x1122334455667788';
            const commitment1 = (0, utils_1.generateCommitment)(address, taskid, cid);
            const commitment2 = (0, utils_1.generateCommitment)(address, taskid, cid);
            (0, globals_1.expect)(commitment1).toBe(commitment2);
        });
        (0, globals_1.it)('should produce different commitments for different inputs', () => {
            const address = '0x1234567890123456789012345678901234567890';
            const taskid = '0xaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd';
            const cid1 = '0x1122334455667788';
            const cid2 = '0x8877665544332211';
            const commitment1 = (0, utils_1.generateCommitment)(address, taskid, cid1);
            const commitment2 = (0, utils_1.generateCommitment)(address, taskid, cid2);
            (0, globals_1.expect)(commitment1).not.toBe(commitment2);
        });
    });
    (0, globals_1.describe)('hydrateInput', () => {
        const template = {
            input: [
                {
                    variable: 'prompt',
                    type: 'string',
                    required: true,
                    default: '',
                },
                {
                    variable: 'num_steps',
                    type: 'int',
                    required: false,
                    default: 20,
                    min: 1,
                    max: 100,
                },
                {
                    variable: 'model',
                    type: 'string_enum',
                    required: false,
                    default: 'sdxl',
                    choices: ['sd15', 'sdxl', 'sd3'],
                },
            ],
        };
        (0, globals_1.it)('should hydrate valid input', () => {
            const input = {
                prompt: 'a beautiful sunset',
                num_steps: 30,
            };
            const result = (0, utils_1.hydrateInput)(input, template);
            (0, globals_1.expect)(result.err).toBe(false);
            (0, globals_1.expect)(result.input.prompt).toBe('a beautiful sunset');
            (0, globals_1.expect)(result.input.num_steps).toBe(30);
            (0, globals_1.expect)(result.input.model).toBe('sdxl'); // default
        });
        (0, globals_1.it)('should use defaults for missing optional fields', () => {
            const input = {
                prompt: 'test',
            };
            const result = (0, utils_1.hydrateInput)(input, template);
            (0, globals_1.expect)(result.err).toBe(false);
            (0, globals_1.expect)(result.input.num_steps).toBe(20);
            (0, globals_1.expect)(result.input.model).toBe('sdxl');
        });
        (0, globals_1.it)('should error on missing required field', () => {
            const input = {
                num_steps: 30,
            };
            const result = (0, utils_1.hydrateInput)(input, template);
            (0, globals_1.expect)(result.err).toBe(true);
            (0, globals_1.expect)(result.errmsg).toContain('prompt');
        });
        (0, globals_1.it)('should error on wrong type', () => {
            const input = {
                prompt: 'test',
                num_steps: 'not a number',
            };
            const result = (0, utils_1.hydrateInput)(input, template);
            (0, globals_1.expect)(result.err).toBe(true);
            (0, globals_1.expect)(result.errmsg).toContain('num_steps');
        });
        (0, globals_1.it)('should error on invalid enum value', () => {
            const input = {
                prompt: 'test',
                model: 'invalid_model',
            };
            const result = (0, utils_1.hydrateInput)(input, template);
            (0, globals_1.expect)(result.err).toBe(true);
            (0, globals_1.expect)(result.errmsg).toContain('enum');
        });
    });
    (0, globals_1.describe)('cidify', () => {
        (0, globals_1.it)('should convert hex CID to base58', () => {
            const hexCid = '0x' + Buffer.from('test').toString('hex');
            const base58Cid = (0, utils_1.cidify)(hexCid);
            (0, globals_1.expect)(base58Cid).toBeTruthy();
            (0, globals_1.expect)(base58Cid).not.toContain('0x');
        });
        (0, globals_1.it)('should return empty string for empty input', () => {
            (0, globals_1.expect)((0, utils_1.cidify)('')).toBe('');
            (0, globals_1.expect)((0, utils_1.cidify)(null)).toBe('');
            (0, globals_1.expect)((0, utils_1.cidify)(undefined)).toBe('');
        });
    });
    (0, globals_1.describe)('now', () => {
        (0, globals_1.it)('should return current unix timestamp', () => {
            const timestamp = (0, utils_1.now)();
            const currentTime = Math.floor(Date.now() / 1000);
            (0, globals_1.expect)(timestamp).toBeGreaterThan(1700000000); // After 2023
            (0, globals_1.expect)(Math.abs(timestamp - currentTime)).toBeLessThan(2); // Within 2 seconds
        });
    });
    (0, globals_1.describe)('sleep', () => {
        (0, globals_1.it)('should sleep for specified duration', async () => {
            const start = Date.now();
            await (0, utils_1.sleep)(100);
            const elapsed = Date.now() - start;
            (0, globals_1.expect)(elapsed).toBeGreaterThanOrEqual(95);
            (0, globals_1.expect)(elapsed).toBeLessThan(150);
        });
    });
});
