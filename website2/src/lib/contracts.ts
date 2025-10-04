import { getContract, type Address } from 'viem'
import { usePublicClient, useWalletClient } from 'wagmi'
import { arbitrum } from 'viem/chains'
import { ARBIUS_CONFIG } from '@/config/arbius'

// Contract addresses for Arbitrum One (mainnet)
const mainnetConfig = ARBIUS_CONFIG[arbitrum.id]

export const contracts = {
  baseToken: mainnetConfig.baseTokenAddress,
  engine: mainnetConfig.engineAddress,
  votingEscrow: mainnetConfig.veAIUSAddress,
  veStaking: mainnetConfig.veStakingAddress,
  voter: mainnetConfig.voterAddress,
  // Legacy support - keeping v2 references for upgrade page
  l1Token: '0xe3DBC4F88EAa632DDF9708732E2832EEaA6688AB' as Address,
  v2Token: '0x8AFE4055Ebc86Bd2AFB3940c0095C9aca511d852' as Address,
  v2Engine: '0x3BF6050327Fa280Ee1B5F3e8Fd5EA2EfE8A6472a' as Address,
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

// Re-export for backwards compatibility with upgrade page and API
export const config = {
  // Current v5/v6 addresses
  v4_baseTokenAddress: mainnetConfig.baseTokenAddress,
  v4_engineAddress: mainnetConfig.engineAddress,
  votingEscrowAddress: mainnetConfig.veAIUSAddress,
  veStakingAddress: mainnetConfig.veStakingAddress,
  voterAddress: mainnetConfig.voterAddress,
  // Legacy v1/v2 addresses for upgrade page
  baseTokenAddress: '0xe3DBC4F88EAa632DDF9708732E2832EEaA6688AB', // v1 on Nova
  engineAddress: '0x399511EDEB7ca4A8328E801b1B3D0fe232aBc996', // v1 engine on Nova
  l1TokenAddress: '0xe3DBC4F88EAa632DDF9708732E2832EEaA6688AB',
  v2_l1TokenAddress: '0x8AFE4055Ebc86Bd2AFB3940c0095C9aca511d852',
  v2_baseTokenAddress: '0x8AFE4055Ebc86Bd2AFB3940c0095C9aca511d852',
  l1OneToOneAddress: '0x5080a6A0F0b0E21A895841456e5Ed77d26332262',
  l2OneToOneAddress: '0x5080a6A0F0b0E21A895841456e5Ed77d26332262',
  v2_engineAddress: '0x3BF6050327Fa280Ee1B5F3e8Fd5EA2EfE8A6472a',
  proxyAdminAddress: '0xF392fEA506efB6ED445253594DC81a0CB7cD3562',
}
