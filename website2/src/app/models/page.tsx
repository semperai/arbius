import { createMetadata } from '@/lib/metadata'
import ModelsPageClient from './page.client'

export const metadata = createMetadata({
  title: 'AI Models',
  description: 'Explore decentralized AI models on Arbius. From text generation to image synthesis, discover community-governed models for every use case.',
  keywords: ['AI Models', 'Machine Learning Models', 'Stable Diffusion', 'LLM', 'Image Generation'],
})

export default function ModelsPage() {
  return <ModelsPageClient />
}
