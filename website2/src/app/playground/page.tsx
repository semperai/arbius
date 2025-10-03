import { createMetadata } from '@/lib/metadata'
import PlaygroundPageClient from './page.client'

export const dynamic = 'force-dynamic'

export const metadata = createMetadata({
  title: 'Playground',
  description: 'Try Arbius AI models directly in your browser. Generate images and text with decentralized AI powered by the Arbius network.',
  keywords: ['AI Playground', 'Generate AI', 'Test AI Models', 'Image Generation', 'Text Generation'],
})

export default function PlaygroundPage() {
  return <PlaygroundPageClient />
}
