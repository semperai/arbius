/**
 * Types for veAIUS staking system
 */

export type LockPosition = {
  tokenId: bigint
  amount: bigint
  unlockTime: bigint
  votingPower: bigint
  lockedAt: bigint
}

export type ProtocolStats = {
  totalVeSupply: bigint
  totalStaked: bigint
  rewardRate: bigint
  apr: number
}

export type UserStats = {
  aiusBalance: bigint
  veAiusBalance: bigint
  lockedAmount: bigint
  votingPower: bigint
  nftCount: bigint
  positions: LockPosition[]
}

export type StakeFormData = {
  amount: string
  duration: {
    weeks: number
    months: number
  }
  totalSeconds: number
}

export type VotingData = {
  tokenId: bigint
  votingPower: bigint
  usedWeights: bigint
  remainingPower: bigint
  currentVotes: ModelVote[]
}

export type ModelVote = {
  modelId: string
  weight: bigint
  percentage: number
}

export type AIModel = {
  id: string
  name: string
  description: string
  address: `0x${string}`
  currentVotes?: bigint
  votingPercentage?: number
}

// veAIUS calculation constants
export const SECONDS_PER_WEEK = BigInt(604800)
export const SECONDS_PER_MONTH = BigInt(2592000) // ~30 days
export const MAX_LOCK_TIME = BigInt(126144000) // 4 years in seconds
export const WEEK = BigInt(7 * 24 * 60 * 60)
