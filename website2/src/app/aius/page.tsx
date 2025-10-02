import { AIUSPageClient } from './page.client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'veAIUS Staking | Arbius',
  description: 'Lock AIUS tokens to earn veAIUS and participate in governance. Vote on AI model rewards and earn staking yields.',
  openGraph: {
    title: 'veAIUS Staking | Arbius',
    description: 'Lock AIUS tokens to earn veAIUS and participate in governance. Vote on AI model rewards and earn staking yields.',
    url: 'https://arbius.ai/aius',
    siteName: 'Arbius',
    images: [
      {
        url: '/og-aius.png',
        width: 1200,
        height: 630,
        alt: 'veAIUS Staking',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'veAIUS Staking | Arbius',
    description: 'Lock AIUS tokens to earn veAIUS and participate in governance.',
    images: ['/og-aius.png'],
  },
}

export default function AIUSPage() {
  return <AIUSPageClient />
}
