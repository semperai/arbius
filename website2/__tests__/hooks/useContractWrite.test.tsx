import { renderHook } from '@testing-library/react';
import { useContractWriteHook } from '@/hooks/useContractWrite';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

vi.mock('wagmi', () => ({
  useWriteContract: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
}));

const mockUseWriteContract = useWriteContract as vi.MockedFunction<typeof useWriteContract>;
const mockUseWaitForTransactionReceipt = useWaitForTransactionReceipt as vi.MockedFunction<
  typeof useWaitForTransactionReceipt
>;

describe('useContractWriteHook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return write function and default states', () => {
    const mockWriteContract = vi.fn();

    mockUseWriteContract.mockReturnValue({
      data: undefined,
      writeContract: mockWriteContract,
      isPending: false,
      error: null,
    } as any);

    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: false,
    } as any);

    const { result } = renderHook(() => useContractWriteHook());

    expect(result.current.write).toBe(mockWriteContract);
    expect(result.current.hash).toBeUndefined();
    expect(result.current.isPending).toBe(false);
    expect(result.current.isConfirming).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should return hash when transaction is submitted', () => {
    const mockHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const mockWriteContract = vi.fn();

    mockUseWriteContract.mockReturnValue({
      data: mockHash,
      writeContract: mockWriteContract,
      isPending: false,
      error: null,
    } as any);

    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: false,
    } as any);

    const { result } = renderHook(() => useContractWriteHook());

    expect(result.current.hash).toBe(mockHash);
  });

  it('should show pending state during write', () => {
    const mockWriteContract = vi.fn();

    mockUseWriteContract.mockReturnValue({
      data: undefined,
      writeContract: mockWriteContract,
      isPending: true,
      error: null,
    } as any);

    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: false,
    } as any);

    const { result } = renderHook(() => useContractWriteHook());

    expect(result.current.isPending).toBe(true);
  });

  it('should show confirming state while waiting for receipt', () => {
    const mockHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const mockWriteContract = vi.fn();

    mockUseWriteContract.mockReturnValue({
      data: mockHash,
      writeContract: mockWriteContract,
      isPending: false,
      error: null,
    } as any);

    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: true,
      isSuccess: false,
    } as any);

    const { result } = renderHook(() => useContractWriteHook());

    expect(result.current.isConfirming).toBe(true);
    expect(result.current.isSuccess).toBe(false);
  });

  it('should show success state when transaction is confirmed', () => {
    const mockHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const mockWriteContract = vi.fn();

    mockUseWriteContract.mockReturnValue({
      data: mockHash,
      writeContract: mockWriteContract,
      isPending: false,
      error: null,
    } as any);

    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: true,
    } as any);

    const { result } = renderHook(() => useContractWriteHook());

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isConfirming).toBe(false);
  });

  it('should return error when write fails', () => {
    const mockError = new Error('Transaction failed');
    const mockWriteContract = vi.fn();

    mockUseWriteContract.mockReturnValue({
      data: undefined,
      writeContract: mockWriteContract,
      isPending: false,
      error: mockError,
    } as any);

    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: false,
    } as any);

    const { result } = renderHook(() => useContractWriteHook());

    expect(result.current.error).toBe(mockError);
  });

  it('should pass hash to useWaitForTransactionReceipt', () => {
    const mockHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const mockWriteContract = vi.fn();

    mockUseWriteContract.mockReturnValue({
      data: mockHash,
      writeContract: mockWriteContract,
      isPending: false,
      error: null,
    } as any);

    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: false,
    } as any);

    renderHook(() => useContractWriteHook());

    expect(mockUseWaitForTransactionReceipt).toHaveBeenCalledWith({
      hash: mockHash,
    });
  });

  it('should handle transition from pending to confirming to success', () => {
    const mockHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const mockWriteContract = vi.fn();

    // Initial state - pending
    mockUseWriteContract.mockReturnValue({
      data: undefined,
      writeContract: mockWriteContract,
      isPending: true,
      error: null,
    } as any);

    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: false,
    } as any);

    const { result, rerender } = renderHook(() => useContractWriteHook());

    expect(result.current.isPending).toBe(true);
    expect(result.current.isConfirming).toBe(false);
    expect(result.current.isSuccess).toBe(false);

    // Transaction submitted - confirming
    mockUseWriteContract.mockReturnValue({
      data: mockHash,
      writeContract: mockWriteContract,
      isPending: false,
      error: null,
    } as any);

    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: true,
      isSuccess: false,
    } as any);

    rerender();

    expect(result.current.isPending).toBe(false);
    expect(result.current.isConfirming).toBe(true);
    expect(result.current.isSuccess).toBe(false);

    // Transaction confirmed - success
    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: true,
    } as any);

    rerender();

    expect(result.current.isPending).toBe(false);
    expect(result.current.isConfirming).toBe(false);
    expect(result.current.isSuccess).toBe(true);
  });
});
