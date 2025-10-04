import { renderHook } from '@testing-library/react';
import { useActiveChainId } from '../useActiveChainId';

jest.mock('wagmi', () => ({
  useChainId: jest.fn(),
}));

import { useChainId } from 'wagmi';

const mockUseChainId = useChainId as jest.MockedFunction<typeof useChainId>;

describe('useActiveChainId', () => {
  it('should return connected chain ID when wallet is connected', () => {
    mockUseChainId.mockReturnValue(1);

    const { result } = renderHook(() => useActiveChainId());

    expect(result.current).toBe(1);
  });

  it('should return Arbitrum One (42161) when no wallet is connected', () => {
    mockUseChainId.mockReturnValue(undefined);

    const { result } = renderHook(() => useActiveChainId());

    expect(result.current).toBe(42161);
  });

  it('should return Arbitrum One (42161) when chain ID is 0', () => {
    mockUseChainId.mockReturnValue(0);

    const { result } = renderHook(() => useActiveChainId());

    expect(result.current).toBe(42161);
  });

  it('should return correct chain ID for different networks', () => {
    const testCases = [
      { chainId: 1, expected: 1 }, // Ethereum
      { chainId: 137, expected: 137 }, // Polygon
      { chainId: 42161, expected: 42161 }, // Arbitrum
      { chainId: 10, expected: 10 }, // Optimism
    ];

    testCases.forEach(({ chainId, expected }) => {
      mockUseChainId.mockReturnValue(chainId);

      const { result } = renderHook(() => useActiveChainId());

      expect(result.current).toBe(expected);
    });
  });
});
