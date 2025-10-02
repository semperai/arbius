import { HeroSection } from '@/components/homepage/HeroSection'
import { Partners } from '@/components/homepage/Partners'
import { ModelsSection } from '@/components/homepage/ModelsSection'
import { DemocraticSection } from '@/components/homepage/DemocraticSection'
import { AIUSSection } from '@/components/homepage/AIUSSection'
import { EACCSection } from '@/components/homepage/EACCSection'
import { CommunitySection } from '@/components/homepage/CommunitySection'
import { BuySection } from '@/components/homepage/BuySection'

export default function Home() {
  return (
    <div>
      <HeroSection />
      <Partners />
      <ModelsSection />
      <DemocraticSection />
      <AIUSSection />
      <EACCSection />
      <CommunitySection />
      <BuySection />
    </div>
  )
}
