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
});
