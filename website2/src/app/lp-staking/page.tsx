'use client'

import { useState } from 'react'
import { HeaderSection } from '@/components/lp-staking/HeaderSection'
import { StakeSection } from '@/components/lp-staking/StakeSection'
import { StatsSection } from '@/components/lp-staking/StatsSection'

export default function LPStakingPage() {
  const [selectedTab, setSelectedTab] = useState<'Stake' | 'Stats'>('Stake')

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <HeaderSection />

      {/* Tabs and Content */}
      <div className="bg-gradient-to-r from-blue-50/20 via-purple-50/20 to-pink-50/20 py-12 lg:py-24">
        <div className="mx-auto w-[90%] max-w-[2000px] lg:w-[80%]">
          {/* Tab Navigation */}
          <div className="mb-8 border-b border-gray-200">
            <div className="flex gap-8">
              {(['Stake', 'Stats'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`pb-4 text-lg font-semibold transition-colors ${
                    selectedTab === tab
                      ? 'border-b-2 border-purple-text text-purple-text'
                      : 'text-gray-600 hover:text-purple-text'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {selectedTab === 'Stake' ? <StakeSection /> : <StatsSection />}
        </div>
      </div>
    </div>
  )
}
