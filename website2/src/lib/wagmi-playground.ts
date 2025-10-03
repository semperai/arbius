import { http, createConfig } from 'wagmi'
import { arbitrum } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

// Playground page config - only Arbitrum One
export const playgroundConfig = createConfig({
  chains: [arbitrum],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [arbitrum.id]: http(),
  },
})
