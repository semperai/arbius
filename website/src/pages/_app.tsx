import { useRouter } from "next/router";
import { useEffect } from "react";
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { ThemeProvider } from "next-themes"
import { configureChains, createClient, WagmiConfig, mainnet } from 'wagmi'
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum'
import { Web3Modal } from '@web3modal/react'
import * as gtag from "@/gtag";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

const arbitrumNova = {
  id: parseInt(process.env.NEXT_PUBLIC_CHAINID || ''),
  network: "arbitrum-nova",
  name: "Arbitrum Nova",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_RPC_URL || '',
      ]
    },
    public: {
      http: [
        process.env.NEXT_PUBLIC_RPC_URL || '',
      ]
    }
  },
  blockExplorers: {
    etherscan: {
      name: "Arbiscan",
      url: "https://nova.arbiscan.io"
    },
    blockScout: {
      name: 'BlockScout',
      url: 'https://nova-explorer.arbitrum.io/',
    },
    default: {
      name: "Arbiscan",
      url: "https://nova.arbiscan.io"
    }
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11' as `0x${string}`,
      blockCreated: 1746963,
    },
  }
}

const chains = [arbitrumNova, mainnet]

const { provider } = configureChains(chains, [w3mProvider({ projectId })])
const wagmiClient = createClient({
  autoConnect: true,
  connectors: w3mConnectors({ version: 1, chains, projectId }),
  provider,
})

const ethereumClient = new EthereumClient(wagmiClient, chains)


export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url: URL) => {
      if (process.env.NODE_ENV === 'production') {
        gtag.pageview(url);
      }
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
      <ThemeProvider
        attribute="class"
        storageKey="nightwind-mode"
        defaultTheme="system" // default "light"
      >
        <WagmiConfig client={wagmiClient}>
          <Component {...pageProps} />
        </WagmiConfig>
      </ThemeProvider>
  
      <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
    </>
  )
}
