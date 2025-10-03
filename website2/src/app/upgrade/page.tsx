import type { Metadata } from 'next'
import UpgradePageClient from './page.client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Upgrade AIUS Tokens | Arbius',
  description: 'Upgrade your AIUS v1 tokens to v2. Deposit your v1 tokens and receive new AIUS in exchange, 1:1. Available on Ethereum Mainnet and Arbitrum Nova.',
  openGraph: {
    title: 'Upgrade AIUS Tokens | Arbius',
    description: 'Upgrade your AIUS v1 tokens to v2. 1:1 token swap available on Ethereum Mainnet and Arbitrum Nova.',
    url: 'https://arbius.ai/upgrade',
    siteName: 'Arbius',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Arbius Token Upgrade',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Upgrade AIUS Tokens | Arbius',
    description: 'Upgrade your AIUS v1 tokens to v2. 1:1 token swap available.',
    images: ['/og-image.png'],
    creator: '@arbius_ai',
  },
  keywords: ['AIUS', 'Token Upgrade', 'Arbius', 'Ethereum', 'Arbitrum Nova', 'Web3', 'Cryptocurrency'],
}

export default function UpgradePage() {
  return <UpgradePageClient />
}
