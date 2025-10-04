import { useReadContract } from 'wagmi'
import { type Address, type Abi } from 'viem'

/**
 * Simple wrapper around wagmi's useReadContract for consistency
 * Example usage:
 *
 * const { data, isLoading } = useContractRead({
 *   address: '0x...',
 *   abi: myAbi,
 *   functionName: 'balanceOf',
 *   args: [address],
 * })
 */
export function useContractReadHook(config: {
  address: Address
  abi: Abi
  functionName: string
  args?: readonly unknown[]
  enabled?: boolean
}) {
  const { enabled, ...contractConfig } = config
  return useReadContract({
    address: contractConfig.address,
    abi: contractConfig.abi,
    functionName: contractConfig.functionName,
    args: contractConfig.args,
    query: {
      enabled,
    },
  })
}
