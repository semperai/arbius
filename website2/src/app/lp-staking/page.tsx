import { createMetadata } from '@/lib/metadata'
import LPStakingPageClient from './page.client'

export const dynamic = 'force-dynamic'

export const metadata = createMetadata({
  title: 'LP Staking',
  description: 'Provide liquidity on Uniswap and stake your LP tokens to earn AIUS rewards. Join the Arbius liquidity mining program.',
  keywords: ['LP Staking', 'Liquidity Mining', 'Uniswap', 'DeFi', 'Yield Farming'],
})

export default function LPStakingPage() {
  return <LPStakingPageClient />
}
