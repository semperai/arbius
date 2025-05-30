import { useRouter } from 'next/router';
import { useEffect } from 'react';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import { WagmiProvider } from 'wagmi';
import { mainnet, arbitrum, arbitrumSepolia, Chain, sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected } from 'wagmi/connectors';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import * as gtag from '@/gtag';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

const apolloClient = new ApolloClient({
  uri: 'https://squid.subsquid.io/arbius-core/v/v1/graphql',
  cache: new InMemoryCache(),
});

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

const chains = [mainnet, arbitrumSepolia, arbitrum, sepolia] as const;

const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata: {
    name: 'Arbius',
    description: 'Arbius Website',
    url: 'https://arbius.ai',
    icons: ['https://arbius.ai/favicon.ico'],
  },
});

const queryClient = new QueryClient();

// Create Web3Modal instance
createWeb3Modal({
  wagmiConfig,
  projectId,
  themeMode: 'dark',
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url: URL) => {
      if (process.env.NODE_ENV === 'production') {
        gtag.pageview(url);
      }
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
      <ThemeProvider
        attribute='class'
        storageKey='nightwind-mode'
        defaultTheme='system'
      >
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <ApolloProvider client={apolloClient}>
              <Component {...pageProps} />
            </ApolloProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </ThemeProvider>
    </>
  );
}
