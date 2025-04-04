import { useState, useEffect } from 'react';
import { useContractRead } from 'wagmi';
import Config from '@/config.json';
import EngineArtifact from '@/artifacts/V2_EngineV2.sol/V2_EngineV2.json';
import BaseTokenArtifact from '@/artifacts/BaseTokenV1.sol/BaseTokenV1.json';
import { formatBalance } from '@/utils';

import { ethers } from 'ethers';

export default function ExpectedTotalSupply() {
  const [totalSupply, setTotalSupply] = useState(ethers.constants.Zero);
  const [unixTime, setUnixTime] = useState(Math.floor(+new Date() / 1000));

  const {
    data: startBlockTimeData,
    isError: startBlockTimeIsError,
    isLoading: startBlockTimeIsLoading,
  } = useContractRead({
    address: Config.v2_engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    functionName: 'startBlockTime',
    args: [],
  });

  const {
    data: targetTsData,
    isError: targetTsIsError,
    isLoading: targetTsIsLoading,
  } = useContractRead({
    address: Config.v2_engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    functionName: 'targetTs',
    args: [unixTime - (startBlockTimeData as ethers.BigNumber)?.toNumber()],
    query: {
      enabled: Boolean(startBlockTimeData),
    }
  });

  useEffect(() => {
    if (targetTsData) {
      setTotalSupply(targetTsData as ethers.BigNumber);
    }
  }, [targetTsData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setUnixTime(Math.floor(+new Date() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  let totalSupplyStr = '';
  if (totalSupply) {
    totalSupplyStr = formatBalance(totalSupply);
  }

  return (
    <div>
      <p>
        <strong>Target Total Supply: </strong>
        {totalSupplyStr}
      </p>
    </div>
  );
}
