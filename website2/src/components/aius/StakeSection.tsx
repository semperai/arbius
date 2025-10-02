'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useChainId, useReadContract } from 'wagmi'
import { useContractWriteHook } from '@/hooks/useContractWrite'
import { formatUnits, parseUnits } from 'viem'
import baseTokenAbi from '@/abis/baseTokenV1.json'
import votingEscrowAbi from '@/abis/votingEscrow.json'
import { ARBIUS_CONFIG } from '@/config/arbius'

const SECONDS_PER_WEEK = 604800
const SECONDS_PER_MONTH = 2592000 // ~30 days
const MAX_LOCK_TIME = 126144000 // 4 years in seconds

export function StakeSection() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [amount, setAmount] = useState('')
  const [months, setMonths] = useState(12)
  const [weeks, setWeeks] = useState(0)
  const [isApproving, setIsApproving] = useState(false)
  const [isStaking, setIsStaking] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const config = ARBIUS_CONFIG[chainId as keyof typeof ARBIUS_CONFIG]
  const veAIUSAddress = config?.veAIUSAddress
  const baseTokenAddress = config?.baseTokenAddress

  // Read AIUS balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: baseTokenAddress,
    abi: baseTokenAbi.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!baseTokenAddress },
  })

  // Read allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: baseTokenAddress,
    abi: baseTokenAbi.abi,
    functionName: 'allowance',
    args: address && veAIUSAddress ? [address, veAIUSAddress] : undefined,
    query: { enabled: !!address && !!baseTokenAddress && !!veAIUSAddress },
  })

  const { write: writeContract, isPending, isSuccess, error } = useContractWriteHook()

  const balanceFormatted = balance ? formatUnits(balance as bigint, 18) : '0'
  const allowanceAmount = allowance ? (allowance as bigint) : BigInt(0)

  // Calculate total lock duration in seconds
  const totalLockSeconds = (months * SECONDS_PER_MONTH) + (weeks * SECONDS_PER_WEEK)
  const totalWeeks = Math.floor(totalLockSeconds / SECONDS_PER_WEEK)

  // Calculate voting power (linear decay model)
  // veAIUS = amount * (lock_time / MAX_LOCK_TIME)
  const calculateVotingPower = () => {
    if (!amount || parseFloat(amount) === 0) return '0'
    try {
      const amountNum = parseFloat(amount)
      const ratio = totalLockSeconds / MAX_LOCK_TIME
      return (amountNum * ratio).toFixed(4)
    } catch {
      return '0'
    }
  }

  const votingPower = calculateVotingPower()

  // Simple APR estimate (this would be more complex in production)
  const estimatedAPR = 15.5 // Placeholder - should be fetched from contract

  // Validation functions
  const validateAmount = useCallback((): string | null => {
    if (!amount || amount.trim() === '') {
      return 'Please enter an amount'
    }

    const amountNum = parseFloat(amount)

    if (isNaN(amountNum)) {
      return 'Please enter a valid number'
    }

    if (amountNum <= 0) {
      return 'Amount must be greater than 0'
    }

    if (amountNum > parseFloat(balanceFormatted)) {
      return `Insufficient balance. You have ${parseFloat(balanceFormatted).toFixed(4)} AIUS`
    }

    return null
  }, [amount, balanceFormatted])

  const validateDuration = useCallback((): string | null => {
    const MIN_LOCK_SECONDS = SECONDS_PER_WEEK // 1 week minimum

    if (totalLockSeconds < MIN_LOCK_SECONDS) {
      return 'Lock duration must be at least 1 week'
    }

    if (totalLockSeconds > MAX_LOCK_TIME) {
      return 'Lock duration cannot exceed 4 years'
    }

    return null
  }, [totalLockSeconds])

  const validateAll = useCallback((): boolean => {
    const amountError = validateAmount()
    const durationError = validateDuration()

    if (amountError) {
      setValidationError(amountError)
      return false
    }

    if (durationError) {
      setValidationError(durationError)
      return false
    }

    setValidationError(null)
    return true
  }, [validateAmount, validateDuration])

  const needsApproval = () => {
    if (!amount || amount === '0') return false
    try {
      const amountBigInt = parseUnits(amount, 18)
      return allowanceAmount < amountBigInt
    } catch {
      return false
    }
  }

  const handleApprove = useCallback(async () => {
    // Validate before approving
    if (!validateAll()) {
      return
    }

    if (!amount || !veAIUSAddress || !baseTokenAddress) {
      setValidationError('Missing configuration. Please try again.')
      return
    }

    setIsApproving(true)
    setValidationError(null)

    try {
      const amountBigInt = parseUnits(amount, 18)
      await writeContract({
        address: baseTokenAddress,
        abi: baseTokenAbi.abi,
        functionName: 'approve',
        args: [veAIUSAddress, amountBigInt],
      })
    } catch (error) {
      setValidationError('Approval failed. Please try again.')
      setIsApproving(false)
    }
  }, [amount, veAIUSAddress, baseTokenAddress, writeContract, validateAll])

  const handleLock = useCallback(async () => {
    // Validate before locking
    if (!validateAll()) {
      return
    }

    if (!amount || !address || !veAIUSAddress) {
      setValidationError('Please connect your wallet and try again.')
      return
    }

    if (totalLockSeconds === 0) {
      setValidationError('Please select a lock duration.')
      return
    }

    setIsStaking(true)
    setValidationError(null)

    try {
      const amountBigInt = parseUnits(amount, 18)
      const unlockTime = Math.floor(Date.now() / 1000) + totalLockSeconds

      await writeContract({
        address: veAIUSAddress,
        abi: votingEscrowAbi.abi,
        functionName: 'create_lock',
        args: [amountBigInt, BigInt(unlockTime)],
      })
    } catch (error) {
      setValidationError('Lock transaction failed. Please try again.')
      setIsStaking(false)
    }
  }, [amount, address, veAIUSAddress, totalLockSeconds, writeContract, validateAll])

  useEffect(() => {
    if (isSuccess) {
      if (isApproving) {
        setIsApproving(false)
        refetchAllowance()
      }
      if (isStaking) {
        setIsStaking(false)
        setAmount('')
        setMonths(12)
        setWeeks(0)
        refetchBalance()
      }
    }
  }, [isSuccess, isApproving, isStaking, refetchAllowance, refetchBalance])

  const unlockDate = new Date(Date.now() + totalLockSeconds * 1000)

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg lg:p-8">
      <div className="mb-6">
        <h2 className="mb-2 text-2xl font-bold text-black-text">Lock AIUS for veAIUS</h2>
        <p className="text-sm text-gray-600">
          Lock your AIUS tokens to receive veAIUS and earn governance rights
        </p>
      </div>

      {!isConnected ? (
        <div className="rounded-lg bg-gray-50 p-8 text-center">
          <div className="mx-auto mb-3 text-4xl">🔐</div>
          <p className="text-gray-600">Connect your wallet to lock AIUS tokens</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Balance Display */}
          <div className="grid gap-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-gray-600">Available AIUS</p>
              <p className="text-xl font-bold text-black-text">
                {parseFloat(balanceFormatted).toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Estimated APR</p>
              <p className="text-xl font-bold text-green-600">{estimatedAPR}%</p>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Amount to Lock
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  // Clear validation error when user starts typing
                  if (validationError) {
                    setValidationError(null)
                  }
                }}
                placeholder="0.0"
                min="0"
                step="any"
                aria-label="Amount of AIUS tokens to lock"
                aria-describedby={validationError ? "amount-error" : undefined}
                aria-invalid={!!validationError}
                className={`w-full rounded-lg border-2 px-4 py-3 pr-20 text-lg focus:outline-none focus:ring-2 ${
                  validationError
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                    : 'border-gray-200 focus:border-purple-text focus:ring-purple-text/20'
                }`}
              />
              <button
                onClick={() => setAmount(balanceFormatted)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-text hover:bg-purple-200"
                aria-label="Set amount to maximum balance"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Duration Sliders */}
          <div className="space-y-4 rounded-lg border-2 border-gray-200 p-4">
            <h3 className="font-semibold text-gray-700">Lock Duration</h3>

            {/* Months Slider */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-600">Months</label>
                <span className="rounded bg-gray-100 px-2 py-1 text-sm font-bold text-gray-700">
                  {months}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="48"
                value={months}
                onChange={(e) => setMonths(parseInt(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
                aria-label={`Lock duration in months: ${months} months`}
                aria-valuemin={0}
                aria-valuemax={48}
                aria-valuenow={months}
                style={{
                  background: `linear-gradient(to right, #4A28FF 0%, #4A28FF ${(months / 48) * 100}%, #E5E7EB ${(months / 48) * 100}%, #E5E7EB 100%)`
                }}
              />
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>0</span>
                <span>48 months</span>
              </div>
            </div>

            {/* Weeks Slider */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-600">Weeks</label>
                <span className="rounded bg-gray-100 px-2 py-1 text-sm font-bold text-gray-700">
                  {weeks}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="52"
                value={weeks}
                onChange={(e) => setWeeks(parseInt(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
                aria-label={`Lock duration in weeks: ${weeks} weeks`}
                aria-valuemin={0}
                aria-valuemax={52}
                aria-valuenow={weeks}
                style={{
                  background: `linear-gradient(to right, #9ED6FF 0%, #9ED6FF ${(weeks / 52) * 100}%, #E5E7EB ${(weeks / 52) * 100}%, #E5E7EB 100%)`
                }}
              />
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>0</span>
                <span>52 weeks</span>
              </div>
            </div>

            {/* Total Duration */}
            <div className="mt-4 rounded-lg bg-gray-50 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-600">Total Lock:</span>
                <span className="font-bold text-black-text">
                  {months} months, {weeks} weeks ({(totalWeeks / 52).toFixed(2)} years)
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-gray-500">Unlock Date:</span>
                <span className="font-medium text-gray-700">
                  {unlockDate.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Voting Power Display */}
          <div className="rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 p-6 text-white">
            <p className="mb-1 text-sm opacity-90">You Will Receive</p>
            <p className="mb-2 text-4xl font-bold">{votingPower} veAIUS</p>
            <div className="flex items-center justify-between text-sm opacity-75">
              <span>Voting Power</span>
              <span>{totalLockSeconds > 0 ? ((totalLockSeconds / MAX_LOCK_TIME) * 100).toFixed(1) : 0}% of max</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Validation Error */}
            {validationError && (
              <div id="amount-error" className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700" role="alert">
                <span className="font-semibold">⚠️ {validationError}</span>
              </div>
            )}

            {/* Transaction Error */}
            {error && !validationError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700" role="alert">
                Error: {error.message || 'Transaction failed'}
              </div>
            )}

            {needsApproval() ? (
              <button
                onClick={handleApprove}
                disabled={isPending || isApproving || !amount || parseFloat(amount) === 0}
                className="w-full rounded-lg bg-black px-8 py-4 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                aria-label="Approve AIUS tokens for locking"
              >
                {isPending && isApproving ? '⏳ Approving...' : '✓ Approve AIUS'}
              </button>
            ) : (
              <button
                onClick={handleLock}
                disabled={isPending || isStaking || !amount || parseFloat(amount) === 0 || totalLockSeconds === 0}
                className="group relative w-full overflow-hidden rounded-lg bg-black px-8 py-4 font-semibold text-white disabled:opacity-50"
                aria-label={`Lock ${amount || '0'} AIUS for ${months} months and ${weeks} weeks`}
              >
                <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-disabled:opacity-0"></div>
                <span className="relative z-10">
                  {isPending && isStaking ? '⏳ Locking...' : isSuccess ? '✓ Lock Successful!' : '🔒 Lock AIUS'}
                </span>
              </button>
            )}
          </div>

          {/* Info Box */}
          <div className="rounded-lg bg-blue-50 p-4">
            <h4 className="mb-2 flex items-center text-sm font-semibold text-blue-900">
              <span className="mr-2">💡</span>
              Important Information
            </h4>
            <ul className="space-y-1 text-xs text-blue-800">
              <li>• Longer locks give you exponentially more voting power</li>
              <li>• Minimum lock: 1 week | Maximum: 4 years</li>
              <li>• You&apos;ll receive an NFT representing your position</li>
              <li>• Voting power decays linearly until unlock</li>
              <li>• Lock is non-reversible until expiry</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
