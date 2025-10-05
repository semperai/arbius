import { renderHook } from '@testing-library/react';
import { useContractReadHook } from '@/hooks/useContractRead';
import { useReadContract } from 'wagmi';

vi.mock('wagmi', () => ({
  useReadContract: vi.fn(),
}));

const mockUseReadContract = useReadContract as vi.MockedFunction<typeof useReadContract>;

describe('useContractReadHook', () => {
  const mockAbi = [
    {
      name: 'balanceOf',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ name: 'balance', type: 'uint256' }],
    },
  ] as const;

  const mockAddress = '0x1234567890123456789012345678901234567890' as const;
  const mockArgs = ['0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'] as const;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call useReadContract with correct parameters', () => {
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const config = {
      address: mockAddress,
      abi: mockAbi,
      functionName: 'balanceOf',
      args: mockArgs,
    };

    renderHook(() => useContractReadHook(config));

    expect(mockUseReadContract).toHaveBeenCalledWith({
      address: mockAddress,
      abi: mockAbi,
      functionName: 'balanceOf',
      args: mockArgs,
      query: {
        enabled: undefined,
      },
    });
  });

  it('should pass enabled flag correctly', () => {
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const config = {
      address: mockAddress,
      abi: mockAbi,
      functionName: 'balanceOf',
      args: mockArgs,
      enabled: false,
    };

    renderHook(() => useContractReadHook(config));

    expect(mockUseReadContract).toHaveBeenCalledWith({
      address: mockAddress,
      abi: mockAbi,
      functionName: 'balanceOf',
      args: mockArgs,
      query: {
        enabled: false,
      },
    });
  });

  it('should return data from useReadContract', () => {
    const mockData = BigInt(1000);
    mockUseReadContract.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const config = {
      address: mockAddress,
      abi: mockAbi,
      functionName: 'balanceOf',
      args: mockArgs,
    };

    const { result } = renderHook(() => useContractReadHook(config));

    expect(result.current.data).toBe(mockData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('should handle loading state', () => {
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    const config = {
      address: mockAddress,
      abi: mockAbi,
      functionName: 'balanceOf',
      args: mockArgs,
    };

    const { result } = renderHook(() => useContractReadHook(config));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should handle error state', () => {
    const mockError = new Error('Contract read failed');
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: mockError,
    } as any);

    const config = {
      address: mockAddress,
      abi: mockAbi,
      functionName: 'balanceOf',
      args: mockArgs,
    };

    const { result } = renderHook(() => useContractReadHook(config));

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(mockError);
  });

  it('should work without args parameter', () => {
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const config = {
      address: mockAddress,
      abi: mockAbi,
      functionName: 'totalSupply',
    };

    renderHook(() => useContractReadHook(config));

    expect(mockUseReadContract).toHaveBeenCalledWith({
      address: mockAddress,
      abi: mockAbi,
      functionName: 'totalSupply',
      args: undefined,
      query: {
        enabled: undefined,
      },
    });
  });

  it('should update when enabled changes', () => {
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const { rerender } = renderHook(
      ({ enabled }) =>
        useContractReadHook({
          address: mockAddress,
          abi: mockAbi,
          functionName: 'balanceOf',
          args: mockArgs,
          enabled,
        }),
      { initialProps: { enabled: false } }
    );

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        query: { enabled: false },
      })
    );

    rerender({ enabled: true });

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        query: { enabled: true },
      })
    );
  });
});
