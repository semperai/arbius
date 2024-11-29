'use client';
import React, { useEffect, useState } from 'react';
import arbius_logo_without_name from '@/app/assets/images/arbius_logo_without_name.png';
import info_icon from '@/app/assets/images/info_icon_white.png';
import Image from 'next/image';
import ReactSlider from 'react-slider';
import Link from 'next/link';
import { relative } from 'path';
import { BigNumber } from 'ethers';
import { getAIUSVotingPower } from '../../../Utils/getAIUSVotingPower';
import { getAPR } from '../../../Utils/getAPR';
import {
  useContractRead,
  useAccount,
  useNetwork,
  useContractWrite,
  usePrepareContractWrite,
  useContractReads,
  useWaitForTransaction,
} from 'wagmi';
// import config from "../../../../sepolia_config.json"
import votingEscrow from '../../../abis/votingEscrow.json';
import veStaking from '../../../abis/veStaking.json';
import baseTokenV1 from '../../../abis/baseTokenV1.json';
import { AIUS_wei, defaultApproveAmount, infuraUrl, alchemyUrl } from '../../../Utils/constantValues';
import PopUp from './PopUp';
import CircularProgressBar from './CircularProgressBar';
import powered_by from '../../../assets/images/powered_by.png';
import cross from '../../../assets/images/cross.png';
import error_stake from '../../../assets/images/error_stake.png';
import success_stake from '../../../assets/images/success_stake.png';
import { ethers } from 'ethers';
import Config from '@/config.one.json';
import { getTransactionReceiptData } from '../../../Utils/getTransactionReceiptData';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils'; // or relevant package
import Decimal from 'decimal.js';


type StakeProps = {
  selectedtab: string;
  setSelectedTab: Function;
  data: any;
  isLoading: boolean;
  isError: any;
  updateValue: number;
  setUpdateValue: Function;
};

export default function Stake({
  selectedtab,
  setSelectedTab,
  data,
  isLoading,
  isError,
  updateValue,
  setUpdateValue,
}: StakeProps) {
  const [sliderValue, setSliderValue] = useState(0);
  const { address, isConnected } = useAccount();
  const { chain, chains } = useNetwork()
  //const [totalEscrowBalance, setTotalEscrowBalance] = useState(0)
  const [veAiusBalance, setVeAIUSBalance] = useState(0);
  const [allowance, setAllowance] = useState(0);
  //const [veAIUSBalancesContracts, setVeAIUSBalancesContracts] = useState(null);
  const [duration, setDuration] = useState({
    months: 0,
    weeks: 0,
  });
  const [amount, setAmount] = useState(0);
  //const walletBalance = data && !isLoading ? Number(data._hex) / AIUS_wei : 0;
  const [walletBalance, setWalletBalance] = useState(0);
  const [rewardRate, setRewardRate] = useState(0);
  const [totalSupply, setTotalSupply] = useState(0);
  const [escrowBalanceData, setEscrowBalanceData] = useState(0);

  //console.log(veAiusBalance, allowance, walletBalance, rewardRate, totalSupply, escrowBalanceData, "ALL VALUES IN STAKE COMP")

  const FAUCET_ADDRESS = '0x9a2aef1a0fc09d22f0703decd5bf19dc4214e52a';

  const faucetABI = [
    {
      inputs: [
        { internalType: 'address', name: 'tokenAddress', type: 'address' },
      ],
      stateMutability: 'nonpayable',
      type: 'constructor',
    },
    {
      inputs: [],
      name: 'faucet',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'token',
      outputs: [{ internalType: 'contract IERC20', name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function',
    },
  ];

  const [faucetCalled, setFaucetCalled] = useState(false);
  /*const rewardRate = useContractRead({
    address: Config.v4_veStakingAddress,
    abi: veStaking.abi,
    functionName: 'rewardRate',
    args: [

    ],
    enabled: isConnected
  })

  const totalSupply = useContractRead({
    address: Config.v4_veStakingAddress,
    abi: veStaking.abi,
    functionName: 'totalSupply',
    args: [

    ],
    enabled: isConnected
  })
  const { data: escrowBalanceData, isLoading: escrowBalanceIsLoading, isError: escrowBalanceIsError } = useContractRead({
    address: Config.v4_votingEscrowAddress,
    abi: votingEscrow.abi,
    functionName: 'balanceOf',
    args: [
      address
    ],
    enabled: isConnected
  })

  const { data: tokenIDs, isLoading: tokenIDsIsLoading, isError: tokenIDsIsError } = useContractReads({
    contracts: (totalEscrowBalance) ? new Array(totalEscrowBalance).fill(0).map((i, index) => {
      return {
        address: Config.v4_votingEscrowAddress,
        abi: votingEscrow.abi,
        functionName: 'tokenOfOwnerByIndex',
        args: [
          address,
          index
        ]
      }
    }) : null,
  });*/

  /*useEffect(() => {
    if (tokenIDs && tokenIDs.length > 0 && !tokenIDsIsLoading && !tokenIDsIsError) {
      const contracts = tokenIDs?.map((tokenID) => ({
        address: Config.v4_veStakingAddress,
        abi: veStaking.abi,
        functionName: 'balanceOf',
        args: [
          Number(tokenID?._hex)
        ]
      }));
      setVeAIUSBalancesContracts(contracts);
    }
  }, [tokenIDs, tokenIDsIsLoading, tokenIDsIsError]);

  //console.log(veAIUSBalancesContracts, "stake")
  const { data: veAIUSBalances, isLoading: veAIUSBalancesIsLoading, isError: veAIUSBalancesIsError } = useContractReads({
    contracts: veAIUSBalancesContracts,
  });
  console.log(veAIUSBalances, "Stake data")
  const { data: checkAllowance, isLoading: checkIsLoading, isError: checkIsError, refetch: refetchAllowance } = useContractRead({
    address: Config.v4_baseTokenAddress,
    abi: baseTokenV1.abi,
    functionName: 'allowance',
    args: [
      address,
      Config.v4_votingEscrowAddress,
    ],
    enabled: isConnected
  })
  //console.log(checkAllowance, "TO CHECK ALLOWANCE")
  useEffect(() => {
    console.log(veAIUSBalances, "veAIUSBalances")
    let sum = 0
    veAIUSBalances?.forEach((veAIUSBalance, index) => {
      if (veAIUSBalance) {
        sum = sum + Number(veAIUSBalance?._hex) / AIUS_wei
      }
    })
    setVeAIUSBalance(sum);
  }, [veAIUSBalances])

  console.log(escrowBalanceData, "ESCROW BALANCE DATA")
  useEffect(() => {
    console.log(escrowBalanceData, "escrowBalanceData")
    if (escrowBalanceData) {
      setTotalEscrowBalance(Number(escrowBalanceData?._hex))
    }
  }, [escrowBalanceData])

  useEffect(() => {
    console.log(checkAllowance, "CHECK ALLOWANCE")
    if (checkAllowance) {
      const val = Number(checkAllowance?._hex) / AIUS_wei
      setAllowance(val)
    }
  },[checkAllowance?._hex])

  /*const { config: approveConfig } = usePrepareContractWrite({
    address: Config.v4_baseTokenAddress,
    abi: baseTokenV1.abi,
    functionName: 'approve',
    args: [
      Config.v4_votingEscrowAddress,
      defaultApproveAmount
      //(amount * AIUS_wei).toString()
    ]
  });

  const { data: approveData, error: approveError, isPending: approvePending, write: approveWrite } = useContractWrite(approveConfig)
  console.log({ approveData, approveError, approvePending, allowance });*/

  /*const { config: stakeConfig } = usePrepareContractWrite({
    address: Config.v4_votingEscrowAddress,
    abi: votingEscrow.abi,
    functionName: 'create_lock',
    args: [
      (Number(amount) * AIUS_wei).toString(),
      (duration.months !== 0 ? duration.months * (52 / 12) : duration.weeks) * 7 * 24 * 60 * 60
    ],
    enabled: allowance >= amount,
  });*/
  console.log(allowance, amount, 'ALLOWANCE AND AMOUNT');
  //const {data:stakeData, error:stakeError, isPending:stakeIsPending, write:stakeWrite} = useContractWrite(stakeConfig)
  //console.log({stakeData, stakeError,stakeWrite})

  /*const { data: approveTx, isError: txError, isLoading: txLoading } = useWaitForTransaction({
    hash: approveData?.hash,
    confirmations: 3,
    onSuccess(data) {
      console.log('approve tx successful data ', data);
      setAllowance(Number(defaultApproveAmount) / AIUS_wei);
    },
    onError(err) {
      console.log('approve tx error data ', err);
    }
  });*/

  /*const { data: approveTx2, isError: txError2, isLoading: txLoading2 } = useWaitForTransaction({
    hash: stakeData?.hash,
    confirmations: 3,
    onSuccess(data) {
      console.log('approve tx successful data 2', data);
      setShowPopUp("Success")
      getTransactionReceiptData(stakeData?.hash).then(function(){
        window.location.reload(true)
      })
    },
    onError(err) {
      console.log('approve tx error data 2', err);
      setShowPopUp("Error")
    }
  });*/

  /*useEffect(() => {
    console.log(allowance, amount)
    if(allowance > amount && showPopUp === 1){
      console.log("running")
      setShowPopUp(2)
      console.log("calling stake")
      setTimeout(() => {
        console.log("HEllo")
        stakeWrite()
      },2000)
    }
  },[allowance])*/
  // Use effect to fetch all values

  const getWeb3 = async() => {
    return await fetch(infuraUrl, {
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
            console.error("Infura error:", data.error.message);
            let web3 = new Web3(new Web3.providers.HttpProvider(alchemyUrl));
            return web3
          } else {
            let web3 = new Web3(new Web3.providers.HttpProvider(infuraUrl));
            console.log("Successfully connected. Block number:", data.result);
            return web3
          }
        })
        .catch((err) => {
          console.log("Request failed:", err)
          let web3 = new Web3(new Web3.providers.HttpProvider(alchemyUrl));
          return web3
        });
  }

  useEffect(() => {

    const f1 = async () => {
      try{
        const web3 = await getWeb3()

        const veStakingContract = new web3.eth.Contract(
          veStaking.abi as AbiItem[],
          Config.v4_veStakingAddress
        );

        console.log("calling f1", veStakingContract)
        const _rewardRate = await veStakingContract.methods.rewardRate().call();
        const _totalSupply = await veStakingContract.methods.totalSupply().call();

        console.log(_rewardRate, _totalSupply, "RRTT1")
        setRewardRate(_rewardRate / AIUS_wei);
        setTotalSupply(_totalSupply / AIUS_wei);
      }catch(e){
        console.log("F1 error", e)
      }
    }

    const f = async () => {
      try {
        // TODO move to wagmi&ethers
        // @ts-ignore
        const web3 = new Web3(window.ethereum);
        const votingEscrowContract = new web3.eth.Contract(
          // @ts-ignore
          votingEscrow.abi,
          Config.v4_votingEscrowAddress
        );
        const veStakingContract = new web3.eth.Contract(
          // @ts-ignore
          veStaking.abi,
          Config.v4_veStakingAddress
        );
        const baseTokenContract = new web3.eth.Contract(
          // @ts-ignore
          baseTokenV1.abi,
          Config.v4_baseTokenAddress
        );

        const wBal = await baseTokenContract.methods.balanceOf(address).call();
        setWalletBalance(wBal / AIUS_wei);

        const _escrowBalanceData = await votingEscrowContract.methods
          .balanceOf(address)
          .call();
        setEscrowBalanceData(_escrowBalanceData);

        const _tokenIDs = [];
        for (let i = 0; i < _escrowBalanceData; i++) {
          _tokenIDs.push(
            await votingEscrowContract.methods
              .tokenOfOwnerByIndex(address, i)
              .call()
          );
        }

        let _veAIUSBalance = 0;
        for (let i = 0; i < _tokenIDs.length; i++) {
          _veAIUSBalance =
            _veAIUSBalance +
            (await veStakingContract.methods.balanceOf(_tokenIDs[i]).call()) /
              AIUS_wei;
        }
        setVeAIUSBalance(_veAIUSBalance);

        const _checkAllowance = await baseTokenContract.methods
          .allowance(address, Config.v4_votingEscrowAddress)
          .call();
        setAllowance(_checkAllowance);

        if (localStorage.getItem('faucetCalled')) {
          if (
            // @ts-ignore
            Array.isArray(JSON.parse(localStorage.getItem('faucetCalled'))) &&
            // @ts-ignore
            JSON.parse(localStorage.getItem('faucetCalled')).includes(address)
          ) {
            setFaucetCalled(true);
          } else {
            setFaucetCalled(false);
          }
        } else {
          setFaucetCalled(false);
        }
      } catch (err) {
        console.log(err);
      }
    };

    f1();

    if (address) {
      f();
    }else{
      setDuration({
          months: 0,
          weeks: 0
      })
      setAmount(0)
      setWalletBalance(0)
      setEscrowBalanceData(0)
      setVeAIUSBalance(0)
      setAllowance(0)
    }
  }, [address, chain?.id, updateValue]);

  const handleStake = async () => {
    //console.log({stakeData});
    let amountInDec = new Decimal(amount).times(AIUS_wei);
    let allowanceInDec = new Decimal(allowance);

    console.log(amountInDec.toString(), allowanceInDec.toString(), 'ALLOWANCE AND AMOUNT before staking');

    if (amountInDec.comparedTo(allowanceInDec) > 0 || allowance === 0) {
      /*if(amount && (duration.months || duration.weeks)){
        setShowPopUp(1)
        approveWrite?.()
      }else{
        //alert("Please enter the amount and duration to stake!")
      }*/
      try {
        // TODO why is this sometimes boolean, sometimes number, sometimes string?
        // @ts-ignore
        setShowPopUp(1);
        // Request account access
        // @ts-ignore
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Create a provider
        // @ts-ignore
        const provider = new ethers.providers.Web3Provider(window.ethereum);

        // Get the signer
        const signer = provider.getSigner();

        const approveContract = new ethers.Contract(
          Config.v4_baseTokenAddress,
          baseTokenV1.abi,
          signer
        );

        const tx1 = await approveContract.approve(
          Config.v4_votingEscrowAddress,
          defaultApproveAmount
        );

        await tx1.wait();

        console.log('First transaction confirmed');

        // @ts-ignore
        setShowPopUp(2);

        const stakeContract = new ethers.Contract(
          Config.v4_votingEscrowAddress,
          votingEscrow.abi,
          signer
        );
        
        const durationWeeks = Math.round((duration.months !== 0
              ? duration.months * (52 / 12)
              : duration.weeks) *
              7 *
              24 *
              60 *
              60)

        const tx2 = await stakeContract.create_lock(
          amountInDec.toFixed(0).toString(),
          durationWeeks
        );
        console.log('Second transaction hash:', tx2.hash);
        await tx2.wait(); // Wait for the transaction to be mined
        console.log('Second transaction confirmed');
        // @ts-ignore
        setShowPopUp('Success');
        console.log('Both transactions completed successfully');
        getTransactionReceiptData(tx2.hash).then(function () {
          //window.location.reload(true)
          // @ts-ignore
          setUpdateValue((prevValue) => prevValue + 1);
        });
      } catch (error) {
        console.log(error)
        // @ts-ignore
        setShowPopUp('Error');
      }
    } else {
      try {
        console.log(
          'Second step if allowance is set, values -> : amount, months and weeks',
          amountInDec,
          duration.months,
          duration.weeks
        );
        if (amountInDec && (duration.months || duration.weeks)) {
          // setShowPopUp(2)
          // @ts-ignore
          setShowPopUp(3);
          // @ts-ignore
          await window.ethereum.request({ method: 'eth_requestAccounts' });

          // Create a provider
          // @ts-ignore
          const provider = new ethers.providers.Web3Provider(window.ethereum);

          // Get the signer
          const signer = provider.getSigner();

          const stakeContract = new ethers.Contract(
            Config.v4_votingEscrowAddress,
            votingEscrow.abi,
            signer
          );

          const durationWeeks = Math.round((duration.months !== 0
              ? duration.months * (52 / 12)
              : duration.weeks) *
              7 *
              24 *
              60 *
              60)

          const tx2 = await stakeContract.create_lock(
            amountInDec.toFixed(0).toString(),
            durationWeeks
          );
          console.log('Second transaction hash:', tx2.hash);
          await tx2.wait(); // Wait for the transaction to be mined
          console.log('Second transaction confirmed');
          // @ts-ignore
          setShowPopUp('Success');
          console.log('Both transactions completed successfully');
          getTransactionReceiptData(tx2.hash).then(function () {
            //window.location.reload(true)
            // @ts-ignore
            setUpdateValue((prevValue) => prevValue + 1);
          });
        } else {
          //alert("Please enter the amount and duration to stake!")
        }
      } catch (err) {
        console.log(err)
        // @ts-ignore
        setShowPopUp('Error');
      }
    }
  };

  const getFaucet = async () => {
    /*
    try{
      setShowPopUp(3)
      const web3 = new Web3(window.ethereum);
      const faucetContract = new web3.eth.Contract(faucetABI, FAUCET_ADDRESS);
      const res = await faucetContract.methods.faucet().send({from: address})
      let getFaucetAddresses = localStorage.getItem("faucetCalled")
      if(getFaucetAddresses && Array.isArray(JSON.parse(getFaucetAddresses))){
        getFaucetAddresses = JSON.parse(getFaucetAddresses)
        getFaucetAddresses.push(address)
        localStorage.setItem("faucetCalled", JSON.stringify(getFaucetAddresses))
      }else{
        localStorage.setItem("faucetCalled", JSON.stringify([address]))
      }
      setFaucetCalled(true)
      setShowPopUp("Success")
      setUpdateValue(prevValue => prevValue + 1)
    }catch(err){
      console.log(err);
      setShowPopUp("Error")
      setFaucetCalled(false)
    }
    */
  };

  // console.log({veAIUSBalances})
  const [showPopUp, setShowPopUp] = useState(false);

  return (
    <>
      <div>
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
            {showPopUp === 'Success' && (
              <SuccessChildren setShowPopUp={setShowPopUp} />
            )}
            {/* @ts-ignore */}
            {showPopUp === 'Error' && (
              <ErrorPopUpChildren setShowPopUp={setShowPopUp} />
            )}
          </PopUp>
        )}
        <div className='stake-box-shadow box-border flex h-auto flex-col justify-between rounded-2xl bg-white-background px-8 pb-8 pt-8 lg:pt-14 2xl:pt-10'>
          {/*2xl:h-[530px] lg:h-[535px]*/}
          <div>
            <div>
              <div className='mb-4 flex items-center justify-between'>
                <p className='lato-bold text-[18px] text-stake'>
                  Amount to lock
                </p>
                <p className='lato-regular text-[15px] text-available'>
                  Available {Number(walletBalance)?.toFixed(2).toString()} AIUS
                </p>
              </div>
              <div>
                <div className='flex items-center rounded-3xl border border-[#2F2F2F]'>
                  <div className='box-border flex items-center justify-center gap-2 rounded-l-3xl bg-stake-input p-2'>
                    <div className='flex h-[30px] w-[30px] items-center justify-center rounded-[50%] bg-white-background'>
                      <Image
                        src={arbius_logo_without_name}
                        width={15}
                        alt='arbius'
                      />
                    </div>
                    <p className='pr- lato-bold text-[15px] text-aius'>AIUS</p>
                  </div>
                  <div className='w-[94%] flex items-center'>
                    {/* @ts-ignore */}
                    <input
                      className='lato-bold w-[100%] rounded-r-3xl border-0 border-none p-2 text-[15px] text-black-text focus:ring-0'
                      id='outline-none'
                      type='number'
                      placeholder='0'
                      value={amount}
                      // @ts-ignore
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <button className="mr-[10px] px-4 py-[4px] rounded-[30px] text-black-text border-1 border-black bg-stake-input"
                      // @ts-ignore
                      onClick={(e) => setAmount(walletBalance)}
                    >Max</button>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p className='lato-bold mb-8 mt-8 h-12 text-[15px] text-stake lg:text-[20px]'>
                Locking for{' '}
                {duration.months !== 0
                  ? `${duration.months} ${duration.months === 1 ? 'month' : 'months'} `
                  : `${duration.weeks} ${duration.weeks <= 1 && duration.weeks !== 0 ? 'week' : 'weeks'}`}{' '}
                for{' '}
                {(
                  getAIUSVotingPower(amount * AIUS_wei, sliderValue) / AIUS_wei
                ).toFixed(2)}{' '}
                veAIUS.
              </p>
              <div className='mb-10'>
                <div className='mb-8'>
                  <ReactSlider
                    className='rounded-2xl border-4 border-b border-[#ECECEC] text-original-white'
                    thumbClassName=' w-[28px] h-[28px] ml-[-5px] bg-thumb cursor-pointer rounded-[50%] flex items-center justify-center border-0 mt-[-14px] outline-none'
                    markClassName='customSlider-mark'
                    marks={4}
                    min={0}
                    step={0.25}
                    max={24}
                    defaultValue={0}
                    value={sliderValue}
                    onChange={(value) => {
                      console.log('Slider on change value: ', value);
                      if (value < 1) {
                        setDuration({
                          ...duration,
                          months: 0,
                          weeks: 4 * value,
                        });
                      } else {
                        setDuration({ ...duration, months: value, weeks: 0 });
                      }
                      setSliderValue(value);
                    }}
                    renderMark={(props) => {
                      // @ts-ignore
                      const isSingleDigit = props.key.toString().length === 1;
                      props.className = `customSlider-mark customSlider-mark-before text-[16px] text-start w-[16.66%]  ${isSingleDigit ? '!ml-[4px]' : '!ml-[0px]'}`;
                      return (
                        <span {...props}>
                          <h1>{props.key}</h1>
                        </span>
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className='mt-8 flex items-center justify-between'>
            <div className='relative box-border w-[48%] rounded-2xl bg-apr px-4 py-4'>
              <div className='group absolute right-3 top-3 cursor-pointer'>
                <Image src={info_icon} width={20} height={20} alt='info' />
                <div className='lato-bold absolute right-6 top-0 hidden rounded-md bg-white-background p-2 text-center text-[.7rem] text-black-text group-hover:block xl:w-[110px]'>
                  2-Year APR Est.
                </div>
              </div>
              <p className='lato-regular mb-4 text-[12px] text-original-white md:text-[16px]'>
                APR
              </p>
              <p className='lato-bold text-[16px] text-original-white md:text-[28px]'>
                {totalSupply && rewardRate
                  ? getAPR(rewardRate, totalSupply).toFixed(2)
                  : 0}
                %
              </p>
            </div>
            <div className='relative box-border w-[48%] rounded-2xl bg-apr px-4 py-4'>
              <div className='group absolute right-3 top-3 cursor-pointer'>
                <Image
                  src={info_icon}
                  width={20}
                  height={20}
                  alt='info'
                  className=''
                />
                <div className='lato-bold absolute right-6 top-0 hidden rounded-md bg-white-background p-2 text-left text-[.7rem] text-black-text group-hover:block xl:w-[160px]'>
                  Total veAIUS staked by user
                </div>
              </div>
              <p className='lato-regular mb-4 text-[12px] text-original-white md:text-[16px]'>
                veAIUS Balance
              </p>
              <p className='lato-bold text-[16px] text-original-white md:text-[28px]'>
                {Number(veAiusBalance)?.toFixed(2)}{' '}
                <span className='lato-regular text-[12px] md:text-[20px]'>
                  veAIUS
                </span>
              </p>
            </div>
          </div>

          <div className='mb-4 flex justify-end gap-2'>
            {/*
            <div className='mt-6'>
              <button
                type='button'
                className={`group relative justify-center py-2 ${faucetCalled ? 'hidden bg-light-gray-background' : 'bg-black-background'} flex w-full items-center gap-3 rounded-full px-6 py-1 lg:px-10`}
                onClick={async () => {
                  if (!faucetCalled) {
                    await getFaucet();
                  }
                }}
              >
                <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-4 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                <div
                  className={`lato-bold relative z-10 ${faucetCalled ? 'text-original-black opacity-40' : 'text-original-white opacity-100'} group-hover:text-original-white group-hover:opacity-100 lg:text-[15px]`}
                >
                  AIUS Faucet
                </div>
              </button>
            </div>
            */}
            <div className='mt-6'>
              <Link
                href={'#dashboard'}
                onClick={() => setSelectedTab('Dashboard')}
              >
                <button
                  type='button'
                  className='group relative flex w-full items-center justify-center gap-3 rounded-full bg-light-gray-background px-6 py-1 py-2 lg:px-10'
                >
                  <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-4 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                  <div className='lato-bold relative z-10 text-black-text opacity-40 group-hover:text-original-white group-hover:opacity-100 lg:text-[15px]'>
                    Manage
                  </div>
                </button>
              </Link>
            </div>
            <div className='mt-6'>
              <button
                type='button'
                onClick={async () => {
                  //console.log(amount, walletBalance, duration)
                  if (
                    Number(amount) &&
                    Number(amount) <= Number(walletBalance) &&
                    (duration.months || duration.weeks)
                  ) {
                    await handleStake();
                  }
                }}
                className={`group relative justify-center bg-black-background py-2 ${Number(amount) && Number(amount) <= Number(walletBalance) && (duration.months || duration.weeks) ? '' : 'opacity-40'} flex w-full items-center gap-3 rounded-full px-6 py-1 lg:px-10`}
              >
                <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-4 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                <div className='lato-bold relative z-10 text-original-white lg:text-[15px]'>
                  Stake
                </div>
              </button>
            </div>
          </div>
          {/*
          {!faucetCalled ? (
            <div className='whitespace-nowrap text-center text-[9px] text-black-text'>
              Wallet needs Arbitrum Sepolia ETH to prevent transaction failure.
            </div>
          ) : null}
          */}
        </div>
      </div>
    </>
  );
}

type StepOneChildrenProps = {
  setShowPopUp: Function;
  isError: boolean;
  noChildren: boolean;
  repeat: boolean;
  valueStart: number;
  valueEnd: number;
};

const StepOneChildren = ({
  setShowPopUp,
  isError,
  noChildren,
  repeat,
  valueStart,
  valueEnd,
}: StepOneChildrenProps) => {
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

type StepTwoChildrenProps = {
  setShowPopUp: Function;
  isError: boolean;
  noChildren: boolean;
  repeat: boolean;
  valueStart: number;
  valueEnd: number;
};

const StepTwoChildren = ({
  setShowPopUp,
  isError,
  noChildren,
  repeat,
  valueStart,
  valueEnd,
}: StepTwoChildrenProps) => {
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

type SuccessChildrenProps = {
  setShowPopUp: Function;
};

const SuccessChildren = ({ setShowPopUp }: SuccessChildrenProps) => {
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

type ErrorPopUpChildrenProps = {
  setShowPopUp: Function;
};

const ErrorPopUpChildren = ({ setShowPopUp }: ErrorPopUpChildrenProps) => {
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
