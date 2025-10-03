import { Address } from 'viem'

export interface Task {
  id: string
  owner: Address
  model: string
  fee: bigint
  blocktime: bigint
  version: number
  cid: string
}

export interface Model {
  id: string
  addr: Address
  fee: bigint
  rate: bigint
  cid: string
  mineable?: boolean
}

export interface Config {
  l1TokenAddress: string
  baseTokenAddress: string
  engineAddress: string
  v2_l1TokenAddress: string
  v2_baseTokenAddress: string
  l1OneToOneAddress: string
  l2OneToOneAddress: string
  v2_engineAddress: string
  v4_baseTokenAddress: string
  v4_engineAddress: string
  proxyAdminAddress: string
  models: {
    [key: string]: {
      id: string
      mineable?: boolean
      contracts?: Record<string, unknown>
      params: {
        addr: string
        fee: string
        rate: string
        cid: string
      }
    }
  }
}
