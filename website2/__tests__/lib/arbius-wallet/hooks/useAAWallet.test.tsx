import { renderHook, waitFor } from '@testing-library/react';
import { useAAWallet } from '../useAAWallet';
import * as viemWalletUtils from '../../utils/viemWalletUtils';
import { AAWalletContext } from '../../components/AAWalletProvider';
import { type PrivateKeyAccount } from 'viem';
import React from 'react';

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
  useWalletClient: jest.fn(),
  usePublicClient: jest.fn(),
}));
jest.mock('../../utils/viemWalletUtils');

import { useAccount, useWalletClient, usePublicClient } from 'wagmi';

const mockUseAccount = useAccount as jest.MockedFunction<typeof useAccount>;
const mockUseWalletClient = useWalletClient as jest.MockedFunction<typeof useWalletClient>;
const mockUsePublicClient = usePublicClient as jest.MockedFunction<typeof usePublicClient>;

describe('useAAWallet', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;
  const mockSmartAccountAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as `0x${string}`;
  const mockSignature = '0xsignature' as `0x${string}`;

  const mockWalletClient = {
    signMessage: jest.fn().mockResolvedValue(mockSignature),
  };

  const mockPublicClient = {
    estimateGas: jest.fn().mockResolvedValue(BigInt(21000)),
  };

  const mockDerivedAccount: PrivateKeyAccount = {
    address: mockSmartAccountAddress,
    signMessage: jest.fn().mockResolvedValue(mockSignature),
    signTransaction: jest.fn(),
    signTypedData: jest.fn(),
    source: 'privateKey',
    type: 'local',
  } as any;

  const mockContextValue = {
    isConnected: false,
    address: null,
    chainId: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AAWalletContext.Provider value={mockContextValue}>
      {children}
    </AAWalletContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccount.mockReturnValue({ address: undefined } as any);
    mockUseWalletClient.mockReturnValue({ data: undefined } as any);
    mockUsePublicClient.mockReturnValue(undefined as any);
  });

  it('should return context values and null states when not connected', () => {
    const { result } = renderHook(() => useAAWallet(), { wrapper });

    expect(result.current.smartAccountAddress).toBeNull();
    expect(result.current.derivedAccount).toBeNull();
    expect(result.current.isInitializing).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should initialize wallet when connected', async () => {
    jest.spyOn(viemWalletUtils, 'getCachedWalletAddress').mockReturnValue(null);
    jest.spyOn(viemWalletUtils, 'initDeterministicWallet').mockResolvedValue(mockDerivedAccount);

    mockUseAccount.mockReturnValue({ address: mockAddress } as any);
    mockUseWalletClient.mockReturnValue({ data: mockWalletClient } as any);

    const { result } = renderHook(() => useAAWallet(), { wrapper });

    await waitFor(() => {
      expect(result.current.smartAccountAddress).toBe(mockSmartAccountAddress);
      expect(result.current.derivedAccount).toBe(mockDerivedAccount);
      expect(result.current.isInitializing).toBe(false);
    });

    expect(viemWalletUtils.initDeterministicWallet).toHaveBeenCalledWith(
      mockAddress,
      expect.any(Function)
    );
  });

  it('should use cached wallet if available', async () => {
    jest.spyOn(viemWalletUtils, 'getCachedWalletAddress').mockReturnValue(mockSmartAccountAddress);
    jest.spyOn(viemWalletUtils, 'getCachedWallet').mockReturnValue(mockDerivedAccount);
    const initSpy = jest.spyOn(viemWalletUtils, 'initDeterministicWallet');

    mockUseAccount.mockReturnValue({ address: mockAddress } as any);
    mockUseWalletClient.mockReturnValue({ data: mockWalletClient } as any);

    const { result } = renderHook(() => useAAWallet(), { wrapper });

    await waitFor(() => {
      expect(result.current.smartAccountAddress).toBe(mockSmartAccountAddress);
      expect(result.current.derivedAccount).toBe(mockDerivedAccount);
    });

    expect(initSpy).not.toHaveBeenCalled();
  });

  it('should handle initialization errors', async () => {
    const errorMessage = 'Failed to initialize';
    jest.spyOn(viemWalletUtils, 'getCachedWalletAddress').mockReturnValue(null);
    jest.spyOn(viemWalletUtils, 'initDeterministicWallet').mockRejectedValue(new Error(errorMessage));

    mockUseAccount.mockReturnValue({ address: mockAddress } as any);
    mockUseWalletClient.mockReturnValue({ data: mockWalletClient } as any);

    const { result } = renderHook(() => useAAWallet(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isInitializing).toBe(false);
    });
  });

  it('should sign message with AA wallet', async () => {
    jest.spyOn(viemWalletUtils, 'getCachedWalletAddress').mockReturnValue(mockSmartAccountAddress);
    jest.spyOn(viemWalletUtils, 'getCachedWallet').mockReturnValue(mockDerivedAccount);

    mockUseAccount.mockReturnValue({ address: mockAddress } as any);
    mockUseWalletClient.mockReturnValue({ data: mockWalletClient } as any);

    const { result } = renderHook(() => useAAWallet(), { wrapper });

    await waitFor(() => {
      expect(result.current.derivedAccount).toBe(mockDerivedAccount);
    });

    const signature = await result.current.signMessageWithAAWallet('test message');

    expect(signature).toBe(mockSignature);
    expect(mockDerivedAccount.signMessage).toHaveBeenCalledWith({ message: 'test message' });
  });

  it('should return null when signing message without derived account', async () => {
    const { result } = renderHook(() => useAAWallet(), { wrapper });

    const signature = await result.current.signMessageWithAAWallet('test message');

    expect(signature).toBeNull();
  });

  it('should handle signing errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockFailingAccount = {
      ...mockDerivedAccount,
      signMessage: jest.fn().mockRejectedValue(new Error('Signing failed')),
    };

    jest.spyOn(viemWalletUtils, 'getCachedWalletAddress').mockReturnValue(mockSmartAccountAddress);
    jest.spyOn(viemWalletUtils, 'getCachedWallet').mockReturnValue(mockFailingAccount);

    mockUseAccount.mockReturnValue({ address: mockAddress } as any);
    mockUseWalletClient.mockReturnValue({ data: mockWalletClient } as any);

    const { result } = renderHook(() => useAAWallet(), { wrapper });

    await waitFor(() => {
      expect(result.current.derivedAccount).toBe(mockFailingAccount);
    });

    const signature = await result.current.signMessageWithAAWallet('test message');

    expect(signature).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to sign message:', 'Signing failed');

    consoleErrorSpy.mockRestore();
  });

  it('should estimate gas successfully', async () => {
    jest.spyOn(viemWalletUtils, 'getCachedWalletAddress').mockReturnValue(mockSmartAccountAddress);
    jest.spyOn(viemWalletUtils, 'getCachedWallet').mockReturnValue(mockDerivedAccount);

    mockUseAccount.mockReturnValue({ address: mockAddress } as any);
    mockUseWalletClient.mockReturnValue({ data: mockWalletClient } as any);
    mockUsePublicClient.mockReturnValue(mockPublicClient as any);

    const { result } = renderHook(() => useAAWallet(), { wrapper });

    await waitFor(() => {
      expect(result.current.smartAccountAddress).toBe(mockSmartAccountAddress);
    });

    const gas = await result.current.estimateGas(
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0' as `0x${string}`,
      '0x' as `0x${string}`,
      BigInt(100)
    );

    expect(gas).toBe(BigInt(21000));
    expect(mockPublicClient.estimateGas).toHaveBeenCalledWith({
      account: mockSmartAccountAddress,
      to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
      data: '0x',
      value: BigInt(100),
    });
  });

  it('should return null when estimating gas without smart account', async () => {
    const { result } = renderHook(() => useAAWallet(), { wrapper });

    const gas = await result.current.estimateGas(
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0' as `0x${string}`,
      '0x' as `0x${string}`
    );

    expect(gas).toBeNull();
  });

  it('should handle gas estimation errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockFailingPublicClient = {
      estimateGas: jest.fn().mockRejectedValue(new Error('Gas estimation failed')),
    };

    jest.spyOn(viemWalletUtils, 'getCachedWalletAddress').mockReturnValue(mockSmartAccountAddress);
    jest.spyOn(viemWalletUtils, 'getCachedWallet').mockReturnValue(mockDerivedAccount);

    mockUseAccount.mockReturnValue({ address: mockAddress } as any);
    mockUseWalletClient.mockReturnValue({ data: mockWalletClient } as any);
    mockUsePublicClient.mockReturnValue(mockFailingPublicClient as any);

    const { result } = renderHook(() => useAAWallet(), { wrapper });

    await waitFor(() => {
      expect(result.current.smartAccountAddress).toBe(mockSmartAccountAddress);
    });

    const gas = await result.current.estimateGas(
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0' as `0x${string}`,
      '0x' as `0x${string}`
    );

    expect(gas).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to estimate gas:', 'Gas estimation failed');

    consoleErrorSpy.mockRestore();
  });

  it('should not reinitialize for the same address', async () => {
    jest.spyOn(viemWalletUtils, 'getCachedWalletAddress').mockReturnValue(null);
    const initSpy = jest.spyOn(viemWalletUtils, 'initDeterministicWallet').mockResolvedValue(mockDerivedAccount);

    mockUseAccount.mockReturnValue({ address: mockAddress } as any);
    mockUseWalletClient.mockReturnValue({ data: mockWalletClient } as any);

    const { result, rerender } = renderHook(() => useAAWallet(), { wrapper });

    await waitFor(() => {
      expect(result.current.smartAccountAddress).toBe(mockSmartAccountAddress);
    });

    expect(initSpy).toHaveBeenCalledTimes(1);

    // Rerender with same address
    rerender();

    // Should not call init again
    expect(initSpy).toHaveBeenCalledTimes(1);
  });
});
