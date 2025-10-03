import { useAccount, useReadContract, useChainId, usePublicClient } from 'wagmi'
import { useState, useEffect } from 'react'
import { parseAbi } from 'viem'
import { ARBIUS_CONFIG } from '@/config/arbius'
import type { LockPosition } from '@/types/staking'

const VE_AIUS_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function balanceOfNFT(uint256 tokenId) view returns (uint256)',
  'function locked(uint256 tokenId) view returns (int128 amount, uint256 end)',
])

/**
 * Hook to fetch all user's veAIUS NFT positions
 * Uses multicall for efficient batch fetching
 * @returns Object with positions array and loading state
 */
export function useNFTPositions() {
  const { address } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const [positions, setPositions] = useState<LockPosition[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const config = ARBIUS_CONFIG[chainId as keyof typeof ARBIUS_CONFIG]
  const veAIUSAddress = config?.veAIUSAddress

  // Get user's NFT balance (count)
  const { data: nftBalance, refetch: refetchCount } = useReadContract({
    address: veAIUSAddress,
    abi: VE_AIUS_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!veAIUSAddress },
  })

  // Fetch all positions when NFT balance changes
  useEffect(() => {
    async function fetchPositions() {
      if (!nftBalance || !address || !veAIUSAddress || !publicClient || nftBalance === BigInt(0)) {
        setPositions([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const count = Number(nftBalance)
        const newPositions: LockPosition[] = []

        // Batch fetch all token IDs
        const tokenIdCalls = Array.from({ length: count }, (_, i) => ({
          address: veAIUSAddress,
          abi: VE_AIUS_ABI,
          functionName: 'tokenOfOwnerByIndex' as const,
          args: [address, BigInt(i)],
        }))

        const tokenIds = await publicClient.multicall({ contracts: tokenIdCalls })

        // Batch fetch lock data and voting power
        const lockCalls = tokenIds
          .filter((result) => result.status === 'success')
          .map((result) => ({
            address: veAIUSAddress,
            abi: VE_AIUS_ABI,
            functionName: 'locked' as const,
            args: [result.result as bigint],
          }))

        const votingPowerCalls = tokenIds
          .filter((result) => result.status === 'success')
          .map((result) => ({
            address: veAIUSAddress,
            abi: VE_AIUS_ABI,
            functionName: 'balanceOfNFT' as const,
            args: [result.result as bigint],
          }))

        const [lockResults, votingPowerResults] = await Promise.all([
          publicClient.multicall({ contracts: lockCalls }),
          publicClient.multicall({ contracts: votingPowerCalls }),
        ])

        // Combine results
        tokenIds.forEach((tokenIdResult, i) => {
          if (tokenIdResult.status === 'success' && lockResults[i]?.status === 'success' && votingPowerResults[i]?.status === 'success') {
            const tokenId = tokenIdResult.result as bigint
            const lockData = lockResults[i].result as [bigint, bigint]
            const votingPower = votingPowerResults[i].result as bigint

            newPositions.push({
              tokenId,
              amount: lockData[0],
              unlockTime: lockData[1],
              votingPower,
              lockedAt: BigInt(Math.floor(Date.now() / 1000)), // Approximate
            })
          }
        })

        setPositions(newPositions)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch positions'))
        setPositions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPositions()
  }, [nftBalance, address, veAIUSAddress, publicClient])

  const refetch = () => {
    refetchCount()
  }

  return {
    positions,
    isLoading,
    error,
    refetch,
    count: nftBalance ? Number(nftBalance) : 0,
  }
}
