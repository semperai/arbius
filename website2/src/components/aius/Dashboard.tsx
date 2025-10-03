'use client'

import { useMemo, useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { formatUnits, parseAbi } from 'viem'
import { ARBIUS_CONFIG } from '@/config/arbius'
import { GanttChart } from './GanttChart'
import { useVeAIUSBalance, useTokenBalance, useNFTPositions, useTokenStats, useActiveChainId } from '@/hooks'
import { useContractWriteHook } from '@/hooks/useContractWrite'
import veStakingAbi from '@/abis/veStaking.json'
import votingEscrowAbi from '@/abis/votingEscrow.json'

const VE_AIUS_ABI = parseAbi([
  'function supply() view returns (uint256)',
])

const VE_STAKING_ABI = parseAbi([
  'function totalSupply() view returns (uint256)',
  'function rewardRate() view returns (uint256)',
  'function periodFinish() view returns (uint256)',
  'function earned(uint256 tokenId) view returns (uint256)',
  'function getRewardForDuration() view returns (uint256)',
])

// Component to display earned rewards for a single position
function PositionEarnedRewards({ tokenId, veStakingAddress }: { tokenId: bigint; veStakingAddress: `0x${string}` | undefined }) {
  const { data: earned, refetch } = useReadContract({
    address: veStakingAddress,
    abi: VE_STAKING_ABI,
    functionName: 'earned',
    args: [tokenId],
    query: {
      enabled: !!veStakingAddress,
      refetchInterval: 3000, // Refresh every 3 seconds for real-time updates
    },
  })

  const earnedFormatted = earned ? parseFloat(formatUnits(earned as bigint, 18)).toFixed(8) : '0.00000000'

  return (
    <span className="font-semibold text-green-600">
      {earnedFormatted} AIUS
    </span>
  )
}

export function Dashboard() {
  const { isConnected } = useAccount()
  const chainId = useActiveChainId()
  const [claimingTokenId, setClaimingTokenId] = useState<bigint | null>(null)
  const [withdrawingTokenId, setWithdrawingTokenId] = useState<bigint | null>(null)

  const config = ARBIUS_CONFIG[chainId as keyof typeof ARBIUS_CONFIG]
  const veAIUSAddress = config?.veAIUSAddress
  const veStakingAddress = config?.veStakingAddress

  const { write: claimRewards, isPending: isClaimPending, isSuccess: isClaimSuccess } = useContractWriteHook()
  const { write: withdrawStake, isPending: isWithdrawPending, isSuccess: isWithdrawSuccess } = useContractWriteHook()

  // Use custom hooks for cleaner code
  const { balance: veBalance, formatted: veBalanceFormatted } = useVeAIUSBalance()
  const { formatted: aiusBalanceFormatted } = useTokenBalance()
  const { positions: userPositions, isLoading: isLoadingPositions, count: nftCount } = useNFTPositions()
  const tokenStats = useTokenStats()

  // Protocol-wide stats - works without wallet connection
  const { data: totalVeSupply, isLoading: loadingSupply } = useReadContract({
    address: veAIUSAddress,
    abi: VE_AIUS_ABI,
    functionName: 'supply',
    query: { enabled: !!veAIUSAddress },
  })

  // Staking contract data
  const { data: totalStaked } = useReadContract({
    address: veStakingAddress,
    abi: VE_STAKING_ABI,
    functionName: 'totalSupply',
    query: { enabled: !!veStakingAddress },
  })

  const { data: rewardRate } = useReadContract({
    address: veStakingAddress,
    abi: VE_STAKING_ABI,
    functionName: 'rewardRate',
    query: { enabled: !!veStakingAddress },
  })

  const { data: periodFinish } = useReadContract({
    address: veStakingAddress,
    abi: VE_STAKING_ABI,
    functionName: 'periodFinish',
    query: { enabled: !!veStakingAddress },
  })

  // Calculate APR based on reward rate and total staked
  const apr = useMemo(() => {
    if (rewardRate && totalStaked && totalStaked > BigInt(0)) {
      // Convert from wei to token units
      const ratePerSecond = Number(formatUnits(rewardRate as bigint, 18))
      const totalStakedTokens = Number(formatUnits(totalStaked as bigint, 18))

      // APR = (reward per veAIUS per second) * seconds in year * 100
      const rewardPerTokenPerSecond = ratePerSecond / totalStakedTokens
      const aprValue = rewardPerTokenPerSecond * 31536000 * 100 // 31536000 = seconds in a year

      return aprValue
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

  const isRewardsActive = useMemo(() => {
    if (!periodFinish) return false
    return Number(periodFinish) > Math.floor(Date.now() / 1000)
  }, [periodFinish])

  // Handle claiming rewards
  const handleClaimRewards = async (tokenId: bigint) => {
    if (!veStakingAddress) return

    setClaimingTokenId(tokenId)

    try {
      await claimRewards({
        address: veStakingAddress,
        abi: veStakingAbi.abi,
        functionName: 'getReward',
        args: [tokenId],
      })
    } catch (error) {
      console.error('Error claiming rewards:', error)
    } finally {
      setClaimingTokenId(null)
    }
  }

  // Handle withdrawing expired stake
  const handleWithdraw = async (tokenId: bigint) => {
    if (!veAIUSAddress) return

    setWithdrawingTokenId(tokenId)

    try {
      await withdrawStake({
        address: veAIUSAddress,
        abi: votingEscrowAbi.abi,
        functionName: 'withdraw',
        args: [tokenId],
      })
    } catch (error) {
      console.error('Error withdrawing stake:', error)
    } finally {
      setWithdrawingTokenId(null)
    }
  }

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
    },
    {
      title: 'Market Cap',
      value: tokenStats.marketCap
        ? `$${(tokenStats.marketCap / 1_000_000).toFixed(2)}M`
        : '$--',
      subtitle: 'Total market value',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Total veAIUS Supply',
      value: parseFloat(totalVeSupplyFormatted).toFixed(2),
      subtitle: 'Protocol voting power',
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Total Staked',
      value: parseFloat(totalStakedFormatted).toFixed(2),
      subtitle: 'AIUS locked in veStaking',
      gradient: 'from-indigo-500 to-indigo-600',
    },
    {
      title: 'Staking APR',
      value: `${apr.toFixed(2)}%`,
      subtitle: isRewardsActive ? 'Current annual rate' : 'No active rewards',
      gradient: 'from-green-500 to-green-600',
    },
  ], [totalVeSupplyFormatted, totalStakedFormatted, apr, isRewardsActive, tokenStats])

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
        <h2 className="mb-2 text-3xl font-bold text-gray-900">Dashboard</h2>
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
                  <p className="mb-1 text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.subtitle}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Lock Positions Table */}
          {nftCount > 0 ? (
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-xl font-semibold text-gray-900">Your Lock Positions</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-3 text-left text-sm font-medium text-gray-600">NFT ID</th>
                      <th className="pb-3 text-left text-sm font-medium text-gray-600">Amount Locked</th>
                      <th className="pb-3 text-left text-sm font-medium text-gray-600">Voting Power</th>
                      <th className="pb-3 text-left text-sm font-medium text-gray-600">Rewards</th>
                      <th className="pb-3 text-left text-sm font-medium text-gray-600">Unlock Date</th>
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
                      userPositions.map((position) => {
                        const isExpired = Number(position.unlockTime) < Date.now() / 1000
                        const isWithdrawn = position.amount === BigInt(0)
                        const canWithdraw = isExpired && !isWithdrawn
                        return (
                          <tr key={position.tokenId.toString()} className="border-b border-gray-100">
                            <td className="py-4 text-sm font-medium">
                              <a
                                href={`https://opensea.io/assets/arbitrum/${veAIUSAddress?.toLowerCase()}/${position.tokenId.toString()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                #{position.tokenId.toString()}
                              </a>
                            </td>
                            <td className="py-4 text-sm text-gray-700">
                              {parseFloat(formatUnits(position.amount, 18)).toFixed(4)} AIUS
                            </td>
                            <td className="py-4 text-sm font-semibold text-purple-600">
                              {parseFloat(formatUnits(position.votingPower, 18)).toFixed(4)} veAIUS
                            </td>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-green-600">
                                  <PositionEarnedRewards tokenId={position.tokenId} veStakingAddress={veStakingAddress} />
                                </span>
                                <button
                                  onClick={() => handleClaimRewards(position.tokenId)}
                                  disabled={isClaimPending && claimingTokenId === position.tokenId}
                                  className="cursor-pointer rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white transition-opacity hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isClaimPending && claimingTokenId === position.tokenId ? 'Claiming...' : 'Claim'}
                                </button>
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm text-gray-700">
                                    {new Date(Number(position.unlockTime) * 1000).toLocaleDateString()}
                                  </span>
                                  <span className={`inline-block w-fit rounded-full px-2 py-0.5 text-xs font-medium ${
                                    isWithdrawn
                                      ? 'bg-purple-100 text-purple-700'
                                      : isExpired
                                      ? 'bg-gray-100 text-gray-700'
                                      : 'bg-green-100 text-green-700'
                                  }`}>
                                    {isWithdrawn ? 'Withdrawn' : isExpired ? 'Expired' : 'Active'}
                                  </span>
                                </div>
                                {canWithdraw && (
                                  <button
                                    onClick={() => handleWithdraw(position.tokenId)}
                                    disabled={isWithdrawPending && withdrawingTokenId === position.tokenId}
                                    className="cursor-pointer rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isWithdrawPending && withdrawingTokenId === position.tokenId ? 'Withdrawing...' : 'Withdraw'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
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
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-800">No Active Locks</h3>
              <p className="text-gray-600">Lock AIUS tokens to create your first veAIUS position</p>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl bg-white p-12 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
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
            <h4 className="mb-3 text-sm font-semibold text-gray-800">
              Earn Rewards
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Share in protocol fee revenue</li>
              <li>• Receive AIUS token emissions</li>
              <li>• Boost your mining rewards</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-800">
              Governance Power
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Vote on gauge emissions</li>
              <li>• Direct rewards to AI models</li>
              <li>• Participate in proposals</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-800">
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
