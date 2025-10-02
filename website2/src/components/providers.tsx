'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '@/lib/wagmi'
import { ThemeProvider } from 'next-themes'
import { useState, useEffect } from 'react'
import { AAWalletProvider, init } from '@/lib/arbius-wallet'
import { arbitrum } from 'viem/chains'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [isWalletInitialized, setIsWalletInitialized] = useState(false)

  useEffect(() => {
    // Initialize AA Wallet
    init({
      defaultChainId: arbitrum.id,
      supportedChainIds: [arbitrum.id],
      ui: {
        autoConnectOnInit: false,
        theme: 'system',
      },
    })
    setIsWalletInitialized(true)
  }, [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {isWalletInitialized ? (
              <AAWalletProvider>{children}</AAWalletProvider>
            ) : (
              children
            )}
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
