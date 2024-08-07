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
import { getAPR } from "../../../Utils/getAPR"
import { useContractRead , useAccount, useContractWrite, usePrepareContractWrite, useContractReads, useWaitForTransaction} from 'wagmi'
import config from "../../../../sepolia_config.json"
import votingEscrow from "../../../abis/votingEscrow.json"
import veStaking from "../../../abis/veStaking.json"
import baseTokenV1 from "../../../abis/baseTokenV1.json"
import { AIUS_wei, defaultApproveAmount } from "../../../Utils/constantValues";
import PopUp from "./PopUp"
import CircularProgressBar from "./CircularProgressBar"
import powered_by from "../../../assets/images/powered_by.png"
import cross from "../../../assets/images/cross.png"
import error_stake from "../../../assets/images/error_stake.png"
import success_stake from "../../../assets/images/success_stake.png"
export default function Stake({ selectedtab, setSelectedTab, data, isLoading, isError }) {
    const [sliderValue, setSliderValue] = useState(0)
    const { address, isConnected } = useAccount()
    const [totalEscrowBalance, setTotalEscrowBalance] = useState(0)
    const [veAiusBalance, setVeAIUSBalance] = useState(0)
    const [allowance, setAllowance] = useState(0)
    const [veAIUSBalancesContracts, setVeAIUSBalancesContracts] = useState(null);

    const [duration, setDuration] = useState({
        months: 0,
        weeks: 0
    })
    const [amount, setAmount] = useState(0)
    const walletBalance = data && !isLoading ? Number(data._hex) / AIUS_wei : 0;

    const VE_STAKING_ADDRESS = config.veStakingAddress;
    const VOTING_ESCROW_ADDRESS = config.votingEscrowAddress;
    const BASETOKEN_ADDRESS_V1 = config.v2_baseTokenAddress;

    const rewardRate = useContractRead({
        address: VE_STAKING_ADDRESS,
        abi: veStaking.abi,
        functionName: 'rewardRate',
        args: [

        ],
        enabled: isConnected
    })

    const totalSupply = useContractRead({
        address: VE_STAKING_ADDRESS,
        abi: veStaking.abi,
        functionName: 'totalSupply',
        args: [

        ],
        enabled: isConnected
    })
    const { data: escrowBalanceData, isLoading: escrowBalanceIsLoading, isError: escrowBalanceIsError } = useContractRead({
        address: VOTING_ESCROW_ADDRESS,
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
                address: VOTING_ESCROW_ADDRESS,
                abi: votingEscrow.abi,
                functionName: 'tokenOfOwnerByIndex',
                args: [
                    address,
                    index
                ]
            }
        }) : null,
    });

    useEffect(() => {
        if (tokenIDs && tokenIDs.length > 0 && !tokenIDsIsLoading && !tokenIDsIsError) {
            const contracts = tokenIDs?.map((tokenID) => ({
                address: VE_STAKING_ADDRESS,
                abi: veStaking.abi,
                functionName: 'balanceOf',
                args: [
                    Number(tokenID?._hex)
                ]
            }));
            setVeAIUSBalancesContracts(contracts);
        }
    }, [tokenIDs, tokenIDsIsLoading, tokenIDsIsError]);

    console.log(veAIUSBalancesContracts, "BALANCE CONTRACTS")
    const { data: veAIUSBalances, isLoading: veAIUSBalancesIsLoading, isError: veAIUSBalancesIsError } = useContractReads({
        contracts: veAIUSBalancesContracts,
    });
    console.log(veAIUSBalances, "BALANCES")
    const { data: checkAllowance, isLoading: checkIsLoading, isError: checkIsError, refetch: refetchAllowance } = useContractRead({
        address: BASETOKEN_ADDRESS_V1,
        abi: baseTokenV1.abi,
        functionName: 'allowance',
        args: [
            address,
            VOTING_ESCROW_ADDRESS
        ],
        enabled: isConnected
    })
    console.log(checkAllowance, "TO CHECK")
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

    console.log(escrowBalanceData, "ESCROW _ B")
    useEffect(() => {
        console.log(escrowBalanceData, "escrowBalanceData")
        if (escrowBalanceData) {
            setTotalEscrowBalance(Number(escrowBalanceData?._hex))
        }
    }, [escrowBalanceData])

    useEffect(() => {
        console.log(checkAllowance, "CHECK ALLOW")
        if (checkAllowance) {
            const val = Number(checkAllowance?._hex) / AIUS_wei
            setAllowance(val)
        }
    },[checkAllowance?._hex])

    const { config: approveConfig } = usePrepareContractWrite({
        address: BASETOKEN_ADDRESS_V1,
        abi: baseTokenV1.abi,
        functionName: 'approve',
        args: [
            VOTING_ESCROW_ADDRESS,
            defaultApproveAmount
            //(amount * AIUS_wei).toString()
        ]
    });

    const { data: approveData, error: approveError, isPending: approvePending, write: approveWrite } = useContractWrite(approveConfig)
    console.log({ approveData, approveError, approvePending, allowance });

    const { config: stakeConfig } = usePrepareContractWrite({
        address: VOTING_ESCROW_ADDRESS,
        abi: votingEscrow.abi,
        functionName: 'create_lock',
        args: [
            (amount * AIUS_wei).toString(),
            (duration.months !== 0 ? duration.months * (52 / 12) : duration.weeks) * 7 * 24 * 60 * 60
        ],
        enabled: allowance >= amount,
    },[allowance]);

    const {data:stakeData, error:stakeError, isPending:stakeIsPending, write:stakeWrite} = useContractWrite(stakeConfig)
    console.log({stakeData, stakeError,stakeWrite})

    const { data: approveTx, isError: txError, isLoading: txLoading } = useWaitForTransaction({
        hash: approveData?.hash,
        confirmations: 3,
        onSuccess(data) {
            console.log('approve tx successful data ', data);
            setAllowance(Number(defaultApproveAmount) / AIUS_wei);
        },
        onError(err) {
            console.log('approve tx error data ', err);
        }
    });

    const { data: approveTx2, isError: txError2, isLoading: txLoading2 } = useWaitForTransaction({
        hash: stakeData?.hash,
        confirmations: 3,
        onSuccess(data) {
            console.log('approve tx successful data 2', data);
            setShowPopUp("Success")
        },
        onError(err) {
            console.log('approve tx error data 2', err);
            setShowPopUp("Error")
        }
    });

    useEffect(() => {
        console.log(allowance, amount)
        if(allowance > amount && showPopUp === 1){
            console.log("running")
            setShowPopUp(2)
            stakeWrite()
        }
    },[allowance])

    const handleStake = async()=>{
        console.log({stakeData});
        console.log({approveData});
        console.log(amount, allowance, "AMT-ALL");

        if(amount > allowance || allowance === 0){
            if(amount && (duration.months || duration.weeks)){
                setShowPopUp(1)
                approveWrite?.()
            }else{
                //alert("Please enter the amount and duration to stake!")
            }
        }else{
            if(amount && (duration.months || duration.weeks)){
                setShowPopUp(2)
                stakeWrite?.();
            }else{
                //alert("Please enter the amount and duration to stake!")
            }
        }
    }
    // console.log({veAIUSBalances})
    const [showPopUp, setShowPopUp] = useState(false)

    return (
        <>
        <div>
            {
                showPopUp !== false && (
                    <PopUp setShowPopUp={setShowPopUp}>
                        {showPopUp === 1 && <StepOneChildren setShowPopUp={setShowPopUp} isError={approveError || stakeError} />}
                        {showPopUp === 2 && <StepTwoChildren setShowPopUp={setShowPopUp} isError={approveError || stakeError} />}
                        {showPopUp === "Success" && <SuccessChildren setShowPopUp={setShowPopUp} />}
                        {showPopUp === "Error" && <ErrorPopUpChildren setShowPopUp={setShowPopUp} />}
                    </PopUp>
                )
            }
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
                                    <input className="w-[100%] border-0 rounded-r-3xl p-2 lato-bold text-[15px] text-black-text border-none focus:ring-0 " id="outline-none" type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className="mt-8 mb-8 text-[15px] lg:text-[20px] lato-bold  text-stake h-12">Locking for {duration.months !== 0 ? `${duration.months} ${duration.months === 1 ? "month" : "months"} ` : `${duration.weeks} ${(duration.weeks <= 1) ? "week" : "weeks"}`} for {(getAIUSVotingPower(amount * AIUS_wei, sliderValue) / AIUS_wei).toFixed(2)} AIUS voting power.</p>
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
                                        props.className = `customSlider-mark customSlider-mark-before text-[16px] text-start w-[16.66%]  ${isSingleDigit ? '!ml-[4px]' : '!ml-[0px]'}`;

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
                        <p className="md:text-[28px] text-[16px] lato-bold text-original-white">{veAiusBalance?.toFixed(2)} <span className="md:text-[20px] text-[12px] lato-regular">veAIUS</span></p>
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
                                onClick={async()=>{
                                    if(!stakeIsPending && !stakeError){
                                        if(amount && (duration.months || duration.weeks)){
                                            await handleStake()
                                        }
                                    }
                                }}
                            className={`relative justify-center py-2 group bg-black-background ${amount && (duration.months || duration.weeks) ? "" : "opacity-40" } py-1 px-6 lg:px-10 rounded-full flex items-center gap-3 w-full`}
                        >
                            <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-4 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="lato-bold relative z-10 text-original-white lg:text-[15px]">
                                Stake
                            </div>

                        </button>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}


const StepOneChildren = ({ setShowPopUp, isError }) => {
    return (
        <div>
            <div className="flex justify-end mt-4">
                <button className="cursor-pointer" onClick={() => setShowPopUp(false)}>
                    <Image src={cross} className="w-[10px]" alt="cross" />
                </button>

            </div>
            <div className="my-12">

                <div className="flex justify-center items-center">
                    <div className="w-40 h-40">
                        <CircularProgressBar valueStart={0} valueEnd={100} duration={4} text={"1/2"} setShowPopUp={setShowPopUp} step={1} isError={isError} />
                    </div>

                </div>
                <h1 className="text-[20px] mt-4 text-[#000] text-center">Approve AIUS Spending Limit!</h1>
                <h1 className="text-[12px] text-[#8C8C8C] text-center">Confirm this transaction in your wallet.</h1>


            </div>

            <div className="flex justify-center items-center">
                <Image src={powered_by} className="w-auto h-4" alt="powered_by" />
            </div>
        </div>

    )
}
const StepTwoChildren = ({ setShowPopUp, isError }) => {
    return (
        <div>
            <div className="flex justify-end mt-4">
                <button className="cursor-pointer" onClick={() => setShowPopUp(false)}>
                    <Image src={cross} className="w-[10px]" alt="cross" />
                </button>

            </div>
            <div className="my-12">

                <div className="flex justify-center items-center">
                    <div className="w-40 h-40">
                        <CircularProgressBar valueStart={0} valueEnd={100} duration={4} text={"2/2"} setShowPopUp={setShowPopUp} step={2} isError={isError} />
                    </div>

                </div>
                <h1 className="text-[20px] mt-4 text-[#000] text-center">Pending transaction confirmation!</h1>
                <h1 className="text-[12px] text-[#8C8C8C] text-center">Confirm this transaction in your wallet.</h1>


            </div>

            <div className="flex justify-center items-center">
                <Image src={powered_by} className="w-auto h-4" alt="powered_by" />
            </div>
        </div>
    )
}

const SuccessChildren = ({ setShowPopUp }) => {

    return (
        <div>
            <div className="flex justify-end mt-4">
                <button className="cursor-pointer" onClick={() => setShowPopUp(false)}>
                    <Image src={cross} className="w-[10px]" alt="cross" />
                </button>

            </div>
            <div className="my-12">
                <div className="flex justify-center items-center">
                    <div className="w-40 h-40 flex justify-center items-center relative bg-[#FCFCFC] rounded-full">
                        <Image src={success_stake} className=" w-12" alt="error_stake" />

                    </div>
                </div>

                <h1 className="text-[20px] mt-4 text-[#000] text-center">Congrats!</h1>
                <h1 className="text-[12px] text-[#8C8C8C] text-center">Transaction Completed.</h1>


            </div>

            <div className="flex justify-center items-center">
                <Image src={powered_by} className="w-auto h-4" alt="powered_by" />
            </div>
        </div>
    )

}

const ErrorPopUpChildren = ({ setShowPopUp }) => {
    return (
        <div>
            <div className="flex justify-end mt-4">
                <button className="cursor-pointer" onClick={() => setShowPopUp(false)}>
                    <Image src={cross} className="w-[10px]" alt="cross" />
                </button>

            </div>
            <div className="my-12">
                <div className="flex justify-center items-center">
                    <div className="w-40 h-40 flex justify-center items-center relative bg-[#FCFCFC] rounded-full">
                        <Image src={success_stake} className=" w-12" alt="error_stake" />

                    </div>
                </div>
                <h1 className="text-[20px] mt-4 text-[#000] text-center">Error!</h1>
                <h1 className="text-[12px] text-[#8C8C8C] text-center">Please try again.</h1>

                <div className="flex justify-center items-center">
                    <button
                        onClick={() => setShowPopUp(false)}
                        type="button"
                        className="relative justify-center mt-2 py-2 group bg-black-background py-1 px-6 lg:px-10 rounded-full flex items-center gap-3 "
                    >
                        <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-4 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="lato-bold  relative z-10 text-original-white lg:text-[15px]">
                            Continue
                        </div>

                    </button>
                </div>
            </div>

            <div className="flex justify-center items-center">
                <Image src={powered_by} className="w-auto h-4" alt="powered_by" />
            </div>
        </div>
    )
}


