'use client'

import { useMemo } from 'react'
import { useAccount, useReadContract, useChainId } from 'wagmi'
import { formatUnits, parseAbi } from 'viem'
import { ARBIUS_CONFIG } from '@/config/arbius'
import { GanttChart } from './GanttChart'
import { useVeAIUSBalance, useTokenBalance, useNFTPositions, useTokenStats } from '@/hooks'

const VE_AIUS_ABI = parseAbi([
  'function supply() view returns (uint256)',
])

export function Dashboard() {
  const { isConnected } = useAccount()
  const chainId = useChainId()

  const config = ARBIUS_CONFIG[chainId as keyof typeof ARBIUS_CONFIG]
  const veAIUSAddress = config?.veAIUSAddress

  // Use custom hooks for cleaner code
  const { balance: veBalance, formatted: veBalanceFormatted } = useVeAIUSBalance()
  const { formatted: aiusBalanceFormatted } = useTokenBalance()
  const { positions: userPositions, isLoading: isLoadingPositions, count: nftCount } = useNFTPositions()
  const tokenStats = useTokenStats()

  // Protocol-wide stats
  const { data: totalVeSupply, isLoading: loadingSupply } = useReadContract({
    address: veAIUSAddress,
    abi: VE_AIUS_ABI,
    functionName: 'supply',
  })

  // Placeholder values for now - these would come from veStaking contract
  const rewardRate = null
  const totalStaked = null

  // Calculate APR (simplified - real calculation would be more complex)
  const apr = useMemo(() => {
    if (rewardRate && totalStaked && totalStaked > BigInt(0)) {
      return (Number(rewardRate) / Number(totalStaked)) * 100 * 365 * 24 * 3600
    }
    return 0
  }, [rewardRate, totalStaked])

  // Format values
  const totalVeSupplyFormatted = useMemo(
    () => totalVeSupply ? formatUnits(totalVeSupply as bigint, 18) : '0',
    [totalVeSupply]
  )

  const totalStakedFormatted = useMemo(
    () => totalStaked ? formatUnits(totalStaked as bigint, 18) : '0',
    [totalStaked]
  )

  const votingPowerPercentage = useMemo(() => {
    if (totalVeSupply && veBalance && totalVeSupply !== BigInt(0)) {
      return ((Number(veBalance) / Number(totalVeSupply as bigint)) * 100).toFixed(4)
    }
    return '0'
  }, [totalVeSupply, veBalance])

  const protocolStats = useMemo(() => [
    {
      title: 'AIUS Price',
      value: tokenStats.price ? `$${tokenStats.price.toFixed(2)}` : '$--',
      subtitle: tokenStats.priceChange24h
        ? `${tokenStats.priceChange24h > 0 ? '+' : ''}${tokenStats.priceChange24h.toFixed(2)}% (24h)`
        : 'Loading...',
      gradient: tokenStats.priceChange24h && tokenStats.priceChange24h > 0
        ? 'from-green-500 to-green-600'
        : 'from-red-500 to-red-600',
      icon: '💰',
    },
    {
      title: 'Market Cap',
      value: tokenStats.marketCap
        ? `$${(tokenStats.marketCap / 1_000_000).toFixed(2)}M`
        : '$--',
      subtitle: 'Total market value',
      gradient: 'from-blue-500 to-blue-600',
      icon: '📊',
    },
    {
      title: 'Total veAIUS Supply',
      value: parseFloat(totalVeSupplyFormatted).toFixed(2),
      subtitle: 'Protocol voting power',
      gradient: 'from-purple-500 to-purple-600',
      icon: '🏛️',
    },
  ], [totalVeSupplyFormatted, tokenStats])

  const userStats = useMemo(() => [
    {
      title: 'Your veAIUS Balance',
      value: parseFloat(veBalanceFormatted).toFixed(4),
      subtitle: `${votingPowerPercentage}% of total power`,
      gradient: 'from-purple-50 to-purple-100',
    },
    {
      title: 'Your AIUS Balance',
      value: parseFloat(aiusBalanceFormatted).toFixed(4),
      subtitle: 'Available to lock',
      gradient: 'from-blue-50 to-blue-100',
    },
    {
      title: 'Active Positions',
      value: nftCount.toString(),
      subtitle: 'veAIUS NFTs owned',
      gradient: 'from-pink-50 to-pink-100',
    },
  ], [veBalanceFormatted, votingPowerPercentage, aiusBalanceFormatted, nftCount])

  if (loadingSupply) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 rounded bg-gray-200"></div>
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="mb-2 text-3xl font-bold text-black-text">Dashboard</h2>
        <p className="text-gray-600">
          Protocol statistics and your veAIUS position overview
        </p>
      </div>

      {/* Protocol Stats - Prominent Cards */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-700">Protocol Statistics</h3>
        <div className="grid gap-6 md:grid-cols-3">
          {protocolStats.map((stat, idx) => (
            <div
              key={idx}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.gradient} p-6 shadow-lg transition-transform hover:scale-105`}
            >
              <div className="absolute right-4 top-4 text-4xl opacity-20">{stat.icon}</div>
              <h3 className="mb-2 text-sm font-medium text-white/80">{stat.title}</h3>
              <p className="mb-1 text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/70">{stat.subtitle}</p>
            </div>
          ))}
        </div>
      </div>

      {/* User Stats */}
      {isConnected ? (
        <>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-700">Your Position</h3>
            <div className="grid gap-6 md:grid-cols-3">
              {userStats.map((stat, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl bg-gradient-to-br ${stat.gradient} p-6 shadow-md`}
                >
                  <h3 className="mb-2 text-sm font-medium text-gray-600">{stat.title}</h3>
                  <p className="mb-1 text-3xl font-bold text-black-text">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.subtitle}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Lock Positions Table */}
          {nftCount > 0 ? (
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-xl font-semibold text-black-text">Your Lock Positions</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-3 text-left text-sm font-medium text-gray-600">NFT ID</th>
                      <th className="pb-3 text-left text-sm font-medium text-gray-600">Amount Locked</th>
                      <th className="pb-3 text-left text-sm font-medium text-gray-600">Voting Power</th>
                      <th className="pb-3 text-left text-sm font-medium text-gray-600">Unlock Date</th>
                      <th className="pb-3 text-left text-sm font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingPositions ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">
                          Loading positions...
                        </td>
                      </tr>
                    ) : userPositions.length > 0 ? (
                      userPositions.map((position) => (
                        <tr key={position.tokenId.toString()} className="border-b border-gray-100">
                          <td className="py-4 text-sm font-medium text-black-text">
                            #{position.tokenId.toString()}
                          </td>
                          <td className="py-4 text-sm text-gray-700">
                            {formatUnits(position.amount, 18)} AIUS
                          </td>
                          <td className="py-4 text-sm font-semibold text-purple-600">
                            {formatUnits(position.votingPower, 18)} veAIUS
                          </td>
                          <td className="py-4 text-sm text-gray-700">
                            {new Date(Number(position.unlockTime) * 1000).toLocaleDateString()}
                          </td>
                          <td className="py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                              Number(position.unlockTime) < Date.now() / 1000
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {Number(position.unlockTime) < Date.now() / 1000 ? 'Expired' : 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">
                          No positions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Gantt Chart */}
              <div className="mt-6">
                <GanttChart positions={userPositions} />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-12 text-center shadow-lg">
              <div className="mx-auto mb-4 text-6xl">🔒</div>
              <h3 className="mb-2 text-xl font-semibold text-gray-800">No Active Locks</h3>
              <p className="text-gray-600">Lock AIUS tokens to create your first veAIUS position</p>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl bg-white p-12 text-center shadow-lg">
          <div className="mx-auto mb-4 text-6xl">👛</div>
          <h3 className="mb-2 text-xl font-semibold text-gray-800">Connect Wallet</h3>
          <p className="text-gray-600">Connect your wallet to view your veAIUS position</p>
        </div>
      )}

      {/* Token Supply Stats */}
      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Token Supply</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs text-gray-600">Total Supply</p>
            <p className="text-2xl font-bold text-gray-900">
              {tokenStats.totalSupply ? `${(tokenStats.totalSupply / 1_000_000).toFixed(2)}M` : '--'}
            </p>
            <p className="text-xs text-gray-500">AIUS tokens</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs text-gray-600">Circulating Supply</p>
            <p className="text-2xl font-bold text-gray-900">
              {tokenStats.circulatingSupply ? `${(tokenStats.circulatingSupply / 1_000_000).toFixed(2)}M` : '--'}
            </p>
            <p className="text-xs text-gray-500">
              {tokenStats.totalSupply && tokenStats.circulatingSupply
                ? `${((tokenStats.circulatingSupply / tokenStats.totalSupply) * 100).toFixed(1)}% of total`
                : 'Loading...'}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs text-gray-600">24h Volume</p>
            <p className="text-2xl font-bold text-gray-900">
              {tokenStats.volume24h ? `$${(tokenStats.volume24h / 1_000).toFixed(0)}K` : '--'}
            </p>
            <p className="text-xs text-gray-500">Trading volume</p>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-50 via-blue-50 to-pink-50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">veAIUS Mechanics</h3>
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <h4 className="mb-3 flex items-center text-sm font-medium text-gray-700">
              <span className="mr-2 text-lg">💰</span>
              Earn Rewards
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Share in protocol fee revenue</li>
              <li>• Receive AIUS token emissions</li>
              <li>• Boost your mining rewards</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 flex items-center text-sm font-medium text-gray-700">
              <span className="mr-2 text-lg">🗳️</span>
              Governance Power
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Vote on gauge emissions</li>
              <li>• Direct rewards to AI models</li>
              <li>• Participate in proposals</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 flex items-center text-sm font-medium text-gray-700">
              <span className="mr-2 text-lg">⏱️</span>
              Lock Duration
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Lock from 1 week to 2 years</li>
              <li>• Longer locks = more power</li>
              <li>• Power decays linearly over time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
