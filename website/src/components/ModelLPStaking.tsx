import { useState, useEffect } from 'react';
import { Disclosure, Transition } from '@headlessui/react'
import { MinusSmallIcon, PlusSmallIcon } from '@heroicons/react/24/outline'
import {
  useAccount,
  useContractRead,
  usePrepareContractWrite,
  useContractWrite,
} from 'wagmi';
import { ethers } from 'ethers'
import TokenBalance from '@/components/TokenBalance';
import IncreaseAllowanceButton from '@/components/IncreaseAllowanceButton';
import Config from '@/config.json';
import BasicModelLPStaking from '@/artifacts/BasicModelLPStaking.sol/BasicModelLPStaking.json';

interface Props {
  lpAddress: `0x${string}`;
  lpStakingAddress: `0x${string}`;
}

export default function XBasicModelTokenStaking({
  lpAddress,
  lpStakingAddress,
}: Props) {
  const { address } = useAccount();

  const [lpTokenBalance, setLPTokenBalance] = useState(ethers.BigNumber.from(0));
  const [lpStakingBalance, setLPStakingBalance] = useState(ethers.BigNumber.from(0));
  const [stakeValue, setStakeValue] = useState('0');
  const [stakedValue, setStakedValue] = useState('0');
  const [rewardsValue, setRewardsValue] = useState('');
  const [needsAllowance, setNeedsAllowance] = useState(true);

  const {
    data: rewardsData,
    isError: rewardsIsError,
    isLoading: rewardsIsLoading,
    refetch: rewardsRefetch
  } = useContractRead({
    address: lpStakingAddress as `0x${string}`,
    abi: BasicModelLPStaking.abi,
    functionName: 'calculateRewardsEarned',
    args: [
      address,
    ],
  });

  useEffect(() => {
    const interval = setInterval(() => {
      rewardsRefetch();
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  const { config: claimConfig } = usePrepareContractWrite({
    address: lpStakingAddress as `0x${string}`,
    abi: BasicModelLPStaking.abi,
    functionName: 'claim',
    args: [],
  });

  const {
    data: claimData,
    isIdle: claimIsIdle,
    isError: claimIsError,
    isLoading: claimIsLoading,
    isSuccess: claimIsSuccess,
    write: claimWrite
  } = useContractWrite(claimConfig)


  const { config: stakeConfig } = usePrepareContractWrite({
    address: lpStakingAddress as `0x${string}`,
    abi: BasicModelLPStaking.abi,
    functionName: 'stake',
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
    address: lpStakingAddress as `0x${string}`,
    abi: BasicModelLPStaking.abi,
    functionName: 'unstake',
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
    setStakeValue(ethers.utils.formatEther(lpTokenBalance));
  }, [lpTokenBalance]);

  useEffect(() => {
    setStakedValue(ethers.utils.formatEther(lpStakingBalance));
  }, [lpStakingBalance]);

  useEffect(() => {
    console.log('rewardsData', rewardsData);
    console.log('rewardsIsError', rewardsIsError);

    if (rewardsData) {
      setRewardsValue(ethers.utils.formatEther(rewardsData as ethers.BigNumber));
    }
  }, [rewardsData]);

  return (
    <>
      <TokenBalance
        show={false}
        update={setLPTokenBalance}
        token={lpAddress}
      />
      <TokenBalance
        show={false}
        update={setLPStakingBalance}
        token={lpStakingAddress}
      />


      <Disclosure as="div" className="pt-6">
        {({ open }) => (
          <>
            <dt>
              <Disclosure.Button className="flex w-full items-start justify-between text-left text-gray-900">
                <span className="text-base font-semibold leading-7">LP Staking</span>
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
                  Deposit Arbius/Model LP tokens here to get access to constantly generated rewards paid directly in model token.
                </p>

                <div className="flex justify-between mt-4">
                  <div>
                    <IncreaseAllowanceButton
                      updateNeedsAllowance={setNeedsAllowance}
                      token={lpAddress}
                      to={lpStakingAddress}
                    />
                  </div>
                  <div>
                    <button
                      onClick={() => claimWrite?.() }
                      className="rounded-md bg-white py-2 px-3 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-25 ml-2"
                      disabled={needsAllowance || rewardsValue === '0.0'}
                    >
                      Claim {rewardsValue}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between mt-3">
                  <div>
                    <input
                      type="number"
                      min={0}
                      max={ethers.utils.formatEther(lpTokenBalance)}
                      step={0.01}
                      value={stakeValue}
                      onChange={(e) => {
                        if (! isNaN(parseFloat(e.target.value))) {
                          if (ethers.utils.parseEther(e.target.value).lte(lpTokenBalance)) {
                            setStakeValue(e.target.value)
                          } else {
                            setStakeValue(ethers.utils.formatEther(lpTokenBalance))
                          }
                        }
                      }}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 w-full"
                    />
                  </div>

                  <div>
                    <button
                      onClick={() => setStakeValue(ethers.utils.formatEther(lpTokenBalance))}
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
                    disabled={needsAllowance}
                  >
                    Stake
                  </button>
                </div>

                <div className="flex justify-between mt-10">
                  <div>
                    <input
                      type="number"
                      min={0}
                      max={ethers.utils.formatEther(lpStakingBalance)}
                      step={0.01}
                      value={stakedValue}
                      onChange={(e) => {
                        if (! isNaN(parseFloat(e.target.value))) {
                          if (ethers.utils.parseEther(e.target.value).lte(lpStakingBalance)) {
                            setStakedValue(e.target.value)
                          } else {
                            setStakedValue(ethers.utils.formatEther(lpStakingBalance))
                          }
                        }
                      }}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 w-full"
                    />
                  </div>

                  <div>
                    <button
                      onClick={() => setStakedValue(ethers.utils.formatEther(lpStakingBalance))}
                      className="rounded-md bg-white py-2 px-3 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-25 ml-2"
                    >
                      Set Max
                    </button>
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => unstakeWrite?.()}
                    className="rounded-md bg-fuchsia-500 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-fuchsia-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-25 mt-2 w-full"
                    disabled={needsAllowance}
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
