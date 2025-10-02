import type { Metadata } from 'next'

const baseUrl = 'https://arbius.ai'

export const defaultMetadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: 'Arbius - Decentralized Machine Learning',
  description: 'Decentralized network for machine learning with a fixed total supply token.',
  openGraph: {
    siteName: 'Arbius',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    creator: '@arbius_ai',
    card: 'summary_large_image',
  },
}

export function createMetadata(overrides: Partial<Metadata>): Metadata {
  return {
    ...defaultMetadata,
    ...overrides,
    openGraph: {
      ...defaultMetadata.openGraph,
      ...(overrides.openGraph || {}),
    },
    twitter: {
      ...defaultMetadata.twitter,
      ...(overrides.twitter || {}),
    },
  }
}
