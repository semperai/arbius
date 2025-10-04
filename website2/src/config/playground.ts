export const PLAYGROUND_MODELS = {
  text: ['qwen_qwq_32b'],
  image: ['wai_v120'],
  video: [], // No video models deployed yet
} as const

export type ModelCategory = keyof typeof PLAYGROUND_MODELS

// Model fees in AIUS tokens (paid to model creator)
export const MODEL_FEES: Record<string, string> = {
  qwen_qwq_32b: '0.007',
  wai_v120: '0.0035',
}

// Base miner fee (buffer) in AIUS tokens
export const BASE_MINER_FEE = '0.003'

// Model-specific miner fees (optional overrides)
export const MODEL_MINER_FEES: Partial<Record<string, string>> = {
  qwen_qwq_32b: '0.005', // Override for more complex model
}
