import { useState, useEffect } from 'react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { ethers } from 'ethers';
import Config from '@/config.json';
import BaseTokenArtifact from '@/artifacts/BaseTokenV1.sol/BaseTokenV1.json';

const buttonClassName =
  'inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50';

interface Props {
  token: `0x${string}`;
  to: `0x${string}`;
  updateNeedsAllowance: (a: boolean) => void;
}

export default function IncreaseAllowanceButton({
  token,
  to,
  updateNeedsAllowance,
}: Props) {
  const { address, isConnected } = useAccount();
  const { open: openWeb3Modal } = useWeb3Modal();
  const [loading, setLoading] = useState(false);

  const { data: allowance } = useReadContract({
    address: token,
    abi: BaseTokenArtifact.abi,
    functionName: 'allowance',
    args: [address, to],
    query: {
      enabled: isConnected && !!address,
    },
  });

  const { writeContract, data: hash } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (allowance) {
      updateNeedsAllowance(allowance === ethers.BigNumber.from(0));
    }
  }, [allowance, updateNeedsAllowance]);

  async function click() {
    if (!isConnected) {
      await openWeb3Modal();
      return;
    }

    setLoading(true);
    try {
      writeContract({
        address: token,
        abi: BaseTokenArtifact.abi,
        functionName: 'approve',
        args: [to, ethers.constants.MaxUint256],
      });
    } catch (error) {
      console.error('Error approving token:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type='button'
        onClick={click}
        className={buttonClassName}
        disabled={loading || isConfirming}
      >
        {loading || isConfirming ? 'Loading...' : 'Approve'}
      </button>
    </div>
  );
}
