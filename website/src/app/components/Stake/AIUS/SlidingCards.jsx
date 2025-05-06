import React, { useRef, useState, useEffect } from 'react';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Slider from 'react-slick';
import Image from 'next/image';
import arrow_prev from '../../../assets/images/arrow_slider_2.png';
import PopUp from './PopUp';
import cross_icon from '../../../assets/images/cross_icon.png';
import arbius_logo_without_name from '@/app/assets/images/arbius_logo_without_name.png';
import ReactSlider from 'react-slider';
import info_icon from '../../../assets/images/info_icon.png';
import arbius_logo_slider from '@/app/assets/images/arbius_logo_slider.png';
import veStaking from '../../../abis/veStaking.json';
import votingEscrow from '../../../abis/votingEscrow.json';
import { getAPR } from '../../../Utils/getAPR';
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useTransaction,
} from 'wagmi';
import { BigNumber } from 'ethers';
import baseTokenV1 from '../../../abis/baseTokenV1.json';
import StakeCard from './StakeCard';
import { AIUS_wei, t_max, defaultApproveAmount, infuraUrl, alchemyUrl } from '../../../Utils/constantValues';
import CircularProgressBar from './CircularProgressBar';
import powered_by from '../../../assets/images/powered_by.png';
import cross from '../../../assets/images/cross.png';
import error_stake from '../../../assets/images/error_stake.png';
import success_stake from '../../../assets/images/success_stake.png';

import { getWeb3 } from '@/app/Utils/getWeb3RPC';
import { ethers } from 'ethers';
import { getTransactionReceiptData } from '../../../Utils/getTransactionReceiptData';
import Config from '@/config.one.json';
import Decimal from 'decimal.js';

const AddPopUpChildren = ({
  setShowPopUp,
  selectedStake,
  showPopUp,
  walletBalance,
  totalSupply,
  rewardRate,
  getAPR,
  address,
  updateValue,
  setUpdateValue,
}) => {
  const [aiusToStake, setAIUSToStake] = useState(0);
  const [estBalance, setEstBalance] = useState(0);
  const [allowance, setAllowance] = useState(0);
  const { writeContract } = useWriteContract();

  const [endDate, setEndDate] = useState(0);
  const [stakedOn, setStakedOn] = useState(0);
  const [totalStaked, setTotalStaked] = useState(0);

  const { data: allowanceData } = useReadContract({
    address: Config.baseTokenAddress,
    abi: baseTokenV1.abi,
    functionName: 'allowance',
    args: [address, Config.votingEscrowAddress],
  });

  useEffect(() => {
    if (allowanceData) {
      setAllowance(Number(allowanceData));
    }
  }, [allowanceData]);

  const handleStake = async () => {
    let amountInDec = new Decimal(aiusToStake);
    let allowanceInDec = new Decimal(allowance);

    //console.log(amountInDec.toString(), allowanceInDec.toString(), 'ALLOWANCE AND AMOUNT before staking');

    if (amountInDec.comparedTo(allowanceInDec) > 0 || allowance === 0) {
      try {
        // @ts-ignore
        setShowPopUp('add/s1');
        // @ts-ignore
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        // @ts-ignore
        const provider = new ethers.providers.Web3Provider(window.ethereum);

        const signer = provider.getSigner();

        const approveContract = new ethers.Contract(
          Config.baseTokenAddress,
          baseTokenV1.abi,
          signer
        );

        const tx1 = await approveContract.approve(
          Config.votingEscrowAddress,
          defaultApproveAmount
        );

        await tx1.wait();

        console.log('First transaction confirmed');

        // @ts-ignore

        const stakeContract = new ethers.Contract(
          Config.votingEscrowAddress,
          votingEscrow.abi,
          signer
        );
        // @ts-ignore
        setShowPopUp('add/s2');

        const tx2 = await stakeContract.increase_amount(
          Number(selectedStake),
          amountInDec.toFixed(0).toString()
        );
        console.log('Second transaction hash:', tx2.hash);
        await tx2.wait(); // Wait for the transaction to be mined
        console.log('Second transaction confirmed');
        // @ts-ignore
        setShowPopUp('add/Success');
        console.log('Both transactions completed successfully');
        getTransactionReceiptData(tx2.hash).then(function () {
          // @ts-ignore
          setUpdateValue((prevValue) => prevValue + 1);

          setTimeout(function(){
            // @ts-ignore
            setShowPopUp(false)
          },3000)
        });
      } catch (error) {
        // @ts-ignore
        console.log(error)
        setShowPopUp('add/Error');
      }
    } else {
      try {
        if (amountInDec) {
          // @ts-ignore
          setShowPopUp('add/2');
          // @ts-ignore
          await window.ethereum.request({ method: 'eth_requestAccounts' });

          // @ts-ignore
          const provider = new ethers.providers.Web3Provider(window.ethereum);

          const signer = provider.getSigner();

          const stakeContract = new ethers.Contract(
            Config.votingEscrowAddress,
            votingEscrow.abi,
            signer
          );
          const tx2 = await stakeContract.increase_amount(
            Number(selectedStake),
            amountInDec.toFixed(0).toString()
          );
          console.log('Second transaction hash:', tx2.hash);
          await tx2.wait(); // Wait for the transaction to be mined
          console.log('Second transaction confirmed');
          // @ts-ignore
          setShowPopUp('add/Success');
          console.log('Both transactions completed successfully');
          getTransactionReceiptData(tx2.hash).then(function () {
            // @ts-ignore
            setUpdateValue((prevValue) => prevValue + 1);

            setTimeout(function(){
              // @ts-ignore
              setShowPopUp(false)
            },3000)
          });
        } else {
          console.log("Please enter the amount and duration to stake!");
        }
      } catch (err) {
        // @ts-ignore
        console.log(err)
        setShowPopUp('add/Error');
      }
    }
  };


  useEffect(() => {
    if (totalStaked && endDate && stakedOn) {
      const t = Number(endDate) - Number(stakedOn);
      const a_b = Number(totalStaked?.amount) + Number(aiusToStake);
      setEstBalance( (a_b * (t / t_max)) / AIUS_wei );
    }
  }, [aiusToStake, totalStaked, endDate, stakedOn]);

  useEffect(() => {
    const f = async () => {
      const web3 = await getWeb3();
      const votingEscrowContract = new web3.eth.Contract(
        votingEscrow.abi,
        Config.votingEscrowAddress
      );
      const baseTokenContract = new web3.eth.Contract(
        baseTokenV1.abi,
        Config.baseTokenAddress
      );

      const _totalStaked = await votingEscrowContract.methods
        .locked(selectedStake)
        .call();
      const _endDate = await votingEscrowContract.methods
        .locked__end(selectedStake)
        .call();
      const _stakedOn = await votingEscrowContract.methods
        .user_point_history__ts(selectedStake, 1)
        .call();

      setTotalStaked(_totalStaked);
      setEndDate(_endDate);
      setStakedOn(_stakedOn);

      const _checkAllowance = await baseTokenContract.methods.allowance(address, Config.votingEscrowAddress).call();
      setAllowance(_checkAllowance);
    };
    if (address) {
      f();
    }
  }, [address]);

  return (
    <>
      <div className={showPopUp == 'add' ? 'block' : 'hidden'}>
        <div className={'my-2 flex items-center justify-between'}>
          <div className='flex items-center justify-start gap-3'>
            <h1>Add AIUS</h1>
          </div>
          <div className='cursor-pointer' onClick={() => setShowPopUp(false)}>
            <Image src={cross_icon} className='h-[10px] w-[10px]' alt='' />
          </div>
        </div>

        <div className='my-4'>
          <div className='flex items-center rounded-3xl border border-[#2F2F2F]'>
            <div className='box-border flex items-center justify-center gap-2 rounded-l-3xl bg-stake-input p-1 px-2'>
              <div className='flex h-[30px] w-[30px] items-center justify-center rounded-[50%] bg-white-background'>
                <Image src={arbius_logo_without_name} width={15} alt='arbius' />
              </div>
              <p className='pr- lato-bold text-[12px] text-aius'>AIUS</p>
            </div>
            <div className='w-[94%] flex items-center'>
              <input
                className='lato-bold w-[100%] rounded-r-3xl border-0 border-none p-1 px-2 text-[15px] outline-none focus:ring-0'
                id='add-amount-input'
                type='number'
                placeholder='0.0'
                //value={amount}
                onChange={(e) => {
                  if((Number(e.target.value) >= 0) && e.target.value != ''){
                    let amountInDec = new Decimal(e.target.value);
                    // @ts-ignore
                    setAIUSToStake(amountInDec.times(AIUS_wei))
                  }else{
                    // @ts-ignore
                    setAIUSToStake(0)
                  }
                }}
              />
              <button className="mr-[10px] px-4 py-[4px] rounded-[30px] text-black-text border-1 border-black bg-stake-input"
                // @ts-ignore
                onClick={(e) => { setAIUSToStake(walletBalance);  document.getElementById("add-amount-input").value = Number(walletBalance / AIUS_wei)?.toFixed(2).toString(); }}
              >Max</button>
            </div>
          </div>
          <h1 className='my-1 text-[0.6rem] opacity-50'>
            Available AIUS {Number(walletBalance / AIUS_wei)?.toFixed(2).toString()}
          </h1>
        </div>
        <div className='flex items-center justify-center gap-2'>
          <div className='w-full rounded-2xl bg-light-purple-background-2 p-3 py-6'>
            <h1 className='text-xs'>
              <span className='text-[20px] text-purple-text'>
                {estBalance?.toFixed(2).toString()}
              </span>{' '}
              veAIUS
            </h1>
            <h1 className='text-[.6rem]'>Est. veAIUS balance</h1>
          </div>
          <div className='w-full rounded-2xl bg-light-purple-background-2 p-3 py-6'>
            <h1 className='text-xs'>
              <span className='text-[20px] text-purple-text'>
                {totalSupply && rewardRate
                  ? getAPR(rewardRate, totalSupply).toFixed(2)
                  : 0}
              </span>
              %
            </h1>
            <h1 className='text-[0.6rem]'>APR</h1>
          </div>
        </div>

        <div className='mt-16 flex justify-end gap-2'>
          <button
            type='button'
            className='group relative flex items-center gap-3 rounded-full bg-light-gray-background px-3 py-1 lg:px-5'
            onClick={() => setShowPopUp(false)}
          >
            <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-5 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
            <div className='lato-bold relative z-10 mb-[1px] text-black-text text-opacity-40 group-hover:text-original-white lg:text-[100%]'>
              Cancel
            </div>
          </button>
          <div className='flex justify-end'>
            <button
              type='button'
              className={`group relative bg-black-background ${Number(walletBalance) >= Number(aiusToStake) ? '' : 'opacity-40'} flex items-center gap-3 rounded-full px-7 py-1`}
              onClick={async() => {
                if (Number(aiusToStake) && Number(walletBalance) >= Number(aiusToStake)) {
                  await handleStake()
                }
              }}
            >
              <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-5 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
              <div className='lato-bold relative z-10 mb-[1px] text-original-white lg:text-[100%]'>
                Add
              </div>
            </button>
          </div>
        </div>
      </div>

      {showPopUp === 'add/2' && (
        <StepTwoChildren
          setShowPopUp={setShowPopUp}
          isError={false}
          noChildren={true}
          repeat={false}
        />
      )}
      {showPopUp === 'add/s1' && (
        <StepOneChildren
          setShowPopUp={setShowPopUp}
          isError={false}
          noChildren={false}
          repeat={false}
          valueStart={0}
          valueEnd={50}
        />
      )}
      {showPopUp === 'add/s2' && (
        <StepTwoChildren12
          setShowPopUp={setShowPopUp}
          isError={false}
          noChildren={false}
          repeat={false}
          valueStart={50}
          valueEnd={100}
        />
      )}
      <div className={showPopUp === 'add/Success' ? 'block' : 'hidden'}>
        <SuccessChildren setShowPopUp={setShowPopUp} />
      </div>
      <div className={showPopUp === 'add/Error' ? 'block' : 'hidden'}>
        <ErrorPopUpChildren setShowPopUp={setShowPopUp} />
      </div>
    </>
  );
};

const ExtendPopUpChildren = ({
  setShowPopUp,
  showPopUp,
  selectedStake,
  address,
  updateValue,
  setUpdateValue,
}) => {
  const [sliderValue, setSliderValue] = useState(0);
  const [duration, setDuration] = useState({
    months: 0,
    weeks: 0,
  });
  //console.log(sliderValue, duration, "SLDURA")
  function getCurrentTimeInMSeconds() {
    const now = new Date();
    return Math.floor(now.getTime());
  }
  const [endDate, setEndDate] = useState(0);

  const [enableExtendButton, setEnableExtendButton] = useState(false);
  //console.log({ selectedStake });

  //console.log(endDate, 'END DATE');
  let currentlyEndingAt = new Date(Number(endDate) * 1000).toLocaleDateString(
    'en-US'
  );

  let currentDate = new Date().toLocaleDateString('en-US');

  const [currentEndDate, setCurrentEndDate] = useState(
    new Date(currentlyEndingAt)
  );
  const [extendStartDate, setExtendStartDate] = useState(new Date(currentDate));

  let datePlus24Months = new Date();
  datePlus24Months.setMonth(datePlus24Months.getMonth() + 24);
  const currentlyEndingDate = new Date(currentlyEndingAt);
  let numberOfMonths =
    (datePlus24Months.getFullYear() - currentlyEndingDate.getFullYear()) * 12 +
    (datePlus24Months.getMonth() - currentlyEndingDate.getMonth());

  const timeDiff = (datePlus24Months - currentlyEndingDate) / (1000 * 60 * 60 * 24);
  let numberOfWeeks = Math.floor(timeDiff / 7);

  if(numberOfMonths === 0){
    numberOfMonths = numberOfWeeks;
  }

  const [extendEndDate, setExtendEndDate] = useState(
    new Date(currentlyEndingAt)
  );

  const handleExtend = async () => {
    try {
      // @ts-ignore
      setShowPopUp('extend/2');
      // @ts-ignore
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      // @ts-ignore
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const votingEscrowContract = new ethers.Contract(
        Config.votingEscrowAddress,
        votingEscrow.abi,
        signer
      );

      const tx = await votingEscrowContract.increase_unlock_time(
        Number(selectedStake),
        parseInt( ( (extendEndDate - getCurrentTimeInMSeconds()) / 1000) + 1000 ).toString(), // value in months(decimal) * 4*7*24*60*60
      );

      console.log('Transaction hash:', tx.hash);
      await tx.wait();
      console.log('Transaction confirmed');
      setShowPopUp('extend/Success');
      getTransactionReceiptData(tx.hash).then(function () {
        setUpdateValue((prevValue) => prevValue + 1);
        
        setTimeout(function(){
          // @ts-ignore
          setShowPopUp(false)
        },3000)
      });
    } catch (error) {
      console.error('Extend error:', error);
      setShowPopUp('extend/Error');
    }
  };


  useEffect(() => {
    const f = async () => {
      const web3 = await getWeb3();
      const votingEscrowContract = new web3.eth.Contract(
        votingEscrow.abi,
        Config.votingEscrowAddress
      );

      const _endDate = await votingEscrowContract.methods
        .locked__end(selectedStake)
        .call();
      let _currentlyEndingAt = new Date(
        Number(_endDate) * 1000
      ).toLocaleDateString('en-US');

      const _stakedOn = await votingEscrowContract.methods
        .user_point_history__ts(selectedStake, 1)
        .call();

      setEndDate(_endDate);
      setCurrentEndDate(new Date(_currentlyEndingAt));
    };
    if (address) {
      f();
    }
  }, [address]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className={showPopUp === 'extend' ? 'w-[100%] block' : 'hidden'}>
        <div className='my-2 flex items-center justify-between'>
          <div className='flex items-center justify-start gap-3'>
            <h1>Extend</h1>
          </div>
          <div className='cursor-pointer' onClick={() => setShowPopUp(false)}>
            <Image src={cross_icon} className='h-[10px] w-[10px]' alt='' />
          </div>
        </div>

        <div className='my-6'>
          <ReactSlider
            className='rounded-2xl border-4 border-b border-[#ECECEC] text-original-white'
            thumbClassName=' w-[28px] h-[28px] ml-[-6px] bg-thumb cursor-pointer rounded-[50%] flex items-center justify-center border-0 mt-[-14px] outline-none'
            markClassName='customSlider-mark'
            marks={4}
            min={0}
            step={0.25}
            max={numberOfMonths}
            defaultValue={0}
            value={sliderValue}
            onChange={(value) => {
              console.log(value, 'Slider on change: VALUE');
              if (value < 1) {
                setDuration({ ...duration, months: 0, weeks: 4 * value });
              } else {
                setDuration({ ...duration, months: value, weeks: 0 });
                // setExtendEndDate(new Date(currentEndDate.getFullYear(), currentEndDate.getMonth() + value, currentEndDate.getDate()))
              }
              let date;
              if (Number.isInteger(value)) {
                date = new Date(
                  currentEndDate?.getFullYear(),
                  currentEndDate?.getMonth() + value,
                  currentEndDate?.getDate()
                );
              } else {
                let additional_day = 1;
                if (value > 0.25) {
                  // Special case for 1 week
                  additional_day = 0;
                }
                date = new Date(
                  currentEndDate?.getFullYear(),
                  currentEndDate?.getMonth(),
                  currentEndDate?.getDate() + 30 * value + additional_day
                );
              }
              const WEEK = 7 * 24 * 60 * 60; // Assuming WEEK is defined in seconds
              const MAXTIME = 2 * 365 * 24 * 60 * 60; // Assuming MAXTIME is 2 years in seconds

              let lockDuration = parseInt(
                (date - getCurrentTimeInMSeconds()) / 1000
              );

              let currentTimestamp = getCurrentTimeInMSeconds() / 1000;
              const unlockTime = Math.floor((currentTimestamp + lockDuration) / WEEK) * WEEK; // Locktime rounded down to weeks
              //console.log(unlockTime, 'UNLOCK TIME and', date);
              date = new Date(unlockTime * 1000);

              if (date <= currentEndDate) {
                setEnableExtendButton(false)
                return;
              }

              if (unlockTime > currentTimestamp + MAXTIME) {
                setEnableExtendButton(false)
                return;
              }

              setEnableExtendButton(true);
              setExtendEndDate(date);
              setSliderValue(value);
            }}
            renderMark={(props) => {
              props.className =
                'customSlider-mark customSlider-mark-before text-[16px] text-start ml-[0px] w-[16.66%]';
              return (
                <span {...props}>
                  <h1>{props.key}</h1>
                </span>
              );
            }}
          />
        </div>
        <div className='mt-20 flex items-center justify-center gap-2'>
          <div className='w-full rounded-md bg-light-purple-background-2 p-3 py-4'>
            {/*console.log(currentEndDate, "EXTSTART")*/}

            <h1 className='text-xs font-semibold text-purple-text'>
              {currentEndDate?.getMonth() + 1}/{currentEndDate?.getDate()}/
              {currentEndDate?.getFullYear()}
            </h1>
            <h1 className='text-[.6rem]'>Current Stake ends at</h1>
          </div>
          <div className='w-full rounded-md bg-light-purple-background-2 p-3 py-4'>
            <h1 className='text-xs font-semibold text-purple-text'>{` ${extendEndDate > 0 ? (extendEndDate?.getMonth() + 1).toString() + '/' + extendEndDate?.getDate().toString() + '/' + extendEndDate?.getFullYear().toString() : '-/-/-'} `}</h1>
            <h1 className='text-[.6rem]'>Stake extended till</h1>
          </div>
        </div>

        <div className='mt-4 flex items-center justify-start gap-3 rounded-xl border-2 p-4'>
          <Image src={info_icon} width={14} height={14} alt='' />
          <h1 className='text-[0.66rem] text-purple-text'>
            A lock duration cannot exceed two years
          </h1>
        </div>

        <div className='mt-4 flex justify-end gap-2'>
          <button
            type='button'
            className='group relative flex items-center gap-3 rounded-full bg-light-gray-background px-3 py-1 lg:px-5'
            onClick={() => setShowPopUp(false)}
          >
            <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-5 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
            <div className='lato-bold relative z-10 text-black-text text-opacity-40 group-hover:text-original-white lg:text-[100%]'>
              Cancel
            </div>
          </button>
          <div className='flex justify-end'>
            <button
              type='button'
              onClick={
                enableExtendButton ? () => {
                  handleExtend()
                } : null
              }
              className={`group relative flex items-center gap-3 rounded-full ${enableExtendButton ? "bg-black-background" : "bg-light-gray-background"} px-3 py-1 lg:px-5`}
            >
              <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-5 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
              <div className={`lato-bold relative z-10 ${enableExtendButton ? "text-original-white" : "text-black-text text-opacity-40"} lg:text-[100%]`}>
                Extend
              </div>
            </button>
          </div>
        </div>
      </div>
      {showPopUp === 'extend/2' && (
        <StepTwoChildren
          setShowPopUp={setShowPopUp}
          isError={false}
          noChildren={true}
          repeat={false}
        />
      )}
      <div className={showPopUp === 'extend/Success' ? 'block' : 'hidden'}>
        <SuccessChildren setShowPopUp={setShowPopUp} />
      </div>
      <div className={showPopUp === 'extend/Error' ? 'block' : 'hidden'}>
        <ErrorPopUpChildren setShowPopUp={setShowPopUp} />
      </div>
    </div>
  );
};

const ClaimPopUpChildren = ({
  setShowPopUp,
  showPopUp,
  selectedStake,
  address,
  updateValue,
  setUpdateValue,
}) => {
  const [earned, setEarned] = useState(0);
  const [realtimeInterval, setRealtimeInterval] = useState(null);

  const handleClaim = async () => {
    try {
      // @ts-ignore
      setShowPopUp('claim/2');
      // @ts-ignore
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      // @ts-ignore
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const veStakingContract = new ethers.Contract(
        Config.veStakingAddress,
        veStaking.abi,
        signer
      );

      const tx = await veStakingContract.getReward(
        Number(selectedStake)
      );

      console.log('Transaction hash:', tx.hash);
      await tx.wait();
      console.log('Transaction confirmed');
      setShowPopUp('claim/Success');
      getTransactionReceiptData(tx.hash).then(function () {
        setUpdateValue((prevValue) => prevValue + 1);

        setTimeout(function(){
          // @ts-ignore
          setShowPopUp(false)
        },3000)
      });
    } catch (error) {
      console.error('Extend error:', error);
      setShowPopUp('claim/Error');
    }
  };



  useEffect(() => {
    const f = async () => {
      const web3 = await getWeb3();
      const veStakingContract = new web3.eth.Contract(
        veStaking.abi,
        Config.veStakingAddress
      );

      const _earned = await veStakingContract.methods
        .earned(selectedStake)
        .call();

      setEarned(_earned);

      const initialBalance = await veStakingContract.methods.balanceOf(selectedStake).call();

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
      //setRateOfIncreasePerSecond(_rateOfIncreasePerSecond);

      let newEarned = _earned;

      let _interval = setInterval(async() => {
          newEarned = Number(newEarned) + Number(_rateOfIncreasePerSecond);
          setEarned(newEarned)
      }, 1000);
      setRealtimeInterval(_interval);
    };
    if (address) {
      f();
    }
  }, [address]);


  return (
    <>
      <div className={showPopUp === 'claim' ? 'block' : 'hidden'}>
        <div className='my-2 flex items-center justify-between'>
          <div className='flex items-center justify-start gap-3'>
            <h1>Claim</h1>
          </div>
          <div className='cursor-pointer' onClick={() => setShowPopUp(false)}>
            <Image src={cross_icon} className='h-[10px] w-[10px]' alt='' />
          </div>
        </div>

        <div className='mt-6 flex items-center justify-center gap-2'>
          <div className='w-full rounded-md bg-light-purple-background-2 p-3 py-6 text-center'>
            <h1 className='text-xs'>
              <span className='text-[30px] font-semibold text-purple-text'>
                {earned ? (Number(earned) / AIUS_wei).toFixed(11).toString() : 0}
              </span>{' '}
              AIUS
            </h1>
            <h1 className='mt-2 text-[.6rem]'>Claimable AIUS</h1>
          </div>
        </div>

        <div className='mt-4 flex items-center justify-start gap-3 rounded-xl border-2 p-4'>
          <Image src={info_icon} width={14} height={14} alt='' />
          <h1 className='text-[0.66rem] text-purple-text'>
            AIUS is claimable directly to your wallet{' '}
          </h1>
        </div>

        <div className='mt-12 flex justify-end gap-2'>
          <button
            type='button'
            className='group relative flex items-center gap-3 rounded-full bg-light-gray-background px-3 py-1 lg:px-5'
            onClick={() => setShowPopUp(false)}
          >
            <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-5 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
            <div className='lato-bold relative z-10 text-black-text text-opacity-40 group-hover:text-original-white lg:text-[100%]'>
              Cancel
            </div>
          </button>

          <div className='flex justify-end'>
            <button
              type='button'
              onClick={() => {
                handleClaim()
              }}
              className='group relative flex items-center gap-3 rounded-full bg-black-background px-3 py-1 lg:px-5'
            >
              <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-5 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
              <div className='lato-bold relative z-10 text-original-white lg:text-[100%]'>
                Claim
              </div>
            </button>
          </div>
        </div>
      </div>
      {showPopUp === 'claim/2' && (
        <StepTwoChildren
          setShowPopUp={setShowPopUp}
          isError={false}
          noChildren={true}
          repeat={false}
        />
      )}
      <div className={showPopUp === 'claim/Success' ? 'block' : 'hidden'}>
        <SuccessChildren setShowPopUp={setShowPopUp} />
      </div>
      <div className={showPopUp === 'claim/Error' ? 'block' : 'hidden'}>
        <ErrorPopUpChildren setShowPopUp={setShowPopUp} />
      </div>
    </>
  );
};

function SlidingCards({
  totalEscrowBalance,
  tokenIDs,
  rewardRate,
  totalSupply,
  walletBalance,
  isLoading,
  updateValue,
  setUpdateValue,
}) {
  const [showPopUp, setShowPopUp] = useState(false);
  const sliderRef = useRef();
  const [direction, setDirection] = useState('');
  const [selectedStake, setSelectedStake] = useState({});
  const [windowWidth, setWindowWidth] = useState(null);

  const { address, isConnected } = useAccount();

  useEffect(() => {
    setWindowWidth(window.innerWidth);
  }, []);

  var settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: tokenIDs?.length > 2 ? (windowWidth > 1800 ? 2.3 : 2.1) : 2,
    slidesToScroll: 1,
    nextArrow: tokenIDs?.length > 2 ? <NextBtn /> : null,
    prevArrow: tokenIDs?.length > 2 ? <PrevBtn /> : null,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: tokenIDs?.length > 1 ? 1.5 : tokenIDs?.length,
          slidesToScroll: 1,
          nextArrow: tokenIDs?.length > 1 ? <NextBtn /> : null,
          prevArrow: tokenIDs?.length > 1 ? <PrevBtn /> : null,
        },
      },
      {
        breakpoint: 475,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          nextArrow: tokenIDs?.length > 1 ? <NextBtn /> : null,
          prevArrow: tokenIDs?.length > 1 ? <PrevBtn /> : null,
        },
      },
    ],
  };

  function PrevBtn(props) {
    const { className, style, onClick } = props;
    if (className.includes('slick-disabled')) {
      setDirection('right');
    }
    return (
      <div
        className={`absolute left-[-22px] top-[40%] z-20 flex h-[45px] w-[45px] cursor-pointer items-center justify-center rounded-full border-2 bg-white-background p-3`}
        onClick={onClick}
      >
        <Image
          src={arrow_prev}
          className='mr-[2px]'
          width={10}
          height={10}
          alt=''
        />
      </div>
    );
  }

  function NextBtn(props) {
    const { className, style, onClick } = props;
    if (className.includes('slick-disabled')) {
      setDirection('left');
    }
    return (
      <div
        className={`absolute right-[-20px] top-[40%] flex h-[45px] w-[45px] cursor-pointer items-center justify-center rounded-full border-2 bg-white-background p-3`}
        onClick={onClick}
      >
        <Image
          src={arrow_prev}
          className='ml-[2px] rotate-180'
          width={10}
          height={10}
          alt=''
        />
      </div>
    );
  }

  useEffect(() => {
    //console.log('direction of movement of cards: ', direction);
    const elements = document.querySelectorAll('.slick-list');
    if (tokenIDs?.length > 2) {
      elements.forEach((element) => {
        if (direction == 'right') {
          element.style.boxShadow = '10px 0 5px -4px rgba(18, 0, 117, 0.077)';
        } else if (direction == 'left') {
          element.style.boxShadow = '-10px 0 5px -4px rgba(18, 0, 117, 0.077)';
        }
      });
    }
  }, [direction]);

  return (
    <div>
      {showPopUp !== false && (
        <>
          <PopUp setShowPopUp={setShowPopUp}>
            {
            showPopUp.startsWith('add') && (
              <AddPopUpChildren
                setShowPopUp={setShowPopUp}
                showPopUp={showPopUp}
                selectedStake={selectedStake}
                walletBalance={walletBalance}
                totalSupply={totalSupply}
                rewardRate={rewardRate}
                getAPR={getAPR}
                setSelectedStake={setSelectedStake}
                address={address}
                updateValue={updateValue}
                setUpdateValue={setUpdateValue}
              />
            )}
            {showPopUp.startsWith('claim') && (
              <ClaimPopUpChildren
                setShowPopUp={setShowPopUp}
                showPopUp={showPopUp}
                selectedStake={selectedStake}
                address={address}
                updateValue={updateValue}
                setUpdateValue={setUpdateValue}
              />
            )}
            {showPopUp.startsWith('extend') && (
              <ExtendPopUpChildren
                setShowPopUp={setShowPopUp}
                showPopUp={showPopUp}
                selectedStake={selectedStake}
                address={address}
                updateValue={updateValue}
                setUpdateValue={setUpdateValue}
              />
            )}
            {showPopUp === 'withdraw/Success' && (
              <SuccessChildren setShowPopUp={setShowPopUp} />
            )}
            {showPopUp === 'withdraw/Error' && (
              <ErrorPopUpChildren setShowPopUp={setShowPopUp} />
            )}
            {showPopUp === 'withdraw/2' && (
              <StepTwoChildren
                setShowPopUp={setShowPopUp}
                isError={false}
                noChildren={true}
                repeat={false}
              />
            )}
          </PopUp>
        </>
      )}
      <div className='relative'>
        <div
          className='relative flex w-full items-center justify-start pl-2'
          ref={sliderRef}
        >
          <Slider {...settings}>
            {tokenIDs?.map((item, key) => (
              <StakeCard
                token={item}
                rewardRate={rewardRate}
                totalSupply={totalSupply}
                getAPR={getAPR}
                key={key}
                setSelectedStake={setSelectedStake}
                setShowPopUp={setShowPopUp}
                updateValue={updateValue}
                setUpdateValue={setUpdateValue}
              />
            ))}
          </Slider>
        </div>
      </div>
    </div>
  );
}
export default SlidingCards;


const StepOneChildren = ({
  setShowPopUp,
  isError,
  noChildren,
  repeat,
  valueStart,
  valueEnd,
}) => {
  return (
    <div>
      <div className='mt-4 flex justify-end'>
        <button className='cursor-pointer' onClick={() => setShowPopUp(false)}>
          <Image src={cross} className='w-[10px]' alt='cross' />
        </button>
      </div>
      <div className='my-12'>
        <div className='flex items-center justify-center'>
          <div className='h-40 w-40'>
            <CircularProgressBar
              valueStart={valueStart}
              valueEnd={valueEnd}
              duration={4}
              text={'1/2'}
              setShowPopUp={setShowPopUp}
              step={1}
              isError={isError}
              noChildren={noChildren}
              repeat={repeat}
            />
          </div>
        </div>
        <h1 className='mt-4 text-center text-[20px] text-original-black'>
          Approve AIUS Spending Limit!
        </h1>
        <h1 className='text-center text-[12px] text-aius-tabs-gray'>
          Confirm this transaction in your wallet.
        </h1>
      </div>

      <div className='flex items-center justify-center'>
        <Image src={powered_by} className='h-4 w-auto' alt='powered_by' />
      </div>
    </div>
  );
};

const StepTwoChildren12 = ({
  setShowPopUp,
  isError,
  noChildren,
  repeat,
  valueStart,
  valueEnd,
}) => {
  return (
    <div>
      <div className='mt-4 flex justify-end'>
        <button className='cursor-pointer' onClick={() => setShowPopUp(false)}>
          <Image src={cross} className='w-[10px]' alt='cross' />
        </button>
      </div>
      <div className='my-12'>
        <div className='flex items-center justify-center'>
          <div className='h-40 w-40'>
            <CircularProgressBar
              valueStart={valueStart}
              valueEnd={valueEnd}
              duration={4}
              text={'2/2'}
              setShowPopUp={setShowPopUp}
              step={2}
              isError={isError}
              noChildren={noChildren}
              repeat={repeat}
            />
          </div>
        </div>
        <h1 className='mt-4 text-center text-[20px] text-original-black'>
          Pending transaction confirmation!
        </h1>
        <h1 className='text-center text-[12px] text-aius-tabs-gray'>
          Confirm this transaction in your wallet.
        </h1>
      </div>

      <div className='flex items-center justify-center'>
        <Image src={powered_by} className='h-4 w-auto' alt='powered_by' />
      </div>
    </div>
  );
};

const StepTwoChildren = ({
  setShowPopUp,
  isError,
  noChildren,
  repeat = true,
}) => {
  return (
    <div>
      <div className='mt-4 flex justify-end'>
        <button className='cursor-pointer' onClick={() => setShowPopUp(false)}>
          <Image src={cross} className='w-[10px]' alt='cross' />
        </button>
      </div>
      <div className='my-12'>
        <div className='flex items-center justify-center'>
          <div className='h-40 w-40'>
            <CircularProgressBar
              valueStart={0}
              valueEnd={100}
              duration={4}
              text={'2/2'}
              setShowPopUp={setShowPopUp}
              step={2}
              isError={isError}
              noChildren={noChildren}
              repeat={true}
            />
          </div>
        </div>
        <h1 className='mt-4 text-center text-[20px] text-original-black'>
          Pending transaction confirmation!
        </h1>
        <h1 className='text-center text-[12px] text-aius-tabs-gray'>
          Confirm this transaction in your wallet.
        </h1>
      </div>

      <div className='flex items-center justify-center'>
        <Image src={powered_by} className='h-4 w-auto' alt='powered_by' />
      </div>
    </div>
  );
};

const SuccessChildren = ({ setShowPopUp }) => {

  return (
    <div>
      <div className='mt-4 flex justify-end'>
        <button className='cursor-pointer' onClick={() => setShowPopUp(false)}>
          <Image src={cross} className='w-[10px]' alt='cross' />
        </button>
      </div>
      <div className='my-12'>
        <div className='flex items-center justify-center'>
          <div className='relative flex h-40 w-40 items-center justify-center rounded-full bg-white-background'>
            <Image src={success_stake} className='w-12' alt='error_stake' />
          </div>
        </div>

        <h1 className='mt-4 text-center text-[20px] text-original-black'>
          Congrats!
        </h1>
        <h1 className='text-center text-[12px] text-aius-tabs-gray'>
          Transaction Completed.
        </h1>
      </div>

      <div className='flex items-center justify-center'>
        <Image src={powered_by} className='h-4 w-auto' alt='powered_by' />
      </div>
    </div>
  );
};

const ErrorPopUpChildren = ({ setShowPopUp }) => {
  return (
    <div>
      <div className='mt-4 flex justify-end'>
        <button className='cursor-pointer' onClick={() => setShowPopUp(false)}>
          <Image src={cross} className='w-[10px]' alt='cross' />
        </button>
      </div>
      <div className='my-12'>
        <div className='flex items-center justify-center'>
          <div className='relative flex h-40 w-40 items-center justify-center rounded-full bg-white-background'>
            <Image src={error_stake} className='w-40' alt='error_stake' />
          </div>
        </div>
        <h1 className='mt-4 text-center text-[20px] text-original-black'>
          Error!
        </h1>
        <h1 className='text-center text-[12px] text-aius-tabs-gray'>
          Please try again.
        </h1>

        <div className='flex items-center justify-center'>
          <button
            onClick={() => setShowPopUp(false)}
            type='button'
            className='group relative mt-2 flex items-center justify-center gap-3 rounded-full bg-black-background px-6 py-1 py-2 lg:px-10'
          >
            <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-4 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
            <div className='lato-bold relative z-10 text-original-white lg:text-[15px]'>
              Continue
            </div>
          </button>
        </div>
      </div>

      <div className='flex items-center justify-center'>
        <Image src={powered_by} className='h-4 w-auto' alt='powered_by' />
      </div>
    </div>
  );
};
