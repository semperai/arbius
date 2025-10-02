import { arbitrum, arbitrumSepolia } from 'viem/chains'

export const ARBIUS_CONFIG = {
  [arbitrum.id]: {
    engineAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`, // TODO: Add mainnet address
    voterAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`, // TODO: Add mainnet voter address
    veAIUSAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`, // TODO: Add mainnet veAIUS address
  },
  [arbitrumSepolia.id]: {
    engineAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`, // TODO: Add testnet address
    voterAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`, // TODO: Add testnet voter address
    veAIUSAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`, // TODO: Add testnet veAIUS address
  },
} as const

export const MODELS = {
  kandinsky2: {
    id: '0x3ac907e782b35cf2096eadcbd5d347fb7705db98526adcd2232ea560abbbef90' as `0x${string}`,
    name: 'Kandinsky 2',
    description: 'Text-to-image generation model',
  },
  qwen_qwq_32b: {
    id: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`, // TODO: Add actual model ID
    name: 'Qwen QwQ 32B',
    description: 'Large language model for reasoning',
  },
  wai_v120: {
    id: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`, // TODO: Add actual model ID
    name: 'WAI V1.20',
    description: 'Waifu generation model',
  },
  damo: {
    id: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`, // TODO: Add actual model ID
    name: 'DAMO',
    description: 'Text-to-video generation',
  },
  robust_video_matting: {
    id: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`, // TODO: Add actual model ID
    name: 'Robust Video Matting',
    description: 'Video background removal',
  },
} as const

export const IPFS_GATEWAY = 'https://ipfs.arbius.org'
