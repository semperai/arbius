import { useState, useEffect } from 'react';
import { useWeb3Modal } from '@web3modal/react';
import {
  useAccount,
  useContractRead,
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction,
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
  const { address } = useAccount();
  const [showAllowanceIncrease, setShowAllowanceIncrease] = useState(false);
  const [increaseAllowanceButtonDisabled, setIncreaseAllowanceButtonDisabled] =
    useState(false);

  const {
    data: allowanceData,
    isError: allowanceIsError,
    isLoading: allowanceIsLoading,
  } = useContractRead({
    address: token,
    abi: BaseTokenArtifact.abi,
    functionName: 'allowance',
    args: [address, to],
  });

  const { config: increaseAllowanceConfig } = usePrepareContractWrite({
    address: token,
    abi: BaseTokenArtifact.abi,
    functionName: 'approve',
    args: [
      to,
      ethers.constants.MaxUint256, // max allowance
    ],
    enabled: (allowanceData as ethers.BigNumber)?.lt(
      ethers.utils.parseUnits('5', 18)
    ),
  });

  const {
    data: increaseAllowanceData,
    isLoading: increaseAllowanceIsLoading,
    isSuccess: increaseAllowanceIsSuccess,
    write: increaseAllowanceWrite,
  } = useContractWrite(increaseAllowanceConfig);

  const {
    data: increaseAllowanceTxData,
    isError: increaseAllowanceTxIsError,
    isLoading: increaseAllowanceTxIsLoading,
  } = useWaitForTransaction({
    hash: increaseAllowanceData?.hash,
  });

  function clickIncreaseAllowance() {
    async function f() {
      setIncreaseAllowanceButtonDisabled(true);
      increaseAllowanceWrite?.();
      setIncreaseAllowanceButtonDisabled(false);
    }

    f();
  }

  useEffect(() => {
    if (increaseAllowanceTxData) {
      setShowAllowanceIncrease(false);
      updateNeedsAllowance(false);
      return;
    }

    if (
      allowanceData &&
      (allowanceData as ethers.BigNumber).lt(ethers.utils.parseUnits('5', 18))
    ) {
      setShowAllowanceIncrease(true);
      updateNeedsAllowance(true);
    } else {
      setShowAllowanceIncrease(false);
      updateNeedsAllowance(false);
    }
  });

  return (
    <div className={!showAllowanceIncrease ? 'hidden' : ''}>
      <button
        className={
          (increaseAllowanceButtonDisabled
            ? 'opacity-25 hover:cursor-default '
            : 'opacity-95 hover:opacity-100 ') +
          'group nightwind-prevent-block text-indigo-600 border-slate-200 relative inline-block inline-flex w-28 items-center justify-center overflow-hidden rounded-lg border px-3 py-2 text-sm font-semibold transition ease-out hover:shadow'
        }
        disabled={increaseAllowanceButtonDisabled}
        onClick={clickIncreaseAllowance}
      >
        <span className='ease bg-violet-500 absolute left-0 top-0 -ml-3 -mt-10 h-40 w-40 rounded-full blur-md transition-all duration-700'></span>
        <span className='ease absolute inset-0 h-full w-full transition duration-700 group-hover:rotate-180'>
          <span className='bg-purple-500 absolute bottom-0 left-0 -ml-10 h-24 w-24 rounded-full blur-md'></span>
          <span className='bg-fuchsia-500 absolute bottom-0 right-0 -mr-10 h-24 w-24 rounded-full blur-md'></span>
        </span>
        <span className='text-white relative'>
          {increaseAllowanceIsLoading ? 'Waiting...' : 'Approve'}
        </span>
      </button>
    </div>
  );
}
