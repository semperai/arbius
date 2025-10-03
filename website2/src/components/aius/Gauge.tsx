'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId, useReadContract } from 'wagmi'
import { parseAbi, formatEther } from 'viem'
import { useContractWriteHook } from '@/hooks/useContractWrite'
import VoterABI from '@/abis/voter.json'
import { ARBIUS_CONFIG, MODELS } from '@/config/arbius'

const AI_MODELS = [
  { id: MODELS.kandinsky2.id, name: 'Kandinsky 2', description: 'Text-to-image generation' },
  { id: MODELS.qwen_qwq_32b.id, name: 'Qwen QwQ 32B', description: 'Large language model' },
  { id: MODELS.wai_v120.id, name: 'WAI v1.2.0', description: 'Waifu generation' },
  { id: MODELS.damo.id, name: 'DAMO', description: 'Text-to-video' },
]

const VE_AIUS_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function balanceOfNFT(uint256 tokenId) view returns (uint256)',
  'function locked(uint256 tokenId) view returns (int128 amount, uint256 end)',
])

export function Gauge() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [tokenId, setTokenId] = useState<bigint | null>(null)

  const config = ARBIUS_CONFIG[chainId as keyof typeof ARBIUS_CONFIG]
  const voterAddress = config?.voterAddress
  const veAIUSAddress = config?.veAIUSAddress

  // Get user's veAIUS NFT count
  const { data: nftBalance, isLoading: isLoadingBalance } = useReadContract({
    address: veAIUSAddress,
    abi: VE_AIUS_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!veAIUSAddress },
  })

  // Get user's first NFT tokenId
  const { data: firstTokenId } = useReadContract({
    address: veAIUSAddress,
    abi: VE_AIUS_ABI,
    functionName: 'tokenOfOwnerByIndex',
    args: address && nftBalance && nftBalance > BigInt(0) ? [address, BigInt(0)] : undefined,
    query: { enabled: !!address && !!veAIUSAddress && nftBalance !== undefined && nftBalance > BigInt(0) },
  })

  // Get voting power for the NFT
  const { data: votingPower, isLoading: isLoadingPower } = useReadContract({
    address: veAIUSAddress,
    abi: VE_AIUS_ABI,
    functionName: 'balanceOfNFT',
    args: firstTokenId ? [firstTokenId] : undefined,
    query: { enabled: !!firstTokenId && !!veAIUSAddress },
  })

  // Get used weights (how much voting power already used) - THIS WAS UNUSED!
  const { data: usedWeights, isLoading: isLoadingUsed } = useReadContract({
    address: voterAddress,
    abi: VoterABI.abi,
    functionName: 'usedWeights',
    args: firstTokenId ? [firstTokenId] : undefined,
    query: { enabled: !!firstTokenId && !!voterAddress },
  })

  // Get current votes for each model - THIS WAS UNUSED!
  const { data: currentVotes, isLoading: isLoadingVotes } = useReadContract({
    address: voterAddress,
    abi: VoterABI.abi,
    functionName: 'votes',
    args: firstTokenId ? [firstTokenId] : undefined,
    query: { enabled: !!firstTokenId && !!voterAddress },
  })

  useEffect(() => {
    if (firstTokenId) {
      setTokenId(firstTokenId as bigint)
    }
  }, [firstTokenId])

  // Initialize votes from current on-chain votes
  useEffect(() => {
    if (currentVotes && Array.isArray(currentVotes)) {
      const initialVotes: Record<string, number> = {}
      // currentVotes is typically [addresses[], weights[]]
      if (currentVotes.length >= 2) {
        const addresses = currentVotes[0] as `0x${string}`[]
        const weights = currentVotes[1] as bigint[]

        addresses.forEach((addr, idx) => {
          // Weights are in basis points (10000 = 100%)
          const percentage = Number(weights[idx]) / 100
          initialVotes[addr.toLowerCase()] = percentage
        })
      }
      setVotes(initialVotes)
    }
  }, [currentVotes])

  const { write: submitVote, isPending, isSuccess } = useContractWriteHook()

  const handleVoteChange = (modelId: string, value: number) => {
    setVotes((prev) => ({
      ...prev,
      [modelId]: value,
    }))
  }

  const totalVotes = Object.values(votes).reduce((sum, val) => sum + val, 0)
  const canSubmit = totalVotes === 100

  // Calculate remaining voting power
  const votingPowerBigInt = votingPower as bigint | undefined
  const usedWeightsBigInt = usedWeights as bigint | undefined
  const remainingPower = votingPowerBigInt && usedWeightsBigInt
    ? votingPowerBigInt - usedWeightsBigInt
    : votingPowerBigInt || BigInt(0)

  const usagePercentage = votingPowerBigInt && usedWeightsBigInt && votingPowerBigInt > BigInt(0)
    ? (Number(usedWeightsBigInt) / Number(votingPowerBigInt)) * 100
    : 0

  const handleSubmitVotes = async () => {
    if (!canSubmit || !tokenId || !voterAddress) return

    try {
      const modelVote: `0x${string}`[] = []
      const weights: bigint[] = []

      Object.entries(votes).forEach(([modelId, weight]) => {
        if (weight > 0) {
          modelVote.push(modelId as `0x${string}`)
          weights.push(BigInt(weight * 100))
        }
      })

      await submitVote({
        address: voterAddress,
        abi: VoterABI.abi,
        functionName: 'vote',
        args: [tokenId, modelVote, weights],
      })
    } catch (error) {
      console.error('Error submitting votes:', error)
    }
  }

  if (!isConnected) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
        <p className="text-gray-600">Connect your wallet to participate in gauge voting</p>
      </div>
    )
  }

  if (isLoadingBalance) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-1/2 rounded bg-gray-200"></div>
          <div className="h-4 w-3/4 rounded bg-gray-200"></div>
        </div>
      </div>
    )
  }

  if (!nftBalance || nftBalance === BigInt(0)) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
        <p className="mb-2 text-lg font-semibold text-gray-800">No veAIUS Position</p>
        <p className="text-gray-600">You need to lock AIUS tokens to participate in gauge voting</p>
      </div>
    )
  }

  const isLoading = isLoadingPower || isLoadingUsed || isLoadingVotes

  return (
    <div className="space-y-6">
      {/* Voting Power Stats */}
      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-xl font-bold text-gray-900">Your Voting Power</h3>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-purple-50 p-4">
            <p className="text-sm text-gray-600">Total Power</p>
            <p className="text-2xl font-bold text-purple-600">
              {votingPowerBigInt ? parseFloat(formatEther(votingPowerBigInt)).toFixed(4) : '0'} veAIUS
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-gray-600">Used Power</p>
            <p className="text-2xl font-bold text-blue-600">
              {usedWeightsBigInt ? parseFloat(formatEther(usedWeightsBigInt)).toFixed(4) : '0'} veAIUS
            </p>
            <p className="text-xs text-gray-500">{usagePercentage.toFixed(2)}% used</p>
          </div>

          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-sm text-gray-600">Remaining</p>
            <p className="text-2xl font-bold text-green-600">
              {parseFloat(formatEther(remainingPower)).toFixed(4)} veAIUS
            </p>
          </div>
        </div>
      </div>

      {/* Current Vote Distribution */}
      {currentVotes && Array.isArray(currentVotes) && currentVotes[0] && (currentVotes[0] as any[]).length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-xl font-bold text-gray-900">Current Vote Distribution</h3>
          <div className="space-y-2">
            {(currentVotes[0] as `0x${string}`[]).map((addr, idx) => {
              const weight = (currentVotes[1] as bigint[])[idx]
              const model = AI_MODELS.find(m => m.id.toLowerCase() === addr.toLowerCase())
              const percentage = Number(weight) / 100

              return (
                <div key={addr} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <div>
                    <p className="font-semibold">{model?.name || 'Unknown Model'}</p>
                    <p className="text-xs text-gray-500">{model?.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-600">{percentage}%</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Vote Allocation UI */}
      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-xl font-bold text-gray-900">Allocate Your Votes</h3>
        <p className="mb-6 text-sm text-gray-600">
          Distribute 100% of your voting weight across AI models to direct rewards
        </p>

        <div className="space-y-4">
          {AI_MODELS.map((model) => (
            <div key={model.id} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800">{model.name}</h4>
                  <p className="text-sm text-gray-500">{model.description}</p>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={votes[model.id] || 0}
                  onChange={(e) => handleVoteChange(model.id, Number(e.target.value))}
                  className="w-20 rounded border border-gray-300 px-3 py-2 text-right"
                  disabled={isLoading || isPending}
                />
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={votes[model.id] || 0}
                onChange={(e) => handleVoteChange(model.id, Number(e.target.value))}
                className="w-full"
                disabled={isLoading || isPending}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total Allocated:</span>
            <span className={`text-xl font-bold ${canSubmit ? 'text-green-600' : 'text-red-600'}`}>
              {totalVotes}%
            </span>
          </div>
          {!canSubmit && (
            <p className="mt-2 text-sm text-red-600">You must allocate exactly 100%</p>
          )}
        </div>

        <button
          onClick={handleSubmitVotes}
          disabled={!canSubmit || isPending || isLoading}
          className={`mt-6 w-full rounded-full py-3 font-semibold text-white transition-colors ${
            canSubmit && !isPending && !isLoading
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'cursor-not-allowed bg-gray-400'
          }`}
        >
          {isPending ? 'Submitting...' : isSuccess ? 'Votes Submitted!' : 'Submit Votes'}
        </button>
      </div>
    </div>
  )
}
