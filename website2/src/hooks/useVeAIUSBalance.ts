import { useAccount, useReadContract, useChainId } from 'wagmi'
import { formatUnits } from 'viem'
import votingEscrowAbi from '@/abis/votingEscrow.json'
import { ARBIUS_CONFIG } from '@/config/arbius'

/**
 * Hook to fetch user's veAIUS balance (voting power)
 * @returns Object with balance data and formatted string
 */
export function useVeAIUSBalance() {
  const { address } = useAccount()
  const chainId = useChainId()

  const config = ARBIUS_CONFIG[chainId as keyof typeof ARBIUS_CONFIG]
  const veAIUSAddress = config?.veAIUSAddress

  const { data, isLoading, error, refetch } = useReadContract({
    address: veAIUSAddress,
    abi: votingEscrowAbi.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!veAIUSAddress },
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
