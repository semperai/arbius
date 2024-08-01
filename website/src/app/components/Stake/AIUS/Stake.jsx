"use client"
import React, { useEffect, useState } from "react"
import arbius_logo_without_name from '@/app/assets/images/arbius_logo_without_name.png'
import info_icon from '@/app/assets/images/info_icon_white.png'
import Image from "next/image"
import ReactSlider from 'react-slider'
import Link from "next/link"
import { relative } from "path"
import { BigNumber } from "ethers"
import { getAIUSVotingPower } from "../../../Utils/getAIUSVotingPower"
import { useContractRead , useAccount, useContractWrite, usePrepareContractWrite} from 'wagmi'
import config from "../../../../sepolia_config.json"
import votingEscrow from "../../../abis/votingEscrow.json"
import veStaking from "../../../abis/veStaking.json"

export default function Stake({selectedtab, setSelectedTab, data, isLoading, isError}) {
    const [sliderValue, setSliderValue] = useState(0)
    const {address,isConnected} = useAccount()
    const [totalEscrowBalance, setTotalEscrowBalance] = useState(0)
    const [veAiusBalance, setVeAIUSBalance] = useState(0)
    const [duration, setDuration] = useState({
        months: 0,
        weeks: 0
    })
    const [amount, setAmount] = useState(0)
    const walletBalance = data && !isLoading ? BigNumber.from(data._hex) / 1000000000000000000 : 0;
    const VE_STAKING_ADDRESS = config.veStakingAddress;
    const VOTING_ESCROW_ADDRESS = config.votingEscrowAddress;

    const rewardRate = useContractRead({
        address: VE_STAKING_ADDRESS,
        abi: veStaking.abi,
        functionName: 'rewardRate',
        args: [
            
        ]
    })

    const totalSupply = useContractRead({
        address: VE_STAKING_ADDRESS,
        abi: veStaking.abi,
        functionName: 'totalSupply',
        args: [
            
        ]
    })
    const {data:escrowBalanceData, isLoading: escrowBalanceIsLoading, isError: escrowBalanceIsError} = useContractRead({
        address: VOTING_ESCROW_ADDRESS,
        abi: votingEscrow.abi,
        functionName: 'balanceOf',
        args: [
            address
        ]
    })    

    const getAPR = (rate, supply)=>{
        rate = BigNumber.from(rate).toNumber()
        supply = BigNumber.from(supply).toNumber()
        const rewardPerveAiusPerSecond = rate / supply;
        let apr = rewardPerveAiusPerSecond * 31536000 // reward per second multiplied by seconds in an year
        apr = apr * 100; // APR percentage
        console.log(apr);
        if(apr){
            return apr;
        }
        return 0;
    }

    if(totalEscrowBalance){
        for (let i = 0; i < totalEscrowBalance; i++) {
            const {
                data: tokenIDData,
                isLoading: tokenIDIsLoading,
                isError: tokenIDIsError 
            } = useContractRead({
                address: VOTING_ESCROW_ADDRESS,
                abi: votingEscrow.abi,
                functionName: 'tokenOfOwnerByIndex',
                args: [
                    address,
                    i
                ]
            })
            if(tokenIDData){
                console.log(tokenIDData);
                const {
                    data:veAIUSData,
                    isLoading: veAIUSIsLoading,
                    isError: veAIUSIsError
                } = useContractRead({
                    address: VE_STAKING_ADDRESS,
                    abi: veStaking.abi,
                    functionName: 'balanceOf',
                    args: [
                        BigNumber.from(tokenIDData?._hex).toNumber()
                    ]
                })
                if(veAIUSData){
                    console.log(veAIUSData);
                    setVeAIUSBalance((prev) => prev + BigNumber.from(veAIUSData?._hex).toNumber())
                }
            }

        }

    }
    console.log({totalEscrowBalance});
    console.log({veAiusBalance});
    useEffect(()=>{
        if(escrowBalanceData){
            setTotalEscrowBalance(BigNumber.from(escrowBalanceData?._hex).toNumber())
        }
    },[escrowBalanceData])

    const { config: stakeConfig } = usePrepareContractWrite({
        address: VOTING_ESCROW_ADDRESS,
        abi: votingEscrow.abi,
        functionName: 'create_lock',
        args: [
            amount,
            (duration.months !== 0 ? duration.months * (52 / 12) : duration.weeks)*7*24*60*60,
            address
        ],
        enabled:Boolean(amount),
    });

    const {data:stakeData, error:stakeError, isPending:stakeIsPending, write} = useContractWrite(stakeConfig)

    const handleStake = ()=>{
        console.log({write});
        console.log({stakeData});
        write();
    }

    return (
        <div>
            <div className="bg-white-background 2xl:h-[530px] lg:h-[535px] h-auto stake-box-shadow rounded-2xl px-8 2xl:pt-10 lg:pt-14 pb-8 pt-8 box-border flex flex-col justify-between">
                <div>
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-stake lato-bold text-[18px]">Amount to lock</p>
                            <p className="text-available lato-regular text-[15px]">Available {walletBalance.toString()} AIUS</p>
                        </div>
                        <div>
                            <div className="border border-[#2F2F2F] rounded-3xl flex items-center">
                                <div className="bg-stake-input flex items-center gap-2 justify-center rounded-l-3xl  p-2 box-border">
                                    <div className="bg-white-background w-[30px] h-[30px] rounded-[50%] flex items-center justify-center ">
                                        <Image src={arbius_logo_without_name} width={15} alt="arbius" />
                                    </div>
                                    <p className="pr- text-aius lato-bold text-[15px]">AIUS</p>
                                </div>
                                <div className="w-[94%]">
                                    <input className="w-[100%] border-0 rounded-r-3xl p-2 lato-bold text-[15px] text-black-text border-none focus:ring-0 " id="outline-none" type="number" placeholder="0.0" value={amount} onChange={(e) => setAmount(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className="mt-8 mb-8 text-[15px] lg:text-[20px] lato-bold  text-stake h-12">Locking for {duration.months !== 0 ? `${duration.months} ${duration.months === 1 ? "month" : "months"} ` : `${duration.weeks} ${(duration.weeks <= 1) ? "week" : "weeks"}`} for {getAIUSVotingPower(amount, duration.months !== 0 ? duration.months*(52/12) : ( duration.weeks > 2 ? duration.weeks : 2)).toFixed(2)} AIUS voting power.</p>
                        <div className="mb-10">
                            <div className="mb-8">
                                <ReactSlider
                                    className=" text-original-white border-b border-4 border-[#ECECEC] rounded-2xl"
                                    thumbClassName=" w-[28px] h-[28px] ml-[-5px] bg-thumb cursor-pointer rounded-[50%] flex items-center justify-center border-0 mt-[-14px] outline-none"
                                    markClassName="customSlider-mark"
                                    marks={4}
                                    min={0}
                                    step={.25}
                                    max={24}
                                    defaultValue={0}
                                    value={sliderValue}
                                    onChange={(value) => {
                                        console.log(value);
                                        if (value < 1) {
                                            setDuration({ ...duration, months: 0, weeks: 4 * value })
                                        } else {
                                            setDuration({ ...duration, months: value, weeks: 0 })
                                        }
                                        setSliderValue(value)
                                    }}
                                    renderMark={(props) => {
                                        const isSingleDigit = props.key.toString().length === 1;
                                        props.className = `customSlider-mark customSlider-mark-before text-[16px] text-start w-[16.66%]  ${isSingleDigit ? 'ml-[7px] !important' : 'ml-[0px] !important'}}`;
                                        
                                        return <span {...props}  >
                                            <h1>{props.key}</h1>
                                        </span>;
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between mt-8 ">


                    <div className="bg-apr rounded-2xl w-[48%] py-4 px-4 box-border relative">
                        <div className="right-3 top-3 absolute group cursor-pointer">
                            <Image src={info_icon} width={20} height={20} alt="info" />
                            <div className="absolute hidden group-hover:block right-6 xl:w-[110px] top-0 text-[.7rem] lato-bold bg-white-background text-black-text p-2 rounded-md text-center">
                                2-Year APR Est.

                            </div>

                        </div>
                        <p className="md:text-[16px] text-[12px] lato-regular mb-4 text-original-white">APR</p>
                        <p className="md:text-[28px] text-[16px] lato-bold text-original-white">{totalSupply.data?._hex && rewardRate.data?._hex ? getAPR(rewardRate.data?._hex, totalSupply.data?._hex).toFixed(2) : 0}%</p>
                    </div>
                    <div className="bg-apr rounded-2xl w-[48%] py-4 px-4 box-border relative">
                        <div className="right-3 top-3 absolute group cursor-pointer">
                            <Image src={info_icon} width={20} height={20} alt="info" className="" />
                            <div className="absolute hidden group-hover:block right-6 xl:w-[160px] top-0 text-[.7rem] lato-bold bg-white-background text-black-text p-2 rounded-md text-left">
                                Total veAIUS staked by user

                            </div>

                        </div>
                        <p className="md:text-[16px] text-[12px] lato-regular mb-4 text-original-white">veAIUS Balance</p>
                        <p className="md:text-[28px] text-[16px] lato-bold text-original-white">{veAiusBalance} <span className="md:text-[20px] text-[12px] lato-regular">veAIUS</span></p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mb-4">

                    <div className=' mt-6'>
                        <Link href={"#dashboard"} onClick={() => setSelectedTab("Dashboard")}>
                            <button
                                type="button"

                                className="relative justify-center py-2 group bg-[#F3F3F3] py-1 px-6 lg:px-10 rounded-full flex items-center gap-3 w-full"
                            >
                                <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-4 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="lato-bold  relative z-10  text-black-text group-hover:text-original-white opacity-40 group-hover:opacity-100 lg:text-[15px]">
                                    Manage
                                </div>

                            </button>
                        </Link>

                    </div>
                    <div className=' mt-6'>
                        <button
                            type="button"
                                onClick={()=>{
                                    if(!stakeIsPending && !stakeError){
                                        handleStake()
                                    }
                                }}
                            className="relative justify-center py-2 group bg-black-background py-1 px-6 lg:px-10 rounded-full flex items-center gap-3 w-full"
                        >
                            <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-4 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="lato-bold  relative z-10 text-original-white lg:text-[15px]">
                                Stake
                            </div>

                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}


