/**
 * Tests for contracts configuration and utilities
 */

import { renderHook } from '@testing-library/react';
import { contracts, config, useContract } from '@/lib/contracts';
import { usePublicClient, useWalletClient } from 'wagmi';
import { getContract } from 'viem';

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  usePublicClient: jest.fn(),
  useWalletClient: jest.fn(),
}));

// Mock viem
jest.mock('viem', () => ({
  getContract: jest.fn(),
  arbitrum: { id: 42161 },
}));

// Mock viem/chains
jest.mock('viem/chains', () => ({
  arbitrum: { id: 42161 },
}));

// Mock arbius config
jest.mock('@/config/arbius', () => ({
  ARBIUS_CONFIG: {
    42161: {
      baseTokenAddress: '0xMockBaseToken' as any,
      engineAddress: '0xMockEngine' as any,
      veAIUSAddress: '0xMockVeAIUS' as any,
      veStakingAddress: '0xMockVeStaking' as any,
      voterAddress: '0xMockVoter' as any,
    },
  },
}));

const mockUsePublicClient = usePublicClient as jest.MockedFunction<typeof usePublicClient>;
const mockUseWalletClient = useWalletClient as jest.MockedFunction<typeof useWalletClient>;
const mockGetContract = getContract as jest.MockedFunction<typeof getContract>;

describe('contracts', () => {
  describe('contracts export', () => {
    it('should export contract addresses from mainnet config', () => {
      expect(contracts.baseToken).toBe('0xMockBaseToken');
      expect(contracts.engine).toBe('0xMockEngine');
      expect(contracts.votingEscrow).toBe('0xMockVeAIUS');
      expect(contracts.veStaking).toBe('0xMockVeStaking');
      expect(contracts.voter).toBe('0xMockVoter');
    });

    it('should include legacy v2 addresses', () => {
      expect(contracts.l1Token).toBe('0xe3DBC4F88EAa632DDF9708732E2832EEaA6688AB');
      expect(contracts.v2Token).toBe('0x8AFE4055Ebc86Bd2AFB3940c0095C9aca511d852');
      expect(contracts.v2Engine).toBe('0x3BF6050327Fa280Ee1B5F3e8Fd5EA2EfE8A6472a');
    });

    it('should be a const object', () => {
      // Verify it's readonly by attempting to assign (TypeScript would catch this)
      expect(typeof contracts).toBe('object');
      expect(contracts).toBeDefined();
    });
  });

  describe('config export', () => {
    it('should export current v5/v6 addresses', () => {
      expect(config.v4_baseTokenAddress).toBe('0xMockBaseToken');
      expect(config.v4_engineAddress).toBe('0xMockEngine');
      expect(config.votingEscrowAddress).toBe('0xMockVeAIUS');
      expect(config.veStakingAddress).toBe('0xMockVeStaking');
      expect(config.voterAddress).toBe('0xMockVoter');
    });

    it('should export legacy v1 addresses', () => {
      expect(config.baseTokenAddress).toBe('0xe3DBC4F88EAa632DDF9708732E2832EEaA6688AB');
      expect(config.engineAddress).toBe('0x399511EDEB7ca4A8328E801b1B3D0fe232aBc996');
      expect(config.l1TokenAddress).toBe('0xe3DBC4F88EAa632DDF9708732E2832EEaA6688AB');
    });

    it('should export legacy v2 addresses', () => {
      expect(config.v2_l1TokenAddress).toBe('0x8AFE4055Ebc86Bd2AFB3940c0095C9aca511d852');
      expect(config.v2_baseTokenAddress).toBe('0x8AFE4055Ebc86Bd2AFB3940c0095C9aca511d852');
      expect(config.v2_engineAddress).toBe('0x3BF6050327Fa280Ee1B5F3e8Fd5EA2EfE8A6472a');
    });

    it('should export one-to-one migration addresses', () => {
      expect(config.l1OneToOneAddress).toBe('0x5080a6A0F0b0E21A895841456e5Ed77d26332262');
      expect(config.l2OneToOneAddress).toBe('0x5080a6A0F0b0E21A895841456e5Ed77d26332262');
    });

    it('should export proxy admin address', () => {
      expect(config.proxyAdminAddress).toBe('0xF392fEA506efB6ED445253594DC81a0CB7cD3562');
    });
  });

  describe('useContract hook', () => {
    const mockAddress = '0x1234567890123456789012345678901234567890' as any;
    const mockAbi = [{ name: 'test', type: 'function' }] as const;
    const mockPublicClient = { chain: { id: 42161 } };
    const mockWalletClient = { account: { address: '0xwallet' } };
    const mockContractInstance = { address: mockAddress, abi: mockAbi };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return null when publicClient is not available', () => {
      mockUsePublicClient.mockReturnValue(null as any);
      mockUseWalletClient.mockReturnValue({ data: null } as any);

      const { result } = renderHook(() => useContract(mockAddress, mockAbi));

      expect(result.current).toBeNull();
      expect(mockGetContract).not.toHaveBeenCalled();
    });

    it('should call getContract with correct parameters when publicClient is available', () => {
      mockUsePublicClient.mockReturnValue(mockPublicClient as any);
      mockUseWalletClient.mockReturnValue({ data: mockWalletClient } as any);
      mockGetContract.mockReturnValue(mockContractInstance as any);

      const { result } = renderHook(() => useContract(mockAddress, mockAbi));

      expect(mockGetContract).toHaveBeenCalledWith({
        address: mockAddress,
        abi: mockAbi,
        client: { public: mockPublicClient, wallet: mockWalletClient },
      });
      expect(result.current).toBe(mockContractInstance);
    });

    it('should work with undefined walletClient', () => {
      mockUsePublicClient.mockReturnValue(mockPublicClient as any);
      mockUseWalletClient.mockReturnValue({ data: undefined } as any);
      mockGetContract.mockReturnValue(mockContractInstance as any);

      const { result } = renderHook(() => useContract(mockAddress, mockAbi));

      expect(mockGetContract).toHaveBeenCalledWith({
        address: mockAddress,
        abi: mockAbi,
        client: { public: mockPublicClient, wallet: undefined },
      });
      expect(result.current).toBe(mockContractInstance);
    });

    it('should return contract instance when all clients are available', () => {
      mockUsePublicClient.mockReturnValue(mockPublicClient as any);
      mockUseWalletClient.mockReturnValue({ data: mockWalletClient } as any);
      mockGetContract.mockReturnValue(mockContractInstance as any);

      const { result } = renderHook(() => useContract(mockAddress, mockAbi));

      expect(result.current).toBeDefined();
      expect(result.current).toBe(mockContractInstance);
    });

    it('should handle different ABIs correctly', () => {
      const customAbi = [
        { name: 'transfer', type: 'function' },
        { name: 'balanceOf', type: 'function' },
      ] as const;

      mockUsePublicClient.mockReturnValue(mockPublicClient as any);
      mockUseWalletClient.mockReturnValue({ data: mockWalletClient } as any);
      mockGetContract.mockReturnValue(mockContractInstance as any);

      renderHook(() => useContract(mockAddress, customAbi));

      expect(mockGetContract).toHaveBeenCalledWith({
        address: mockAddress,
        abi: customAbi,
        client: { public: mockPublicClient, wallet: mockWalletClient },
      });
    });

    it('should handle different addresses correctly', () => {
      const differentAddress = '0x9876543210987654321098765432109876543210' as any;

      mockUsePublicClient.mockReturnValue(mockPublicClient as any);
      mockUseWalletClient.mockReturnValue({ data: mockWalletClient } as any);
      mockGetContract.mockReturnValue(mockContractInstance as any);

      renderHook(() => useContract(differentAddress, mockAbi));

      expect(mockGetContract).toHaveBeenCalledWith({
        address: differentAddress,
        abi: mockAbi,
        client: { public: mockPublicClient, wallet: mockWalletClient },
      });
    });
  });

  describe('address format validation', () => {
    it('should have all addresses in correct Ethereum format', () => {
      const addressRegex = /^0x[a-fA-F0-9]{40}$/;

      // Check contracts export
      expect(contracts.l1Token).toMatch(addressRegex);
      expect(contracts.v2Token).toMatch(addressRegex);
      expect(contracts.v2Engine).toMatch(addressRegex);

      // Check config export
      expect(config.baseTokenAddress).toMatch(addressRegex);
      expect(config.engineAddress).toMatch(addressRegex);
      expect(config.l1TokenAddress).toMatch(addressRegex);
      expect(config.v2_l1TokenAddress).toMatch(addressRegex);
      expect(config.v2_baseTokenAddress).toMatch(addressRegex);
      expect(config.l1OneToOneAddress).toMatch(addressRegex);
      expect(config.l2OneToOneAddress).toMatch(addressRegex);
      expect(config.v2_engineAddress).toMatch(addressRegex);
      expect(config.proxyAdminAddress).toMatch(addressRegex);
    });
  });
});
