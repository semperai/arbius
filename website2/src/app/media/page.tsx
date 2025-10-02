import { createMetadata } from '@/lib/metadata'
import MediaPageClient from './page.client'

export const metadata = createMetadata({
  title: 'Media & Press',
  description: 'Arbius media kit, press releases, brand assets, and latest news. Download logos, guidelines, and resources for media coverage.',
  path: '/media',
  keywords: ['Media', 'Press', 'Brand', 'Assets', 'News'],
})

export default function MediaPage() {
  return <MediaPageClient />
}
