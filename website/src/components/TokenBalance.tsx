import { useState, useEffect } from 'react';
import { ethers } from 'ethers'
import BaseTokenArtifact from '@/artifacts/BaseTokenV1.sol/BaseTokenV1.json';
import Config from '@/config.json';
import { formatBalance } from '@/utils';

import {
  useAccount,
  useContractRead,
} from 'wagmi';

interface Props {
  show: boolean;
  update: (a: ethers.BigNumber) => void;
  token: `0x${string}`;
}

export default function TokenBalance({ show, update, token }: Props) {
  const { address } = useAccount()

  const {
    data: tokenBalance,
    isError: tokenBalanceError,
    isLoading: tokenBalanceLoading,
    refetch: tokenBalanceRefetch,
  } = useContractRead({
    address: token,
    abi: BaseTokenArtifact.abi,
    functionName: 'balanceOf',
    args: [address],
    enabled: Boolean(address),
  });

  const [tokenBalanceString, setTokenBalanceString] = useState('');

  useEffect(() => {
    if (tokenBalanceError) {
      setTokenBalanceString('RPC_ERROR');
    }
    else if(tokenBalanceLoading || !tokenBalance) {
      setTokenBalanceString('loading...');
    } else {
      setTokenBalanceString(formatBalance(tokenBalance as ethers.BigNumber));
    }

    update(tokenBalance ? (tokenBalance as ethers.BigNumber): ethers.BigNumber.from('0'));
  }, [tokenBalance, tokenBalanceError, tokenBalanceLoading]);

  useEffect(() => {
    const interval = setInterval(() => {
      tokenBalanceRefetch();
    }, 10_000);
    return () => clearInterval(interval);
  }, []);


  return (
    <div className={(! show) ? 'hidden' : ''}>
      {tokenBalanceString}
    </div>
  );
}
