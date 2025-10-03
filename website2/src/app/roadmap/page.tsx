import { createMetadata } from '@/lib/metadata'
import RoadmapPageClient from './page.client'

export const metadata = createMetadata({
  title: 'Roadmap',
  description: 'Arbius envisions a future where artificial intelligence transcends current limitations, by embracing decentralization, empathy, and economic innovation.',
  keywords: ['Roadmap', 'Vision', 'Future', 'AI', 'Decentralization'],
})

export default function RoadmapPage() {
  return <RoadmapPageClient />
}
