import { renderHook, waitFor } from '@testing-library/react';
import { useTokenApproval } from '@/hooks/useTokenApproval';
import { useAccount, useReadContract, useChainId } from 'wagmi';
import { useContractWriteHook } from '@/hooks/useContractWrite';
import { parseUnits } from 'viem';

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
  useReadContract: jest.fn(),
  useChainId: jest.fn(),
}));

jest.mock('@/hooks/useContractWrite', () => ({
  useContractWriteHook: jest.fn(),
}));

jest.mock('@/config/arbius', () => ({
  ARBIUS_CONFIG: {
    42161: {
      baseTokenAddress: '0x1234567890123456789012345678901234567890',
    },
    1: {
      baseTokenAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    },
  },
}));

const mockUseAccount = useAccount as jest.MockedFunction<typeof useAccount>;
const mockUseReadContract = useReadContract as jest.MockedFunction<typeof useReadContract>;
const mockUseChainId = useChainId as jest.MockedFunction<typeof useChainId>;
const mockUseContractWriteHook = useContractWriteHook as jest.MockedFunction<typeof useContractWriteHook>;

describe('useTokenApproval', () => {
  const mockSpenderAddress = '0x9876543210987654321098765432109876543210' as const;
  const mockUserAddress = '0x1111111111111111111111111111111111111111' as const;
  const mockWriteContract = jest.fn();
  const mockRefetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAccount.mockReturnValue({
      address: mockUserAddress,
    } as any);

    mockUseChainId.mockReturnValue(42161);

    mockUseReadContract.mockReturnValue({
      data: BigInt(0),
      refetch: mockRefetch,
    } as any);

    mockUseContractWriteHook.mockReturnValue({
      write: mockWriteContract,
      isPending: false,
      isSuccess: false,
      error: null,
    } as any);
  });

  it('should return zero allowance when no approval exists', () => {
    mockUseReadContract.mockReturnValue({
      data: BigInt(0),
      refetch: mockRefetch,
    } as any);

    const { result } = renderHook(() => useTokenApproval(mockSpenderAddress));

    expect(result.current.allowance).toBe(BigInt(0));
  });

  it('should return current allowance when approved', () => {
    const allowanceAmount = parseUnits('100', 18);
    mockUseReadContract.mockReturnValue({
      data: allowanceAmount,
      refetch: mockRefetch,
    } as any);

    const { result } = renderHook(() => useTokenApproval(mockSpenderAddress));

    expect(result.current.allowance).toBe(allowanceAmount);
  });

  it('should check if approval is needed', () => {
    const allowanceAmount = parseUnits('50', 18);
    mockUseReadContract.mockReturnValue({
      data: allowanceAmount,
      refetch: mockRefetch,
    } as any);

    const { result } = renderHook(() => useTokenApproval(mockSpenderAddress));

    // Needs approval for amount greater than allowance
    expect(result.current.needsApproval('100')).toBe(true);

    // Does not need approval for amount less than allowance
    expect(result.current.needsApproval('25')).toBe(false);

    // Does not need approval for zero amount
    expect(result.current.needsApproval('0')).toBe(false);

    // Does not need approval for empty string
    expect(result.current.needsApproval('')).toBe(false);
  });

  it('should handle invalid amounts in needsApproval', () => {
    const { result } = renderHook(() => useTokenApproval(mockSpenderAddress));

    expect(result.current.needsApproval('invalid')).toBe(false);
    expect(result.current.needsApproval('abc')).toBe(false);
  });

  it('should call approve with correct parameters', async () => {
    const { result } = renderHook(() => useTokenApproval(mockSpenderAddress));

    await result.current.approve('100');

    expect(mockWriteContract).toHaveBeenCalledWith({
      address: '0x1234567890123456789012345678901234567890',
      abi: expect.any(Array),
      functionName: 'approve',
      args: [mockSpenderAddress, parseUnits('100', 18)],
    });
  });

  it('should throw error when approving without spender address', async () => {
    const { result } = renderHook(() => useTokenApproval());

    await expect(result.current.approve('100')).rejects.toThrow('Missing required parameters');
  });

  it('should throw error when approving without amount', async () => {
    const { result } = renderHook(() => useTokenApproval(mockSpenderAddress));

    await expect(result.current.approve('')).rejects.toThrow('Missing required parameters');
  });

  it('should show isApproving state during transaction', () => {
    mockUseContractWriteHook.mockReturnValue({
      write: mockWriteContract,
      isPending: true,
      isSuccess: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useTokenApproval(mockSpenderAddress));

    expect(result.current.isApproving).toBe(true);
  });

  it('should show isSuccess state after successful approval', () => {
    mockUseContractWriteHook.mockReturnValue({
      write: mockWriteContract,
      isPending: false,
      isSuccess: true,
      error: null,
    } as any);

    const { result } = renderHook(() => useTokenApproval(mockSpenderAddress));

    expect(result.current.isSuccess).toBe(true);
  });

  it('should return error when approval fails', () => {
    const mockError = new Error('Approval failed');
    mockUseContractWriteHook.mockReturnValue({
      write: mockWriteContract,
      isPending: false,
      isSuccess: false,
      error: mockError,
    } as any);

    const { result } = renderHook(() => useTokenApproval(mockSpenderAddress));

    expect(result.current.error).toBe(mockError);
  });

  it('should provide refetchAllowance function', () => {
    const { result } = renderHook(() => useTokenApproval(mockSpenderAddress));

    result.current.refetchAllowance();

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should use correct token address based on chain ID', () => {
    mockUseChainId.mockReturnValue(1); // Ethereum mainnet

    renderHook(() => useTokenApproval(mockSpenderAddress));

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      })
    );
  });

  it('should disable query when missing required parameters', () => {
    mockUseAccount.mockReturnValue({
      address: undefined,
    } as any);

    renderHook(() => useTokenApproval(mockSpenderAddress));

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        query: { enabled: false },
      })
    );
  });

  it('should enable query when all parameters are present', () => {
    mockUseAccount.mockReturnValue({
      address: mockUserAddress,
    } as any);

    renderHook(() => useTokenApproval(mockSpenderAddress));

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        query: { enabled: true },
      })
    );
  });

  it('should pass correct args to allowance check', () => {
    renderHook(() => useTokenApproval(mockSpenderAddress));

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        args: [mockUserAddress, mockSpenderAddress],
        functionName: 'allowance',
      })
    );
  });

  it('should handle missing spender address gracefully', () => {
    const { result } = renderHook(() => useTokenApproval());

    expect(mockUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        args: undefined,
        query: { enabled: false },
      })
    );

    expect(result.current.allowance).toBe(BigInt(0));
  });
});
