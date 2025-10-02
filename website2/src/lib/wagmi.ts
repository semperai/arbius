import { http, createConfig } from 'wagmi'
import { mainnet, arbitrum, arbitrumSepolia, arbitrumNova, sepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

export const config = createConfig({
  chains: [mainnet, arbitrum, arbitrumNova, arbitrumSepolia, sepolia],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [arbitrumNova.id]: http(),
    [arbitrumSepolia.id]: http(),
    [sepolia.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
