import { useAccount, useReadContract, useChainId } from 'wagmi'
import { formatUnits } from 'viem'
import baseTokenAbi from '@/abis/baseTokenV1.json'
import { ARBIUS_CONFIG } from '@/config/arbius'

/**
 * Hook to fetch user's AIUS token balance
 * @returns Object with balance data and formatted string
 */
export function useTokenBalance() {
  const { address } = useAccount()
  const chainId = useChainId()

  const config = ARBIUS_CONFIG[chainId as keyof typeof ARBIUS_CONFIG]
  const baseTokenAddress = config?.baseTokenAddress

  const { data, isLoading, error, refetch } = useReadContract({
    address: baseTokenAddress,
    abi: baseTokenAbi.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!baseTokenAddress },
  })

  const balance = data ? (data as bigint) : BigInt(0)
  const formatted = formatUnits(balance, 18)

  return {
    balance,
    formatted,
    isLoading,
    error,
    refetch,
  }
}
