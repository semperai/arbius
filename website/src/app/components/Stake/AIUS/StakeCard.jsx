import React, { useEffect, useState } from 'react';
import {
  useContractRead,
  useAccount,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from 'wagmi';
import { BigNumber } from 'ethers';
import baseTokenV1 from '../../../abis/baseTokenV1.json';
// import config from "../../../../sepolia_config.json"
import votingEscrow from '../../../abis/votingEscrow.json';
import veStaking from '../../../abis/veStaking.json';
import Image from 'next/image';
import arbius_logo_slider from '@/app/assets/images/arbius_logo_slider.png';
import { AIUS_wei } from '../../../Utils/constantValues';
import Link from 'next/link';
import info_icon from '@/app/assets/images/info_icon_white.png';
import Web3 from 'web3';
import { getTransactionReceiptData } from '../../../Utils/getTransactionReceiptData';
import Config from '@/config.one.json';

function StakeCard({
  idx,
  token,
  getAPR,
  rewardRate,
  totalSupply,
  setSelectedStake,
  setShowPopUp,
  updateValue,
  setUpdateValue,
}) {
  //console.log(token, "TOKEN in individual card")
  const { address, isConnected } = useAccount();

  const [totalStaked, setTotalStaked] = useState(token?.locked);
  const [endDate, setEndDate] = useState(token?.locked__end);
  const [stakedOn, setStakedOn] = useState(token?.user_point_history__ts);
  const [initialBalance, setInitialBalance] = useState(token?.initialBalance);
  const [governancePower, setGovernancePower] = useState(token?.balanceOfNFT);
  const [earned, setEarned] = useState(token?.earned);

  /*const { data: totalStaked, isLoading: totalStakedIsLoading, isError: totalStakedIsError } = useContractRead({
        address: Config.v4_votingEscrowAddress,
        abi: votingEscrow.abi,
        functionName: 'locked',
        args: [
            Number(tokenID?._hex)
        ],
        enabled: isConnected
    })
    console.log(totalStaked, "ttsake")
    const { data: endDate, isLoading: endDateIsLoading, isError: endDateIsError } = useContractRead({
        address: Config.v4_votingEscrowAddress,
        abi: votingEscrow.abi,
        functionName: 'locked__end',
        args: [
            Number(tokenID?._hex)
        ],
        enabled: isConnected
    })
    console.log(Number(endDate?._hex), "endDate")
    const { data: stakedOn, isLoading: stakedOnIsLoading, isError: stakedOnIsError } = useContractRead({
        address: Config.v4_votingEscrowAddress,
        abi: votingEscrow.abi,
        functionName: 'user_point_history__ts',
        args: [
            Number(tokenID?._hex),
            1
        ],
        enabled: isConnected
    })
    console.log(stakedOn, "stakedOn")
    const { data: governancePower, isLoading: governancePowerIsLoading, isError: governancePowerIsError } = useContractRead({
        address: Config.v4_votingEscrowAddress,
        abi: votingEscrow.abi,
        functionName: 'balanceOfNFT',
        args: [
            Number(tokenID?._hex)
        ],
        enabled: isConnected
    })

    const { data: initialBalance, isLoading: initialBalanceIsLoading, isError: initialBalanceIsError } = useContractRead({
        address: Config.v4_veStakingAddress,
        abi: veStaking.abi,
        functionName: 'balanceOf',
        args: [
            Number(tokenID?._hex)
        ],
        enabled: isConnected
    })
    const { data: earned, isLoading: earnedIsLoading, isError: earnedIsError } = useContractRead({
        address: Config.v4_veStakingAddress,
        abi: veStaking.abi,
        functionName: 'earned',
        args: [
            Number(tokenID?._hex)
        ]
    })*/

  // withdraw
  //console.log(Number(endDate) * 1000, "current")
  //console.log("current Date", Date.now())
  const { config: withdrawAIUSConfig } = usePrepareContractWrite({
    address: Config.v4_votingEscrowAddress,
    abi: votingEscrow.abi,
    functionName: 'withdraw',
    args: [Number(token?.tokenID)],
    enabled: Date.now() > Number(endDate) * 1000,
  });

  const {
    data: withdrawAIUSData,
    isLoading: withdrawAIUSIsLoading,
    isSuccess: withdrawAIUSIsSuccess,
    isError: withdrawAIUSError,
    write: withdrawAIUS,
  } = useContractWrite(withdrawAIUSConfig);

  //console.log({ withdrawAIUSData })

  const {
    data: approveTx,
    isError: txError,
    isLoading: txLoading,
  } = useWaitForTransaction({
    hash: withdrawAIUSData?.hash,
    confirmations: 3,
    onSuccess(data) {
      console.log('approve tx successful data ', data);
      setShowPopUp('withdraw/Success');
      getTransactionReceiptData(withdrawAIUSData?.hash).then(function () {
        //window.location.reload(true)
        setUpdateValue((prevValue) => prevValue + 1);
      });
    },
    onError(err) {
      console.log('approve tx error data ', err);
      setShowPopUp('withdraw/Error');
    },
  });

  const handleWithdraw = (lockedEndDate) => {
    console.log(
      lockedEndDate,
      Date.now(),
      'locked end date and current date comparison'
    );
    if (lockedEndDate > Date.now()) {
      return;
    }
    console.log(lockedEndDate, 'LOCKED END DATE', 'Withdraw');

    withdrawAIUS?.();
    setShowPopUp('withdraw/2');
  };

  useEffect(() => {
    if (withdrawAIUSError) {
      setShowPopUp('withdraw/Error');
    }
  }, [withdrawAIUSError]);

  // useEffect(() => {
  //     const f = async() => {
  //         const web3 = new Web3(window.ethereum);
  //         const votingEscrowContract = new web3.eth.Contract(votingEscrow.abi, Config.v4_votingEscrowAddress);
  //         const veStakingContract = new web3.eth.Contract(veStaking.abi, Config.v4_veStakingAddress);

  //         const _totalStaked = await votingEscrowContract.methods.locked(tokenID).call()
  //         const _endDate = await votingEscrowContract.methods.locked__end(tokenID).call()
  //         const _stakedOn = await votingEscrowContract.methods.user_point_history__ts(tokenID, 1).call()
  //         const _governancePower = await votingEscrowContract.methods.balanceOfNFT(tokenID).call()
  //         const _initialBalance = await veStakingContract.methods.balanceOf(tokenID).call()
  //         const _earned = await veStakingContract.methods.earned(tokenID).call()
  //         console.log(_totalStaked, _endDate, _stakedOn, _governancePower, _initialBalance, _earned, "^ 6 values")
  //         setTotalStaked(_totalStaked)
  //         setEndDate(_endDate)
  //         setStakedOn(_stakedOn)
  //         setGovernancePower(_governancePower)
  //         setInitialBalance(_initialBalance)
  //         setEarned(_earned)
  //     }
  //     if(address){
  //         f();
  //     }
  // },[address])

  const openseaLink =
    process?.env?.NEXT_PUBLIC_AIUS_ENV === 'dev'
      ? 'https://testnets.opensea.io/assets/arbitrum-sepolia/'
      : 'https://opensea.io/assets/arbitrum/';
  return (
    <div className='relative rounded-2xl bg-white-background px-8 py-6'>
      <Link
        href={`${openseaLink}${Config.v4_votingEscrowAddress}/${Number(token?.tokenID)}`}
        target='_blank'
      >
        <Image
          src={arbius_logo_slider}
          className='absolute right-2 top-2 z-20 h-[36px] w-[36px] cursor-pointer'
          alt=''
        />
      </Link>
      <div className='flex items-start justify-start gap-8'>
        <div className='flex flex-col items-start justify-center gap-3'>
          <div>
            <h2 className='text-[12px] font-semibold text-[#8D8D8D]'>
              Total Staked
            </h2>
            <h2 className='text-[15px] font-semibold'>
              {totalStaked?.amount
                ? (Number(totalStaked.amount) / AIUS_wei)?.toFixed(2).toString()
                : 0}{' '}
              <span className='text-[11px] font-medium'>AIUS</span>
            </h2>
          </div>
          <div>
            <h2 className='text-[12px] font-semibold text-[#8D8D8D]'>
              Initial Balance
            </h2>
            <h2 className='text-[15px] font-semibold'>
              {initialBalance
                ? (Number(initialBalance) / AIUS_wei)?.toFixed(2).toString()
                : 0}{' '}
              <span className='text-[11px] font-medium'>veAIUS</span>
            </h2>
          </div>
          <div>
            <h2 className='text-[12px] font-semibold text-[#8D8D8D]'>
              Staked on
            </h2>
            <h2 className='text-[15px] font-semibold'>
              {new Date(Number(stakedOn) * 1000).toLocaleDateString('en-US')}
            </h2>
          </div>
        </div>
        <div className='flex flex-col items-start justify-center gap-3'>
          <div>
            <h2 className='text-[12px] font-semibold text-[#8D8D8D]'>
              Governance Power
            </h2>
            <h2 className='text-[15px] font-semibold'>
              {governancePower
                ? (Number(governancePower) / AIUS_wei)?.toFixed(2).toString()
                : 0}
            </h2>
          </div>
          <div>
            <h2 className='text-[12px] font-semibold text-[#8D8D8D]'>
              Rewards
            </h2>
            <h2 className='text-[15px] font-semibold'>
              {earned ? (Number(earned) / AIUS_wei)?.toFixed(2).toString() : 0}{' '}
              AIUS
            </h2>
          </div>
          <div>
            <div>
              <h2 className='text-[12px] font-semibold text-[#8D8D8D]'>
                End Date
              </h2>
              <h2 className='text-[15px] font-semibold'>
                {new Date(Number(endDate) * 1000).toLocaleDateString('en-US')}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* <div className='flex justify-start gap-12 items-center mt-3'>

            </div> */}

      <div className='mt-4 flex items-center justify-between gap-2'>
        {Number(endDate) * 1000 > Date.now() ? (
          <>
            <div className='w-[32%]'>
              <button
                type='button'
                onClick={() => {
                  setShowPopUp('add');
                  setSelectedStake(token?.tokenID);
                }}
                className='group relative flex w-full items-center justify-center gap-3 rounded-full bg-black-background px-3 py-1 py-2 lg:px-4'
              >
                <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-4 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                <div className='lato-bold relative z-10 text-original-white lg:text-[15px]'>
                  Add
                </div>
              </button>
            </div>
            <div className='w-[32%]'>
              <button
                type='button'
                onClick={() => {
                  setShowPopUp('extend');
                  setSelectedStake(token?.tokenID);
                }}
                className='group relative flex w-full items-center justify-center gap-3 rounded-full bg-black-background px-3 py-1 py-2 lg:px-4'
              >
                <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-4 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                <div className='lato-bold relative z-10 text-original-white lg:text-[15px]'>
                  Extend
                </div>
              </button>
            </div>
            <div className='w-[32%]'>
              <button
                type='button'
                onClick={() => {
                  setShowPopUp('claim');
                  setSelectedStake(token?.tokenID);
                }}
                className='group relative flex w-full items-center justify-center gap-3 rounded-full bg-black-background px-3 py-1 py-2 lg:px-4'
              >
                <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-4 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                <div className='lato-bold relative z-10 text-original-white lg:text-[15px]'>
                  Claim
                </div>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className='w-[30%]'></div>
            <div className='w-[30%]'></div>
            <div className='w-[40%]'>
              <button
                type='button'
                onClick={() => {
                  setSelectedStake(token?.tokenID);
                  handleWithdraw(Number(endDate) * 1000);
                }}
                className='group relative flex w-full items-center justify-center gap-3 rounded-full bg-black-background px-3 py-1 py-2 lg:px-4'
              >
                <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-4 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                <div className='lato-bold relative z-10 flex items-center justify-center gap-1 text-original-white lg:text-[15px]'>
                  <h1>Withdraw</h1>
                  <div className='group mt-[1px]'>
                    <Image src={info_icon} width={14} height={14} alt='info' />
                    <div className='stake-box-shadow lato-bold absolute -right-6 -top-[58px] hidden rounded-md bg-white-background p-2 text-left text-[.6rem] text-black-text group-hover:block xl:w-[160px]'>
                      Withdrawing includes your rewards automatically.
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default StakeCard;
