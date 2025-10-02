import { http, createConfig } from 'wagmi'
import { mainnet, arbitrumNova } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

// Upgrade page config - only Ethereum Mainnet and Arbitrum Nova
export const upgradeConfig = createConfig({
  chains: [mainnet, arbitrumNova],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [mainnet.id]: http(),
    [arbitrumNova.id]: http(),
  },
})
