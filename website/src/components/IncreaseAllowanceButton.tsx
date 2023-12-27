import { useState, useEffect } from 'react';
import { useWeb3Modal } from '@web3modal/react'
import {
  useAccount,
  useContractRead,
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction,
} from 'wagmi';
import { ethers } from 'ethers'
import Config from '@/config.json';
import BaseTokenArtifact from '@/artifacts/BaseTokenV1.sol/BaseTokenV1.json';

const buttonClassName = "inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"

interface Props {
  token: `0x${string}`;
  to: `0x${string}`;
  updateNeedsAllowance: (a: boolean) => void;
}

export default function IncreaseAllowanceButton({ token, to, updateNeedsAllowance }: Props) {
  const { address } = useAccount()
  const [showAllowanceIncrease, setShowAllowanceIncrease] = useState(false);
  const [increaseAllowanceButtonDisabled, setIncreaseAllowanceButtonDisabled] = useState(false);

  const {
    data: allowanceData,
    isError: allowanceIsError,
    isLoading: allowanceIsLoading,
  } = useContractRead({
    address: token,
    abi: BaseTokenArtifact.abi,
    functionName: 'allowance',
    args: [
      address,
      to,
    ],
  });

  const { config: increaseAllowanceConfig } = usePrepareContractWrite({
    address: token,
    abi: BaseTokenArtifact.abi,
    functionName: 'approve',
    args: [
      to,
      ethers.constants.MaxUint256, // max allowance
    ],
    enabled: (allowanceData as ethers.BigNumber)?.lt(ethers.utils.parseUnits('5', 18)),
  });

  const {
    data: increaseAllowanceData,
    isLoading: increaseAllowanceIsLoading,
    isSuccess: increaseAllowanceIsSuccess,
    write: increaseAllowanceWrite
  } = useContractWrite(increaseAllowanceConfig)

  const {
    data: increaseAllowanceTxData,
    isError: increaseAllowanceTxIsError,
    isLoading: increaseAllowanceTxIsLoading,
  } = useWaitForTransaction({
    hash: increaseAllowanceData?.hash,
  })

  function clickIncreaseAllowance() {
    async function f() {
      setIncreaseAllowanceButtonDisabled(true);
      increaseAllowanceWrite?.();
      setIncreaseAllowanceButtonDisabled(false)
    }

    f();
  }

  useEffect(() => {
    if (increaseAllowanceTxData) {
      setShowAllowanceIncrease(false);
      updateNeedsAllowance(false);
      return;
    }

    if (allowanceData && (allowanceData as ethers.BigNumber).lt(ethers.utils.parseUnits('5', 18))) {
      setShowAllowanceIncrease(true);
      updateNeedsAllowance(true);
    } else {
      setShowAllowanceIncrease(false);
      updateNeedsAllowance(false);
    }
  });


  return (
    <div className={(! showAllowanceIncrease) ? 'hidden' : ''}>
      <button
        className={(increaseAllowanceButtonDisabled ? 'opacity-25 hover:cursor-default ' : 'opacity-95 hover:opacity-100 ') + "relative inline-flex items-center justify-center inline-block px-3 py-2 overflow-hidden font-semibold text-indigo-600 rounded-lg group text-sm hover:shadow w-28 border-slate-200 border transition ease-out nightwind-prevent-block"}
        disabled={increaseAllowanceButtonDisabled}
        onClick={clickIncreaseAllowance}
        >
        <span className="absolute top-0 left-0 w-40 h-40 -mt-10 -ml-3 transition-all duration-700 bg-violet-500 rounded-full blur-md ease"></span>
        <span className="absolute inset-0 w-full h-full transition duration-700 group-hover:rotate-180 ease">
        <span className="absolute bottom-0 left-0 w-24 h-24 -ml-10 bg-purple-500 rounded-full blur-md"></span>
        <span className="absolute bottom-0 right-0 w-24 h-24 -mr-10 bg-fuchsia-500 rounded-full blur-md"></span>
        </span>
        <span className="relative text-white">
          {increaseAllowanceIsLoading ? 'Waiting...' : 'Approve'}
        </span>
      </button>
    </div>
  );
}
