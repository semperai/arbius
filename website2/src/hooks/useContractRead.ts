import { useReadContract } from 'wagmi'
import { type Address, type Abi } from 'viem'

/**
 * Hook for reading from contracts using viem
 * Example usage:
 *
 * const { data, isLoading } = useContractRead({
 *   address: '0x...',
 *   abi: myAbi,
 *   functionName: 'balanceOf',
 *   args: [address],
 * })
 */
export function useContractReadHook<TAbi extends Abi, TFunctionName extends string>(config: {
  address: Address
  abi: TAbi
  functionName: TFunctionName
  args?: readonly unknown[]
  enabled?: boolean
}) {
  return useReadContract({
    address: config.address,
    abi: config.abi,
    functionName: config.functionName,
    args: config.args as any,
    query: {
      enabled: config.enabled,
    },
  } as any)
}
