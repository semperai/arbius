import { MiningConfig } from './types';

let c: MiningConfig;

export function initializeMiningConfig(data: MiningConfig) {
  c = data;
}

export { c }
