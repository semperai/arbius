import { getContract, type Address } from 'viem'
import { usePublicClient, useWalletClient } from 'wagmi'
import config from './config.json'

// Contract addresses
export const contracts = {
  baseToken: config.v4_baseTokenAddress as Address,
  engine: config.v4_engineAddress as Address,
  l1Token: config.l1TokenAddress as Address,
  v2Token: config.v2_baseTokenAddress as Address,
  v2Engine: config.v2_engineAddress as Address,
} as const

// Hook to get contract instances with viem
export function useContract<TAbi extends readonly unknown[]>(
  address: Address,
  abi: TAbi,
) {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  if (!publicClient) {
    return null
  }

  return getContract({
    address,
    abi,
    client: { public: publicClient, wallet: walletClient },
  })
}

export { config }
