'use client'

import { useAccount } from 'wagmi'
import { useContractReadHook } from '@/hooks/useContractRead'
import veStakingAbi from '@/abis/veStaking.json'
import baseTokenAbi from '@/abis/baseTokenV1.json'
import univ2Abi from '@/abis/univ2ContractABI.json'
import { formatUnits } from 'viem'
import type { Abi, Address } from 'viem'
import config from '@/config.eth.json'

const STAKING_ADDRESS = config.STAKING_REWARD_ADDRESS as Address
const UNIV2_ADDRESS = config.UNIV2_ADDRESS as Address
const AIUS_ADDRESS = config.AIUS_TOKEN_ADDRESS as Address

export function StatsSection() {
  const { address, isConnected } = useAccount()

  // Protocol stats
  const { data: totalSupply } = useContractReadHook({
    address: STAKING_ADDRESS,
    abi: veStakingAbi.abi as Abi,
    functionName: 'totalSupply',
    enabled: true,
  })

  const { data: rewardRate } = useContractReadHook({
    address: STAKING_ADDRESS,
    abi: veStakingAbi.abi as Abi,
    functionName: 'rewardRate',
    enabled: true,
  })

  const { data: aiusBalance } = useContractReadHook({
    address: AIUS_ADDRESS,
    abi: baseTokenAbi.abi as Abi,
    functionName: 'balanceOf',
    args: [STAKING_ADDRESS],
    enabled: true,
  })

  const { data: univ2Balance } = useContractReadHook({
    address: UNIV2_ADDRESS,
    abi: univ2Abi as unknown as Abi,
    functionName: 'balanceOf',
    args: [STAKING_ADDRESS],
    enabled: true,
  })

  // User stats
  const { data: userStaked } = useContractReadHook({
    address: STAKING_ADDRESS,
    abi: veStakingAbi.abi as Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: isConnected && !!address,
  })

  const { data: userEarned } = useContractReadHook({
    address: STAKING_ADDRESS,
    abi: veStakingAbi.abi as Abi,
    functionName: 'earned',
    args: address ? [address] : undefined,
    enabled: isConnected && !!address,
  })

  const totalSupplyFormatted = totalSupply ? parseFloat(formatUnits(totalSupply as bigint, 18)).toFixed(2) : '0'
  const rewardRateFormatted = rewardRate ? parseFloat(formatUnits(rewardRate as bigint, 18)).toFixed(4) : '0'
  const aiusBalanceFormatted = aiusBalance ? parseFloat(formatUnits(aiusBalance as bigint, 18)).toFixed(0) : '0'
  const univ2BalanceFormatted = univ2Balance ? parseFloat(formatUnits(univ2Balance as bigint, 18)).toFixed(2) : '0'
  const userStakedFormatted = userStaked ? parseFloat(formatUnits(userStaked as bigint, 18)).toFixed(4) : '0'
  const userEarnedFormatted = userEarned ? parseFloat(formatUnits(userEarned as bigint, 18)).toFixed(4) : '0'

  const protocolStats = [
    { title: 'Total UNI-V2 Staked', value: totalSupplyFormatted, subtitle: 'Protocol-wide' },
    { title: 'Total UNI-V2 in Contract', value: univ2BalanceFormatted, subtitle: 'Contract balance' },
    { title: 'Reward Rate', value: `${rewardRateFormatted} AIUS/sec`, subtitle: 'Per second' },
    { title: 'Rewards Remaining', value: `${aiusBalanceFormatted} AIUS`, subtitle: 'In contract' },
  ]

  const userStats = [
    { title: 'Your Staked Balance', value: `${userStakedFormatted} UNI-V2`, subtitle: 'Currently staked' },
    { title: 'Your Earned Rewards', value: `${userEarnedFormatted} AIUS`, subtitle: 'Ready to claim' },
  ]

  return (
    <div className="space-y-8">
      {/* Protocol Stats */}
      <div>
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Protocol Statistics</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {protocolStats.map((stat, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 p-6 shadow-lg"
            >
              <h3 className="mb-2 text-sm font-medium text-gray-600">{stat.title}</h3>
              <p className="mb-1 text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.subtitle}</p>
            </div>
          ))}
        </div>
      </div>

      {/* User Stats */}
      {isConnected && (
        <div>
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Your Statistics</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {userStats.map((stat, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white p-8 shadow-lg"
              >
                <h3 className="mb-2 text-sm font-medium text-gray-600">{stat.title}</h3>
                <p className="mb-1 text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isConnected && (
        <div className="rounded-2xl bg-white p-12 text-center shadow-lg">
          <p className="text-gray-600">Connect your wallet to view your statistics</p>
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">How LP Staking Works</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700">Getting Started</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Provide liquidity on Uniswap V2 (AIUS/ETH)</li>
              <li>• Receive UNI-V2 LP tokens</li>
              <li>• Stake your UNI-V2 tokens here</li>
              <li>• Earn AIUS rewards continuously</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700">Important Notes</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Rewards accrue every second</li>
              <li>• Claim rewards at any time</li>
              <li>• No lock-up period for unstaking</li>
              <li>• APR varies based on total staked</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
