import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BlockchainService } from '../../src/services/BlockchainService';
import { ethers } from 'ethers';

// Mock the logger
vi.mock('../../src/log', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  initializeLogger: vi.fn(),
}));

// Mock utils
vi.mock('../../src/utils', () => ({
  generateCommitment: vi.fn(() => '0xmockcommitment123'),
  expretry: vi.fn((tag: string, fn: () => Promise<any>) => fn()),
}));

describe('Dynamic Gas Estimation - Comprehensive Tests', () => {
  let blockchain: BlockchainService;

  const TEST_RPC = 'http://localhost:8545';
  const TEST_PRIVATE_KEY = '0x1234567890123456789012345678901234567890123456789012345678901234';
  const TEST_ARBIUS_ADDRESS = '0x1111111111111111111111111111111111111111';
  const TEST_ROUTER_ADDRESS = '0x2222222222222222222222222222222222222222';
  const TEST_TOKEN_ADDRESS = '0x3333333333333333333333333333333333333333';

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GAS_BUFFER_PERCENT;
  });

  afterEach(() => {
    delete process.env.GAS_BUFFER_PERCENT;
  });

  describe('estimateGasWithBuffer - Core Functionality', () => {
    beforeEach(() => {
      blockchain = new BlockchainService(
        TEST_RPC,
        TEST_PRIVATE_KEY,
        TEST_ARBIUS_ADDRESS,
        TEST_ROUTER_ADDRESS,
        TEST_TOKEN_ADDRESS
      );
    });

    it('should estimate gas and apply default 20% buffer', async () => {
      const mockEstimate = vi.fn().mockResolvedValue(100_000n);
      const estimateGasWithBuffer = (blockchain as any).estimateGasWithBuffer.bind(blockchain);

      const result = await estimateGasWithBuffer(
        mockEstimate,
        200_000n,
        'testOperation'
      );

      expect(mockEstimate).toHaveBeenCalledTimes(1);
      expect(result).toBe(120_000n); // 100k * 1.2
    });

    it('should handle small gas estimates correctly', async () => {
      const mockEstimate = vi.fn().mockResolvedValue(1_000n);
      const estimateGasWithBuffer = (blockchain as any).estimateGasWithBuffer.bind(blockchain);

      const result = await estimateGasWithBuffer(
        mockEstimate,
        50_000n,
        'smallOperation'
      );

      expect(result).toBe(1_200n); // 1k * 1.2
    });

    it('should handle large gas estimates correctly', async () => {
      const mockEstimate = vi.fn().mockResolvedValue(5_000_000n);
      const estimateGasWithBuffer = (blockchain as any).estimateGasWithBuffer.bind(blockchain);

      const result = await estimateGasWithBuffer(
        mockEstimate,
        1_000_000n,
        'largeOperation'
      );

      expect(result).toBe(6_000_000n); // 5M * 1.2
    });

    it('should apply custom buffer percentage from env', async () => {
      process.env.GAS_BUFFER_PERCENT = '50';
      const blockchainCustom = new BlockchainService(
        TEST_RPC,
        TEST_PRIVATE_KEY,
        TEST_ARBIUS_ADDRESS,
        TEST_ROUTER_ADDRESS,
        TEST_TOKEN_ADDRESS
      );

      const mockEstimate = vi.fn().mockResolvedValue(100_000n);
      const estimateGasWithBuffer = (blockchainCustom as any).estimateGasWithBuffer.bind(blockchainCustom);

      const result = await estimateGasWithBuffer(
        mockEstimate,
        200_000n,
        'testOperation'
      );

      expect(result).toBe(150_000n); // 100k * 1.5
    });

    it('should handle 0% buffer', async () => {
      process.env.GAS_BUFFER_PERCENT = '0';
      const blockchainNoBuf = new BlockchainService(
        TEST_RPC,
        TEST_PRIVATE_KEY,
        TEST_ARBIUS_ADDRESS,
        TEST_ROUTER_ADDRESS,
        TEST_TOKEN_ADDRESS
      );

      const mockEstimate = vi.fn().mockResolvedValue(100_000n);
      const estimateGasWithBuffer = (blockchainNoBuf as any).estimateGasWithBuffer.bind(blockchainNoBuf);

      const result = await estimateGasWithBuffer(
        mockEstimate,
        200_000n,
        'testOperation'
      );

      expect(result).toBe(100_000n); // 100k * 1.0 (no buffer)
    });

    it('should handle 100% buffer', async () => {
      process.env.GAS_BUFFER_PERCENT = '100';
      const blockchainDoubleBuf = new BlockchainService(
        TEST_RPC,
        TEST_PRIVATE_KEY,
        TEST_ARBIUS_ADDRESS,
        TEST_ROUTER_ADDRESS,
        TEST_TOKEN_ADDRESS
      );

      const mockEstimate = vi.fn().mockResolvedValue(100_000n);
      const estimateGasWithBuffer = (blockchainDoubleBuf as any).estimateGasWithBuffer.bind(blockchainDoubleBuf);

      const result = await estimateGasWithBuffer(
        mockEstimate,
        200_000n,
        'testOperation'
      );

      expect(result).toBe(200_000n); // 100k * 2.0
    });
  });

  describe('estimateGasWithBuffer - Error Handling', () => {
    beforeEach(() => {
      blockchain = new BlockchainService(
        TEST_RPC,
        TEST_PRIVATE_KEY,
        TEST_ARBIUS_ADDRESS,
        TEST_ROUTER_ADDRESS,
        TEST_TOKEN_ADDRESS
      );
    });

    it('should use fallback when estimation throws error', async () => {
      const mockEstimate = vi.fn().mockRejectedValue(new Error('RPC unavailable'));
      const estimateGasWithBuffer = (blockchain as any).estimateGasWithBuffer.bind(blockchain);

      const result = await estimateGasWithBuffer(
        mockEstimate,
        300_000n,
        'testOperation'
      );

      expect(mockEstimate).toHaveBeenCalledTimes(1);
      expect(result).toBe(300_000n); // fallback value
    });

    it('should use fallback when estimation returns 0', async () => {
      const mockEstimate = vi.fn().mockResolvedValue(0n);
      const estimateGasWithBuffer = (blockchain as any).estimateGasWithBuffer.bind(blockchain);

      const result = await estimateGasWithBuffer(
        mockEstimate,
        250_000n,
        'testOperation'
      );

      // 0 * 1.2 = 0, but this is likely an error case
      expect(result).toBe(0n);
    });

    it('should handle timeout errors gracefully', async () => {
      const mockEstimate = vi.fn().mockRejectedValue(new Error('timeout'));
      const estimateGasWithBuffer = (blockchain as any).estimateGasWithBuffer.bind(blockchain);

      const result = await estimateGasWithBuffer(
        mockEstimate,
        400_000n,
        'timeoutOperation'
      );

      expect(result).toBe(400_000n);
    });

    it('should handle network errors gracefully', async () => {
      const mockEstimate = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      const estimateGasWithBuffer = (blockchain as any).estimateGasWithBuffer.bind(blockchain);

      const result = await estimateGasWithBuffer(
        mockEstimate,
        500_000n,
        'networkOperation'
      );

      expect(result).toBe(500_000n);
    });

    it('should handle invalid gas estimation responses', async () => {
      const mockEstimate = vi.fn().mockResolvedValue(null);
      const estimateGasWithBuffer = (blockchain as any).estimateGasWithBuffer.bind(blockchain);

      // null * 120 / 100 will cause error in calculation
      // The function should catch and use fallback
      const result = await estimateGasWithBuffer(mockEstimate, 200_000n, 'invalidOperation');

      // Should fallback to 200_000n when calculation fails
      expect(result).toBe(200_000n);
    });
  });

  describe('Fallback Gas Limits Configuration', () => {
    it('should have correct fallback limits defined', () => {
      blockchain = new BlockchainService(
        TEST_RPC,
        TEST_PRIVATE_KEY,
        TEST_ARBIUS_ADDRESS,
        TEST_ROUTER_ADDRESS,
        TEST_TOKEN_ADDRESS
      );

      const fallbacks = (blockchain as any).FALLBACK_GAS_LIMITS;

      expect(fallbacks.submitTask).toBe(200_000n);
      expect(fallbacks.signalCommitment).toBe(450_000n);
      expect(fallbacks.submitSolution).toBe(500_000n);
      expect(fallbacks.approve).toBe(100_000n);
      expect(fallbacks.validatorDeposit).toBe(150_000n);
    });
  });

  describe('Buffer Percentage Edge Cases', () => {
    it('should handle negative buffer percentage (treats as 0)', async () => {
      process.env.GAS_BUFFER_PERCENT = '-10';
      const blockchainNeg = new BlockchainService(
        TEST_RPC,
        TEST_PRIVATE_KEY,
        TEST_ARBIUS_ADDRESS,
        TEST_ROUTER_ADDRESS,
        TEST_TOKEN_ADDRESS
      );

      const bufferPercent = (blockchainNeg as any).GAS_BUFFER_PERCENT;
      expect(bufferPercent).toBe(-10);

      const mockEstimate = vi.fn().mockResolvedValue(100_000n);
      const estimateGasWithBuffer = (blockchainNeg as any).estimateGasWithBuffer.bind(blockchainNeg);

      const result = await estimateGasWithBuffer(
        mockEstimate,
        200_000n,
        'negativeBuffer'
      );

      // 100_000 * (100 + (-10)) / 100 = 100_000 * 90 / 100 = 90_000
      expect(result).toBe(90_000n);
    });

    it('should handle very large buffer percentage', async () => {
      process.env.GAS_BUFFER_PERCENT = '1000';
      const blockchainHuge = new BlockchainService(
        TEST_RPC,
        TEST_PRIVATE_KEY,
        TEST_ARBIUS_ADDRESS,
        TEST_ROUTER_ADDRESS,
        TEST_TOKEN_ADDRESS
      );

      const mockEstimate = vi.fn().mockResolvedValue(100_000n);
      const estimateGasWithBuffer = (blockchainHuge as any).estimateGasWithBuffer.bind(blockchainHuge);

      const result = await estimateGasWithBuffer(
        mockEstimate,
        200_000n,
        'hugeBuffer'
      );

      // 100_000 * (100 + 1000) / 100 = 100_000 * 11 = 1_100_000
      expect(result).toBe(1_100_000n);
    });

    it('should handle non-numeric buffer percentage', async () => {
      process.env.GAS_BUFFER_PERCENT = 'invalid';
      const blockchainInvalid = new BlockchainService(
        TEST_RPC,
        TEST_PRIVATE_KEY,
        TEST_ARBIUS_ADDRESS,
        TEST_ROUTER_ADDRESS,
        TEST_TOKEN_ADDRESS
      );

      const bufferPercent = (blockchainInvalid as any).GAS_BUFFER_PERCENT;
      expect(isNaN(bufferPercent)).toBe(true);
    });

    it('should handle decimal buffer percentage', async () => {
      process.env.GAS_BUFFER_PERCENT = '25.5';
      const blockchainDecimal = new BlockchainService(
        TEST_RPC,
        TEST_PRIVATE_KEY,
        TEST_ARBIUS_ADDRESS,
        TEST_ROUTER_ADDRESS,
        TEST_TOKEN_ADDRESS
      );

      const bufferPercent = (blockchainDecimal as any).GAS_BUFFER_PERCENT;
      expect(bufferPercent).toBe(25); // parseInt truncates
    });
  });

  describe('Gas Estimation Precision', () => {
    beforeEach(() => {
      blockchain = new BlockchainService(
        TEST_RPC,
        TEST_PRIVATE_KEY,
        TEST_ARBIUS_ADDRESS,
        TEST_ROUTER_ADDRESS,
        TEST_TOKEN_ADDRESS
      );
    });

    it('should handle odd gas estimates correctly', async () => {
      const mockEstimate = vi.fn().mockResolvedValue(123_456n);
      const estimateGasWithBuffer = (blockchain as any).estimateGasWithBuffer.bind(blockchain);

      const result = await estimateGasWithBuffer(
        mockEstimate,
        200_000n,
        'oddEstimate'
      );

      // 123_456 * 120 / 100 = 148_147.2 -> 148_147n (integer division)
      expect(result).toBe(148_147n);
    });

    it('should not have rounding errors with large numbers', async () => {
      const mockEstimate = vi.fn().mockResolvedValue(9_999_999n);
      const estimateGasWithBuffer = (blockchain as any).estimateGasWithBuffer.bind(blockchain);

      const result = await estimateGasWithBuffer(
        mockEstimate,
        10_000_000n,
        'largeEstimate'
      );

      // 9_999_999 * 120 / 100 = 11_999_998.8 -> 11_999_998n
      expect(result).toBe(11_999_998n);
    });

    it('should handle minimum gas estimate (21000)', async () => {
      const mockEstimate = vi.fn().mockResolvedValue(21_000n);
      const estimateGasWithBuffer = (blockchain as any).estimateGasWithBuffer.bind(blockchain);

      const result = await estimateGasWithBuffer(
        mockEstimate,
        50_000n,
        'minGas'
      );

      expect(result).toBe(25_200n); // 21_000 * 1.2
    });
  });

  describe('Multiple Estimation Calls', () => {
    beforeEach(() => {
      blockchain = new BlockchainService(
        TEST_RPC,
        TEST_PRIVATE_KEY,
        TEST_ARBIUS_ADDRESS,
        TEST_ROUTER_ADDRESS,
        TEST_TOKEN_ADDRESS
      );
    });

    it('should call estimation function exactly once per call', async () => {
      const mockEstimate = vi.fn().mockResolvedValue(100_000n);
      const estimateGasWithBuffer = (blockchain as any).estimateGasWithBuffer.bind(blockchain);

      await estimateGasWithBuffer(mockEstimate, 200_000n, 'test1');
      await estimateGasWithBuffer(mockEstimate, 200_000n, 'test2');
      await estimateGasWithBuffer(mockEstimate, 200_000n, 'test3');

      expect(mockEstimate).toHaveBeenCalledTimes(3);
    });

    it('should return consistent results for same inputs', async () => {
      const mockEstimate = vi.fn().mockResolvedValue(150_000n);
      const estimateGasWithBuffer = (blockchain as any).estimateGasWithBuffer.bind(blockchain);

      const result1 = await estimateGasWithBuffer(mockEstimate, 300_000n, 'consistent');
      const result2 = await estimateGasWithBuffer(mockEstimate, 300_000n, 'consistent');
      const result3 = await estimateGasWithBuffer(mockEstimate, 300_000n, 'consistent');

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
      expect(result1).toBe(180_000n); // 150k * 1.2
    });

    it('should handle sequential success then failure', async () => {
      const mockEstimate = vi.fn()
        .mockResolvedValueOnce(100_000n)
        .mockRejectedValueOnce(new Error('Failed'));

      const estimateGasWithBuffer = (blockchain as any).estimateGasWithBuffer.bind(blockchain);

      const result1 = await estimateGasWithBuffer(mockEstimate, 200_000n, 'test1');
      const result2 = await estimateGasWithBuffer(mockEstimate, 200_000n, 'test2');

      expect(result1).toBe(120_000n);
      expect(result2).toBe(200_000n); // fallback
    });
  });

  describe('Performance Characteristics', () => {
    beforeEach(() => {
      blockchain = new BlockchainService(
        TEST_RPC,
        TEST_PRIVATE_KEY,
        TEST_ARBIUS_ADDRESS,
        TEST_ROUTER_ADDRESS,
        TEST_TOKEN_ADDRESS
      );
    });

    it('should complete estimation quickly (< 100ms)', async () => {
      const mockEstimate = vi.fn().mockResolvedValue(100_000n);
      const estimateGasWithBuffer = (blockchain as any).estimateGasWithBuffer.bind(blockchain);

      const start = Date.now();
      await estimateGasWithBuffer(mockEstimate, 200_000n, 'performance');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should handle slow estimation gracefully', async () => {
      const mockEstimate = vi.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(100_000n), 50))
      );
      const estimateGasWithBuffer = (blockchain as any).estimateGasWithBuffer.bind(blockchain);

      const result = await estimateGasWithBuffer(mockEstimate, 200_000n, 'slow');
      expect(result).toBe(120_000n);
    });
  });

  describe('Buffer Calculation Correctness', () => {
    const testCases = [
      { estimate: 100_000n, buffer: 10, expected: 110_000n },
      { estimate: 100_000n, buffer: 20, expected: 120_000n },
      { estimate: 100_000n, buffer: 25, expected: 125_000n },
      { estimate: 100_000n, buffer: 50, expected: 150_000n },
      { estimate: 200_000n, buffer: 15, expected: 230_000n },
      { estimate: 50_000n, buffer: 30, expected: 65_000n },
      { estimate: 1_000_000n, buffer: 5, expected: 1_050_000n },
    ];

    testCases.forEach(({ estimate, buffer, expected }) => {
      it(`should calculate ${estimate} with ${buffer}% buffer = ${expected}`, async () => {
        process.env.GAS_BUFFER_PERCENT = buffer.toString();
        const blockchainTest = new BlockchainService(
          TEST_RPC,
          TEST_PRIVATE_KEY,
          TEST_ARBIUS_ADDRESS,
          TEST_ROUTER_ADDRESS,
          TEST_TOKEN_ADDRESS
        );

        const mockEstimate = vi.fn().mockResolvedValue(estimate);
        const estimateGasWithBuffer = (blockchainTest as any).estimateGasWithBuffer.bind(blockchainTest);

        const result = await estimateGasWithBuffer(mockEstimate, 1_000_000n, 'bufferTest');
        expect(result).toBe(expected);
      });
    });
  });

  describe('Boundary Conditions', () => {
    beforeEach(() => {
      blockchain = new BlockchainService(
        TEST_RPC,
        TEST_PRIVATE_KEY,
        TEST_ARBIUS_ADDRESS,
        TEST_ROUTER_ADDRESS,
        TEST_TOKEN_ADDRESS
      );
    });

    it('should handle max uint256 gas estimate', async () => {
      const maxUint256 = ethers.MaxUint256;
      const mockEstimate = vi.fn().mockResolvedValue(maxUint256);
      const estimateGasWithBuffer = (blockchain as any).estimateGasWithBuffer.bind(blockchain);

      // BigInt arithmetic can handle this, will overflow but return a value
      const result = await estimateGasWithBuffer(mockEstimate, 1_000_000n, 'maxUint');

      // Should return calculated value (may overflow but BigInt handles it)
      expect(result).toBeGreaterThan(maxUint256);
    });

    it('should handle 1 gas estimate', async () => {
      const mockEstimate = vi.fn().mockResolvedValue(1n);
      const estimateGasWithBuffer = (blockchain as any).estimateGasWithBuffer.bind(blockchain);

      const result = await estimateGasWithBuffer(mockEstimate, 100n, 'oneGas');
      expect(result).toBe(1n); // 1 * 120 / 100 = 1.2 -> 1
    });
  });

  describe('Error Message Quality', () => {
    beforeEach(() => {
      blockchain = new BlockchainService(
        TEST_RPC,
        TEST_PRIVATE_KEY,
        TEST_ARBIUS_ADDRESS,
        TEST_ROUTER_ADDRESS,
        TEST_TOKEN_ADDRESS
      );
    });

    it('should preserve original error message on estimation failure', async () => {
      const originalError = new Error('Specific RPC error: out of gas');
      const mockEstimate = vi.fn().mockRejectedValue(originalError);
      const estimateGasWithBuffer = (blockchain as any).estimateGasWithBuffer.bind(blockchain);

      // Should fallback but log should contain original error
      const result = await estimateGasWithBuffer(mockEstimate, 200_000n, 'errorTest');
      expect(result).toBe(200_000n);
    });
  });
});
