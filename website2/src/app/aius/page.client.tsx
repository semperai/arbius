'use client'

import { useState } from 'react'
import { StakeSection } from '@/components/aius/StakeSection'
import { InfoSection } from '@/components/aius/InfoSection'
import { Tabs } from '@/components/aius/Tabs'
import { Dashboard } from '@/components/aius/Dashboard'
import { Gauge } from '@/components/aius/Gauge'

export function AIUSPageClient() {
  const [selectedTab, setSelectedTab] = useState<'Dashboard' | 'Gauge'>('Dashboard')

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="py-16 lg:py-24">
        <div className="mx-auto w-[90%] max-w-[2000px] lg:w-[80%]">
          <h1 className="mb-8 text-[45px] font-bold text-black-text lg:text-[50px] 2xl:text-[70px]">
            veAIUS Staking
          </h1>

          <div className="flex flex-col justify-between gap-6 lg:flex-row">
            {/* Left: Stake Component */}
            <div className="w-full lg:w-[48%]">
              <StakeSection />
            </div>

            {/* Right: Info Components */}
            <div className="w-full lg:w-[48%]">
              <InfoSection />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-gradient-to-r from-blue-50/20 via-purple-50/20 to-pink-50/20 py-12 lg:py-24">
        <div className="mx-auto w-[90%] max-w-[2000px] lg:w-[80%]">
          <Tabs selectedTab={selectedTab} setSelectedTab={setSelectedTab} />

          {/* Tab Content */}
          <div className="mt-8">
            {selectedTab === 'Dashboard' ? <Dashboard /> : <Gauge />}
          </div>
        </div>
      </div>
    </div>
  )
}
