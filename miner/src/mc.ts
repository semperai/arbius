import { MiningConfig } from './types';

let c: MiningConfig;

export function initializeMiningConfig(data: MiningConfig) {
  c = data;
  if (c.cache_path === undefined) {
    c.cache_path = 'cache';
  }

  if (c.prob === undefined) {
    c.prob = {
      task: 0.01,
      contestation_vote_finish: 0.1,
      solution_submitted: 0.05,
      solve: 0.05,
      task_retracted: 1,
    };
  }
}

export { c }
