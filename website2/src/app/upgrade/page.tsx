'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { useContractReadHook } from '@/hooks/useContractRead'
import { useContractWriteHook } from '@/hooks/useContractWrite'
import baseTokenAbi from '@/abis/baseTokenV1.json'
import { formatUnits } from 'viem'
import type { Abi, Address } from 'viem'
import config from '@/config.json'

// OneToOneConvert ABI (simplified for swap function)
const oneToOneAbi = [
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'swap',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export default function UpgradePage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [isApproving, setIsApproving] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)

  // Determine addresses based on chain
  const [v1TokenAddress, setV1TokenAddress] = useState<Address>('0x0')
  const [v2TokenAddress, setV2TokenAddress] = useState<Address>('0x0')
  const [oneToOneAddress, setOneToOneAddress] = useState<Address>('0x0')

  useEffect(() => {
    if (chainId) {
      // Ethereum mainnet (1)
      if (chainId === 1) {
        setV1TokenAddress(config.l1TokenAddress as Address)
        setV2TokenAddress(config.v2_l1TokenAddress as Address)
        setOneToOneAddress(config.l1OneToOneAddress as Address)
      }
      // Arbitrum Nova (42170)
      else if (chainId === 42170) {
        setV1TokenAddress(config.baseTokenAddress as Address)
        setV2TokenAddress(config.v2_baseTokenAddress as Address)
        setOneToOneAddress(config.l2OneToOneAddress as Address)
      }
    }
  }, [chainId])

  // Read V1 token balance
  const { data: v1Balance, refetch: refetchV1 } = useContractReadHook({
    address: v1TokenAddress,
    abi: baseTokenAbi.abi as Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: isConnected && !!address && v1TokenAddress !== '0x0',
  })

  // Read V2 token balance
  const { data: v2Balance, refetch: refetchV2 } = useContractReadHook({
    address: v2TokenAddress,
    abi: baseTokenAbi.abi as Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: isConnected && !!address && v2TokenAddress !== '0x0',
  })

  // Read allowance
  const { data: allowance, refetch: refetchAllowance } = useContractReadHook({
    address: v1TokenAddress,
    abi: baseTokenAbi.abi as Abi,
    functionName: 'allowance',
    args: address ? [address, oneToOneAddress] : undefined,
    enabled: isConnected && !!address && v1TokenAddress !== '0x0' && oneToOneAddress !== '0x0',
  })

  const { write: writeContract, isPending, isSuccess } = useContractWriteHook()

  const v1BalanceFormatted = v1Balance ? formatUnits(v1Balance as bigint, 18) : '0'
  const v2BalanceFormatted = v2Balance ? formatUnits(v2Balance as bigint, 18) : '0'
  const allowanceAmount = allowance ? (allowance as bigint) : BigInt(0)
  const v1BalanceBigInt = v1Balance ? (v1Balance as bigint) : BigInt(0)

  const needsApproval = () => {
    if (!v1Balance || v1BalanceBigInt === BigInt(0)) return false
    return allowanceAmount < v1BalanceBigInt
  }

  const handleApprove = async () => {
    if (!v1Balance) return
    setIsApproving(true)
    try {
      writeContract({
        address: v1TokenAddress,
        abi: baseTokenAbi.abi as Abi,
        functionName: 'approve',
        args: [oneToOneAddress, v1BalanceBigInt],
      })
    } catch (error) {
      console.error('Approval error:', error)
      setIsApproving(false)
    }
  }

  const handleSwap = async () => {
    if (!v1Balance) return
    setIsSwapping(true)
    try {
      writeContract({
        address: oneToOneAddress,
        abi: oneToOneAbi as Abi,
        functionName: 'swap',
        args: [v1BalanceBigInt],
      })
    } catch (error) {
      console.error('Swap error:', error)
      setIsSwapping(false)
    }
  }

  useEffect(() => {
    if (isSuccess) {
      if (isApproving) {
        setIsApproving(false)
        refetchAllowance()
      }
      if (isSwapping) {
        setIsSwapping(false)
        refetchV1()
        refetchV2()
      }
    }
  }, [isSuccess, isApproving, isSwapping, refetchAllowance, refetchV1, refetchV2])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-24 sm:py-32">
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20"></div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Upgrade AIUS
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Arbius tokens have been upgraded. Deposit your v1 tokens and you will receive new
              AIUS in exchange, 1:1.
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade Section */}
      <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
        {!isConnected ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
              <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="mb-6 text-lg text-gray-600">Connect your wallet to upgrade your AIUS tokens</p>
            <w3m-button />
          </div>
        ) : chainId !== 1 && chainId !== 42170 ? (
          <div className="rounded-2xl bg-yellow-50 p-12 text-center shadow-lg border-2 border-yellow-200">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-yellow-900">Wrong Network</h3>
            <p className="font-medium text-yellow-800">
              Please switch to <strong>Ethereum Mainnet</strong> or <strong>Arbitrum Nova</strong> to upgrade your tokens.
            </p>
            <p className="mt-2 text-sm text-yellow-700">
              The upgrade contract is available on these networks.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* V1 Balance */}
            <div className="rounded-2xl bg-white p-8 shadow-lg">
              <h3 className="mb-4 text-xl font-semibold text-black-text">Your V1 Balance</h3>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={parseFloat(v1BalanceFormatted).toFixed(4)}
                  readOnly
                  className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-lg font-semibold text-gray-900"
                />
                <span className="text-lg font-medium text-gray-600">AIUS V1</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="rounded-2xl bg-white p-8 shadow-lg">
              <h3 className="mb-4 text-xl font-semibold text-black-text">Upgrade Action</h3>
              {v1BalanceBigInt === BigInt(0) ? (
                <button
                  disabled
                  className="w-full rounded-lg bg-gray-400 px-8 py-3 font-medium text-white"
                >
                  No AIUS V1 to Upgrade
                </button>
              ) : needsApproval() ? (
                <button
                  onClick={handleApprove}
                  disabled={isPending || isApproving}
                  className="group relative w-full overflow-hidden rounded-lg bg-black-background px-8 py-3 font-medium text-white disabled:opacity-50"
                >
                  <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-purple-text to-blue-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                  <span className="relative z-10">
                    {isPending && isApproving ? 'Approving...' : 'Approve V1 Tokens'}
                  </span>
                </button>
              ) : (
                <button
                  onClick={handleSwap}
                  disabled={isPending || isSwapping}
                  className="group relative w-full overflow-hidden rounded-lg bg-black-background px-8 py-3 font-medium text-white disabled:opacity-50"
                >
                  <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-purple-text to-blue-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                  <span className="relative z-10">
                    {isPending && isSwapping ? 'Upgrading...' : 'Upgrade to V2'}
                  </span>
                </button>
              )}
            </div>

            {/* V2 Balance */}
            <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 p-8 shadow-lg">
              <h3 className="mb-4 text-xl font-semibold text-black-text">Your V2 Balance</h3>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={parseFloat(v2BalanceFormatted).toFixed(4)}
                  readOnly
                  className="flex-1 rounded-lg border border-purple-300 bg-white px-4 py-3 text-lg font-semibold text-purple-text"
                />
                <span className="text-lg font-medium text-purple-text">AIUS V2</span>
              </div>
            </div>

            {/* Info Box */}
            <div className="rounded-2xl bg-blue-50 p-6">
              <h4 className="mb-3 font-semibold text-gray-900">Important Information</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="text-blue-500">•</span>
                  <span>The upgrade is 1:1 - you will receive the same amount of V2 tokens</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500">•</span>
                  <span>First approve the contract to spend your V1 tokens</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Then upgrade to receive your V2 tokens</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500">•</span>
                  <span>This process is irreversible</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
