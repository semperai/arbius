import React, { useEffect, useState } from 'react'
import { useContractRead, useAccount, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi'
import { BigNumber } from 'ethers'
import baseTokenV1 from "../../../abis/baseTokenV1.json"
// import config from "../../../../sepolia_config.json"
import votingEscrow from "../../../abis/votingEscrow.json"
import veStaking from "../../../abis/veStaking.json"
import Image from "next/image"
import arbius_logo_slider from '@/app/assets/images/arbius_logo_slider.png'
import { AIUS_wei } from "../../../Utils/constantValues";
import Link from "next/link"
import loadConfig from './loadConfig'
import info_icon from '@/app/assets/images/info_icon_white.png'
import Web3 from 'web3';
import { getTransactionReceiptData } from '../../../Utils/getTransactionReceiptData'

function StakeCard({ idx, token, getAPR, rewardRate, totalSupply, setSelectedStake, setShowPopUp, updateValue, setUpdateValue }) {
    //console.log(token, "TOKEN in individual card")
    const { address, isConnected } = useAccount();
    const config = loadConfig();
    const VOTING_ESCROW_ADDRESS = config.votingEscrowAddress;
    const VE_STAKING_ADDRESS = config.veStakingAddress;

    const [totalStaked, setTotalStaked] = useState(token?.locked);
    const [endDate, setEndDate] = useState(token?.locked__end);
    const [stakedOn, setStakedOn] = useState(token?.user_point_history__ts);
    const [initialBalance, setInitialBalance] = useState(token?.initialBalance);
    const [governancePower, setGovernancePower] = useState(token?.balanceOfNFT);
    const [earned, setEarned] = useState(token?.earned);

    /*const { data: totalStaked, isLoading: totalStakedIsLoading, isError: totalStakedIsError } = useContractRead({
        address: VOTING_ESCROW_ADDRESS,
        abi: votingEscrow.abi,
        functionName: 'locked',
        args: [
            Number(tokenID?._hex)
        ],
        enabled: isConnected
    })
    console.log(totalStaked, "ttsake")
    const { data: endDate, isLoading: endDateIsLoading, isError: endDateIsError } = useContractRead({
        address: VOTING_ESCROW_ADDRESS,
        abi: votingEscrow.abi,
        functionName: 'locked__end',
        args: [
            Number(tokenID?._hex)
        ],
        enabled: isConnected
    })
    console.log(Number(endDate?._hex), "endDate")
    const { data: stakedOn, isLoading: stakedOnIsLoading, isError: stakedOnIsError } = useContractRead({
        address: VOTING_ESCROW_ADDRESS,
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
        address: VOTING_ESCROW_ADDRESS,
        abi: votingEscrow.abi,
        functionName: 'balanceOfNFT',
        args: [
            Number(tokenID?._hex)
        ],
        enabled: isConnected
    })

    const { data: initialBalance, isLoading: initialBalanceIsLoading, isError: initialBalanceIsError } = useContractRead({
        address: VE_STAKING_ADDRESS,
        abi: veStaking.abi,
        functionName: 'balanceOf',
        args: [
            Number(tokenID?._hex)
        ],
        enabled: isConnected
    })
    const { data: earned, isLoading: earnedIsLoading, isError: earnedIsError } = useContractRead({
        address: VE_STAKING_ADDRESS,
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
        address: VOTING_ESCROW_ADDRESS,
        abi: votingEscrow.abi,
        functionName: 'withdraw',
        args: [
            Number(token?.tokenID)
        ],
        enabled: Date.now() > (Number(endDate) * 1000)
    });

    const {
        data: withdrawAIUSData,
        isLoading: withdrawAIUSIsLoading,
        isSuccess: withdrawAIUSIsSuccess,
        isError: withdrawAIUSError,
        write: withdrawAIUS
    } = useContractWrite(withdrawAIUSConfig)

    //console.log({ withdrawAIUSData })

    const { data: approveTx, isError: txError, isLoading: txLoading } = useWaitForTransaction({
        hash: withdrawAIUSData?.hash,
        confirmations: 3,
        onSuccess(data) {
            console.log('approve tx successful data ', data);
            setShowPopUp("withdraw/Success")
            getTransactionReceiptData(withdrawAIUSData?.hash).then(function(){
                //window.location.reload(true)
                setUpdateValue(prevValue => prevValue + 1)
            })
        },
        onError(err) {
            console.log('approve tx error data ', err);
            setShowPopUp("withdraw/Error")
        }
    });

    const handleWithdraw = (lockedEndDate)=>{
        console.log(lockedEndDate, Date.now(), "locked end date and current date comparison")
        if(lockedEndDate > Date.now()){
            return 
        }
        console.log(lockedEndDate, "LOCKED END DATE",  "Withdraw")
        
        withdrawAIUS?.()
        setShowPopUp("withdraw/2")
    }

    useEffect(() => {
        if (withdrawAIUSError) {
            setShowPopUp("withdraw/Error")
        }
    }, [withdrawAIUSError])


    // useEffect(() => {
    //     const f = async() => {
    //         const web3 = new Web3(window.ethereum);
    //         const votingEscrowContract = new web3.eth.Contract(votingEscrow.abi, VOTING_ESCROW_ADDRESS);
    //         const veStakingContract = new web3.eth.Contract(veStaking.abi, VE_STAKING_ADDRESS);

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
    

    const openseaLink = process?.env?.NEXT_PUBLIC_AIUS_ENV === "dev" ? "https://testnets.opensea.io/assets/arbitrum-sepolia/" : "https://opensea.io/assets/arbitrum-one/"
    return (
        <div className='rounded-2xl px-8 py-6  bg-white-background relative'>
            <Link href={`${openseaLink}${VOTING_ESCROW_ADDRESS}/${Number(token?.tokenID)}`} target="_blank">
                <Image src={arbius_logo_slider} className='absolute top-2 right-2 w-[36px] h-[36px] z-20 cursor-pointer' alt="" />
            </Link>
            <div className='flex justify-start gap-8 items-start'>
                <div className='flex flex-col gap-3 justify-center items-start'>
                    <div>
                        <h2 className="text-[12px] text-[#8D8D8D] font-semibold">Total Staked</h2>
                        <h2 className='text-[15px] font-semibold'>{totalStaked?.amount ? (Number(totalStaked.amount) / AIUS_wei)?.toFixed(2).toString() : 0} <span className="text-[11px] font-medium">AIUS</span></h2>
                    </div>
                    <div>
                        <h2 className="text-[12px] text-[#8D8D8D] font-semibold">Initial Balance</h2>
                        <h2 className='text-[15px] font-semibold'>{initialBalance ? (Number(initialBalance) / AIUS_wei)?.toFixed(2).toString() : 0} <span className="text-[11px] font-medium">veAIUS</span></h2>
                    </div>
                    <div>
                        <h2 className="text-[12px] text-[#8D8D8D] font-semibold">Staked on</h2>
                        <h2 className='text-[15px] font-semibold'>{new Date(Number(stakedOn) * 1000).toLocaleDateString('en-US')}</h2>
                    </div>
                </div>
                <div className='flex flex-col gap-3 justify-center items-start'>
                    <div>
                        <h2 className="text-[12px] text-[#8D8D8D] font-semibold">Governance Power</h2>
                        <h2 className='text-[15px] font-semibold'>{governancePower ? (Number(governancePower) / AIUS_wei)?.toFixed(2).toString() : 0}</h2>
                    </div>
                    <div>
                        <h2 className="text-[12px] text-[#8D8D8D] font-semibold">Rewards</h2>
                        <h2 className='text-[15px] font-semibold'>{earned ? (Number(earned) / AIUS_wei)?.toFixed(2).toString() : 0} AIUS</h2>
                    </div>
                    <div>
                        <div>
                            <h2 className="text-[12px] text-[#8D8D8D] font-semibold">End Date</h2>
                            <h2 className='text-[15px] font-semibold'>{new Date(Number(endDate) * 1000).toLocaleDateString('en-US')}</h2>
                        </div>
                    </div>

                </div>

            </div>

            {/* <div className='flex justify-start gap-12 items-center mt-3'>

            </div> */}

            <div className='flex justify-between gap-2 items-center mt-4 '>
                {
                    Number(endDate) * 1000 > Date.now() ? (
                        <>
                            <div className='w-[32%]'>
                                <button
                                    type="button"
                                    onClick={() => { setShowPopUp("add"); setSelectedStake(token?.tokenID); }}
                                    className="relative justify-center py-2 group bg-[#F3F3F3] py-1 px-3 lg:px-4 rounded-full flex items-center gap-3 w-full"
                                >
                                    <div className="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-4 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div className="lato-bold  relative z-10  text-black-text group-hover:text-original-white opacity-40 group-hover:opacity-100 lg:text-[15px]">
                                        Add
                                    </div>
                                </button>
                            </div>
                            <div className='w-[32%]'>
                                <button
                                    type="button"
                                    onClick={() => { setShowPopUp("extend"); setSelectedStake(token?.tokenID); }}
                                    className="relative justify-center py-2 group bg-[#F3F3F3] py-1 px-3 lg:px-4 rounded-full flex items-center gap-3 w-full"
                                >
                                    <div className="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-4 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div className="lato-bold  relative z-10  text-black-text group-hover:text-original-white opacity-40 group-hover:opacity-100 lg:text-[15px]">
                                        Extend
                                    </div>
                                </button>
                            </div>
                            <div className='w-[32%]'>
                                <button
                                    type="button"
                                    onClick={() => { setShowPopUp("claim"); setSelectedStake(token?.tokenID); }}
                                    className="relative justify-center py-2 group bg-black-background py-1 px-3 lg:px-4 rounded-full flex items-center gap-3 w-full"
                                >
                                    <div className="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-4 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div className="lato-bold  relative z-10 text-original-white lg:text-[15px]">
                                        Claim
                                    </div>
                                </button>
                            </div></>
                    ) : (
                        <>
                            <div className='w-[30%]'>

                            </div>
                            <div className='w-[30%]'>

                            </div>
                            <div className='w-[40%]'>
                                <button
                                    type="button"
                                    onClick={() => { setSelectedStake(token?.tokenID); handleWithdraw(Number(endDate) * 1000); }}
                                    className="relative justify-center py-2 group bg-black-background py-1 px-3 lg:px-4 rounded-full flex items-center gap-3 w-full"
                                >
                                    <div className="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-4 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div className="lato-bold  relative z-10 text-original-white lg:text-[15px] flex justify-center items-center gap-1">
                                        <h1>Withdraw</h1>
                                        <div className='mt-[1px] group'>
                                            <Image src={info_icon} width={14} height={14} alt="info" />
                                            <div className="absolute  hidden group-hover:block -right-6 bg-white-background stake-box-shadow -top-[58px] xl:w-[160px] text-[.6rem] lato-bold  text-black-text p-2 rounded-md text-left">
                                                Withdrawing includes your rewards automatically.
                                            </div>
                                        </div>
                                    </div>


                                </button>
                            </div>
                        </>
                    )
                }

            </div>
        </div>
    )
}

export default StakeCard