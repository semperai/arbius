'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useAccount } from 'wagmi'
import { useContractReadHook } from '@/hooks/useContractRead'
import baseTokenAbi from '@/abis/baseTokenV1.json'
import { formatUnits } from 'viem'
import type { Abi } from 'viem'

interface ModelCardProps {
  name: string
  role: string
  description: string
  imageUrl: string
  cid: string
  contracts: {
    token?: string
    xtoken?: string
    lpstaking?: string
    lp?: string
  }
}

export function ModelCard({
  name,
  role,
  description,
  imageUrl,
  cid,
  contracts,
}: ModelCardProps) {
  const { address, isConnected } = useAccount()
  const [showDetails, setShowDetails] = useState(false)

  // Read token balance if contract exists
  const { data: balance } = useContractReadHook({
    address: contracts.token as `0x${string}`,
    abi: baseTokenAbi.abi as Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: isConnected && !!address && !!contracts.token,
  })

  const balanceFormatted = balance ? parseFloat(formatUnits(balance as bigint, 18)).toFixed(4) : '0'

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Could add a toast notification here
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl">
      {/* Model Image */}
      <div className="relative aspect-[3/2] w-full overflow-hidden">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>

      {/* Model Info */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900">{name}</h3>
        <p className="mt-1 text-sm font-medium text-primary">{role}</p>
        <p className="mt-3 text-sm text-gray-600">{description}</p>

        {/* Contract Info */}
        {contracts.token ? (
          <div className="mt-4 space-y-3">
            {/* Token Address */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={contracts.token}
                readOnly
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-mono text-gray-700"
              />
              <button
                onClick={() => copyToClipboard(contracts.token!)}
                className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
                title="Copy Contract Address"
              >
                Copy
              </button>
            </div>

            {/* Wallet Connected */}
            {isConnected && (
              <div className="rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Your Balance:</span>
                  <span className="text-lg font-bold text-primary">{balanceFormatted}</span>
                </div>
                <button className="mt-3 w-full rounded-lg bg-gradient-to-r from-primary to-blue-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                  Swap Tokens
                </button>
              </div>
            )}

            {/* CID Details Toggle */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-primary hover:underline"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>

            {showDetails && (
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-600">Model CID:</p>
                <p className="mt-1 break-all font-mono text-xs text-gray-700">{cid}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-lg bg-green-50 p-3">
            <p className="text-sm font-medium text-green-700">This model has no fee</p>
            <p className="mt-1 text-xs text-green-600">Free to use for all users</p>
          </div>
        )}
      </div>
    </div>
  )
}
