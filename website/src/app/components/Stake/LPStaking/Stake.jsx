import React, { useEffect, useRef } from 'react';
import { useState } from 'react';
import walletImage from '../../../assets/images/ion_wallet-outline.png';
import Image from 'next/image';
import Popup from './Popup';
import HintBox from '../../HintBox/Hintbox';
import { useAccount } from 'wagmi';
import { AIUS_wei, maxApproveAmount } from '@/app/Utils/constantValues';
import { getWeb3Sepolia } from '@/app/Utils/getWeb3RPC';
import PopUp from '@/app/components/Stake/AIUS/PopUp';
import stakingContractABI from '@/app/abis/stakingContractABI';
import univ2ContractABI from '@/app/abis/univ2ContractABI';
import cross from '@/app/assets/images/cross.png';
import Decimal from 'decimal.js';
import CircularProgressBar from '@/app/components/Stake/AIUS/CircularProgressBar';
import powered_by from '@/app/assets/images/powered_by.png';
import error_stake from '@/app/assets/images/error_stake.png';
import success_stake from '@/app/assets/images/success_stake.png';
import { ethers } from 'ethers';
import { getTransactionReceiptData } from '@/app/Utils/getTransactionReceiptData';
import Config from '@/config.eth.json';

function Stake() {
  const { address, isConnected } = useAccount();
  const [currentHoverId, setCurrentHoverId] = useState(null);
  const [data, setData] = useState(null);

  const [showPopUp, setShowPopUp] = useState(false);
  const [amount, setAmount] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [updateValue, setUpdateValue] = useState(0);

  const stakeInput = useRef("");
  const unstakeInput = useRef("");

  const [disableStakeButton, setDisableStakeButton] = useState(true);
  const [disableUnstakeButton, setDisableUnstakeButton] = useState(true);

  const UNIV2_ADDRESS = Config.UNIV2_ADDRESS;
  const StakingAddress = Config.STAKING_REWARD_ADDRESS;
  
  const [earned, setEarned] = useState(0);
  const [realtimeInterval, setRealtimeInterval] = useState(null);
  const [earnedHover, setEarnedHover] = useState(false);

  function convertLargeNumber(numberStr) {
    // Convert the string to a BigInt
    let number = BigInt(0);

    // Divide the large number by 10^20 and convert it to a floating-point number
    let scaledNumber = (Number(number) / 1e20).toFixed(2);

    return scaledNumber;
  }

  function formatNumber(num) {

      if (num > 1) {
          return num.toFixed(0);
      }
      
      if (num === 0) {
          return "0";
      }
      
      const absNum = Math.abs(num);

      if (absNum >= 1) {
          return num.toFixed(2);
      } else if (absNum >= 0.1) {
          return num.toFixed(3);
      } else if (absNum >= 0.01) {
          return num.toFixed(4);
      } else if (absNum >= 0.001) {
          return num.toFixed(5);
      } else if (absNum >= 0.0001) {
          return num.toFixed(6);
      } else if (absNum >= 0.00001) {
          return num.toFixed(7);
      } else {
          return num.toExponential(4);
      }
  }


  function getDaysFromNow(timestamp) {
    const now = Date.now(); // Current timestamp in milliseconds
    const givenDate = timestamp * 1000; // Convert the given timestamp to milliseconds
    if(givenDate < now){
      return 0;
    }
    const differenceInMilliseconds = givenDate - now;
    const days = Math.floor(differenceInMilliseconds / (1000 * 60 * 60 * 24));
    return days;
  }

  useEffect(() => {

    const f = async () => {
      try{
        const web3 = await getWeb3Sepolia();

        const stakingContract = new web3.eth.Contract(
          stakingContractABI,
          StakingAddress
        )

        const _rewardPeriod = await stakingContract.methods.periodFinish().call()

        setData({
          "rewardPeriod": getDaysFromNow(_rewardPeriod)
        })
      }catch(e){
        console.log("F1 error", e)
      }
    }


    const f1 = async () => {
      try{
        const web3 = await getWeb3Sepolia();

        const balanceOfABI = [{
          "constant": true,
          "inputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "name": "balanceOf",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        }]

        const univ2Contract = new web3.eth.Contract(
          univ2ContractABI,
          UNIV2_ADDRESS
        )
        const stakingContract = new web3.eth.Contract(
          stakingContractABI,
          StakingAddress
        )

        const _userUNIV2Balance = await univ2Contract.methods.balanceOf(address).call()
        console.log('## User UNIV2 Balance', _userUNIV2Balance)

        const _stakedBalance = await stakingContract.methods.balanceOf(address).call()
        console.log('## Staked Balance', _stakedBalance)

        const _earned = await stakingContract.methods.earned(address).call()
        console.log('## Earned', _earned)

        const _allowance = await univ2Contract.methods.allowance(address, StakingAddress).call()
        console.log('## Allowance', _allowance)


        const _rewardPeriod = await stakingContract.methods.periodFinish().call()

        setData({
          "userUNIV2Balance": _userUNIV2Balance,
          "stakedBalance": _stakedBalance,
          "claimableRewards": _earned,
          "allowance": _allowance,
          "rewardPeriod": 0 // Set to 0 since program is not running
        })
      }catch(e){
        console.log("F1 error", e)
      }
    }

    console.log("## Address", address)

    if(address){
      f1();

    }else{
      //f();

      setData({
        "userUNIV2Balance": 0,
        "stakedBalance": 0,
        "claimableRewards": 0,
        "allowance": 0,
        "rewardPeriod": 0 // Set to 0 since program is not running
      })
    }
    setAmount(new Decimal(0))
    setWithdrawAmount(new Decimal(0))

  },[address, updateValue])

  const handleStake = async () => {
    // Disabled - staking program not running
    return;
  };

  const handleApprove = async() => {
    // Disabled - staking program not running
    return;
  }

  const setStakeAmount = (e) => {
    // Keep disabled since staking is not available
    setDisableStakeButton(true);
  }

  const setUnstakeAmount = (e) => {
    if(Number(e.target.value)){
      const amountInDec = new Decimal(e.target.value);
      const balanceInDec = new Decimal(data?.stakedBalance);
      const AIUS_wei_InDec = new Decimal(AIUS_wei);
      const amountInWei = amountInDec.mul(AIUS_wei_InDec);

      if(amountInWei.comparedTo(balanceInDec) > 0) {
        setDisableUnstakeButton(true);
      }else{
        setDisableUnstakeButton(false);
      }

      setWithdrawAmount(amountInWei);
    }else{
      setWithdrawAmount(new Decimal(0));
      setDisableUnstakeButton(true);
    }
  }

  const setMaxAmount = () => {
    // Disabled - staking program not running
    return;
  }

  const setMaxUnstakeAmount = () => {
    if(!data?.stakedBalance){
      return;
    }
    const balanceInDec = new Decimal(data?.stakedBalance);
    const AIUS_wei_InDec = new Decimal(AIUS_wei);

    setWithdrawAmount(balanceInDec);
    unstakeInput.current.value = balanceInDec.div(AIUS_wei);

    if(balanceInDec > 0){
      setDisableUnstakeButton(false);
    }
  }

  const handleClaim = async() => {
    if(!address){
      return;
    }

    try {
      setShowPopUp(3);
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const signer = provider.getSigner();

      const stakingContract = new ethers.Contract(
        StakingAddress,
        stakingContractABI,
        signer
      );

      const tx2 = await stakingContract.getReward();
      setShowPopUp(4);
      console.log('transaction hash:', tx2.hash);
      await tx2.wait();
      console.log('transaction confirmed');

      setShowPopUp('Success');
      console.log('transaction completed successfully');
      getTransactionReceiptData(tx2.hash).then(function () {
        setUpdateValue(prev => prev + 1);
      });
    } catch (err) {
      console.log(err)
      setShowPopUp('Error');
    }
  }

  const handleExit = async() => {
    if(!address){
      return;
    }

    try {
      setShowPopUp(3);
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const signer = provider.getSigner();

      const stakingContract = new ethers.Contract(
        StakingAddress,
        stakingContractABI,
        signer
      );

      const tx2 = await stakingContract.exit();
      setShowPopUp(4);
      console.log('transaction hash:', tx2.hash);
      await tx2.wait();
      console.log('transaction confirmed');

      setShowPopUp('Success');
      console.log('transaction completed successfully');
      getTransactionReceiptData(tx2.hash).then(function () {
        setUpdateValue(prev => prev + 1);
      });
    } catch (err) {
      console.log(err)
      setShowPopUp('Error');
    }
  }

  const handleWithdraw = async() => {
    if(!address){
      return;
    }
    try {
      let amountInDec = new Decimal(withdrawAmount);

      setShowPopUp(3);
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const signer = provider.getSigner();

      const stakingContract = new ethers.Contract(
        StakingAddress,
        stakingContractABI,
        signer
      );

      const tx2 = await stakingContract.withdraw(
        amountInDec.toFixed(0).toString()
      );
      setShowPopUp(4);
      console.log('transaction hash:', tx2.hash);
      await tx2.wait();
      console.log('transaction confirmed');

      setShowPopUp('Success');
      console.log('transaction completed successfully');
      getTransactionReceiptData(tx2.hash).then(function () {
        setUpdateValue(prev => prev + 1);
      });
    } catch (err) {
      console.log(err)
      setShowPopUp('Error');
    }
  }

  const handleUnstakeClaim = async() => {
    if(withdrawAmount > 0){
      await handleWithdraw();
    }else{
      await handleExit();
    }
  }


  useEffect(() => {
    const f = async () => {
      try{
        const web3 = await getWeb3Sepolia();

        const stakingContract = new web3.eth.Contract(
          stakingContractABI,
          StakingAddress
        )

        const _earned = await stakingContract.methods.earned(address).call()

        setEarned(_earned);

        // Don't update earned in real-time since rewards program is not running
        if (realtimeInterval) {
            clearInterval(realtimeInterval);
        }
      }catch(err){
        console.log(err, "ERR in interval")
      }
    };
    if (address) {
      f();
    }
  }, [address, updateValue]);


  return (
    <>
      {showPopUp !== false && (
        <PopUp setShowPopUp={setShowPopUp}>
          {/* TODO fix showPopUp types*/}
          {/* @ts-ignore */}
          {showPopUp === 1 && (
            <StepOneChildren
              setShowPopUp={setShowPopUp}
              isError={false}
              noChildren={false}
              repeat={false}
              valueStart={0}
              valueEnd={50}
            />
          )}
          {/* @ts-ignore */}
          {showPopUp === 2 && (
            <StepTwoChildren
              setShowPopUp={setShowPopUp}
              isError={false}
              noChildren={false}
              repeat={false}
              valueStart={50}
              valueEnd={100}
            />
          )}
          {/* @ts-ignore */}
          {showPopUp === 3 && (
            <StepTwoChildren
              setShowPopUp={setShowPopUp}
              isError={false}
              noChildren={true}
              repeat={true}
              valueStart={0}
              valueEnd={100}
            />
          )}
          {/* @ts-ignore */}
          {showPopUp === 4 && (
            <StepWaitChildren
              setShowPopUp={setShowPopUp}
              isError={false}
              noChildren={true}
              repeat={true}
              valueStart={0}
              valueEnd={100}
            />
          )}
          {/* @ts-ignore */}
          {showPopUp === 'Success' && (
            <SuccessChildren setShowPopUp={setShowPopUp} />
          )}
          {/* @ts-ignore */}
          {showPopUp === 'Error' && (
            <ErrorPopUpChildren setShowPopUp={setShowPopUp} />
          )}
        </PopUp>
      )}
      <div className='m-[auto] grid w-mobile-section-width max-w-center-width grid-cols-1 gap-8 pt-4 pb-4 um:pb-8 um:pt-8 lg:w-section-width lg:grid-cols-2'>
        {true ? (
          <>
            <div className='stake-card flex h-[auto] flex-col justify-between rounded-2xl bg-white-background p-4 um:p-6 lg:p-10 opacity-60'>
              <div>
                <h1 className='text-[15px] font-medium text-[#4A28FF] lg:text-[20px]'>
                  Stake
                </h1>
                
                {/* Program Not Running Notice */}
                <div className='mt-4 p-3 bg-[#FFF3CD] border border-[#FFEAA7] rounded-lg'>
                  <p className='text-[12px] text-[#856404] font-medium'>
                    LP Staking program is currently not running
                  </p>
                </div>
                
                <div className='um:mt-6 flex items-end justify-between gap-6'>
                  <div className='mt-1 um:mt-6 max-h-[150px] w-1/2 rounded-[10px] lp-stake-bg-gradient px-2 um:px-6 py-4 shadow-none transition-all hover:shadow-stats whitespace-nowrap'>
                    <div className='flex items-baseline justify-start'>
                      <h1 className='text-[18px] um:text-[25px] font-medium text-purple-text'>
                        { data?.userUNIV2Balance ?
                            formatNumber(Number(data?.userUNIV2Balance / AIUS_wei))
                          : 0
                        }
                      </h1>
                      <p className='ml-2 text-[11px] um:text-[14px] text-black-text'>Uni-V2</p>
                    </div>
                    <h1 className='text-[8px] font-medium text-black-text lg:text-[13px]'>
                      Wallet Balance
                    </h1>
                  </div>

                  <div className='mt-1 um:mt-6 flex max-h-[150px] w-1/2 flex-col justify-center rounded-[10px] lp-stake-bg-gradient px-2 um:px-6 py-4 text-[#101010] shadow-none transition-all hover:cursor-pointer hover:shadow-stats whitespace-nowrap'>
                    <div
                      className='flex items-baseline justify-start'
                      id='RewardsPeriod'
                    >
                      <h1 className='text-[18px] um:text-[25px] font-medium text-purple-text'>
                        0
                      </h1>
                      <p className='ml-2 text-[11px] um:text-[14px] text-black-text'>Days</p>
                    </div>

                    <h1 className='text-[8px] font-medium text-black-text lg:text-[13px]'>
                      Rewards Period
                    </h1>
                  </div>
                </div>
                <div className='mt-4 um:mt-6 flex w-[100%] justify-center rounded-[25px] text-[#101010] opacity-50'>
                  <div className='flex w-[25%] items-center justify-center gap-2 rounded-l-[25px] rounded-r-none border-[1px] border-l-0 bg-[#E6DFFF] py-1 um:py-2 px-2 lg:gap-2 lg:p-3'>
                    <h1 className='text-[10px] font-medium lg:text-[14px]'>
                      UNI-V2
                    </h1>
                  </div>
                  <div className='flex w-[75%] flex-row justify-between rounded-l-none rounded-r-[25px] border-[1.5px] border-l-0 bg-original-white py-1 um:py-2 px-2 focus:outline-none lg:p-3'>
                    <div className='flex w-[80%] py-1 um:py-0 um:block'>
                      <input
                        ref={stakeInput}
                        className='w-[100%] bg-original-white text-[11px] um:text-[13px] italic outline-none cursor-not-allowed'
                        placeholder='Staking is currently unavailable'
                        disabled
                      />
                    </div>
                    <div className='flex items-center rounded-full px-3 py-[1px] text-original-white opacity-50 cursor-not-allowed'>
                      <p className='um:pb-[2px] text-[9px] lg:text-[13px]'>max</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className='mt-3 um:mt-4 flex items-center justify-end gap-4 text-[#101010] md:mb-0'>
                <button
                  type='button'
                  className='group relative flex items-center gap-3 rounded-full bg-[#121212] px-8 py-2 opacity-40 cursor-not-allowed'
                  disabled
                >
                  <p className='relative z-10 text-[15px] text-original-white'>
                    Stake
                  </p>
                </button>
              </div>
            </div>

            <div className='stake-card flex h-[auto] flex-col justify-between rounded-2xl bg-white-background p-4 um:p-6 lg:p-10'>
              <div>
                <h1 className='text-[15px] font-medium text-[#4A28FF] lg:text-[20px]'>
                  Unstake
                </h1>
                
                {/* You can still unstake notice */}
                <div className='mt-4 p-3 bg-[#D4EDDA] border border-[#C3E6CB] rounded-lg'>
                  <p className='text-[12px] text-[#155724] font-medium'>
                    You can still unstake your tokens
                  </p>
                </div>
                
                <div className='um:mt-6 flex items-end justify-start gap-6 text-[#101010]'>
                  <div className='mt-2 um:mt-6 flex max-h-[150px] w-1/2 flex-col justify-center rounded-[10px] lp-stake-bg-gradient px-2 um:px-6 py-4 text-[#101010] shadow-none transition-all hover:cursor-pointer hover:shadow-stats whitespace-nowrap'>
                    <div
                      id='unstakeBalance'
                      className='flex items-baseline justify-start'
                    >
                      <h1 className='text-[18px] um:text-[25px] font-medium text-purple-text'>
                        { data?.stakedBalance ?
                            formatNumber(Number(data?.stakedBalance / AIUS_wei))
                          : 0
                        }
                        &nbsp;
                      </h1>
                      <p className='text-[11px] um:text-[14px] text-black-text'>Uni-V2</p>
                    </div>
                    <h1 className='text-[8px] font-medium lg:text-[13px]'>
                      Staked
                    </h1>
                  </div>

                  <div className='mt-2 um:mt-6 flex max-h-[150px] w-1/2 flex-col justify-center rounded-[10px] lp-stake-bg-gradient px-2 um:px-6 py-4 text-[#101010] shadow-none transition-all hover:cursor-pointer hover:shadow-stats whitespace-nowrap'
                    onMouseEnter={() => setEarnedHover(true)}
                    onMouseLeave={() => setEarnedHover(false)}
                  >
                    <div
                      id='claimableRewards'
                      className='flex items-baseline justify-start'
                    >
                      <h1 className={`${earnedHover ? "text-[13px] mt-[18px]" : "text-[18px] um:text-[25px]"} font-medium text-purple-text`}>
                        {
                          earned && earnedHover ?
                            Number(earned / AIUS_wei).toFixed(11)
                          : earned ?
                            Number(earned / AIUS_wei).toFixed(3)
                          : 0
                        }
                        &nbsp;
                      </h1>
                      <p className='text-[11px] um:text-[14px]'>AIUS</p>
                    </div>
                    <h1 className='text-[8px] font-medium text-[#101010] lg:text-[13px]'>
                      Claimable Rewards
                    </h1>
                  </div>
                </div>

                <hr className='opacity-10' />

                <div className='mt-4 um:mt-6 flex w-[100%] justify-center rounded-[25px] text-[#101010]'>
                  <div className='flex w-[25%] items-center justify-center gap-2 rounded-l-[25px] rounded-r-none border-[1px] border-l-0 bg-[#E6DFFF] py-1 um:py-2 px-2 lg:gap-2 lg:p-3'>
                    <h1 className='text-[10px] font-medium lg:text-[14px]'>
                      UNI-V2
                    </h1>
                  </div>
                  <div className='flex w-[75%] flex-row justify-between rounded-l-none rounded-r-[25px] border-[1.5px] border-l-0 bg-original-white py-1 um:py-2 px-2 focus:outline-none lg:p-3'>
                    <div className='flex w-[80%] py-1 um:py-0 um:block'>
                      <input
                        ref={unstakeInput}
                        className='w-[100%] bg-original-white text-[11px] um:text-[13px] italic outline-none'
                        placeholder='Amount of UNI-V2 to unstake'
                        onChange={(e) => setUnstakeAmount(e)}
                      />
                    </div>
                    <div className='maxButtonHover flex items-center rounded-full px-3 py-[1px] text-original-white'
                    onClick={setMaxUnstakeAmount}
                    >
                      <p className='um:pb-[2px] text-[9px] lg:text-[13px]'>max</p>
                    </div>
                  </div>
                </div>


                <div className='mt-3 um:mt-6 flex items-center justify-end gap-4'>
                  <button
                    type='button'
                    className='group relative flex items-center justify-center gap-3 rounded-full bg-[#121212] px-8 py-2'
                    onClick={() => handleClaim()}
                  >
                    <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full px-8 py-2 opacity-0 transition-opacity duration-500 bg-buy-hover group-hover:opacity-100'></div>
                    <p className='relative z-10 mb-[1px] text-[15px] text-original-white'>
                      Claim
                    </p>
                  </button>
                  <button
                    type='button'
                    className={`${disableUnstakeButton ? "opacity-10" : ""} group relative flex items-center justify-center gap-3 rounded-full bg-[#121212] px-4 um:px-8 py-2`}
                    onClick={ disableUnstakeButton ? null : handleUnstakeClaim}
                  >
                    <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-8 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                    <p className={`relative z-10 mb-[1px] text-[15px] text-original-white ${disableUnstakeButton ? "opacity-90": ""}`}>
                      Unstake
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className='stake-card flex h-[350px] flex-col justify-between rounded-2xl bg-white-background p-6 lg:h-[auto] lg:p-10'>
              <div>
                <h1 className='text-[15px] font-medium lg:text-[20px]'>
                  Stake
                </h1>
                <p className='mt-6 text-[11px] lg:text-para'>
                  Please connect a wallet to interact with this pool!
                </p>
              </div>

              <div className='flex items-center justify-center lg:mb-16 lg:mt-16'>
                <div className='relative h-[100px] w-[100px] lg:h-[100px] lg:w-[100px]'>
                  <Image src={walletImage} alt="" />
                </div>
              </div>
              <div className='flex justify-center lg:justify-end'>
                <button
                  type='button'
                  className='group relative flex w-[100%] items-center gap-3 rounded-full bg-black-background px-8 py-2 lg:w-[auto]'
                  onClick={() => connectWallet()}
                >
                  <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-8 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                  <p className='relative z-10 mb-1 w-[100%] text-original-white lg:w-[auto]'>
                    Connect Wallet
                  </p>
                </button>
              </div>
            </div>

            <div className='stake-card flex h-[350px] flex-col justify-between rounded-2xl bg-white-background p-6 lg:h-[auto] lg:p-10'>
              <div>
                <h1 className='text-[15px] font-medium lg:text-[20px]'>
                  Unstake
                </h1>
                <p className='mt-6 text-[11px] lg:text-para'>
                  Please connect a wallet to interact with this pool!
                </p>
              </div>

              <div className='flex items-center justify-center lg:mb-16 lg:mt-16'>
                <div className='relative h-[100px] w-[100px] lg:h-[100px] lg:w-[100px]'>
                  <Image src={walletImage} alt="" />
                </div>
              </div>
              <div className='flex justify-center lg:justify-end'>
                <button
                  type='button'
                  className='group relative flex w-[100%] items-center gap-3 rounded-full bg-black-background px-8 py-2 lg:w-[auto]'
                  onClick={() => connectWallet()}
                >
                  <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-8 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                  <p className='relative z-10 mb-1 w-[100%] text-original-white lg:w-[auto]'>
                    Connect Wallet
                  </p>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default Stake;


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

const StepTwoChildren = ({
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

const StepWaitChildren = ({
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
          Finalizing Your Transaction...
        </h1>
        <h1 className='text-center text-[12px] text-aius-tabs-gray'>
          Waiting for on-chain confirmation. This should only take a few seconds.
        </h1>
      </div>

      <div className='flex items-center justify-center'>
        <Image src={powered_by} className='h-4 w-auto' alt='powered_by' />
      </div>
    </div>
  );
};


const SuccessChildren = ({ setShowPopUp }) => {

  useEffect(()=>{
    setTimeout(function(){
      setShowPopUp(false)
    },3000)
  },[])

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
            <Image src={error_stake} className='w-12' alt='error_stake' />
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
