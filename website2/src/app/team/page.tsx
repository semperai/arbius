import { createMetadata } from '@/lib/metadata'
import TeamPageClient from './page.client'

export const metadata = createMetadata({
  title: 'Team',
  description: 'Meet the passionate and talented team bringing free and open AI to the world.',
  keywords: ['Team', 'About', 'Contributors', 'Developers'],
})

export default function TeamPage() {
  return <TeamPageClient />
}
