type TabsProps = {
  selectedTab: 'Dashboard' | 'Gauge'
  setSelectedTab: (tab: 'Dashboard' | 'Gauge') => void
}

export function Tabs({ selectedTab, setSelectedTab }: TabsProps) {
  const tabs = ['Dashboard', 'Gauge'] as const

  return (
    <div className="border-b border-gray-200">
      <div className="flex gap-8">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`pb-4 pt-8 text-lg font-semibold transition-colors ${
              selectedTab === tab
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-600 hover:text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  )
}
