import { arbitrum, arbitrumSepolia } from 'viem/chains'

export const ARBIUS_CONFIG = {
  [arbitrum.id]: {
    // v5 contracts on Arbitrum One (Mainnet)
    baseTokenAddress: '0x4a24b101728e07a52053c13fb4db2bcf490cabc3' as `0x${string}`,
    engineAddress: '0x9b51Ef044d3486A1fB0A2D55A6e0CeeAdd323E66' as `0x${string}`,
    voterAddress: '0x80E9B3dA81258705eC7C3DC89a799b78f2c68968' as `0x${string}`,
    veAIUSAddress: '0x3A7e6915f997Cdbc8BFB090051AA22E37Dab345d' as `0x${string}`, // votingEscrowAddress
    veStakingAddress: '0x1c0a14cAC52ebDe9c724e5627162a90A26B85E15' as `0x${string}`,
    veNFTRenderAddress: '0x18f936418CeB70CceE7AebE1E66754a8CEe9350D' as `0x${string}`,
    arbiusRouterV1: '0xecAba4E6a4bC1E3DE3e996a8B2c89e8B0626C9a1' as `0x${string}`,
  },
  [arbitrumSepolia.id]: {
    // Testnet contracts on Arbitrum Sepolia
    baseTokenAddress: '0x8D9753e0af7ed426c63c7D6f0424d83f257C7821' as `0x${string}`, // Has faucet
    engineAddress: '0xBb388FACEffd52941a789610a931CeaDb043B885' as `0x${string}`,
    voterAddress: '0x19774CAB3DacE1Ac360083213Ba9E379AB6F5dB7' as `0x${string}`,
    veAIUSAddress: '0x4e801E9BE4fa87F1c7737d77D7F74e799380eC15' as `0x${string}`, // votingEscrowAddress
    veStakingAddress: '0x51dfbe71b2226262a102a668C612c9F4C7bf81e5' as `0x${string}`,
    veNFTRenderAddress: '0x1355bfAdE8d425a13aB1e344A5206747e42fB961' as `0x${string}`,
    timelockAddress: '0x32c3623a621b986B1c1413cf073BCa005A718412' as `0x${string}`,
    governorAddress: '0x3E44BA7519c098c6936c0ef738a9648826d155C6' as `0x${string}`,
    arbiusRouterV1: '0xb3D381D6eA21e04fe2eC3d712Fd512e80e5945fe' as `0x${string}`,
    swapReceiverAddress: '0x99e669178e956479D91098CaA82C4f006796Eb3B' as `0x${string}`,
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
