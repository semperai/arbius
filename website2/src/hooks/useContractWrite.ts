import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

/**
 * Hook for writing to contracts using viem
 * Example usage:
 *
 * const { write, isPending, isSuccess } = useContractWrite()
 *
 * // Then call:
 * write({
 *   address: '0x...',
 *   abi: myAbi,
 *   functionName: 'transfer',
 *   args: [toAddress, amount],
 * })
 */
export function useContractWriteHook() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    write: writeContract,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}
