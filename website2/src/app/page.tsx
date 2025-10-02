import { HeroSection } from '@/components/homepage/HeroSection'
import { Partners } from '@/components/homepage/Partners'
import { ModelsSection } from '@/components/homepage/ModelsSection'
import { ArbiusModelsSection } from '@/components/homepage/ArbiusModelsSection'
import { DemocraticSection } from '@/components/homepage/DemocraticSection'
import { AIUSSection } from '@/components/homepage/AIUSSection'
import { EACCSection } from '@/components/homepage/EACCSection'
import { CommunitySection } from '@/components/homepage/CommunitySection'
import { BuySection } from '@/components/homepage/BuySection'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Arbius - Decentralized Machine Learning',
  description: 'Arbius is a decentralized network for machine learning and a token with a fixed total supply. Generate AI with GPU power on a censorship-resistant network.',
  openGraph: {
    title: 'Arbius - Decentralized Machine Learning',
    description: 'Arbius is a decentralized network for machine learning and a token with a fixed total supply. Generate AI with GPU power on a censorship-resistant network.',
    url: 'https://arbius.ai',
    siteName: 'Arbius',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Arbius - Decentralized Machine Learning',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Arbius - Decentralized Machine Learning',
    description: 'Arbius is a decentralized network for machine learning and a token with a fixed total supply. Generate AI with GPU power on a censorship-resistant network.',
    images: ['/og-image.png'],
    creator: '@arbius_ai',
  },
  keywords: ['AI', 'Machine Learning', 'Decentralized', 'Blockchain', 'AIUS', 'veAIUS', 'DeFi AI', 'Arbitrum'],
}

export default function Home() {
  return (
    <div>
      <HeroSection />
      <Partners />
      <ModelsSection />
      <ArbiusModelsSection />
      <DemocraticSection />
      <AIUSSection />
      <EACCSection />
      <CommunitySection />
      <BuySection />
    </div>
  )
}
