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
// import config from "../../../../sepolia_config.json"
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
import { ethers } from 'ethers';
import loadConfig from "./loadConfig"
import { getTransactionReceiptData } from '../../../Utils/getTransactionReceiptData'
import Web3 from 'web3';

export default function Stake({ selectedtab, setSelectedTab, data, isLoading, isError, updateValue, setUpdateValue }) {

    const [sliderValue, setSliderValue] = useState(0)
    const { address, isConnected } = useAccount()
    //const [totalEscrowBalance, setTotalEscrowBalance] = useState(0)
    const [veAiusBalance, setVeAIUSBalance] = useState(0)
    const [allowance, setAllowance] = useState(0)
    //const [veAIUSBalancesContracts, setVeAIUSBalancesContracts] = useState(null);
    const config = loadConfig();
    const [duration, setDuration] = useState({
        months: 0,
        weeks: 0
    })
    const [amount, setAmount] = useState(0)
    //const walletBalance = data && !isLoading ? Number(data._hex) / AIUS_wei : 0;
    const [walletBalance, setWalletBalance] = useState(0);
    const [rewardRate, setRewardRate] = useState(0);
    const [totalSupply, setTotalSupply] = useState(0);
    const [escrowBalanceData, setEscrowBalanceData] = useState(0);

    //console.log(veAiusBalance, allowance, walletBalance, rewardRate, totalSupply, escrowBalanceData, "ALL VALUES IN STAKE COMP")

    const VE_STAKING_ADDRESS = config.veStakingAddress;
    const VOTING_ESCROW_ADDRESS = config.votingEscrowAddress;
    const BASETOKEN_ADDRESS_V1 = config.v2_baseTokenAddress;
    const FAUCET_ADDRESS = "0x9a2aef1a0fc09d22f0703decd5bf19dc4214e52a";

    const faucetABI = [{"inputs":[{"internalType":"address","name":"tokenAddress","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"faucet","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"token","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"}]

    const [faucetCalled, setFaucetCalled] = useState(false);

    /*const rewardRate = useContractRead({
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
    });*/

    /*useEffect(() => {
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

    //console.log(veAIUSBalancesContracts, "stake")
    const { data: veAIUSBalances, isLoading: veAIUSBalancesIsLoading, isError: veAIUSBalancesIsError } = useContractReads({
        contracts: veAIUSBalancesContracts,
    });
    console.log(veAIUSBalances, "Stake data")
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
    console.log({ approveData, approveError, approvePending, allowance });*/

    /*const { config: stakeConfig } = usePrepareContractWrite({
        address: VOTING_ESCROW_ADDRESS,
        abi: votingEscrow.abi,
        functionName: 'create_lock',
        args: [
            (Number(amount) * AIUS_wei).toString(),
            (duration.months !== 0 ? duration.months * (52 / 12) : duration.weeks) * 7 * 24 * 60 * 60
        ],
        enabled: allowance >= amount,
    });*/
    console.log(allowance, amount, "ALLOWANCE AND AMOUNT")
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

    useEffect(() => {
        const f = async() => {

            try {
                const web3 = new Web3(window.ethereum);
                const votingEscrowContract = new web3.eth.Contract(votingEscrow.abi, VOTING_ESCROW_ADDRESS);
                const veStakingContract = new web3.eth.Contract(veStaking.abi, VE_STAKING_ADDRESS);
                const baseTokenContract = new web3.eth.Contract(baseTokenV1.abi, BASETOKEN_ADDRESS_V1);

                const wBal = await baseTokenContract.methods.balanceOf(address).call()
                setWalletBalance(wBal / AIUS_wei);

                const _rewardRate = await veStakingContract.methods.rewardRate().call()
                setRewardRate(_rewardRate)

                const _totalSupply = await veStakingContract.methods.totalSupply().call()
                setTotalSupply(_totalSupply)

                const _escrowBalanceData = await votingEscrowContract.methods.balanceOf(address).call()
                setEscrowBalanceData(_escrowBalanceData)

                const _tokenIDs = []
                for(let i=0; i<_escrowBalanceData; i++){
                    _tokenIDs.push(
                        await votingEscrowContract.methods.tokenOfOwnerByIndex(address, i).call()
                    )
                }

                let _veAIUSBalance = 0;
                for(let i=0; i<_tokenIDs.length; i++){
                    _veAIUSBalance = _veAIUSBalance + await veStakingContract.methods.balanceOf(_tokenIDs[i]).call() / AIUS_wei
                }
                setVeAIUSBalance(_veAIUSBalance);

                const _checkAllowance = await baseTokenContract.methods.allowance(address, VOTING_ESCROW_ADDRESS).call()
                setAllowance(_checkAllowance)

                if(localStorage.getItem("faucetCalled")){
                    setFaucetCalled(true);
                }else{
                    setFaucetCalled(false)
                }

            }catch(err){
                console.log(err)
            }
        }
        if(address){
            f();
        }
    },[address, updateValue])


    const handleStake = async()=>{
        //console.log({stakeData});
        console.log(amount, allowance, "ALLOWANCE AND AMOUNT before staking");

        if(amount > allowance || allowance === 0){
            /*if(amount && (duration.months || duration.weeks)){
                setShowPopUp(1)
                approveWrite?.()
            }else{
                //alert("Please enter the amount and duration to stake!")
            }*/
            try {
                setShowPopUp(1);
                // Request account access
                await window.ethereum.request({ method: 'eth_requestAccounts' });

                // Create a provider
                const provider = new ethers.providers.Web3Provider(window.ethereum);

                // Get the signer
                const signer = provider.getSigner();

                const approveContract = new ethers.Contract(BASETOKEN_ADDRESS_V1, baseTokenV1.abi, signer)

                const tx1 = await approveContract.approve(VOTING_ESCROW_ADDRESS, defaultApproveAmount)
                
                await tx1.wait();
                
                console.log('First transaction confirmed');

                setShowPopUp(2);

                const stakeContract = new ethers.Contract(VOTING_ESCROW_ADDRESS, votingEscrow.abi, signer)

                const tx2 = await stakeContract.create_lock(
                                                    (amount * AIUS_wei).toString(),
                                                    (duration.months !== 0 ? duration.months * (52 / 12) : duration.weeks) * 7 * 24 * 60 * 60
                                                )
                console.log('Second transaction hash:', tx2.hash);
                await tx2.wait(); // Wait for the transaction to be mined
                console.log('Second transaction confirmed');
                setShowPopUp("Success")
                console.log('Both transactions completed successfully');
                getTransactionReceiptData(tx2.hash).then(function(){
                    //window.location.reload(true)
                    setUpdateValue(prevValue => prevValue + 1)
                })
            } catch (error) {
                setShowPopUp("Error")
            }
        }else{
            try{
                console.log("Second step if allowance is set, values -> : amount, months and weeks", amount, duration.months, duration.weeks)
                if(amount && (duration.months || duration.weeks)){
                    // setShowPopUp(2)
                    setShowPopUp(3)
                    await window.ethereum.request({ method: 'eth_requestAccounts' });

                    // Create a provider
                    const provider = new ethers.providers.Web3Provider(window.ethereum);

                    // Get the signer
                    const signer = provider.getSigner();

                    const stakeContract = new ethers.Contract(VOTING_ESCROW_ADDRESS, votingEscrow.abi, signer)
                    const tx2 = await stakeContract.create_lock(
                                                        (amount * AIUS_wei).toString(),
                                                        (duration.months !== 0 ? duration.months * (52 / 12) : duration.weeks) * 7 * 24 * 60 * 60
                                                    )
                    console.log('Second transaction hash:', tx2.hash);
                    await tx2.wait(); // Wait for the transaction to be mined
                    console.log('Second transaction confirmed');
                    setShowPopUp("Success")
                    console.log('Both transactions completed successfully');
                    getTransactionReceiptData(tx2.hash).then(function(){
                        //window.location.reload(true)
                        setUpdateValue(prevValue => prevValue + 1)
                    })
                }else{
                    //alert("Please enter the amount and duration to stake!")
                }
            }catch(err){
                setShowPopUp("Error")
            }
        }
    }


    const getFaucet = async() => {
        try{
            setShowPopUp(3)
            const web3 = new Web3(window.ethereum);
            const faucetContract = new web3.eth.Contract(faucetABI, FAUCET_ADDRESS);
            const res = await faucetContract.methods.faucet().send({from: address})
            setFaucetCalled(true)
            localStorage.setItem("faucetCalled", true)
            setShowPopUp("Success")
            setUpdateValue(prevValue => prevValue + 1)
        }catch(err){
            console.log(err);
            setShowPopUp("Error")
            setFaucetCalled(false)
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
                        {showPopUp === 1 && <StepOneChildren setShowPopUp={setShowPopUp} isError={false} noChildren={false} repeat={false} valueStart={0} valueEnd={50} />}
                        {showPopUp === 2 && <StepTwoChildren setShowPopUp={setShowPopUp} isError={false} noChildren={false} repeat={false} valueStart={50} valueEnd={100} />}
                        {showPopUp === 3 && <StepTwoChildren setShowPopUp={setShowPopUp} isError={false} noChildren={true} repeat={true} valueStart={0} valueEnd={100} />}
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
                            <p className="text-available lato-regular text-[15px]">Available {Number(walletBalance)?.toFixed(4).toString()} AIUS</p>
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
                        <p className="mt-8 mb-8 text-[15px] lg:text-[20px] lato-bold  text-stake h-12">Locking for {duration.months !== 0 ? `${duration.months} ${duration.months === 1 ? "month" : "months"} ` : `${duration.weeks} ${(duration.weeks <= 1 && duration.weeks !== 0) ? "week" : "weeks"}`} for {(getAIUSVotingPower(amount * AIUS_wei, sliderValue) / AIUS_wei).toFixed(2)} veAIUS.</p>
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
                                        console.log("Slider on change value: ",value);
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
                        <p className="md:text-[28px] text-[16px] lato-bold text-original-white">{totalSupply && rewardRate ? getAPR(rewardRate, totalSupply).toFixed(2) : 0}%</p>
                    </div>
                    <div className="bg-apr rounded-2xl w-[48%] py-4 px-4 box-border relative">
                        <div className="right-3 top-3 absolute group cursor-pointer">
                            <Image src={info_icon} width={20} height={20} alt="info" className="" />
                            <div className="absolute hidden group-hover:block right-6 xl:w-[160px] top-0 text-[.7rem] lato-bold bg-white-background text-black-text p-2 rounded-md text-left">
                                Total veAIUS staked by user

                            </div>

                        </div>
                        <p className="md:text-[16px] text-[12px] lato-regular mb-4 text-original-white">veAIUS Balance</p>
                        <p className="md:text-[28px] text-[16px] lato-bold text-original-white">{Number(veAiusBalance)?.toFixed(2)} <span className="md:text-[20px] text-[12px] lato-regular">veAIUS</span></p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mb-4">
                    <div className=' mt-6'>
                        <button
                            type="button"
                            className={`relative justify-center py-2 group ${faucetCalled ? "hidden bg-light-gray-background": "bg-black-background"} py-1 px-6 lg:px-10 rounded-full flex items-center gap-3 w-full`}
                            onClick={async()=>{
                                    if(!faucetCalled){
                                        await getFaucet()
                                    }
                            }}
                        >
                            <div className="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-4 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className={`lato-bold  relative z-10  ${faucetCalled ? "text-original-black opacity-40": "text-original-white opacity-100"} group-hover:text-original-white group-hover:opacity-100 lg:text-[15px]`}>
                                AIUS Faucet
                            </div>

                        </button>

                    </div>
                    <div className=' mt-6'>
                        <Link href={"#dashboard"} onClick={() => setSelectedTab("Dashboard")}>
                            <button
                                type="button"

                                className="relative justify-center py-2 group bg-light-gray-background py-1 px-6 lg:px-10 rounded-full flex items-center gap-3 w-full"
                            >
                                <div className="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-4 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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
                                    //console.log(amount, walletBalance, duration)
                                    if(Number(amount) && Number(amount) <= Number(walletBalance) && (duration.months || duration.weeks)){
                                        await handleStake()
                                    }
                                }}
                            className={`relative justify-center py-2 group bg-black-background ${Number(amount) && Number(amount) <= Number(walletBalance) && (duration.months || duration.weeks) ? "" : "opacity-40" } py-1 px-6 lg:px-10 rounded-full flex items-center gap-3 w-full`}
                        >
                            <div className="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-4 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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


const StepOneChildren = ({ setShowPopUp, isError, noChildren, repeat, valueStart, valueEnd }) => {
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
                        <CircularProgressBar valueStart={valueStart} valueEnd={valueEnd} duration={4} text={"1/2"} setShowPopUp={setShowPopUp} step={1} isError={isError} noChildren={noChildren} repeat={repeat} />
                    </div>

                </div>
                <h1 className="text-[20px] mt-4 text-original-black text-center">Approve AIUS Spending Limit!</h1>
                <h1 className="text-[12px] text-aius-tabs-gray text-center">Confirm this transaction in your wallet.</h1>


            </div>

            <div className="flex justify-center items-center">
                <Image src={powered_by} className="w-auto h-4" alt="powered_by" />
            </div>
        </div>

    )
}
const StepTwoChildren = ({ setShowPopUp, isError, noChildren, repeat, valueStart, valueEnd }) => {
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
                        <CircularProgressBar valueStart={valueStart} valueEnd={valueEnd} duration={4} text={"2/2"} setShowPopUp={setShowPopUp} step={2} isError={isError} noChildren={noChildren} repeat={repeat} />
                    </div>

                </div>
                <h1 className="text-[20px] mt-4 text-original-black text-center">Pending transaction confirmation!</h1>
                <h1 className="text-[12px] text-aius-tabs-gray text-center">Confirm this transaction in your wallet.</h1>


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
                    <div className="w-40 h-40 flex justify-center items-center relative bg-white-background rounded-full">
                        <Image src={success_stake} className=" w-12" alt="error_stake" />

                    </div>
                </div>

                <h1 className="text-[20px] mt-4 text-original-black text-center">Congrats!</h1>
                <h1 className="text-[12px] text-aius-tabs-gray text-center">Transaction Completed.</h1>


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
                    <div className="w-40 h-40 flex justify-center items-center relative bg-white-background rounded-full">
                        <Image src={error_stake} className=" w-12" alt="error_stake" />

                    </div>
                </div>
                <h1 className="text-[20px] mt-4 text-original-black text-center">Error!</h1>
                <h1 className="text-[12px] text-aius-tabs-gray text-center">Please try again.</h1>

                <div className="flex justify-center items-center">
                    <button
                        onClick={() => setShowPopUp(false)}
                        type="button"
                        className="relative justify-center mt-2 py-2 group bg-black-background py-1 px-6 lg:px-10 rounded-full flex items-center gap-3 "
                    >
                        <div className="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-4 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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


