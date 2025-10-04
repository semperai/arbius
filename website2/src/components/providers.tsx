'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '@/lib/wagmi'
import { ThemeProvider } from 'next-themes'
import { useState, useEffect } from 'react'
import { AAWalletProvider, init, isEthereumProxyActive } from '@/lib/arbius-wallet'
import { arbitrum } from 'viem/chains'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { Toaster } from 'sonner'
import '@rainbow-me/rainbowkit/styles.css'

// Create a context to share AA wallet initialization status
export const AAWalletStatusContext = React.createContext<{ isProxyActive: boolean }>({ isProxyActive: false })

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [isWalletInitialized, setIsWalletInitialized] = useState(false)
  const [isProxyActive, setIsProxyActive] = useState(false)

  useEffect(() => {
    // Initialize AA Wallet
    const success = init({
      defaultChainId: arbitrum.id,
      supportedChainIds: [arbitrum.id],
      ui: {
        autoConnectOnInit: false,
        theme: 'system',
      },
    })
    setIsProxyActive(success && isEthereumProxyActive())
    setIsWalletInitialized(true)
  }, [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <AAWalletStatusContext.Provider value={{ isProxyActive }}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Toaster
                position="top-right"
                richColors
                closeButton
              />
              {isWalletInitialized ? (
                <AAWalletProvider>{children}</AAWalletProvider>
              ) : (
                children
              )}
            </ThemeProvider>
          </AAWalletStatusContext.Provider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
