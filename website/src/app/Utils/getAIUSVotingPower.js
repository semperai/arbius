import { t_max } from './constantValues';

export const getAIUSVotingPower = (lockedAIUS, value) => {
  let timeToLock = value * 2419200; // value in months(decimal) * 4*7*24*60*60
  let votingPower = (lockedAIUS * timeToLock) / t_max;
  return votingPower;
};
