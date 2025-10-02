'use client'

import { useAccount } from 'wagmi'
import { useContractReadHook } from '@/hooks/useContractRead'
import { contracts } from '@/lib/contracts'
import votingEscrowAbi from '@/abis/votingEscrow.json'
import baseTokenAbi from '@/abis/baseTokenV1.json'
import { formatUnits } from 'viem'
import type { Abi } from 'viem'

export function Dashboard() {
  const { address, isConnected } = useAccount()

  // Read total supply of veAIUS
  const { data: totalSupply } = useContractReadHook({
    address: contracts.engine,
    abi: votingEscrowAbi.abi as Abi,
    functionName: 'totalSupply',
    enabled: true,
  })

  // Read user's veAIUS balance
  const { data: veBalance } = useContractReadHook({
    address: contracts.engine,
    abi: votingEscrowAbi.abi as Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: isConnected && !!address,
  })

  // Read user's AIUS balance
  const { data: aiusBalance } = useContractReadHook({
    address: contracts.baseToken,
    abi: baseTokenAbi.abi as Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: isConnected && !!address,
  })

  const totalSupplyFormatted = totalSupply ? parseFloat(formatUnits(totalSupply as bigint, 18)).toFixed(2) : '0'
  const veBalanceFormatted = veBalance ? parseFloat(formatUnits(veBalance as bigint, 18)).toFixed(4) : '0'
  const aiusBalanceFormatted = aiusBalance ? parseFloat(formatUnits(aiusBalance as bigint, 18)).toFixed(4) : '0'

  const votingPowerPercentage = totalSupply && veBalance && totalSupply !== BigInt(0)
    ? ((Number(veBalance as bigint) / Number(totalSupply as bigint)) * 100).toFixed(4)
    : '0'

  const stats = [
    {
      title: 'Total veAIUS Supply',
      value: totalSupplyFormatted,
      subtitle: 'Protocol-wide',
      gradient: 'from-purple-50 to-blue-50',
    },
    {
      title: 'Your veAIUS Balance',
      value: veBalanceFormatted,
      subtitle: `${votingPowerPercentage}% of total voting power`,
      gradient: 'from-blue-50 to-purple-50',
    },
    {
      title: 'Your AIUS Balance',
      value: aiusBalanceFormatted,
      subtitle: 'Available to lock',
      gradient: 'from-purple-50 to-pink-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-3xl font-bold text-black-text">Dashboard</h2>
        <p className="text-gray-600">
          Overview of your veAIUS position and protocol statistics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`rounded-2xl bg-gradient-to-br ${stat.gradient} p-6 shadow-lg`}
          >
            <h3 className="mb-2 text-sm font-medium text-gray-600">{stat.title}</h3>
            <p className="mb-1 text-3xl font-bold text-black-text">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.subtitle}</p>
          </div>
        ))}
      </div>

      {/* User Position Details */}
      {isConnected ? (
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h3 className="mb-6 text-xl font-semibold text-black-text">Your Position</h3>

          <div className="grid gap-6 md:grid-cols-2">
            {/* veAIUS NFT Info */}
            <div className="rounded-lg border border-gray-200 p-6">
              <h4 className="mb-4 font-medium text-gray-700">veAIUS NFT</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Balance:</span>
                  <span className="font-semibold text-black-text">{veBalanceFormatted} veAIUS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Voting Power:</span>
                  <span className="font-semibold text-purple-text">{votingPowerPercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lock Status:</span>
                  <span className="font-semibold text-green-600">Active</span>
                </div>
              </div>
            </div>

            {/* Rewards Info */}
            <div className="rounded-lg border border-gray-200 p-6">
              <h4 className="mb-4 font-medium text-gray-700">Rewards</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Accrued Rewards:</span>
                  <span className="font-semibold text-black-text">0.0000 AIUS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Claimed Rewards:</span>
                  <span className="font-semibold text-black-text">0.0000 AIUS</span>
                </div>
                <button className="mt-2 w-full rounded-lg bg-gradient-to-r from-purple-text to-blue-500 px-4 py-2 text-sm font-medium text-white opacity-50">
                  Claim Rewards (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-12 text-center shadow-lg">
          <p className="text-gray-600">Connect your wallet to view your position</p>
        </div>
      )}

      {/* Protocol Info */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-50 via-blue-50 to-pink-50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">About veAIUS</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700">Benefits</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Earn rewards from protocol fees</li>
              <li>• Vote on gauge emissions</li>
              <li>• Governance participation</li>
              <li>• Boost model inference rewards</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700">Mechanics</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Lock AIUS for 1 week to 2 years</li>
              <li>• Longer locks = more voting power</li>
              <li>• Receive NFT representing position</li>
              <li>• Weekly gauge voting epochs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
