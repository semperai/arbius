import { MiningConfig } from './types';

let c: MiningConfig;

export function initializeMiningConfig(data: MiningConfig) {
  c = data;
  if (c.cache_path === undefined) {
    c.cache_path = 'cache';
  }

  if (c.read_only === undefined) {
    c.read_only = false;
  }

  if (c.prob === undefined) {
    c.prob = {
      task: 0.01,
      contestation_vote_finish: 0.2,
      contestation_submitted: 1.0,
      solution_submitted: 0.01,
      task_retracted: 1,
    };
  }
}

export { c }
