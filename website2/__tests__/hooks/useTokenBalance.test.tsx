import { renderHook } from '@testing-library/react';
import { useTokenBalance } from '../useTokenBalance';
import { formatUnits } from 'viem';

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
  useReadContract: jest.fn(),
  useChainId: jest.fn(),
}));

jest.mock('viem', () => ({
  formatUnits: jest.fn(),
}));

jest.mock('@/config/arbius', () => ({
  ARBIUS_CONFIG: {
    42161: {
      baseTokenAddress: '0x123456789' as `0x${string}`,
    },
    1: {
      baseTokenAddress: '0xabcdefabc' as `0x${string}`,
    },
  },
}));

import { useAccount, useReadContract, useChainId } from 'wagmi';

const mockUseAccount = useAccount as jest.MockedFunction<typeof useAccount>;
const mockUseReadContract = useReadContract as jest.MockedFunction<typeof useReadContract>;
const mockUseChainId = useChainId as jest.MockedFunction<typeof useChainId>;
const mockFormatUnits = formatUnits as jest.MockedFunction<typeof formatUnits>;

describe('useTokenBalance', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatUnits.mockImplementation((value: bigint) => (Number(value) / 1e18).toString());
  });

  it('should return zero balance when no address is connected', () => {
    mockUseAccount.mockReturnValue({ address: undefined } as any);
    mockUseChainId.mockReturnValue(42161);
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    const { result } = renderHook(() => useTokenBalance());

    expect(result.current.balance).toBe(BigInt(0));
    expect(result.current.formatted).toBe('0');
    expect(result.current.isLoading).toBe(false);
  });

  it('should fetch balance when address is connected', () => {
    const mockBalance = BigInt(1000000000000000000); // 1 token
    mockUseAccount.mockReturnValue({ address: mockAddress } as any);
    mockUseChainId.mockReturnValue(42161);
    mockUseReadContract.mockReturnValue({
      data: mockBalance,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    const { result } = renderHook(() => useTokenBalance());

    expect(result.current.balance).toBe(mockBalance);
    expect(mockFormatUnits).toHaveBeenCalledWith(mockBalance, 18);
  });

  it('should pass correct parameters to useReadContract', () => {
    mockUseAccount.mockReturnValue({ address: mockAddress } as any);
    mockUseChainId.mockReturnValue(42161);
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    renderHook(() => useTokenBalance());

    expect(mockUseReadContract).toHaveBeenCalledWith({
      address: '0x123456789',
      abi: expect.any(Array),
      functionName: 'balanceOf',
      args: [mockAddress],
      query: { enabled: true },
    });
  });

  it('should disable query when no address is connected', () => {
    mockUseAccount.mockReturnValue({ address: undefined } as any);
    mockUseChainId.mockReturnValue(42161);
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    renderHook(() => useTokenBalance());

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        args: undefined,
        query: { enabled: false },
      })
    );
  });

  it('should handle different chain IDs', () => {
    mockUseAccount.mockReturnValue({ address: mockAddress } as any);
    mockUseChainId.mockReturnValue(1); // Ethereum mainnet
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    renderHook(() => useTokenBalance());

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '0xabcdefabc',
      })
    );
  });

  it('should return loading state', () => {
    mockUseAccount.mockReturnValue({ address: mockAddress } as any);
    mockUseChainId.mockReturnValue(42161);
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    } as any);

    const { result } = renderHook(() => useTokenBalance());

    expect(result.current.isLoading).toBe(true);
  });

  it('should return error state', () => {
    const mockError = new Error('Failed to fetch');
    mockUseAccount.mockReturnValue({ address: mockAddress } as any);
    mockUseChainId.mockReturnValue(42161);
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
      refetch: jest.fn(),
    } as any);

    const { result } = renderHook(() => useTokenBalance());

    expect(result.current.error).toBe(mockError);
  });

  it('should provide refetch function', () => {
    const mockRefetch = jest.fn();
    mockUseAccount.mockReturnValue({ address: mockAddress } as any);
    mockUseChainId.mockReturnValue(42161);
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    const { result } = renderHook(() => useTokenBalance());

    expect(result.current.refetch).toBe(mockRefetch);
  });

  it('should handle undefined config for unsupported chain', () => {
    mockUseAccount.mockReturnValue({ address: mockAddress } as any);
    mockUseChainId.mockReturnValue(999); // Unsupported chain
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    renderHook(() => useTokenBalance());

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: undefined,
        query: { enabled: false },
      })
    );
  });
});
