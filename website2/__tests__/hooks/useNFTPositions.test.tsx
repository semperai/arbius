import { renderHook, waitFor } from '@testing-library/react';
import { useNFTPositions } from '@/hooks/useNFTPositions';
import { useAccount, useReadContract, useChainId, usePublicClient } from 'wagmi';

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
  useReadContract: jest.fn(),
  useChainId: jest.fn(),
  usePublicClient: jest.fn(),
}));

jest.mock('@/config/arbius', () => ({
  ARBIUS_CONFIG: {
    42161: {
      veAIUSAddress: '0x1234567890123456789012345678901234567890',
    },
  },
}));

const mockUseAccount = useAccount as jest.MockedFunction<typeof useAccount>;
const mockUseReadContract = useReadContract as jest.MockedFunction<typeof useReadContract>;
const mockUseChainId = useChainId as jest.MockedFunction<typeof useChainId>;
const mockUsePublicClient = usePublicClient as jest.MockedFunction<typeof usePublicClient>;

describe('useNFTPositions', () => {
  const mockUserAddress = '0x1111111111111111111111111111111111111111';
  const mockRefetch = jest.fn();
  const mockMulticall = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAccount.mockReturnValue({
      address: mockUserAddress,
    } as any);

    mockUseChainId.mockReturnValue(42161);

    mockUsePublicClient.mockReturnValue({
      multicall: mockMulticall,
    } as any);

    mockUseReadContract.mockReturnValue({
      data: BigInt(0),
      refetch: mockRefetch,
    } as any);
  });

  it('should return empty positions when user has no NFTs', async () => {
    mockUseReadContract.mockReturnValue({
      data: BigInt(0),
      refetch: mockRefetch,
    } as any);

    const { result } = renderHook(() => useNFTPositions());

    await waitFor(() => {
      expect(result.current.positions).toEqual([]);
      expect(result.current.count).toBe(0);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should return empty positions when user is not connected', async () => {
    mockUseAccount.mockReturnValue({
      address: undefined,
    } as any);

    const { result } = renderHook(() => useNFTPositions());

    await waitFor(() => {
      expect(result.current.positions).toEqual([]);
      expect(result.current.count).toBe(0);
    });
  });

  it('should fetch positions when user has NFTs', async () => {
    const tokenId1 = BigInt(1);
    const tokenId2 = BigInt(2);

    mockUseReadContract.mockReturnValue({
      data: BigInt(2),
      refetch: mockRefetch,
    } as any);

    // Mock token IDs fetch
    mockMulticall.mockResolvedValueOnce([
      { status: 'success', result: tokenId1 },
      { status: 'success', result: tokenId2 },
    ]);

    // Mock lock data and voting power fetch
    mockMulticall
      .mockResolvedValueOnce([
        { status: 'success', result: [BigInt(1000), BigInt(1735689600)] },
        { status: 'success', result: [BigInt(2000), BigInt(1735776000)] },
      ])
      .mockResolvedValueOnce([
        { status: 'success', result: BigInt(500) },
        { status: 'success', result: BigInt(1000) },
      ]);

    const { result } = renderHook(() => useNFTPositions());

    await waitFor(() => {
      expect(result.current.positions).toHaveLength(2);
      expect(result.current.count).toBe(2);
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.positions[0].tokenId).toBe(tokenId1);
    expect(result.current.positions[0].amount).toBe(BigInt(1000));
    expect(result.current.positions[0].votingPower).toBe(BigInt(500));

    expect(result.current.positions[1].tokenId).toBe(tokenId2);
    expect(result.current.positions[1].amount).toBe(BigInt(2000));
    expect(result.current.positions[1].votingPower).toBe(BigInt(1000));
  });

  it('should handle errors when fetching positions', async () => {
    mockUseReadContract.mockReturnValue({
      data: BigInt(1),
      refetch: mockRefetch,
    } as any);

    const mockError = new Error('Multicall failed');
    mockMulticall.mockRejectedValue(mockError);

    const { result } = renderHook(() => useNFTPositions());

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Multicall failed');
      expect(result.current.positions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle partial failures in multicall results', async () => {
    const tokenId1 = BigInt(1);

    mockUseReadContract.mockReturnValue({
      data: BigInt(2),
      refetch: mockRefetch,
    } as any);

    // First token succeeds, second fails
    mockMulticall.mockResolvedValueOnce([
      { status: 'success', result: tokenId1 },
      { status: 'failure', error: new Error('Failed') },
    ]);

    mockMulticall
      .mockResolvedValueOnce([
        { status: 'success', result: [BigInt(1000), BigInt(1735689600)] },
      ])
      .mockResolvedValueOnce([
        { status: 'success', result: BigInt(500) },
      ]);

    const { result } = renderHook(() => useNFTPositions());

    await waitFor(() => {
      expect(result.current.positions).toHaveLength(1);
      expect(result.current.positions[0].tokenId).toBe(tokenId1);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should show loading state while fetching', async () => {
    mockUseReadContract.mockReturnValue({
      data: BigInt(1),
      refetch: mockRefetch,
    } as any);

    let resolveMulticall: (value: any) => void;
    const multicallPromise = new Promise((resolve) => {
      resolveMulticall = resolve;
    });
    mockMulticall.mockReturnValue(multicallPromise as any);

    const { result } = renderHook(() => useNFTPositions());

    // Should be loading initially
    expect(result.current.isLoading).toBe(true);

    // Resolve the promise
    resolveMulticall!([{ status: 'success', result: BigInt(1) }]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should refetch when refetch is called', () => {
    const { result } = renderHook(() => useNFTPositions());

    result.current.refetch();

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should disable query when address is missing', () => {
    mockUseAccount.mockReturnValue({
      address: undefined,
    } as any);

    renderHook(() => useNFTPositions());

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        query: { enabled: false },
      })
    );
  });

  it('should enable query when address and veAIUS address are present', () => {
    mockUseAccount.mockReturnValue({
      address: mockUserAddress,
    } as any);

    renderHook(() => useNFTPositions());

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        query: { enabled: true },
      })
    );
  });

  it('should use correct veAIUS address from config', () => {
    renderHook(() => useNFTPositions());

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '0x1234567890123456789012345678901234567890',
        functionName: 'balanceOf',
      })
    );
  });

  it('should handle non-Error exceptions in catch block', async () => {
    mockUseReadContract.mockReturnValue({
      data: BigInt(1),
      refetch: mockRefetch,
    } as any);

    mockMulticall.mockRejectedValue('String error');

    const { result } = renderHook(() => useNFTPositions());

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Failed to fetch positions');
      expect(result.current.positions).toEqual([]);
    });
  });

  it('should clear error on successful fetch', async () => {
    // First fetch fails
    mockUseReadContract.mockReturnValue({
      data: BigInt(1),
      refetch: mockRefetch,
    } as any);

    mockMulticall.mockRejectedValueOnce(new Error('First error'));

    const { result, rerender } = renderHook(() => useNFTPositions());

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    // Change NFT balance to trigger new fetch
    mockMulticall.mockResolvedValueOnce([
      { status: 'success', result: BigInt(1) },
    ]);
    mockMulticall
      .mockResolvedValueOnce([
        { status: 'success', result: [BigInt(1000), BigInt(1735689600)] },
      ])
      .mockResolvedValueOnce([
        { status: 'success', result: BigInt(500) },
      ]);

    mockUseReadContract.mockReturnValue({
      data: BigInt(2), // Changed to trigger effect
      refetch: mockRefetch,
    } as any);

    rerender();

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.positions).toHaveLength(1);
    }, { timeout: 2000 });
  });

  it('should set positions array with correct structure', async () => {
    const tokenId = BigInt(123);
    const amount = BigInt(5000);
    const unlockTime = BigInt(1735689600);
    const votingPower = BigInt(2500);

    mockUseReadContract.mockReturnValue({
      data: BigInt(1),
      refetch: mockRefetch,
    } as any);

    mockMulticall.mockResolvedValueOnce([
      { status: 'success', result: tokenId },
    ]);

    mockMulticall
      .mockResolvedValueOnce([
        { status: 'success', result: [amount, unlockTime] },
      ])
      .mockResolvedValueOnce([
        { status: 'success', result: votingPower },
      ]);

    const { result } = renderHook(() => useNFTPositions());

    await waitFor(() => {
      expect(result.current.positions).toHaveLength(1);
      expect(result.current.positions[0]).toMatchObject({
        tokenId,
        amount,
        unlockTime,
        votingPower,
      });
      expect(result.current.positions[0].lockedAt).toBeDefined();
      expect(typeof result.current.positions[0].lockedAt).toBe('bigint');
    }, { timeout: 2000 });
  });
});
