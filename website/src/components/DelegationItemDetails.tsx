import { useState, useEffect } from 'react';
import {
  useAccount,
  useContractRead,
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction,
} from 'wagmi';
import ConnectWallet from '@/components/ConnectWallet';
import ClaimButton from '@/components/ClaimButton';
import IncreaseAllowanceButton from '@/components/IncreaseAllowanceButton';
import TokenBalance from '@/components/TokenBalance';
import DelegatedValidatorArtifact from '@/artifacts/DelegatedValidatorV1.sol/DelegatedValidatorV1.json';
import EngineArtifact from '@/artifacts/EngineV1.sol/EngineV1.json';
import Config from '@/config.json';
import { ethers } from 'ethers'
import { secondsToDhms } from '@/utils';

// check depositsEnabled set disabled for -->:
// show deposit button

// show depositOf and totalDeposited


// check if withdraw initiated if no: 
// initiate withdraw
// otherwise:
// show cancel withdraw button
// & show time until you can withdraw or show button to complete withdraw
//
//

interface PendingValidatorWithdrawRequest {
  unlockTime: ethers.BigNumber;
  amount: ethers.BigNumber;
}

interface Props {
  representative: `0x${string}`;
}

export default function DelegationItemDetails({ representative }: Props) {
  const { address } = useAccount();

  const [walletConnected, setWalletConnected] = useState(false);
  const [needsAllowance, setNeedsAllowance] = useState(true);
  const [tokenBalance, setTokenBalance] = useState(ethers.BigNumber.from(0));
  const [depositValue, setDepositValue] = useState('0');
  const [redraw, setRedraw] = useState(0);

  const {
    data: depositsEnabled,
    isError: depositsEnabledIsError,
    isLoading: depositsEnabledIsLoading,
    refetch: depositsEnabledRefetch,
  } = useContractRead({
    address: representative,
    abi: DelegatedValidatorArtifact.abi,
    functionName: 'depositsEnabled',
  });

  const {
    data: depositOf,
    isError: depositOfIsError,
    isLoading: depositOfIsLoading,
    refetch: depositOfRefetch,
  } = useContractRead({
    address: representative,
    abi: DelegatedValidatorArtifact.abi,
    functionName: 'depositOf',
    args: [address],
    enabled: Boolean(address),
  });

  const {
    data: rewardsEarned,
    isError: rewardsEarnedIsError,
    isLoading: rewardsEarnedIsLoading,
    refetch: rewardsEarnedRefetch,
  } = useContractRead({
    address: representative,
    abi: DelegatedValidatorArtifact.abi,
    functionName: 'calculateRewardsEarned',
    args: [address],
    enabled: Boolean(address),
  });

  const {
    data: totalDeposited,
    isError: totalDepositedIsError,
    isLoading: totalDepositedIsLoading,
    refetch: totalDepositedRefetch,
  } = useContractRead({
    address: representative,
    abi: DelegatedValidatorArtifact.abi,
    functionName: 'totalDeposited',
    watch: true,
  });

  // see if has pending withdraw
  const {
    data: userPendingWithdrawCount,
    isError: userPendingWithdrawCountIsError,
    isLoading: userPendingWithdrawCountIsLoading,
    refetch: userPendingWithdrawCountRefetch,
  } = useContractRead({
    address: representative,
    abi: DelegatedValidatorArtifact.abi,
    functionName: 'userPendingWithdrawCount',
    args: [address],
    enabled: Boolean(address),
    watch: true,
  });

  const {
    data: pendingValidatorWithdrawRequest,
    isError: pendingValidatorWithdrawRequestIsError,
    isLoading: pendingValidatorWithdrawRequestIsLoading,
    refetch: pendingValidatorWithdrawRequestRefetch,
  } = useContractRead({
    address: Config.engineAddress as `0x${string}`,
    abi: EngineArtifact.abi,
    functionName: 'pendingValidatorWithdrawRequests',
    args: [representative, userPendingWithdrawCount],
    enabled: (
      Boolean(address) &&
      Boolean(userPendingWithdrawCount) &&
      ! (userPendingWithdrawCount as ethers.BigNumber).eq(0)
    ),
  });

  useEffect(() => {
    const interval = setInterval(() => {
      depositsEnabledRefetch();
      depositOfRefetch();
      rewardsEarnedRefetch();
      totalDepositedRefetch();
      userPendingWithdrawCountRefetch();
      pendingValidatorWithdrawRequestRefetch();
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  const { config: depositConfig } = usePrepareContractWrite({
    address: representative,
    abi: DelegatedValidatorArtifact.abi,
    functionName: 'deposit',
    args: [
      ethers.utils.parseEther(depositValue),
    ],
  });

  const {
    data: depositData,
    isIdle: depositIsIdle,
    isError: depositIsError,
    isLoading: depositIsLoading,
    isSuccess: depositIsSuccess,
    write: depositWrite
  } = useContractWrite(depositConfig)

  const { data: waitForDepositData } = useWaitForTransaction({
    hash: depositData?.hash,
  });

  const { config: initiateWithdrawConfig } = usePrepareContractWrite({
    address: representative,
    abi: DelegatedValidatorArtifact.abi,
    functionName: 'initiateWithdraw',
    args: [],
  });

  const {
    data: initiateWithdrawData,
    isIdle: initiateWithdrawIsIdle,
    isError: initiateWithdrawIsError,
    isLoading: initiateWithdrawIsLoading,
    isSuccess: initiateWithdrawIsSuccess,
    write: initiateWithdrawWrite
  } = useContractWrite(initiateWithdrawConfig)

  const { data: waitForInitiateWithdrawData } = useWaitForTransaction({
    hash: initiateWithdrawData?.hash,
  });

  const { config: cancelWithdrawConfig } = usePrepareContractWrite({
    address: representative,
    abi: DelegatedValidatorArtifact.abi,
    functionName: 'cancelWithdraw',
    args: [],
  });

  const {
    data: cancelWithdrawData,
    isIdle: cancelWithdrawIsIdle,
    isError: cancelWithdrawIsError,
    isLoading: cancelWithdrawIsLoading,
    isSuccess: cancelWithdrawIsSuccess,
    write: cancelWithdrawWrite
  } = useContractWrite(cancelWithdrawConfig)

  const { data: waitForCancelWithdrawData } = useWaitForTransaction({
    hash: cancelWithdrawData?.hash,
  });

  const { config: withdrawConfig } = usePrepareContractWrite({
    address: representative,
    abi: DelegatedValidatorArtifact.abi,
    functionName: 'withdraw',
    args: [],
  });

  const {
    data: withdrawData,
    isIdle: withdrawIsIdle,
    isError: withdrawIsError,
    isLoading: withdrawIsLoading,
    isSuccess: withdrawIsSuccess,
    write: withdrawWrite
  } = useContractWrite(withdrawConfig)

  const { data: waitForWithdrawData } = useWaitForTransaction({
    hash: withdrawData?.hash,
  });

  const { config: claimConfig } = usePrepareContractWrite({
    address: representative,
    abi: DelegatedValidatorArtifact.abi,
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

  const { data: waitForClaimData } = useWaitForTransaction({
    hash: claimData?.hash,
  });

  const pendingWithdrawTimeRemaining = pendingValidatorWithdrawRequest
    ? ((pendingValidatorWithdrawRequest as PendingValidatorWithdrawRequest).unlockTime.toNumber() - ((+ new Date)/1000))
    : 0;

  console.log('rewardsEarned', rewardsEarned);

  useEffect(() => {
    setRedraw(redraw + 1);
    console.log('cancel', waitForCancelWithdrawData);
    console.log('init', waitForInitiateWithdrawData);
  }, [
    waitForDepositData,
    waitForInitiateWithdrawData,
    waitForCancelWithdrawData,
    waitForWithdrawData
  ]);

  return (
    <>
      <div className="border border-slate-200 rounded-lg">
        <ConnectWallet
          update={setWalletConnected}
        />
        { walletConnected && (
          <>
            <TokenBalance
              show={false}
              update={setTokenBalance}
              token={Config.baseTokenAddress as `0x${string}`}
            />

            <div className="grid grid-cols-1 gap-4 mt-6 mb-4 pl-5">
              { needsAllowance && (
                <div className="w-80 bg-slate-50 p-3 border border-slate-200 rounded-lg">
                  <p>
                    You must approve this miner to be able to delegate.
                  </p>
                </div>
              ) }
              <IncreaseAllowanceButton
                updateNeedsAllowance={setNeedsAllowance}
                token={Config.baseTokenAddress as `0x${string}`}
                to={representative}
              />
            </div>

            <div className="w-full pl-4 pb-12">
              <ClaimButton
                disabled={!rewardsEarned}
                onClick={() => claimWrite?.()}
              >
                Claim {rewardsEarned ? ethers.utils.formatEther(rewardsEarned as ethers.BigNumber) : '...'} DML
              </ClaimButton>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="p-3">
                <div className="flex justify-between w-full">
                  <div className="w-80">
                    <input
                      type="number"
                      min={0}
                      max={ethers.utils.formatEther(tokenBalance)}
                      step={0.01}
                      value={depositValue}
                      disabled={! depositsEnabled}
                      onChange={(e) => {
                        if (! isNaN(parseFloat(e.target.value))) {
                          if (ethers.utils.parseEther(e.target.value).lte(tokenBalance)) {
                            setDepositValue(e.target.value)
                          } else {
                            setDepositValue(ethers.utils.formatEther(tokenBalance))
                          }
                        }
                      }}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-cyan-800 sm:text-sm sm:leading-6 w-full bg-white dark:bg-[#26242d]"
                    />
                  </div>
    
                  <div className="w-40">
                    <button
                      onClick={() => setDepositValue(ethers.utils.formatEther(tokenBalance))}
                      disabled={!depositsEnabled}
                      className="rounded-md bg-white py-2 px-3 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-25 ml-2 text-black"
                    >
                      Set Max
                    </button>
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => depositWrite?.()}
                    className="rounded-md bg-indigo-500 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-25 mt-2 w-full transition-all"
                    disabled={needsAllowance || tokenBalance.eq(0) || !depositsEnabled}
                  >
                    Deposit
                  </button>
                  {! depositsEnabled && (
                    <div className="mt-3">
                      <strong className="text-sm pl-1 text-slate-800">
                        Deposits have been disabled by the miner
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <>
                  {/* user doesn't have pending withdraw */}
                  {userPendingWithdrawCount && (userPendingWithdrawCount as ethers.BigNumber).eq(0) && (
                    <>
                      <button
                        onClick={() => initiateWithdrawWrite?.()}
                        className="rounded-md bg-fuchsia-500 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-fuchsia-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-25 mt-2 w-full transition-all"
                        disabled={needsAllowance || (depositOf as ethers.BigNumber).eq(0)}
                      >
                        Initiate withdraw of {ethers.utils.formatEther(depositOf as ethers.BigNumber)} DML
                      </button>
                    </>
                  )}

                  {/* user has pending withdraw */}
                  {userPendingWithdrawCount && !(userPendingWithdrawCount as ethers.BigNumber).eq(0) && (
                    <>
                      <div className="grid grid-cols-2 gap-2 pr-3">
                        <div>
                          <button
                            onClick={() => withdrawWrite?.()}
                            className="rounded-md bg-fuchsia-500 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-fuchsia-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-25 mt-2 w-full transition-all"
                            disabled={pendingWithdrawTimeRemaining > 0}
                          >
                            Withdraw {ethers.utils.formatEther(pendingValidatorWithdrawRequest ? (pendingValidatorWithdrawRequest as PendingValidatorWithdrawRequest).amount : ethers.constants.Zero)} DML
                            <br />
                            {pendingWithdrawTimeRemaining > 0 && (
                              <span className="text-xs">&nbsp;({secondsToDhms(pendingWithdrawTimeRemaining)} remaining)</span>
                            )}
                          </button>
                        </div>

                        <div>
                          <button
                            onClick={() => cancelWithdrawWrite?.()}
                            className="rounded-md bg-red-500 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-25 mt-2 w-full transition-all"
                          >
                            Cancel Withdraw
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              </div>
            </div>
    
    
            {/*
    
            Deposits Enabled: {depositsEnabled && depositsEnabled ? 'true' : 'false'}
            <br />
            Deposit of: {depositOf && ethers.utils.formatEther(depositOf)}
            <br />
            total deposited: {totalDeposited && ethers.utils.formatEther(totalDeposited)}
            <br />
            pending reward: {rewardsEarned && ethers.utils.formatEther(rewardsEarned)}
            <br />
            pending withdraw: {userPendingWithdrawCount && !userPendingWithdrawCount.eq(0) ? 'true' : 'false'}
            <br />
            pending withdraw time: {pendingValidatorWithdrawRequest && pendingValidatorWithdrawRequest.unlockTime.toString() }
            <br />
            pending withdraw amount: {pendingValidatorWithdrawRequest && pendingValidatorWithdrawRequest.amount }
            */}
          </>
        )}
      </div>
    </>
  );
}
