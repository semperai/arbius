'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useContractReadHook } from '@/hooks/useContractRead'
import { useContractWriteHook } from '@/hooks/useContractWrite'
import veStakingAbi from '@/abis/veStaking.json'
import univ2Abi from '@/abis/univ2ContractABI.json'
import { formatUnits, parseUnits } from 'viem'
import type { Abi, Address } from 'viem'
import config from '@/config.eth.json'

const STAKING_ADDRESS = config.STAKING_REWARD_ADDRESS as Address
const UNIV2_ADDRESS = config.UNIV2_ADDRESS as Address

export function StakeSection() {
  const { address, isConnected } = useAccount()
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [isApproving, setIsApproving] = useState(false)
  const [isStaking, setIsStaking] = useState(false)
  const [isUnstaking, setIsUnstaking] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)

  // Read UNI-V2 balance
  const { data: univ2Balance } = useContractReadHook({
    address: UNIV2_ADDRESS,
    abi: univ2Abi as unknown as Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: isConnected && !!address,
  })

  // Read staked balance
  const { data: stakedBalance, refetch: refetchStaked } = useContractReadHook({
    address: STAKING_ADDRESS,
    abi: veStakingAbi.abi as Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: isConnected && !!address,
  })

  // Read earned rewards
  const { data: earned, refetch: refetchEarned } = useContractReadHook({
    address: STAKING_ADDRESS,
    abi: veStakingAbi.abi as Abi,
    functionName: 'earned',
    args: address ? [address] : undefined,
    enabled: isConnected && !!address,
  })

  // Read allowance
  const { data: allowance, refetch: refetchAllowance } = useContractReadHook({
    address: UNIV2_ADDRESS,
    abi: univ2Abi as unknown as Abi,
    functionName: 'allowance',
    args: address ? [address, STAKING_ADDRESS] : undefined,
    enabled: isConnected && !!address,
  })

  const { write: writeContract, isPending, isSuccess } = useContractWriteHook()

  const univ2BalanceFormatted = univ2Balance ? formatUnits(univ2Balance as bigint, 18) : '0'
  const stakedBalanceFormatted = stakedBalance ? formatUnits(stakedBalance as bigint, 18) : '0'
  const earnedFormatted = earned ? formatUnits(earned as bigint, 18) : '0'
  const allowanceAmount = allowance ? (allowance as bigint) : BigInt(0)

  const needsApproval = () => {
    if (!stakeAmount || stakeAmount === '0') return false
    try {
      const amountBigInt = parseUnits(stakeAmount, 18)
      return allowanceAmount < amountBigInt
    } catch {
      return false
    }
  }

  const handleApprove = async () => {
    if (!stakeAmount) return
    setIsApproving(true)
    try {
      const amountBigInt = parseUnits(stakeAmount, 18)
      writeContract({
        address: UNIV2_ADDRESS,
        abi: univ2Abi as unknown as Abi,
        functionName: 'approve',
        args: [STAKING_ADDRESS, amountBigInt],
      })
    } catch (error) {
      console.error('Approval error:', error)
      setIsApproving(false)
    }
  }

  const handleStake = async () => {
    if (!stakeAmount) return
    setIsStaking(true)
    try {
      const amountBigInt = parseUnits(stakeAmount, 18)
      writeContract({
        address: STAKING_ADDRESS,
        abi: veStakingAbi.abi as Abi,
        functionName: 'stake',
        args: [amountBigInt],
      })
    } catch (error) {
      console.error('Stake error:', error)
      setIsStaking(false)
    }
  }

  const handleUnstake = async () => {
    if (!unstakeAmount) return
    setIsUnstaking(true)
    try {
      const amountBigInt = parseUnits(unstakeAmount, 18)
      writeContract({
        address: STAKING_ADDRESS,
        abi: veStakingAbi.abi as Abi,
        functionName: 'withdraw',
        args: [amountBigInt],
      })
    } catch (error) {
      console.error('Unstake error:', error)
      setIsUnstaking(false)
    }
  }

  const handleClaim = async () => {
    setIsClaiming(true)
    try {
      writeContract({
        address: STAKING_ADDRESS,
        abi: veStakingAbi.abi as Abi,
        functionName: 'getReward',
      })
    } catch (error) {
      console.error('Claim error:', error)
      setIsClaiming(false)
    }
  }

  useEffect(() => {
    if (isSuccess) {
      if (isApproving) {
        setIsApproving(false)
        refetchAllowance()
      }
      if (isStaking) {
        setIsStaking(false)
        setStakeAmount('')
        refetchStaked()
        refetchEarned()
      }
      if (isUnstaking) {
        setIsUnstaking(false)
        setUnstakeAmount('')
        refetchStaked()
        refetchEarned()
      }
      if (isClaiming) {
        setIsClaiming(false)
        refetchEarned()
      }
    }
  }, [isSuccess, isApproving, isStaking, isUnstaking, isClaiming, refetchAllowance, refetchStaked, refetchEarned])

  if (!isConnected) {
    return (
      <div className="rounded-lg bg-white p-12 text-center shadow-lg">
        <p className="text-gray-600">Connect your wallet to stake UNI-V2 LP tokens</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Stake Section */}
      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-2xl font-bold text-black-text">Stake UNI-V2</h2>

        {/* Balance Display */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-xl font-bold text-black-text">{parseFloat(univ2BalanceFormatted).toFixed(4)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Staked</p>
              <p className="text-xl font-bold text-purple-text">{parseFloat(stakedBalanceFormatted).toFixed(4)}</p>
            </div>
          </div>
        </div>

        {/* Stake Input */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">Amount to Stake</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-purple-text focus:outline-none focus:ring-2 focus:ring-purple-text/20"
            />
            <button
              onClick={() => setStakeAmount(univ2BalanceFormatted)}
              className="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Stake Button */}
        {needsApproval() ? (
          <button
            onClick={handleApprove}
            disabled={isPending || isApproving || !stakeAmount}
            className="w-full rounded-lg bg-black-background px-8 py-3 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {isPending && isApproving ? 'Approving...' : 'Approve UNI-V2'}
          </button>
        ) : (
          <button
            onClick={handleStake}
            disabled={isPending || isStaking || !stakeAmount || parseFloat(stakeAmount) === 0}
            className="group relative w-full overflow-hidden rounded-lg bg-black-background px-8 py-3 font-medium text-white disabled:opacity-50"
          >
            <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-purple-text to-blue-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
            <span className="relative z-10">{isPending && isStaking ? 'Staking...' : 'Stake'}</span>
          </button>
        )}
      </div>

      {/* Unstake & Rewards Section */}
      <div className="space-y-6">
        {/* Unstake */}
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-2xl font-bold text-black-text">Unstake UNI-V2</h2>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">Amount to Unstake</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-purple-text focus:outline-none focus:ring-2 focus:ring-purple-text/20"
              />
              <button
                onClick={() => setUnstakeAmount(stakedBalanceFormatted)}
                className="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200"
              >
                MAX
              </button>
            </div>
          </div>

          <button
            onClick={handleUnstake}
            disabled={isPending || isUnstaking || !unstakeAmount || parseFloat(unstakeAmount) === 0}
            className="w-full rounded-lg bg-gray-800 px-8 py-3 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {isPending && isUnstaking ? 'Unstaking...' : 'Unstake'}
          </button>
        </div>

        {/* Rewards */}
        <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 p-8 shadow-lg">
          <h2 className="mb-4 text-2xl font-bold text-black-text">Rewards</h2>
          <div className="mb-6">
            <p className="text-sm text-gray-600">Earned AIUS</p>
            <p className="text-4xl font-bold text-purple-text">{parseFloat(earnedFormatted).toFixed(4)}</p>
          </div>

          <button
            onClick={handleClaim}
            disabled={isPending || isClaiming || parseFloat(earnedFormatted) === 0}
            className="group relative w-full overflow-hidden rounded-lg bg-black-background px-8 py-3 font-medium text-white disabled:opacity-50"
          >
            <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-purple-text to-blue-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
            <span className="relative z-10">{isPending && isClaiming ? 'Claiming...' : 'Claim Rewards'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
