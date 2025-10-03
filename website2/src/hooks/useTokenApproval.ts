import { useAccount, useReadContract, useChainId } from 'wagmi'
import { parseUnits } from 'viem'
import baseTokenAbi from '@/abis/baseTokenV1.json'
import { ARBIUS_CONFIG } from '@/config/arbius'
import { useContractWriteHook } from './useContractWrite'

/**
 * Hook to check token approval and approve tokens
 * @param spenderAddress - Address that will spend the tokens (e.g., veAIUS contract)
 * @returns Object with allowance data and approve function
 */
export function useTokenApproval(spenderAddress?: `0x${string}`) {
  const { address } = useAccount()
  const chainId = useChainId()

  const config = ARBIUS_CONFIG[chainId as keyof typeof ARBIUS_CONFIG]
  const baseTokenAddress = config?.baseTokenAddress

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: baseTokenAddress,
    abi: baseTokenAbi.abi,
    functionName: 'allowance',
    args: address && spenderAddress ? [address, spenderAddress] : undefined,
    query: { enabled: !!address && !!baseTokenAddress && !!spenderAddress },
  })

  const { write: writeContract, isPending, isSuccess, error } = useContractWriteHook()

  const allowanceAmount = allowance ? (allowance as bigint) : BigInt(0)

  /**
   * Check if approval is needed for a given amount
   */
  const needsApproval = (amount: string): boolean => {
    if (!amount || amount === '0') return false
    try {
      const amountBigInt = parseUnits(amount, 18)
      return allowanceAmount < amountBigInt
    } catch {
      return false
    }
  }

  /**
   * Approve tokens for spending
   */
  const approve = async (amount: string) => {
    if (!amount || !spenderAddress || !baseTokenAddress) {
      throw new Error('Missing required parameters')
    }

    const amountBigInt = parseUnits(amount, 18)

    await writeContract({
      address: baseTokenAddress,
      abi: baseTokenAbi.abi,
      functionName: 'approve',
      args: [spenderAddress, amountBigInt],
    })
  }

  return {
    allowance: allowanceAmount,
    needsApproval,
    approve,
    isApproving: isPending,
    isSuccess,
    error,
    refetchAllowance,
  }
}
