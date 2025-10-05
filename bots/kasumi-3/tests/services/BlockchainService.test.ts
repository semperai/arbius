import { vi } from 'vitest';
import { BlockchainService } from '../../src/services/BlockchainService';

// Mock the logger
vi.mock('../../src/log', () => ({
  log: {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  },
}));

// Mock utils
vi.mock('../../src/utils', () => ({
  generateCommitment: () => '0xcommitment',
  expretry: (tag: string, fn: () => Promise<any>) => fn(),
}));

describe('BlockchainService', () => {
  let blockchain: BlockchainService;

  const TEST_RPC = 'http://localhost:8545';
  const TEST_PRIVATE_KEY = '0x1234567890123456789012345678901234567890123456789012345678901234';
  const TEST_ARBIUS_ADDRESS = '0x1111111111111111111111111111111111111111';
  const TEST_ROUTER_ADDRESS = '0x2222222222222222222222222222222222222222';
  const TEST_TOKEN_ADDRESS = '0x3333333333333333333333333333333333333333';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with single RPC URL', () => {
      blockchain = new BlockchainService(
        TEST_RPC,
        TEST_PRIVATE_KEY,
        TEST_ARBIUS_ADDRESS,
        TEST_ROUTER_ADDRESS,
        TEST_TOKEN_ADDRESS
      );

      expect(blockchain).toBeDefined();
      expect(blockchain.getWalletAddress()).toBeTruthy();
    });

    it('should initialize with multiple RPC URLs', () => {
      const multipleRpcs = 'http://localhost:8545,http://localhost:8546,http://localhost:8547';

      blockchain = new BlockchainService(
        multipleRpcs,
        TEST_PRIVATE_KEY,
        TEST_ARBIUS_ADDRESS,
        TEST_ROUTER_ADDRESS,
        TEST_TOKEN_ADDRESS
      );

      expect(blockchain).toBeDefined();
    });
  });

  describe('getWalletAddress', () => {
    it('should return wallet address', () => {
      blockchain = new BlockchainService(
        TEST_RPC,
        TEST_PRIVATE_KEY,
        TEST_ARBIUS_ADDRESS,
        TEST_ROUTER_ADDRESS,
        TEST_TOKEN_ADDRESS
      );

      const address = blockchain.getWalletAddress();
      expect(address).toBeTruthy();
      expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });
  });

  describe('getArbiusContract', () => {
    it('should return arbius contract', () => {
      blockchain = new BlockchainService(
        TEST_RPC,
        TEST_PRIVATE_KEY,
        TEST_ARBIUS_ADDRESS,
        TEST_ROUTER_ADDRESS,
        TEST_TOKEN_ADDRESS
      );

      const contract = blockchain.getArbiusContract();
      expect(contract).toBeDefined();
      expect(contract.target).toBe(TEST_ARBIUS_ADDRESS);
    });
  });

  describe('getProvider', () => {
    it('should return provider', () => {
      blockchain = new BlockchainService(
        TEST_RPC,
        TEST_PRIVATE_KEY,
        TEST_ARBIUS_ADDRESS,
        TEST_ROUTER_ADDRESS,
        TEST_TOKEN_ADDRESS
      );

      const provider = blockchain.getProvider();
      expect(provider).toBeDefined();
    });
  });

  describe('dynamic gas estimation', () => {
    beforeEach(() => {
      blockchain = new BlockchainService(
        TEST_RPC,
        TEST_PRIVATE_KEY,
        TEST_ARBIUS_ADDRESS,
        TEST_ROUTER_ADDRESS,
        TEST_TOKEN_ADDRESS
      );
    });

    it('should use dynamic gas estimation with buffer', async () => {
      const mockEstimateGas = vi.fn().mockResolvedValue(100_000n);
      const mockContract = {
        submitSolution: {
          estimateGas: mockEstimateGas,
        },
      };

      // Access private method via any cast for testing
      const estimateGasWithBuffer = (blockchain as any).estimateGasWithBuffer.bind(blockchain);

      const gasLimit = await estimateGasWithBuffer(
        async () => await mockEstimateGas(),
        200_000n,
        'test'
      );

      // Default buffer is 20%, so 100_000 * 1.2 = 120_000
      expect(gasLimit).toBe(120_000n);
      expect(mockEstimateGas).toHaveBeenCalled();
    });

    it('should use fallback gas when estimation fails', async () => {
      const mockEstimateGas = vi.fn().mockRejectedValue(new Error('Estimation failed'));

      const estimateGasWithBuffer = (blockchain as any).estimateGasWithBuffer.bind(blockchain);

      const gasLimit = await estimateGasWithBuffer(
        async () => await mockEstimateGas(),
        200_000n,
        'test'
      );

      expect(gasLimit).toBe(200_000n);
      expect(mockEstimateGas).toHaveBeenCalled();
    });

    it('should respect custom GAS_BUFFER_PERCENT env var', async () => {
      process.env.GAS_BUFFER_PERCENT = '50';

      const blockchainWithCustomBuffer = new BlockchainService(
        TEST_RPC,
        TEST_PRIVATE_KEY,
        TEST_ARBIUS_ADDRESS,
        TEST_ROUTER_ADDRESS,
        TEST_TOKEN_ADDRESS
      );

      const mockEstimateGas = vi.fn().mockResolvedValue(100_000n);
      const estimateGasWithBuffer = (blockchainWithCustomBuffer as any).estimateGasWithBuffer.bind(blockchainWithCustomBuffer);

      const gasLimit = await estimateGasWithBuffer(
        async () => await mockEstimateGas(),
        200_000n,
        'test'
      );

      // 50% buffer: 100_000 * 1.5 = 150_000
      expect(gasLimit).toBe(150_000n);

      delete process.env.GAS_BUFFER_PERCENT;
    });
  });
});
