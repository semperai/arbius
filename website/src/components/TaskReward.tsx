import { useState, useEffect } from 'react';
import {
  useContractRead,
} from 'wagmi';
import Config from '@/config.json';
import EngineArtifact from '@/artifacts/V2_EngineV1.sol/V2_EngineV1.json';
import { formatBalance } from '@/utils';

import { ethers } from 'ethers'

export default function TaskReward() {
  const [taskReward, setTaskReward] = useState(ethers.constants.Zero);

  const {
    data: taskRewardData,
    isError: taskRewardIsError,
    isLoading: taskRewardIsLoading,
    refetch: taskRewardRefetch,
  } = useContractRead({
    address: Config.v2_engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    functionName: 'getReward',
    args: [],
  });

  useEffect(() => {
    const interval = setInterval(() => {
      taskRewardRefetch();
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (taskRewardData) {
      setTaskReward(taskRewardData as ethers.BigNumber);
    }
  }, [taskRewardData]);

  let taskRewardStr = '';
  if (taskReward) {
    taskRewardStr = formatBalance(taskReward);
  }

  return (
    <p>
      <strong>Current Task Reward: </strong>
      {taskRewardStr} AIUS
    </p>
  );
}

