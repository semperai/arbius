import { renderHook } from '@testing-library/react';
import { useVeAIUSBalance } from '@/hooks/useVeAIUSBalance';
import { useAccount, useReadContract, useChainId } from 'wagmi';
import { formatUnits } from 'viem';

vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useReadContract: vi.fn(),
  useChainId: vi.fn(),
}));

vi.mock('@/config/arbius', () => ({
  ARBIUS_CONFIG: {
    42161: {
      veAIUSAddress: '0x1234567890123456789012345678901234567890',
    },
    1: {
      veAIUSAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    },
  },
}));

const mockUseAccount = useAccount as vi.MockedFunction<typeof useAccount>;
const mockUseReadContract = useReadContract as vi.MockedFunction<typeof useReadContract>;
const mockUseChainId = useChainId as vi.MockedFunction<typeof useChainId>;

describe('useVeAIUSBalance', () => {
  const mockUserAddress = '0x1111111111111111111111111111111111111111';
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAccount.mockReturnValue({
      address: mockUserAddress,
    } as any);

    mockUseChainId.mockReturnValue(42161);

    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);
  });

  it('should return zero balance when user has no veAIUS', () => {
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    const { result } = renderHook(() => useVeAIUSBalance());

    expect(result.current.balance).toBe(BigInt(0));
    expect(result.current.formatted).toBe(formatUnits(BigInt(0), 18));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should return veAIUS balance when user has balance', () => {
    const mockBalance = BigInt('1000000000000000000000'); // 1000 veAIUS

    mockUseReadContract.mockReturnValue({
      data: mockBalance,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    const { result } = renderHook(() => useVeAIUSBalance());

    expect(result.current.balance).toBe(mockBalance);
    expect(result.current.formatted).toBe('1000');
    expect(result.current.isLoading).toBe(false);
  });

  it('should format balance correctly with decimals', () => {
    const mockBalance = BigInt('123456789012345678901'); // 123.456... veAIUS

    mockUseReadContract.mockReturnValue({
      data: mockBalance,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    const { result } = renderHook(() => useVeAIUSBalance());

    expect(result.current.formatted).toBe(formatUnits(mockBalance, 18));
  });

  it('should call useReadContract with correct parameters', () => {
    renderHook(() => useVeAIUSBalance());

    expect(mockUseReadContract).toHaveBeenCalledWith({
      address: '0x1234567890123456789012345678901234567890',
      abi: expect.any(Array),
      functionName: 'balanceOf',
      args: [mockUserAddress],
      query: { enabled: true },
    });
  });

  it('should disable query when user is not connected', () => {
    mockUseAccount.mockReturnValue({
      address: undefined,
    } as any);

    renderHook(() => useVeAIUSBalance());

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        args: undefined,
        query: { enabled: false },
      })
    );
  });

  it('should use correct veAIUS address for different chains', () => {
    mockUseChainId.mockReturnValue(1); // Ethereum mainnet

    renderHook(() => useVeAIUSBalance());

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      })
    );
  });

  it('should handle loading state', () => {
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    } as any);

    const { result } = renderHook(() => useVeAIUSBalance());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.balance).toBe(BigInt(0));
  });

  it('should handle error state', () => {
    const mockError = new Error('Failed to fetch balance');

    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
      refetch: mockRefetch,
    } as any);

    const { result } = renderHook(() => useVeAIUSBalance());

    expect(result.current.error).toBe(mockError);
    expect(result.current.balance).toBe(BigInt(0));
  });

  it('should provide refetch function', () => {
    const { result } = renderHook(() => useVeAIUSBalance());

    result.current.refetch();

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should handle very large balances', () => {
    const largeBalance = BigInt('999999999999999999999999'); // ~1M veAIUS

    mockUseReadContract.mockReturnValue({
      data: largeBalance,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    const { result } = renderHook(() => useVeAIUSBalance());

    expect(result.current.balance).toBe(largeBalance);
    expect(result.current.formatted).toBe(formatUnits(largeBalance, 18));
  });

  it('should handle very small balances', () => {
    const smallBalance = BigInt('1000000000000'); // 0.000001 veAIUS

    mockUseReadContract.mockReturnValue({
      data: smallBalance,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    const { result } = renderHook(() => useVeAIUSBalance());

    expect(result.current.balance).toBe(smallBalance);
    expect(result.current.formatted).toBe(formatUnits(smallBalance, 18));
  });

  it('should return BigInt(0) when data is null', () => {
    mockUseReadContract.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    const { result } = renderHook(() => useVeAIUSBalance());

    expect(result.current.balance).toBe(BigInt(0));
    expect(result.current.formatted).toBe('0');
  });

  it('should update when balance changes', () => {
    const initialBalance = BigInt('1000000000000000000000');
    const updatedBalance = BigInt('2000000000000000000000');

    mockUseReadContract.mockReturnValue({
      data: initialBalance,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    const { result, rerender } = renderHook(() => useVeAIUSBalance());

    expect(result.current.balance).toBe(initialBalance);

    mockUseReadContract.mockReturnValue({
      data: updatedBalance,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as any);

    rerender();

    expect(result.current.balance).toBe(updatedBalance);
    expect(result.current.formatted).toBe('2000');
  });

  it('should disable query when veAIUS address is not available', () => {
    mockUseChainId.mockReturnValue(999); // Unsupported chain

    renderHook(() => useVeAIUSBalance());

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: undefined,
        query: { enabled: false },
      })
    );
  });
});
