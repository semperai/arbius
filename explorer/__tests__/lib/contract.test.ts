import {
  parseIPFSCid,
  formatAddress,
  isValidAddress,
  isValidTaskId,
  getMockTasks
} from '@/lib/contract';

describe('contract helpers', () => {
  describe('parseIPFSCid', () => {
    it('should return null for empty or invalid input', () => {
      expect(parseIPFSCid('')).toBeNull();
      expect(parseIPFSCid('0x')).toBeNull();
      expect(parseIPFSCid('0x00')).toBeNull();
    });

    it('should return null for very short hex', () => {
      expect(parseIPFSCid('0x12')).toBeNull();
    });

    it('should handle valid IPFS CID hex strings', () => {
      // Test with UTF8-decodable hex (representing "test")
      const hex = '0x74657374'; // "test" in hex
      const result = parseIPFSCid(hex);
      expect(result).toBe('test');
    });

    it('should handle null input', () => {
      expect(parseIPFSCid(null as any)).toBeNull();
    });
  });

  describe('formatAddress', () => {
    it('should return empty string for empty input', () => {
      expect(formatAddress('')).toBe('');
    });

    it('should format Ethereum address correctly', () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
      expect(formatAddress(address)).toBe('0x742d...f44e');
    });

    it('should handle short addresses', () => {
      const address = '0x1234567890';
      expect(formatAddress(address)).toBe('0x1234...7890');
    });
  });

  describe('isValidAddress', () => {
    it('should return true for valid Ethereum address', () => {
      expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e')).toBe(true);
    });

    it('should return true for checksummed address', () => {
      expect(isValidAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(true);
    });

    it('should return false for invalid address', () => {
      expect(isValidAddress('invalid')).toBe(false);
      expect(isValidAddress('0x123')).toBe(false);
      expect(isValidAddress('')).toBe(false);
    });

    it('should handle lowercase addresses', () => {
      expect(isValidAddress('0x742d35cc6634c0532925a3b844bc454e4438f44e')).toBe(true);
    });
  });

  describe('isValidTaskId', () => {
    it('should return true for valid 32-byte hex string', () => {
      const taskId = '0x' + '1309128093aa6234231eee34234234eff7778aa8a00000000000000000000000';
      expect(taskId.length).toBe(66); // Verify length
      expect(isValidTaskId(taskId)).toBe(true);
    });

    it('should return false for invalid hex string', () => {
      expect(isValidTaskId('invalid')).toBe(false);
      expect(isValidTaskId('')).toBe(false);
      expect(isValidTaskId('0x123')).toBe(false);
    });

    it('should return false for hex string with wrong length', () => {
      // Too short (should be 66 characters: 0x + 64 hex chars)
      expect(isValidTaskId('0x1309128093aa6234231eee34234234eff7778aa8a')).toBe(false);
    });

    it('should return false for non-hex string', () => {
      expect(isValidTaskId('0x' + 'g'.repeat(64))).toBe(false);
    });
  });

  describe('getMockTasks', () => {
    it('should return an array of mock tasks', () => {
      const tasks = getMockTasks();
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);
    });

    it('should return tasks with required properties', () => {
      const tasks = getMockTasks();
      tasks.forEach(task => {
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('model');
        expect(task).toHaveProperty('fee');
        expect(task).toHaveProperty('owner');
        expect(task).toHaveProperty('blocktime');
        expect(task).toHaveProperty('version');
        expect(task).toHaveProperty('cid');
        expect(task).toHaveProperty('solution');
        expect(task).toHaveProperty('contestation');
        expect(task).toHaveProperty('hasContestation');
      });
    });

    it('should return tasks with valid solution structure', () => {
      const tasks = getMockTasks();
      tasks.forEach(task => {
        expect(task.solution).toHaveProperty('validator');
        expect(task.solution).toHaveProperty('blocktime');
        expect(task.solution).toHaveProperty('claimed');
        expect(task.solution).toHaveProperty('cid');
      });
    });

    it('should return tasks with valid contestation structure', () => {
      const tasks = getMockTasks();
      tasks.forEach(task => {
        expect(task.contestation).toHaveProperty('validator');
        expect(task.contestation).toHaveProperty('blocktime');
        expect(task.contestation).toHaveProperty('finish_start_index');
        expect(task.contestation).toHaveProperty('slashAmount');
      });
    });

    it('should return at least one task with a contestation', () => {
      const tasks = getMockTasks();
      const hasContestations = tasks.some(task => task.hasContestation);
      expect(hasContestations).toBe(true);
    });
  });
});
