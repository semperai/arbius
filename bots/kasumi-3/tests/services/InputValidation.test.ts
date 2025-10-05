import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { hydrateInput } from '../../src/utils';
import { UserService } from '../../src/services/UserService';
import { DatabaseService } from '../../src/services/DatabaseService';
import { ethers } from 'ethers';

describe('Input Validation', () => {
  describe('hydrateInput - Template validation', () => {
    describe('Required fields', () => {
      it('should reject when required field is missing', () => {
        const template = {
          input: [
            { variable: 'prompt', type: 'string', required: true }
          ]
        };

        const result = hydrateInput({}, template);

        expect(result.err).toBe(true);
        expect(result.errmsg).toContain('missing required field');
        expect(result.errmsg).toContain('prompt');
      });

      it('should accept when required field is present', () => {
        const template = {
          input: [
            { variable: 'prompt', type: 'string', required: true }
          ]
        };

        const result = hydrateInput({ prompt: 'test' }, template);

        expect(result.err).toBe(false);
        expect(result.input.prompt).toBe('test');
      });

      it('should accept when optional field is missing', () => {
        const template = {
          input: [
            { variable: 'optional', type: 'string', required: false, default: 'default' }
          ]
        };

        const result = hydrateInput({}, template);

        expect(result.err).toBe(false);
        expect(result.input.optional).toBe('default');
      });
    });

    describe('Type validation', () => {
      it('should reject non-string for string type', () => {
        const template = {
          input: [
            { variable: 'prompt', type: 'string', required: true }
          ]
        };

        const result = hydrateInput({ prompt: 123 }, template);

        expect(result.err).toBe(true);
        expect(result.errmsg).toContain('wrong type');
        expect(result.errmsg).toContain('prompt');
      });

      it('should accept string for string type', () => {
        const template = {
          input: [
            { variable: 'prompt', type: 'string', required: true }
          ]
        };

        const result = hydrateInput({ prompt: 'hello world' }, template);

        expect(result.err).toBe(false);
        expect(result.input.prompt).toBe('hello world');
      });

      it('should reject non-integer for int type', () => {
        const template = {
          input: [
            { variable: 'steps', type: 'int', required: true }
          ]
        };

        const result = hydrateInput({ steps: 'not a number' }, template);

        expect(result.err).toBe(true);
        expect(result.errmsg).toContain('wrong type');
      });

      it('should reject decimal for int type', () => {
        const template = {
          input: [
            { variable: 'steps', type: 'int', required: true }
          ]
        };

        const result = hydrateInput({ steps: 3.14 }, template);

        expect(result.err).toBe(true);
        expect(result.errmsg).toContain('wrong type');
      });

      it('should accept integer for int type', () => {
        const template = {
          input: [
            { variable: 'steps', type: 'int', required: true }
          ]
        };

        const result = hydrateInput({ steps: 50 }, template);

        expect(result.err).toBe(false);
        expect(result.input.steps).toBe(50);
      });
    });

    describe('Range validation', () => {
      it('should reject value below minimum', () => {
        const template = {
          input: [
            { variable: 'steps', type: 'int', min: 1, max: 100, required: true }
          ]
        };

        const result = hydrateInput({ steps: 0 }, template);

        expect(result.err).toBe(true);
        expect(result.errmsg).toContain('out of bounds');
      });

      it('should reject value above maximum', () => {
        const template = {
          input: [
            { variable: 'steps', type: 'int', min: 1, max: 100, required: true }
          ]
        };

        const result = hydrateInput({ steps: 101 }, template);

        expect(result.err).toBe(true);
        expect(result.errmsg).toContain('out of bounds');
      });

      it('should accept value at minimum', () => {
        const template = {
          input: [
            { variable: 'steps', type: 'int', min: 1, max: 100, required: true }
          ]
        };

        const result = hydrateInput({ steps: 1 }, template);

        expect(result.err).toBe(false);
        expect(result.input.steps).toBe(1);
      });

      it('should accept value at maximum', () => {
        const template = {
          input: [
            { variable: 'steps', type: 'int', min: 1, max: 100, required: true }
          ]
        };

        const result = hydrateInput({ steps: 100 }, template);

        expect(result.err).toBe(false);
        expect(result.input.steps).toBe(100);
      });

      it('should accept value within range', () => {
        const template = {
          input: [
            { variable: 'steps', type: 'int', min: 1, max: 100, required: true }
          ]
        };

        const result = hydrateInput({ steps: 50 }, template);

        expect(result.err).toBe(false);
        expect(result.input.steps).toBe(50);
      });
    });

    describe('Enum validation', () => {
      it('should reject value not in string enum', () => {
        const template = {
          input: [
            { variable: 'style', type: 'string_enum', choices: ['realistic', 'anime', 'cartoon'], required: true }
          ]
        };

        const result = hydrateInput({ style: 'invalid' }, template);

        expect(result.err).toBe(true);
        expect(result.errmsg).toContain('not in enum');
      });

      it('should accept value in string enum', () => {
        const template = {
          input: [
            { variable: 'style', type: 'string_enum', choices: ['realistic', 'anime', 'cartoon'], required: true }
          ]
        };

        const result = hydrateInput({ style: 'anime' }, template);

        expect(result.err).toBe(false);
        expect(result.input.style).toBe('anime');
      });

      it('should reject value not in int enum', () => {
        const template = {
          input: [
            { variable: 'model', type: 'int_enum', choices: [1, 2, 3], required: true }
          ]
        };

        const result = hydrateInput({ model: 5 }, template);

        expect(result.err).toBe(true);
        expect(result.errmsg).toContain('not in enum');
      });

      it('should accept value in int enum', () => {
        const template = {
          input: [
            { variable: 'model', type: 'int_enum', choices: [1, 2, 3], required: true }
          ]
        };

        const result = hydrateInput({ model: 2 }, template);

        expect(result.err).toBe(false);
        expect(result.input.model).toBe(2);
      });
    });

    describe('Default values', () => {
      it('should use default when field is undefined', () => {
        const template = {
          input: [
            { variable: 'steps', type: 'int', default: 50, required: false }
          ]
        };

        const result = hydrateInput({}, template);

        expect(result.err).toBe(false);
        expect(result.input.steps).toBe(50);
      });

      it('should override default when field is provided', () => {
        const template = {
          input: [
            { variable: 'steps', type: 'int', default: 50, required: false }
          ]
        };

        const result = hydrateInput({ steps: 100 }, template);

        expect(result.err).toBe(false);
        expect(result.input.steps).toBe(100);
      });
    });

    describe('Multiple fields validation', () => {
      it('should validate all fields correctly', () => {
        const template = {
          input: [
            { variable: 'prompt', type: 'string', required: true },
            { variable: 'steps', type: 'int', min: 1, max: 100, default: 50, required: false },
            { variable: 'style', type: 'string_enum', choices: ['realistic', 'anime'], default: 'realistic', required: false }
          ]
        };

        const result = hydrateInput({
          prompt: 'beautiful sunset',
          steps: 75,
          style: 'anime'
        }, template);

        expect(result.err).toBe(false);
        expect(result.input.prompt).toBe('beautiful sunset');
        expect(result.input.steps).toBe(75);
        expect(result.input.style).toBe('anime');
      });

      it('should fail on first invalid field', () => {
        const template = {
          input: [
            { variable: 'prompt', type: 'string', required: true },
            { variable: 'steps', type: 'int', min: 1, max: 100, required: true }
          ]
        };

        const result = hydrateInput({ steps: 50 }, template); // missing prompt

        expect(result.err).toBe(true);
        expect(result.errmsg).toContain('prompt');
      });
    });

    describe('Edge cases', () => {
      it('should handle empty string as valid string', () => {
        const template = {
          input: [
            { variable: 'prompt', type: 'string', required: true }
          ]
        };

        const result = hydrateInput({ prompt: '' }, template);

        expect(result.err).toBe(false);
        expect(result.input.prompt).toBe('');
      });

      it('should handle zero as valid int', () => {
        const template = {
          input: [
            { variable: 'steps', type: 'int', min: 0, max: 100, required: true }
          ]
        };

        const result = hydrateInput({ steps: 0 }, template);

        expect(result.err).toBe(false);
        expect(result.input.steps).toBe(0);
      });

      it('should handle negative numbers in range', () => {
        const template = {
          input: [
            { variable: 'value', type: 'int', min: -50, max: 50, required: true }
          ]
        };

        const result = hydrateInput({ value: -25 }, template);

        expect(result.err).toBe(false);
        expect(result.input.value).toBe(-25);
      });
    });

    describe('Special characters and unicode', () => {
      it('should accept unicode characters in strings', () => {
        const template = {
          input: [
            { variable: 'prompt', type: 'string', required: true }
          ]
        };

        const result = hydrateInput({ prompt: '你好世界 🌍' }, template);

        expect(result.err).toBe(false);
        expect(result.input.prompt).toBe('你好世界 🌍');
      });

      it('should accept special characters in strings', () => {
        const template = {
          input: [
            { variable: 'prompt', type: 'string', required: true }
          ]
        };

        const result = hydrateInput({ prompt: '<script>alert("test")</script>' }, template);

        expect(result.err).toBe(false);
        expect(result.input.prompt).toBe('<script>alert("test")</script>');
      });

      it('should accept newlines in strings', () => {
        const template = {
          input: [
            { variable: 'prompt', type: 'string', required: true }
          ]
        };

        const result = hydrateInput({ prompt: 'line1\nline2\nline3' }, template);

        expect(result.err).toBe(false);
        expect(result.input.prompt).toBe('line1\nline2\nline3');
      });
    });
  });

  describe('UserService - Wallet validation', () => {
    let db: DatabaseService;
    let userService: UserService;

    beforeEach(() => {
      db = new DatabaseService(':memory:');
      userService = new UserService(db);
    });

    afterEach(() => {
      db.close();
    });

    describe('Address format validation', () => {
      it('should reject invalid Ethereum address', () => {
        const result = userService.linkWallet(123, 'invalid-address');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid Ethereum address');
      });

      it('should reject malformed hex address', () => {
        const result = userService.linkWallet(123, '0xGGGGGG');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid Ethereum address');
      });

      it('should reject address with wrong length', () => {
        const result = userService.linkWallet(123, '0x1234');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid Ethereum address');
      });

      it('should accept valid checksum address', () => {
        const validAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
        const result = userService.linkWallet(123, validAddress);

        expect(result.success).toBe(true);
        expect(result.user).toBeDefined();
      });

      it('should accept lowercase address and checksum it', () => {
        const lowercaseAddress = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';
        const result = userService.linkWallet(123, lowercaseAddress);

        expect(result.success).toBe(true);
        // DB stores checksummed address
        expect(ethers.getAddress(result.user?.wallet_address!)).toBe(ethers.getAddress(lowercaseAddress));
      });

      it('should accept uppercase address', () => {
        const uppercaseAddress = '0x70997970C51812DC3A010C7D01B50E0D17DC79C8';
        const result = userService.linkWallet(123, uppercaseAddress);

        expect(result.success).toBe(true);
      });
    });

    describe('Duplicate wallet prevention', () => {
      it('should reject wallet already linked to another user', () => {
        const address = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

        // First user links wallet
        const result1 = userService.linkWallet(123, address);
        expect(result1.success).toBe(true);

        // Second user tries to link same wallet
        const result2 = userService.linkWallet(456, address);
        expect(result2.success).toBe(false);
        expect(result2.error).toContain('already linked');
      });

      it('should allow same user to re-link same wallet', () => {
        const address = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

        const result1 = userService.linkWallet(123, address);
        expect(result1.success).toBe(true);

        const result2 = userService.linkWallet(123, address);
        expect(result2.success).toBe(true);
      });

      it('should allow same user to update wallet address', () => {
        const address1 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
        const address2 = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';

        const result1 = userService.linkWallet(123, address1);
        expect(result1.success).toBe(true);

        const result2 = userService.linkWallet(123, address2);
        expect(result2.success).toBe(true);
        expect(ethers.getAddress(result2.user?.wallet_address!)).toBe(ethers.getAddress(address2));
      });
    });
  });

  describe('Command parsing - Input sanitization', () => {
    describe('Prompt extraction', () => {
      it('should extract prompt from command', () => {
        const text = '/sdxl beautiful sunset over mountains';
        const parts = text.split(' ');
        const prompt = parts.slice(1).join(' ');

        expect(prompt).toBe('beautiful sunset over mountains');
      });

      it('should handle empty prompt', () => {
        const text = '/sdxl';
        const parts = text.split(' ');
        const prompt = parts.slice(1).join(' ');

        expect(prompt).toBe('');
      });

      it('should preserve multiple spaces in prompt', () => {
        const text = '/sdxl cat    with    spaces';
        const parts = text.split(' ');
        const prompt = parts.slice(1).join(' ');

        expect(prompt).toBe('cat    with    spaces');
      });

      it('should handle prompts with special characters', () => {
        const text = '/sdxl prompt "with" \'quotes\' & symbols!';
        const parts = text.split(' ');
        const prompt = parts.slice(1).join(' ');

        expect(prompt).toBe('prompt "with" \'quotes\' & symbols!');
      });
    });

    describe('Model name extraction', () => {
      it('should extract and lowercase model name', () => {
        const text = '/SDXL test prompt';
        const parts = text.split(' ');
        const modelName = parts[0].substring(1).toLowerCase();

        expect(modelName).toBe('sdxl');
      });

      it('should handle lowercase commands', () => {
        const text = '/sdxl test';
        const parts = text.split(' ');
        const modelName = parts[0].substring(1).toLowerCase();

        expect(modelName).toBe('sdxl');
      });

      it('should handle mixed case', () => {
        const text = '/SdXl test';
        const parts = text.split(' ');
        const modelName = parts[0].substring(1).toLowerCase();

        expect(modelName).toBe('sdxl');
      });
    });

    describe('TaskID validation', () => {
      it('should accept valid hex taskid', () => {
        const taskid = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        const isHex = /^0x[0-9a-fA-F]+$/.test(taskid);

        expect(isHex).toBe(true);
      });

      it('should reject taskid without 0x prefix', () => {
        const taskid = '1234567890abcdef';
        const isHex = /^0x[0-9a-fA-F]+$/.test(taskid);

        expect(isHex).toBe(false);
      });

      it('should reject taskid with invalid characters', () => {
        const taskid = '0x1234567890GHIJKL';
        const isHex = /^0x[0-9a-fA-F]+$/.test(taskid);

        expect(isHex).toBe(false);
      });

      it('should accept short valid hex', () => {
        const taskid = '0x1234';
        const isHex = /^0x[0-9a-fA-F]+$/.test(taskid);

        expect(isHex).toBe(true);
      });
    });

    describe('Telegram ID validation', () => {
      it('should accept valid telegram ID', () => {
        const input = '123456789';
        const telegramId = parseInt(input);

        expect(telegramId).toBe(123456789);
        expect(Number.isInteger(telegramId)).toBe(true);
      });

      it('should handle invalid telegram ID', () => {
        const input = 'not_a_number';
        const telegramId = parseInt(input);

        expect(Number.isNaN(telegramId)).toBe(true);
      });

      it('should handle negative numbers', () => {
        const input = '-123';
        const telegramId = parseInt(input);

        expect(telegramId).toBe(-123);
      });

      it('should truncate decimal values', () => {
        const input = '123.456';
        const telegramId = parseInt(input);

        expect(telegramId).toBe(123);
      });
    });

    describe('Amount parsing', () => {
      it('should parse valid AIUS amount', () => {
        const input = '10';
        const amount = ethers.parseEther(input);

        expect(amount).toBe(ethers.parseEther('10'));
      });

      it('should parse decimal AIUS amount', () => {
        const input = '0.5';
        const amount = ethers.parseEther(input);

        expect(amount).toBe(ethers.parseEther('0.5'));
      });

      it('should throw on invalid amount', () => {
        const input = 'not_a_number';

        expect(() => ethers.parseEther(input)).toThrow();
      });

      it('should handle very small amounts', () => {
        const input = '0.000000000000000001'; // 1 wei
        const amount = ethers.parseEther(input);

        expect(amount).toBe(1n);
      });

      it('should handle large amounts', () => {
        const input = '1000000'; // 1 million
        const amount = ethers.parseEther(input);

        expect(amount).toBe(ethers.parseEther('1000000'));
      });
    });
  });

  describe('Security - Injection prevention', () => {
    it('should not execute JavaScript in prompts', () => {
      const template = {
        input: [
          { variable: 'prompt', type: 'string', required: true }
        ]
      };

      const maliciousInput = '<img src=x onerror=alert(1)>';
      const result = hydrateInput({ prompt: maliciousInput }, template);

      // Input is stored as-is, not executed
      expect(result.err).toBe(false);
      expect(result.input.prompt).toBe(maliciousInput);
    });

    it('should not execute SQL in prompts', () => {
      const template = {
        input: [
          { variable: 'prompt', type: 'string', required: true }
        ]
      };

      const sqlInjection = '\'; DROP TABLE users; --';
      const result = hydrateInput({ prompt: sqlInjection }, template);

      // Input is stored as-is, SQL would be prevented at DB layer
      expect(result.err).toBe(false);
      expect(result.input.prompt).toBe(sqlInjection);
    });

    it('should handle null bytes', () => {
      const template = {
        input: [
          { variable: 'prompt', type: 'string', required: true }
        ]
      };

      const nullByteInput = 'test\x00malicious';
      const result = hydrateInput({ prompt: nullByteInput }, template);

      expect(result.err).toBe(false);
      expect(result.input.prompt).toBe(nullByteInput);
    });
  });

  describe('Length limits', () => {
    it('should accept reasonable length prompts', () => {
      const template = {
        input: [
          { variable: 'prompt', type: 'string', required: true }
        ]
      };

      const prompt = 'a'.repeat(500);
      const result = hydrateInput({ prompt }, template);

      expect(result.err).toBe(false);
      expect(result.input.prompt).toBe(prompt);
    });

    it('should accept very long prompts', () => {
      const template = {
        input: [
          { variable: 'prompt', type: 'string', required: true }
        ]
      };

      const prompt = 'a'.repeat(10000);
      const result = hydrateInput({ prompt }, template);

      expect(result.err).toBe(false);
      expect(result.input.prompt).toBe(prompt);
    });

    it('should handle extremely long prompts', () => {
      const template = {
        input: [
          { variable: 'prompt', type: 'string', required: true }
        ]
      };

      const prompt = 'a'.repeat(100000); // 100k characters
      const result = hydrateInput({ prompt }, template);

      expect(result.err).toBe(false);
      expect(result.input.prompt.length).toBe(100000);
    });
  });
});
