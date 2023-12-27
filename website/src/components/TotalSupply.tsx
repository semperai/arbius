import { useState, useEffect } from 'react';
import {
  useContractRead,
} from 'wagmi';
import Config from '@/config.json';
import BaseTokenArtifact from '@/artifacts/BaseTokenV1.sol/BaseTokenV1.json';
import { formatBalance } from '@/utils';

import { ethers } from 'ethers'

export default function TotalSupply() {
  const [totalSupply, setTotalSupply] = useState(ethers.constants.Zero);

  const {
    data: totalSupplyData,
    isError: totalSupplyIsError,
    isLoading: totalSupplyIsLoading,
    refetch: totalSupplyRefetch,
  } = useContractRead({
    address: Config.baseTokenAddress as `0x${string}`,
    abi: BaseTokenArtifact.abi,
    functionName: 'totalSupply',
    args: [],
  });

  useEffect(() => {
    const interval = setInterval(() => {
      totalSupplyRefetch();
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (totalSupplyData) {
      setTotalSupply(totalSupplyData as ethers.BigNumber);
    }
  }, [totalSupplyData]);

  let totalSupplyStr = '';
  if (totalSupply) {
    totalSupplyStr = formatBalance(totalSupply);
  }

  return (
    <p>
      <strong>Total Supply: </strong>
      {totalSupplyStr}
    </p>
  );
}
