import { MiningConfig } from './types';

let c: MiningConfig;

export function initializeMiningConfig(data: MiningConfig) {
  c = data;
  if (c.cache_path === undefined) {
    c.cache_path = 'cache';
  }
}

export { c }
