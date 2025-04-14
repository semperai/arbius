import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import BaseTokenArtifact from '@/artifacts/BaseTokenV1.sol/BaseTokenV1.json';
import Config from '@/config.json';
import { formatBalance } from '@/utils';
import { useAccount, useReadContract } from 'wagmi';

interface Props {
  show: boolean;
  update: (a: ethers.BigNumber) => void;
  token: `0x${string}`;
}

export default function TokenBalance({ show, update, token }: Props) {
  const { address, isConnected } = useAccount();
  const [balance, setBalance] = useState(ethers.BigNumber.from(0));

  const { data: balanceData } = useReadContract({
    address: token,
    abi: BaseTokenArtifact.abi,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: isConnected && !!address,
    },
  });

  useEffect(() => {
    if (balanceData) {
      const newBalance = balanceData as ethers.BigNumber;
      setBalance(newBalance);
      update(newBalance);
    }
  }, [balanceData, update]);

  let balanceStr = '';
  if (balance) {
    balanceStr = formatBalance(balance);
  }

  return (
    <div className={show ? '' : 'hidden'}>
      <p>
        <strong>Balance: </strong>
        {balanceStr} AIUS
      </p>
    </div>
  );
}
