import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  useAccount,
  useContractRead,
  usePrepareContractWrite,
  useContractWrite,
} from 'wagmi';
import { ethers } from 'ethers'
import Layout from '@/components/Layout';
import ClaimButton from '@/components/ClaimButton';
import GetDMLButton from '@/components/GetDMLButton';
import GetLPButton from '@/components/GetLPButton';
import { ArrowRightIcon } from '@heroicons/react/20/solid'
import { MinusSmallIcon, PlusSmallIcon } from '@heroicons/react/24/outline'
import ConnectWallet from '@/components/ConnectWallet';
import TokenBalance from '@/components/TokenBalance';
import IncreaseAllowanceButton from '@/components/IncreaseAllowanceButton';
import EngineArtifact from '@/artifacts/EngineV1.sol/EngineV1.json';
import ERC20DividendsArtifact from '@/artifacts/ERC20DividendsV1.sol/ERC20DividendsV1.json';
import Config from '@/config.json';
import { formatBalance } from '@/utils';

// TODO test with new network
// need to refresh these/enable them once approved
export default function StakingPage() {
  const { address } = useAccount();

  const [walletConnected, setWalletConnected] = useState(false);
  const [lpTokenBalance, setLPTokenBalance] = useState(ethers.BigNumber.from(0));
  const [lpStakingBalance, setLPStakingBalance] = useState(ethers.BigNumber.from(0));
  const [stakeValue, setStakeValue] = useState('0');
  const [stakedValue, setStakedValue] = useState('0');
  const [rewardsValue, setRewardsValue] = useState('');
  const [needsAllowance, setNeedsAllowance] = useState(true);

  const {
    data: stakingTokenAddress,
    isError: stakingTokenAddressIsError,
    isLoading: stakingTokenAddressIsLoading,
  } = useContractRead({
    address: Config.lpStakingRewardAddress as `0x${string}`,
    abi: ERC20DividendsArtifact.abi,
    functionName: 'stakingToken',
  });

  const {
    data: stakingTotalSupply,
    isError: stakingTotalSupplyIsError,
    isLoading: stakingTotalSupplyIsLoading,
  } = useContractRead({
    address: Config.lpStakingRewardAddress as `0x${string}`,
    abi: ERC20DividendsArtifact.abi,
    functionName: 'totalSupply',
  });

  const {
    data: rewardsData,
    isError: rewardsIsError,
    isLoading: rewardsIsLoading,
    refetch: rewardsRefetch,
  } = useContractRead({
    address: Config.lpStakingRewardAddress as `0x${string}`,
    abi: ERC20DividendsArtifact.abi,
    functionName: 'pendingPayment',
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
    address: Config.lpStakingRewardAddress as `0x${string}`,
    abi: ERC20DividendsArtifact.abi,
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
    address: Config.lpStakingRewardAddress as `0x${string}`,
    abi: ERC20DividendsArtifact.abi,
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
    address: Config.lpStakingRewardAddress as `0x${string}`,
    abi: ERC20DividendsArtifact.abi,
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

  const {
    data: startBlockTime,
    isError: startBlockTimeIsError,
    isLoading: startBlockTimeIsLoading,
  } = useContractRead({
    address: Config.engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    functionName: 'startBlockTime',
  });

  const targetTsBeginTime = Math.floor((+new Date())/1000) - parseInt(startBlockTime ? startBlockTime.toString() : '0')
  const targetTsEndTime = targetTsBeginTime + 86400;

  const {
    data: targetTsBeginAmount,
    isError: targetTsBeginAmountIsError,
    isLoading: targetTsBeginAmountIsLoading,
  } = useContractRead({
    address: Config.engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    functionName: 'targetTs',
    args: [
      targetTsBeginTime,
    ],
    enabled: Boolean(startBlockTime),
  });

  const {
    data: targetTsEndAmount,
    isError: targetTsEndAmountIsError,
    isLoading: targetTsEndAmountIsLoading,
  } = useContractRead({
    address: Config.engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    functionName: 'targetTs',
    args: [
      targetTsEndTime,
    ],
    enabled: Boolean(startBlockTime),
  });

  const {
    data: lpRewardPercentage,
    isError: lpRewardPercentageIsError,
    isLoading: lpRewardPercentageIsLoading,
  } = useContractRead({
    address: Config.engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    functionName: 'lpRewardPercentage',
  });

  const [nextDayExpectedEmission, setNextDayExpectedEmission] = useState('0');
  useEffect(() => {
    if (! startBlockTime || ! targetTsBeginAmount || !targetTsEndAmount || ! lpRewardPercentage) {
      return;
    }
    const units = (targetTsEndAmount as ethers.BigNumber)
      .sub(targetTsBeginAmount as ethers.BigNumber)
      .mul(lpRewardPercentage as ethers.BigNumber)
      .div(ethers.utils.parseEther('1'));
    setNextDayExpectedEmission(formatBalance(units));
  }, [startBlockTime, targetTsBeginAmount, targetTsEndAmount, lpRewardPercentage]);

  const [percentageOfStakedSupply, setPercentageOfStakedSupply] = useState('0');
  useEffect(() => {
    if (! lpStakingBalance || ! stakingTotalSupply) {
      return;
    }

    const lpStakingBalanceF = parseFloat(lpStakingBalance?.toString()); 
    const stakingTotalSupplyF = parseFloat(stakingTotalSupply?.toString());
    console.log('stakingTotalSupply', stakingTotalSupplyF);

    // avoid div by 0 with 0 staked supply
    if (stakingTotalSupplyF === 0) {
      setPercentageOfStakedSupply('0');
    } else {
      setPercentageOfStakedSupply((lpStakingBalanceF / stakingTotalSupplyF * 100).toString());
    }
  }, [lpStakingBalance, stakingTotalSupply]);

  useEffect(() => {
    setStakeValue(ethers.utils.formatEther(lpTokenBalance));
  }, [lpTokenBalance]);

  useEffect(() => {
    setStakedValue(ethers.utils.formatEther(lpStakingBalance));
  }, [lpStakingBalance]);

  useEffect(() => {
    if (rewardsData) {
      const remainder = (rewardsData as ethers.BigNumber).mod(1e14);
      setRewardsValue(ethers.utils.formatEther((rewardsData as ethers.BigNumber).sub(remainder)));
    }
  }, [rewardsData]);


  console.log('lpStakingBalance', ethers.utils.formatEther(lpStakingBalance));
  console.log('lpTokenBalance', ethers.utils.formatEther(lpTokenBalance));
  console.log('stakingTokenAddress', stakingTokenAddress);

  return (
    <Layout title="Staking">
      <main>
        <div className="sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mx-auto max-w-7xl">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
                Staking
              </h1>
            </div>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                Stake DML/ETH LP tokens to receive 10% of all newly created DML.
                <br />
                Funds are available to claim as tasks are completed.
              </p>
            </div>
            <div className="mt-8 w-full">
              <div className="flex justify-begin space-x-4">
                <GetDMLButton />
                <GetLPButton />
              </div>
            </div>

            <div className="mt-8 flex justify-begin sm:w-full lg:w-1/2">
              { ! walletConnected && (
                <div>
                  <ConnectWallet
                    update={setWalletConnected}
                  />
                </div>
              ) }
              { walletConnected && (
                <>
                  <TokenBalance
                    show={false}
                    update={setLPTokenBalance}
                    token={stakingTokenAddress as `0x${string}`}
                  />
                  <TokenBalance
                    show={false}
                    update={setLPStakingBalance}
                    token={Config.lpStakingRewardAddress as `0x${string}`}
                  />


                  <div className="pt-6 w-full">
                    <div className="bg-slate-50 p-3 border border-slate-200 rounded-lg text-slate-800">
                      <p>
                        <strong>Daily DML rewards:</strong> {nextDayExpectedEmission}
                        <br />
                        You are <strong>{percentageOfStakedSupply}%</strong> of staked pool
                        {/*
                        <br />
                        Expected staking reward next day:  {nextDayExpectedEmission * percentageOfStakedSupply / 100}
                        */}
                      </p>
                    </div>

                    <div className="flex justify-between mt-8 mb-12">
                      <div>
                        <IncreaseAllowanceButton
                          updateNeedsAllowance={setNeedsAllowance}
                          token={stakingTokenAddress as `0x${string}`}
                          to={Config.lpStakingRewardAddress as `0x${string}`}
                        />
                      </div>
                      <div>
                        <ClaimButton
                          onClick={() => claimWrite?.() }
                          disabled={needsAllowance || rewardsValue === '0.0'}
                        >
                          Claim {rewardsValue} DML
                        </ClaimButton>
                      </div>
                    </div>

                    <div className="flex justify-between mt-3 w-full">
                      <div className="w-80">
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
                          className="block w-full rounded-md border-0 py-1.5 bg-white dark:bg-[#26242d] text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 w-full"
                        />
                      </div>

                      <div className="w-40">
                        <button
                          onClick={() => setStakeValue(ethers.utils.formatEther(lpTokenBalance))}
                          className="rounded-md bg-white py-2 px-3 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-25 ml-2 text-black"
                        >
                          Set Max
                        </button>
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() => stakeWrite?.()}
                        className="rounded-md bg-indigo-500 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-25 mt-2 w-full transition-all"
                        disabled={needsAllowance || lpTokenBalance.eq(0)}
                      >
                        Stake
                      </button>
                    </div>


                    <div className="flex justify-between mt-10 w-full">
                      <div className="w-80">
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
                          className="block w-full rounded-md border-0 py-1.5 bg-white dark:bg-[#26242d] text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 w-full"
                        />
                      </div>

                      <div className="w-40">
                        <button
                          onClick={() => setStakedValue(ethers.utils.formatEther(lpStakingBalance))}
                          className="rounded-md bg-white py-2 px-3 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-25 ml-2 text-black"
                        >
                          Set Max
                        </button>
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() => unstakeWrite?.()}
                        className="rounded-md bg-fuchsia-500 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-fuchsia-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-25 mt-2 w-full transition-all"
                        disabled={needsAllowance || lpStakingBalance.eq(0)}
                      >
                        Unstake
                      </button>
                    </div>
                  </div>
                </>
              ) }
            </div>
          </div>
        </div>
      </main>
    </Layout>
  )
}
