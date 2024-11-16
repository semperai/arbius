import { t_max } from './constantValues';

export const getAIUSVotingPower = (lockedAIUS: number, value: number) => {
  const timeToLock = value * 2419200; // value in months(decimal) * 4*7*24*60*60
  const votingPower = (lockedAIUS * timeToLock) / t_max;
  return votingPower;
};
