import { http, createConfig } from 'wagmi'
import { mainnet, arbitrum, arbitrumNova } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

// All production chains
export const config = createConfig({
  chains: [arbitrum, mainnet, arbitrumNova],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [arbitrumNova.id]: http(),
  },
})

// Export individual chains for page-specific filtering
export { mainnet, arbitrum, arbitrumNova }

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
