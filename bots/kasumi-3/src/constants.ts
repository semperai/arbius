/**
 * Application-wide constants
 */

// Timeouts (milliseconds)
export const TIMEOUTS = {
  JOB_WAIT_DEFAULT: 900000, // 15 minutes
  JOB_PROCESSING: 900000, // 15 minutes
  REPLICATE_API: 600000, // 10 minutes
  COG_API: 600000, // 10 minutes
  IPFS_VERIFICATION: 60000, // 1 minute
  NONCE_CACHE_TTL: 5000, // 5 seconds
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  MAX_REQUESTS_DEFAULT: 5,
  WINDOW_MS_DEFAULT: 60000, // 1 minute
  REQUESTS_PER_MINUTE_TEXT: '5 requests per minute',
} as const;

// Job Queue
export const JOB_QUEUE = {
  MAX_CONCURRENT_DEFAULT: 3,
  CLEANUP_INTERVAL_MS: 3600000, // 1 hour
  OLD_JOB_THRESHOLD_MS: 86400000, // 24 hours
} as const;

// Blockchain
export const BLOCKCHAIN = {
  GAS_BUFFER_PERCENT_DEFAULT: 20,
  STAKE_BUFFER_PERCENT: 10,
  FALLBACK_GAS_LIMITS: {
    submitTask: 200_000n,
    signalCommitment: 450_000n,
    submitSolution: 500_000n,
    approve: 100_000n,
    validatorDeposit: 150_000n,
  },
  NONCE_RETRY_MAX: 3,
  COMMITMENT_DELAY_MS: 1000,
  NONCE_CACHE_TTL: 5000,
  BLOCK_LOOKBACK: 10000,
} as const;

// Health Check
export const HEALTH_CHECK = {
  MIN_ETH_BALANCE: '0.01', // ETH
  MIN_AIUS_BALANCE: '1', // AIUS
  QUEUE_HEALTHY_THRESHOLD: 10, // max processing jobs
} as const;

// Deposit Monitoring
export const DEPOSIT_MONITOR = {
  POLL_INTERVAL_MS: 12000, // 12 seconds (Arbitrum block time)
  BLOCK_LOOKBACK: 10000,
} as const;

// Reward System
export const REWARDS = {
  CHANCE_DEFAULT: 20, // 1 in 20
  AMOUNT_DEFAULT: '1', // AIUS
  DEFAULT_IMAGE_URL: 'https://arbius.ai/mining-icon.png',
} as const;

// Gas Estimation
export const GAS_ESTIMATION = {
  SUBMIT_TASK_ESTIMATE: 200_000n,
  RESERVATION_TIMEOUT_MS: 300000, // 5 minutes
} as const;

// Startup
export const STARTUP = {
  IGNORE_MESSAGES_SECONDS: 3, // Ignore messages during initial startup
} as const;

// IPFS
export const IPFS = {
  GATEWAY_URL: 'https://ipfs.arbius.org/ipfs',
} as const;

// Arbius
export const ARBIUS = {
  TASK_URL_BASE: 'https://arbius.ai/task',
} as const;
