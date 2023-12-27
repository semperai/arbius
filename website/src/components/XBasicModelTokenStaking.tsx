import { useState, useEffect } from 'react';
import { Disclosure, Transition } from '@headlessui/react'
import { MinusSmallIcon, PlusSmallIcon } from '@heroicons/react/24/outline'
import {
  usePrepareContractWrite,
  useContractWrite,
} from 'wagmi';
import { ethers } from 'ethers'
import TokenBalance from '@/components/TokenBalance';
import IncreaseAllowanceButton from '@/components/IncreaseAllowanceButton';
import Config from '@/config.json';
import XBasicModelTokenArtifact from '@/artifacts/XBasicModelToken.sol/XBasicModelToken.json';

interface Props {
  basicModelTokenAddress: `0x${string}`;
  xBasicModelTokenAddress: `0x${string}`;
}

export default function XBasicModelTokenStaking({
  basicModelTokenAddress,
  xBasicModelTokenAddress,
}: Props) {
  const [basicModelTokenBalance, setBasicModelTokenBalance] = useState(ethers.BigNumber.from(0));
  const [xBasicModelTokenBalance, setXBasicModelTokenBalance] = useState(ethers.BigNumber.from(0));
  const [stakeValue, setStakeValue] = useState('0');
  const [stakedValue, setStakedValue] = useState('0');
  const [needsAllowance, setNeedsAllowance] = useState(true);

  const { config: stakeConfig } = usePrepareContractWrite({
    address: xBasicModelTokenAddress,
    abi: XBasicModelTokenArtifact.abi,
    functionName: 'enter',
    args: [
      ethers.utils.parseEther(stakeValue),
    ],
  });

  const {
    data: stakeData,
    isIdle: stakeIsIdle,
    isError: stakeIsError,
    isLoading: stakeIsLoading,
    isSuccess: stakeIsSuccess,
    write: stakeWrite
  } = useContractWrite(stakeConfig)

  const { config: unstakeConfig } = usePrepareContractWrite({
    address: xBasicModelTokenAddress,
    abi: XBasicModelTokenArtifact.abi,
    functionName: 'leave',
    args: [
      ethers.utils.parseEther(stakedValue),
    ],
  });

  const {
    data: unstakeData,
    isIdle: unstakeIsIdle,
    isError: unstakeIsError,
    isLoading: unstakeIsLoading,
    isSuccess: unstakeIsSuccess,
    write: unstakeWrite
  } = useContractWrite(unstakeConfig)


  useEffect(() => {
    setStakeValue(ethers.utils.formatEther(basicModelTokenBalance));
  }, [basicModelTokenBalance]);

  useEffect(() => {
    setStakedValue(ethers.utils.formatEther(xBasicModelTokenBalance));
  }, [xBasicModelTokenBalance]);

  return (
    <>
      <TokenBalance
        show={false}
        update={setBasicModelTokenBalance}
        token={basicModelTokenAddress}
      />
      <TokenBalance
        show={false}
        update={setXBasicModelTokenBalance}
        token={xBasicModelTokenAddress}
      />

      <Disclosure as="div" className="pt-6">
        {({ open }) => (
          <>
            <dt>
              <Disclosure.Button className="flex w-full items-start justify-between text-left text-gray-900">
                <span className="text-base font-semibold leading-7">Fee Staking</span>
                <span className="ml-6 flex h-7 items-center">
                  {open ? (
                    <MinusSmallIcon className="h-6 w-6" aria-hidden="true" />
                  ) : (
                    <PlusSmallIcon className="h-6 w-6" aria-hidden="true" />
                  )}
                </span>
              </Disclosure.Button>
            </dt>
            <Transition
              enter="transition ease duration-200 transform"
              enterFrom="opacity-0 -translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease duration-100 transform"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 -translate-y-1"
            >
              <Disclosure.Panel as="dd" className="mt-2">
                <p className="text-slate-600 text-sm">
                  Deposit Model tokens here to receive xModel tokens. These are constantly compounding and fed with model usage fees. The ratio between Model and xModel changes over time.
                </p>
                <div className="flex justify-between mt-4">
                  <div>
                    <IncreaseAllowanceButton
                      updateNeedsAllowance={setNeedsAllowance}
                      token={basicModelTokenAddress}
                      to={xBasicModelTokenAddress}
                    />
                  </div>
                </div>

                <div className="flex justify-between mt-10">
                  <div>
                    <input
                      type="number"
                      min={0}
                      max={ethers.utils.formatEther(basicModelTokenBalance)}
                      step={0.01}
                      value={stakeValue}
                      onChange={(e) => {
                        if (! isNaN(parseFloat(e.target.value))) {
                          if (ethers.utils.parseEther(e.target.value).lte(basicModelTokenBalance)) {
                            setStakeValue(e.target.value)
                          } else {
                            setStakeValue(ethers.utils.formatEther(basicModelTokenBalance))
                          }
                        }
                      }}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 col-span-2"

                    />
                  </div>

                  <div>
                    <button
                      onClick={() => setStakeValue(ethers.utils.formatEther(basicModelTokenBalance))}
                      className="rounded-md bg-white py-2 px-3 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-25 ml-2"
                    >
                      Set Max
                    </button>
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => stakeWrite?.()}
                    className="rounded-md bg-indigo-500 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-25 mt-2 w-full"
                  >
                    Stake
                  </button>
                </div>

                <div className="flex justify-between mt-10">
                  <div>
                    <input
                      type="number"
                      min={0}
                      max={ethers.utils.formatEther(xBasicModelTokenBalance)}
                      step={0.01}
                      value={stakedValue}
                      onChange={(e) => {
                        if (! isNaN(parseFloat(e.target.value))) {
                          if (ethers.utils.parseEther(e.target.value).lte(xBasicModelTokenBalance)) {
                            setStakedValue(e.target.value)
                          } else {
                            setStakedValue(ethers.utils.formatEther(xBasicModelTokenBalance))
                          }
                        }
                      }}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 w-full"
                    />
                  </div>

                  <div>
                    <button
                      onClick={() => setStakedValue(ethers.utils.formatEther(xBasicModelTokenBalance))}
                      className="rounded-md py-2 px-3 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-25 ml-2"
                    >
                      Set Max
                    </button>
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => unstakeWrite?.()}
                    className="rounded-md bg-fuchsia-500 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-fuchsia-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-25 mt-2 w-full"
                  >
                    Unstake
                  </button>
                </div>

              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>

    </>
  );
}
