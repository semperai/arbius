'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useContractReadHook } from '@/hooks/useContractRead'
import { useContractWriteHook } from '@/hooks/useContractWrite'
import { contracts } from '@/lib/contracts'
import baseTokenAbi from '@/abis/baseTokenV1.json'
import votingEscrowAbi from '@/abis/votingEscrow.json'
import { formatUnits, parseUnits } from 'viem'
import type { Abi } from 'viem'

const SECONDS_PER_WEEK = 604800
const MAX_LOCK_WEEKS = 104 // 2 years

export function StakeSection() {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState('')
  const [lockWeeks, setLockWeeks] = useState(52) // Default 1 year
  const [isApproving, setIsApproving] = useState(false)
  const [isStaking, setIsStaking] = useState(false)

  // Read AIUS balance
  const { data: balance } = useContractReadHook({
    address: contracts.baseToken,
    abi: baseTokenAbi.abi as Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: isConnected && !!address,
  })

  // Read allowance
  const { data: allowance, refetch: refetchAllowance } = useContractReadHook({
    address: contracts.baseToken,
    abi: baseTokenAbi.abi as Abi,
    functionName: 'allowance',
    args: address ? [address, contracts.engine] : undefined,
    enabled: isConnected && !!address,
  })

  // Read veAIUS balance
  const { data: veBalance } = useContractReadHook({
    address: contracts.engine,
    abi: votingEscrowAbi.abi as Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: isConnected && !!address,
  })

  const { write: writeContract, isPending, isSuccess } = useContractWriteHook()

  const balanceFormatted = balance ? formatUnits(balance as bigint, 18) : '0'
  const veBalanceFormatted = veBalance ? formatUnits(veBalance as bigint, 18) : '0'
  const allowanceAmount = allowance ? (allowance as bigint) : BigInt(0)

  const needsApproval = () => {
    if (!amount || amount === '0') return false
    try {
      const amountBigInt = parseUnits(amount, 18)
      return allowanceAmount < amountBigInt
    } catch {
      return false
    }
  }

  const handleApprove = async () => {
    if (!amount) return
    setIsApproving(true)
    try {
      const amountBigInt = parseUnits(amount, 18)
      writeContract({
        address: contracts.baseToken,
        abi: baseTokenAbi.abi as Abi,
        functionName: 'approve',
        args: [contracts.engine, amountBigInt],
      })
    } catch (error) {
      console.error('Approval error:', error)
      setIsApproving(false)
    }
  }

  const handleStake = async () => {
    if (!amount || !address) return
    setIsStaking(true)
    try {
      const amountBigInt = parseUnits(amount, 18)
      const lockTime = BigInt(lockWeeks * SECONDS_PER_WEEK)

      writeContract({
        address: contracts.engine,
        abi: votingEscrowAbi.abi as Abi,
        functionName: 'create_lock',
        args: [amountBigInt, lockTime],
      })
    } catch (error) {
      console.error('Stake error:', error)
      setIsStaking(false)
    }
  }

  useEffect(() => {
    if (isSuccess && isApproving) {
      setIsApproving(false)
      refetchAllowance()
    }
    if (isSuccess && isStaking) {
      setIsStaking(false)
      setAmount('')
    }
  }, [isSuccess, isApproving, isStaking, refetchAllowance])

  const votingPower = amount && lockWeeks ? (
    parseFloat(amount) * (lockWeeks / MAX_LOCK_WEEKS)
  ).toFixed(4) : '0'

  return (
    <div className="rounded-2xl bg-white p-8 shadow-lg">
      <h2 className="mb-6 text-2xl font-bold text-black-text">Lock AIUS for veAIUS</h2>

      {!isConnected ? (
        <div className="rounded-lg bg-gray-50 p-6 text-center">
          <p className="text-gray-600">Connect your wallet to stake AIUS</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Balance Display */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
            <div>
              <p className="text-sm text-gray-600">Your AIUS Balance</p>
              <p className="text-xl font-bold text-black-text">{parseFloat(balanceFormatted).toFixed(4)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Your veAIUS</p>
              <p className="text-xl font-bold text-purple-text">{parseFloat(veBalanceFormatted).toFixed(4)}</p>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Amount to Lock
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-purple-text focus:outline-none focus:ring-2 focus:ring-purple-text/20"
              />
              <button
                onClick={() => setAmount(balanceFormatted)}
                className="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Lock Duration Slider */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Lock Duration: {lockWeeks} weeks ({(lockWeeks / 52).toFixed(1)} years)
            </label>
            <input
              type="range"
              min="1"
              max={MAX_LOCK_WEEKS}
              value={lockWeeks}
              onChange={(e) => setLockWeeks(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>1 week</span>
              <span>2 years</span>
            </div>
          </div>

          {/* Voting Power Display */}
          <div className="rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-4">
            <p className="text-sm text-gray-600">Estimated Voting Power</p>
            <p className="text-2xl font-bold text-purple-text">{votingPower} veAIUS</p>
            <p className="mt-1 text-xs text-gray-500">
              Based on {lockWeeks} week lock duration
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {needsApproval() ? (
              <button
                onClick={handleApprove}
                disabled={isPending || isApproving || !amount}
                className="w-full rounded-lg bg-black-background px-8 py-3 font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {isPending && isApproving ? 'Approving...' : 'Approve AIUS'}
              </button>
            ) : (
              <button
                onClick={handleStake}
                disabled={isPending || isStaking || !amount || parseFloat(amount) === 0}
                className="group relative w-full overflow-hidden rounded-lg bg-black-background px-8 py-3 font-medium text-white disabled:opacity-50"
              >
                <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-purple-text to-blue-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                <span className="relative z-10">
                  {isPending && isStaking ? 'Staking...' : 'Lock AIUS'}
                </span>
              </button>
            )}
          </div>

          {/* Info Text */}
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-gray-700">
            <p className="font-medium">Note:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Longer lock periods give you more voting power</li>
              <li>Minimum lock: 1 week, Maximum lock: 2 years</li>
              <li>You&apos;ll receive an NFT representing your veAIUS position</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
