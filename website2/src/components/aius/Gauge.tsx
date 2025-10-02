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

// Simple veAIUS ABI for getting user's NFT
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
  const { data: nftBalance } = useReadContract({
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
  const { data: votingPower } = useReadContract({
    address: veAIUSAddress,
    abi: VE_AIUS_ABI,
    functionName: 'balanceOfNFT',
    args: firstTokenId ? [firstTokenId] : undefined,
    query: { enabled: !!firstTokenId && !!veAIUSAddress },
  })

  // Get lock info
  const { data: lockInfo } = useReadContract({
    address: veAIUSAddress,
    abi: VE_AIUS_ABI,
    functionName: 'locked',
    args: firstTokenId ? [firstTokenId] : undefined,
    query: { enabled: !!firstTokenId && !!veAIUSAddress },
  })

  // Get used weights (how much voting power already used)
  const { data: usedWeights } = useReadContract({
    address: voterAddress,
    abi: VoterABI.abi,
    functionName: 'usedWeights',
    args: firstTokenId ? [firstTokenId] : undefined,
    query: { enabled: !!firstTokenId && !!voterAddress },
  })

  // Get current votes for each model
  const { data: currentVotes } = useReadContract({
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

  const { write: submitVote, isPending, isSuccess } = useContractWriteHook()

  const handleVoteChange = (modelId: string, value: number) => {
    setVotes((prev) => ({
      ...prev,
      [modelId]: value,
    }))
  }

  const totalVotes = Object.values(votes).reduce((sum, val) => sum + val, 0)
  const canSubmit = totalVotes === 100

  const handleSubmitVotes = async () => {
    if (!canSubmit || !tokenId || !voterAddress) return

    try {
      // Prepare arrays for the vote function
      const modelVote: `0x${string}`[] = []
      const weights: bigint[] = []

      Object.entries(votes).forEach(([modelId, weight]) => {
        if (weight > 0) {
          modelVote.push(modelId as `0x${string}`)
          // Weights are in basis points (100 = 1%)
          weights.push(BigInt(weight * 100))
        }
      })

      if (modelVote.length === 0) {
        alert('Please allocate votes to at least one model')
        return
      }

      submitVote({
        address: voterAddress,
        abi: VoterABI.abi,
        functionName: 'vote',
        args: [tokenId, modelVote, weights],
      })
    } catch (error) {
      console.error('Vote submission error:', error)
    }
  }

  useEffect(() => {
    if (isSuccess) {
      alert('Votes submitted successfully!')
      setVotes({})
    }
  }, [isSuccess])

  const hasVeAIUS = nftBalance && nftBalance > BigInt(0)
  const lockEnd = lockInfo ? new Date(Number(lockInfo[1]) * 1000) : null
  const isLockExpired = lockEnd && lockEnd < new Date()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-3xl font-bold text-black-text">Gauge Voting</h2>
        <p className="text-gray-600">
          Vote with your veAIUS to direct emissions to your preferred AI models.
          Distribute 100% of your voting power across models.
        </p>
      </div>

      {!isConnected ? (
        <div className="rounded-lg bg-gray-50 p-12 text-center">
          <p className="text-gray-600">Connect your wallet to vote on gauges</p>
        </div>
      ) : !hasVeAIUS ? (
        <div className="rounded-lg bg-yellow-50 p-12 text-center">
          <p className="mb-2 text-lg font-semibold text-yellow-900">No veAIUS NFT Found</p>
          <p className="text-yellow-700">
            You need to stake AIUS tokens to receive a veAIUS NFT and participate in gauge voting.
          </p>
        </div>
      ) : isLockExpired ? (
        <div className="rounded-lg bg-red-50 p-12 text-center">
          <p className="mb-2 text-lg font-semibold text-red-900">veAIUS Lock Expired</p>
          <p className="text-red-700">
            Your veAIUS lock has expired. Please re-lock your tokens to participate in voting.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Voting Power Info */}
          <div className="rounded-2xl bg-gradient-to-r from-purple-50 to-blue-50 p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-gray-600">Your veAIUS NFT</p>
                <p className="text-2xl font-bold text-purple-text">#{tokenId?.toString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Voting Power</p>
                <p className="text-2xl font-bold text-purple-text">
                  {votingPower ? formatEther(votingPower as bigint).slice(0, 8) : '0'} veAIUS
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Lock Expires</p>
                <p className="text-2xl font-bold text-purple-text">
                  {lockEnd ? lockEnd.toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Vote Allocation */}
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Allocate Your Votes</h3>
              <div className="rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-2">
                <span className={`text-lg font-bold ${canSubmit ? 'text-green-600' : 'text-gray-600'}`}>
                  {totalVotes}%
                </span>
                <span className="ml-1 text-sm text-gray-500">/ 100%</span>
              </div>
            </div>

            <div className="space-y-6">
              {AI_MODELS.map((model) => {
                const votePercentage = votes[model.id] || 0
                return (
                  <div key={model.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-black-text">{model.name}</h4>
                        <p className="text-xs text-gray-500">{model.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={votePercentage}
                          onChange={(e) => handleVoteChange(model.id, parseInt(e.target.value) || 0)}
                          className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-center focus:border-purple-text focus:outline-none focus:ring-2 focus:ring-purple-text/20"
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full bg-gradient-to-r from-purple-text to-blue-500 transition-all duration-300"
                        style={{ width: `${votePercentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitVotes}
              disabled={!canSubmit || isPending}
              className="group relative mt-8 w-full overflow-hidden rounded-lg bg-black-background px-8 py-3 font-medium text-white disabled:opacity-50"
            >
              <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-purple-text to-blue-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-disabled:opacity-0"></div>
              <span className="relative z-10">
                {isPending
                  ? 'Submitting...'
                  : canSubmit
                    ? 'Submit Votes'
                    : `Allocate ${100 - totalVotes}% more to submit`
                }
              </span>
            </button>
          </div>

          {/* Info Box */}
          <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 p-6">
            <h4 className="mb-3 font-semibold text-gray-900">How Gauge Voting Works</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="text-purple-text">•</span>
                <span>Your voting power is determined by your veAIUS balance and lock duration</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-text">•</span>
                <span>Votes determine emission distribution to different AI models</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-text">•</span>
                <span>You must allocate exactly 100% of your voting power</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-text">•</span>
                <span>Voting resets weekly - you can change your votes each epoch</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
