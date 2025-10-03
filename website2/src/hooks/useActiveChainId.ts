import { useChainId } from 'wagmi'

/**
 * Returns the active chain ID, defaulting to Arbitrum One (42161) if no wallet is connected
 */
export function useActiveChainId(): number {
  const connectedChainId = useChainId()
  // Default to Arbitrum One (42161) when no wallet is connected
  return connectedChainId || 42161
}
