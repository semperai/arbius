import React, { useEffect, useState } from 'react';
import {
  useContractRead,
  useAccount,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from 'wagmi';
import { BigNumber, ethers } from 'ethers';
import baseTokenV1 from '../../../abis/baseTokenV1.json';
// import config from "../../../../sepolia_config.json"
import votingEscrow from '../../../abis/votingEscrow.json';
import voter from '../../../abis/voter.json';
import veStaking from '../../../abis/veStaking.json';
import Image from 'next/image';
import arbius_logo_slider from '@/app/assets/images/arbius_logo_slider.png';
import { AIUS_wei, infuraUrl, alchemyUrl } from '../../../Utils/constantValues';
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
  const [realtimeInterval, setRealtimeInterval] = useState(null);
  const [rateOfIncreasePerSecond, setRateOfIncreasePerSecond] = useState(0);
  const [extendMonths, setExtendMonths] = useState(0);
  console.log(extendMonths, "EMEMEM")
  /*const { data: totalStaked, isLoading: totalStakedIsLoading, isError: totalStakedIsError } = useContractRead({
        address: Config.votingEscrowAddress,
        abi: votingEscrow.abi,
        functionName: 'locked',
        args: [
            Number(tokenID?._hex)
        ],
        enabled: isConnected
    })
    console.log(totalStaked, "ttsake")
    const { data: endDate, isLoading: endDateIsLoading, isError: endDateIsError } = useContractRead({
        address: Config.votingEscrowAddress,
        abi: votingEscrow.abi,
        functionName: 'locked__end',
        args: [
            Number(tokenID?._hex)
        ],
        enabled: isConnected
    })
    console.log(Number(endDate?._hex), "endDate")
    const { data: stakedOn, isLoading: stakedOnIsLoading, isError: stakedOnIsError } = useContractRead({
        address: Config.votingEscrowAddress,
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
        address: Config.votingEscrowAddress,
        abi: votingEscrow.abi,
        functionName: 'balanceOfNFT',
        args: [
            Number(tokenID?._hex)
        ],
        enabled: isConnected
    })

    const { data: initialBalance, isLoading: initialBalanceIsLoading, isError: initialBalanceIsError } = useContractRead({
        address: Config.veStakingAddress,
        abi: veStaking.abi,
        functionName: 'balanceOf',
        args: [
            Number(tokenID?._hex)
        ],
        enabled: isConnected
    })
    const { data: earned, isLoading: earnedIsLoading, isError: earnedIsError } = useContractRead({
        address: Config.veStakingAddress,
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
    address: Config.votingEscrowAddress,
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

  const handleWithdraw = async(lockedEndDate) => {
    // @ts-ignore
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    // Create a provider
    // @ts-ignore
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // Get the signer
    const signer = provider.getSigner();

    const votingEscrowContract = new ethers.Contract(
      Config.votingEscrowAddress,
      votingEscrow.abi,
      signer
    );

    const voterContract = new ethers.Contract(
      Config.voterAddress,
      voter.abi,
      signer
    );

    const alreadyVoted = await votingEscrowContract.voted(token?.tokenID);

    if(alreadyVoted){
      // @ts-ignore
      setShowPopUp('withdraw/2');
      // reset the vote first
      const resetTx = await voterContract.reset(token?.tokenID);

      await resetTx.wait();
      getTransactionReceiptData(resetTx.hash).then(async function () {

        if (lockedEndDate > Date.now()) {
          return;
        }

        const _withdraw = await votingEscrowContract.withdraw(token?.tokenID);
        await _withdraw.wait();
        getTransactionReceiptData(_withdraw.hash).then(function () {
          // @ts-ignore
          setShowPopUp('withdraw/Success');
          // @ts-ignore
          setUpdateValue((prevValue) => prevValue + 1);
        })
        .catch(function() {
          // @ts-ignore
          setShowPopUp('withdraw/Error');
        })
      });
    }else{
      if (lockedEndDate > Date.now()) {
        return;
      }

      withdrawAIUS?.();
      // @ts-ignore
      setShowPopUp('withdraw/2');
    }
  };

  useEffect(() => {
    if (withdrawAIUSError) {
      setShowPopUp('withdraw/Error');
    }
  }, [withdrawAIUSError]);

  // useEffect(() => {
  //     const f = async() => {
  //         const web3 = new Web3(window.ethereum);
  //         const votingEscrowContract = new web3.eth.Contract(votingEscrow.abi, Config.votingEscrowAddress);
  //         const veStakingContract = new web3.eth.Contract(veStaking.abi, Config.veStakingAddress);

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

  const getWeb3 = async() => {
    return await fetch(alchemyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_blockNumber",
          params: []
        }),
      })
      .then(res => res.json())
        .then(data => {
          if (data.error) {
            console.error("Alchemy error:", data.error.message);
            let web3 = new Web3(new Web3.providers.HttpProvider(infuraUrl));
            return web3
          } else {
            let web3 = new Web3(new Web3.providers.HttpProvider(alchemyUrl));
            console.log("Successfully connected. Block number:", data.result);
            return web3
          }
        })
        .catch((err) => {
          console.log("Request failed:", err)
          let web3 = new Web3(new Web3.providers.HttpProvider(infuraUrl));
          return web3
        });
  }

  //const handleRealtimeClaimableRewards = async (mouseOver) => {
  useEffect(() => {

    const f = async() => {
      const web3 = await getWeb3();

      const veStakingContract = new web3.eth.Contract(
        veStaking.abi,
        Config.veStakingAddress
      );

      const votingEscrowContract = new web3.eth.Contract(
        votingEscrow.abi,
        Config.votingEscrowAddress
      );

      const _endDate = await votingEscrowContract.methods.locked__end(token?.tokenID).call();

      let _currentlyEndingAt = new Date(Number(_endDate) * 1000).toLocaleDateString('en-US');

      let datePlus24Months = new Date();
      datePlus24Months.setMonth(datePlus24Months.getMonth() + 24);
      const currentlyEndingDate = new Date(_currentlyEndingAt);
      const numberOfMonths =
        (datePlus24Months.getFullYear() - currentlyEndingDate.getFullYear()) * 12 +
        (datePlus24Months.getMonth() - currentlyEndingDate.getMonth());

      const timeDiff = (datePlus24Months - currentlyEndingDate) / (1000 * 60 * 60 * 24);
      let numberOfWeeks = Math.floor(timeDiff / 7);

      if(numberOfMonths === 0){
        setExtendMonths(numberOfWeeks / 4);
      }else{
        setExtendMonths(numberOfMonths);
      }

      if (realtimeInterval) {
          clearInterval(realtimeInterval);
      }
      // if(Number(_endDate) * 1000 < Date.now()){
      //   return; // Not to proceed further for realtime rewards if time has passed
      // }

      const rewardForDuration = await veStakingContract.methods.getRewardForDuration().call();
      if(!(rewardForDuration > 0)){
        return; // No need to calculate realtime rewards if rewards are disabled 
      }

      const _rewardRate = await veStakingContract.methods.rewardRate().call();
      const _totalSupply = await veStakingContract.methods.totalSupply().call();
      const _rewardPerveAIUSPerSecond = Number(_rewardRate) / Number(_totalSupply);
      const _rateOfIncreasePerSecond = Number(_rewardPerveAIUSPerSecond) * Number(initialBalance);
      setRateOfIncreasePerSecond(_rateOfIncreasePerSecond);

      let newEarned = earned;

      let _interval = setInterval(async() => {
          newEarned = Number(newEarned) + Number(_rateOfIncreasePerSecond);
          setEarned(newEarned)
      }, 1000);
      setRealtimeInterval(_interval);
    }

    if (initialBalance) {
      f();
    }
  },[initialBalance])
  //}


  return (
    <div className='relative rounded-2xl bg-white-background px-8 py-6'>
      <Link
        href={`${openseaLink}${Config.votingEscrowAddress}/${Number(token?.tokenID)}`}
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
            <h2 className={"text-[12px] font-semibold mt-[4px]"} /*onMouseEnter={()=>handleRealtimeClaimableRewards(true, initialBalance)} onMouseLeave={()=>handleRealtimeClaimableRewards(false, initialBalance)}*/>
              { earned ?
                (Number(earned) / AIUS_wei)?.toFixed(11).toString()
                : "0.00"
              }{' '}
              <span className='text-[9px] font-medium'>AIUS</span>
            </h2>
          </div>
          <div className='' /* Extra margin : because rewards has less font size, so to maintain the gap there is mt added */> 
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
                className={`group relative flex w-full items-center justify-center gap-3 rounded-full bg-black-background px-3 py-1 py-2 lg:px-4`}
              >
                <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-4 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                <div className={`lato-bold relative z-10 text-original-white lg:text-[15px]`}>
                  Add
                </div>
              </button>
            </div>
            <div className='w-[32%]'>
              <button
                type='button'
                onClick={extendMonths ? () => {
                  setShowPopUp('extend');
                  setSelectedStake(token?.tokenID);
                } : null }
                className={`group relative flex w-full items-center justify-center gap-3 rounded-full ${extendMonths ? "bg-black-background" : "bg-light-gray-background"} px-3 py-1 py-2 lg:px-4`}
              >
                <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-4 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                <div className={`lato-bold relative z-10 ${extendMonths ? "text-original-white" : "text-black-text text-opacity-40"} lg:text-[15px]`}>
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
                className={`group relative flex w-full items-center justify-center gap-3 rounded-full bg-black-background px-3 py-1 py-2 lg:px-4`}
              >
                <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-4 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                <div className={`lato-bold relative z-10 text-original-white lg:text-[15px]`}>
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
                className={`group relative flex w-full items-center justify-center gap-3 rounded-full bg-black-background px-3 py-1 py-2 lg:px-4`}
              >
                <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-4 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                <div className={`lato-bold relative z-10 flex items-center justify-center gap-1 text-original-white lg:text-[15px]`}>
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
