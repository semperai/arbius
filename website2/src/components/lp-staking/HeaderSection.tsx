'use client'

import { useContractReadHook } from '@/hooks/useContractRead'
import veStakingAbi from '@/abis/veStaking.json'
import baseTokenAbi from '@/abis/baseTokenV1.json'
import univ2Abi from '@/abis/univ2ContractABI.json'
import { formatUnits } from 'viem'
import type { Abi, Address } from 'viem'
import Link from 'next/link'
import config from '@/config.eth.json'

const STAKING_ADDRESS = config.STAKING_REWARD_ADDRESS as Address
const UNIV2_ADDRESS = config.UNIV2_ADDRESS as Address
const AIUS_ADDRESS = config.AIUS_TOKEN_ADDRESS as Address

export function HeaderSection() {
  // Read total staked UNI-V2
  const { data: totalSupply } = useContractReadHook({
    address: STAKING_ADDRESS,
    abi: veStakingAbi.abi as Abi,
    functionName: 'totalSupply',
    enabled: true,
  })

  // Read AIUS balance in staking contract (rewards remaining)
  const { data: aiusBalance } = useContractReadHook({
    address: AIUS_ADDRESS,
    abi: baseTokenAbi.abi as Abi,
    functionName: 'balanceOf',
    args: [STAKING_ADDRESS],
    enabled: true,
  })

  // Read reward rate
  const { data: rewardRate } = useContractReadHook({
    address: STAKING_ADDRESS,
    abi: veStakingAbi.abi as Abi,
    functionName: 'rewardRate',
    enabled: true,
  })

  // Read UNI-V2 total supply
  const { data: univ2TotalSupply } = useContractReadHook({
    address: UNIV2_ADDRESS,
    abi: univ2Abi as unknown as Abi,
    functionName: 'totalSupply',
    enabled: true,
  })

  // Read AIUS balance in UNI-V2 pool
  const { data: aiusInPool } = useContractReadHook({
    address: AIUS_ADDRESS,
    abi: baseTokenAbi.abi as Abi,
    functionName: 'balanceOf',
    args: [UNIV2_ADDRESS],
    enabled: true,
  })

  const totalSupplyFormatted = totalSupply ? parseFloat(formatUnits(totalSupply as bigint, 18)).toFixed(2) : '0'
  const aiusBalanceFormatted = aiusBalance ? parseFloat(formatUnits(aiusBalance as bigint, 18)).toFixed(0) : '0'

  // Calculate APR
  const calculateAPR = () => {
    if (!rewardRate || !totalSupply || !univ2TotalSupply || !aiusInPool) return '0'

    try {
      const ratePerYear = Number(rewardRate as bigint) * 31536000 // seconds in a year
      const totalStakedValue = Number(totalSupply as bigint)

      if (totalStakedValue === 0) return '0'

      const apr = (ratePerYear / totalStakedValue) * 100

      // Adjust for UNI-V2 to AIUS ratio
      const ratio = Number(univ2TotalSupply as bigint) / Number(aiusInPool as bigint)
      const adjustedAPR = apr * ratio

      return adjustedAPR.toFixed(0)
    } catch (error) {
      console.error('APR calculation error:', error)
      return '0'
    }
  }

  const apr = calculateAPR()

  const stats = [
    { value: totalSupplyFormatted, label: 'UNI-V2', sublabel: 'Staked' },
    { value: aiusBalanceFormatted, label: 'AIUS', sublabel: 'Remaining' },
    { value: `${apr}%`, label: '', sublabel: 'APR' },
  ]

  return (
    <div className="py-16 lg:py-24">
      <div className="mx-auto w-[90%] max-w-[2000px] lg:w-[80%]">
        <h1 className="mb-4 text-[45px] font-bold text-gray-900 lg:text-[50px] 2xl:text-[70px]">
          AIUS Uniswap V2 LP Staking
        </h1>
        <p className="mb-8 text-para text-gray-600">
          Stake AIUS and ETH, earn AIUS rewards.
        </p>

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 p-6 shadow-lg"
            >
              <p className="mb-2 text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm font-medium text-gray-700">
                {stat.label} {stat.sublabel}
              </p>
            </div>
          ))}
        </div>

        <Link
          href="https://app.uniswap.org/add/v2/0x8afe4055ebc86bd2afb3940c0095c9aca511d852/ETH?chain=mainnet"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block font-medium text-primary hover:underline"
        >
          Get UNI-V2 by providing liquidity on Uniswap →
        </Link>
      </div>
    </div>
  )
}
