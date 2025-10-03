import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  taskid2Seed,
  generateCommitment,
  hydrateInput,
  cidify,
  now,
  sleep,
} from '../src/utils';
import { ethers } from 'ethers';

describe('Utils', () => {
  describe('taskid2Seed', () => {
    it('should convert taskid to seed within safe range', () => {
      const taskid = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const seed = taskid2Seed(taskid);

      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThan(0x1FFFFFFFFFFFF0);
    });

    it('should produce consistent results for same taskid', () => {
      const taskid = '0xaabbccdd';
      const seed1 = taskid2Seed(taskid);
      const seed2 = taskid2Seed(taskid);

      expect(seed1).toBe(seed2);
    });

    it('should produce different seeds for different taskids', () => {
      const taskid1 = '0xaabbccdd';
      const taskid2 = '0x11223344';

      expect(taskid2Seed(taskid1)).not.toBe(taskid2Seed(taskid2));
    });
  });

  describe('generateCommitment', () => {
    it('should generate valid commitment hash', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const taskid = '0xaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd';
      const cid = '0x1122334455667788';

      const commitment = generateCommitment(address, taskid, cid);

      expect(commitment).toMatch(/^0x[0-9a-f]{64}$/i);
    });

    it('should produce consistent commitments', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const taskid = '0xaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd';
      const cid = '0x1122334455667788';

      const commitment1 = generateCommitment(address, taskid, cid);
      const commitment2 = generateCommitment(address, taskid, cid);

      expect(commitment1).toBe(commitment2);
    });

    it('should produce different commitments for different inputs', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const taskid = '0xaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd';
      const cid1 = '0x1122334455667788';
      const cid2 = '0x8877665544332211';

      const commitment1 = generateCommitment(address, taskid, cid1);
      const commitment2 = generateCommitment(address, taskid, cid2);

      expect(commitment1).not.toBe(commitment2);
    });
  });

  describe('hydrateInput', () => {
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

    it('should hydrate valid input', () => {
      const input = {
        prompt: 'a beautiful sunset',
        num_steps: 30,
      };

      const result = hydrateInput(input, template);

      expect(result.err).toBe(false);
      expect(result.input.prompt).toBe('a beautiful sunset');
      expect(result.input.num_steps).toBe(30);
      expect(result.input.model).toBe('sdxl'); // default
    });

    it('should use defaults for missing optional fields', () => {
      const input = {
        prompt: 'test',
      };

      const result = hydrateInput(input, template);

      expect(result.err).toBe(false);
      expect(result.input.num_steps).toBe(20);
      expect(result.input.model).toBe('sdxl');
    });

    it('should error on missing required field', () => {
      const input = {
        num_steps: 30,
      };

      const result = hydrateInput(input, template);

      expect(result.err).toBe(true);
      expect(result.errmsg).toContain('prompt');
    });

    it('should error on wrong type', () => {
      const input = {
        prompt: 'test',
        num_steps: 'not a number',
      };

      const result = hydrateInput(input, template);

      expect(result.err).toBe(true);
      expect(result.errmsg).toContain('num_steps');
    });

    it('should error on invalid enum value', () => {
      const input = {
        prompt: 'test',
        model: 'invalid_model',
      };

      const result = hydrateInput(input, template);

      expect(result.err).toBe(true);
      expect(result.errmsg).toContain('enum');
    });
  });

  describe('cidify', () => {
    it('should convert hex CID to base58', () => {
      const hexCid = '0x' + Buffer.from('test').toString('hex');
      const base58Cid = cidify(hexCid);

      expect(base58Cid).toBeTruthy();
      expect(base58Cid).not.toContain('0x');
    });

    it('should return empty string for empty input', () => {
      expect(cidify('')).toBe('');
      expect(cidify(null as any)).toBe('');
      expect(cidify(undefined as any)).toBe('');
    });
  });

  describe('now', () => {
    it('should return current unix timestamp', () => {
      const timestamp = now();
      const currentTime = Math.floor(Date.now() / 1000);

      expect(timestamp).toBeGreaterThan(1700000000); // After 2023
      expect(Math.abs(timestamp - currentTime)).toBeLessThan(2); // Within 2 seconds
    });
  });

  describe('sleep', () => {
    it('should sleep for specified duration', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(95);
      expect(elapsed).toBeLessThan(150);
    });
  });
});
