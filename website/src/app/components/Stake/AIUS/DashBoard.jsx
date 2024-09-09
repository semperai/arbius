import React, { useEffect, useState } from 'react'
// import Slider from './Slider'
import SlidingCards from './SlidingCards'
import Image from 'next/image'
import aius_icon from "../../../assets/images/aius_icon.png"
import gysr_logo_wallet from "../../../assets/images/gysr_logo_wallet.png"
import GanttChart from './GanttChart'
import { useAccount, useContractRead, useNetwork } from 'wagmi'
// import config from "../../../../sepolia_config.json"
import veStaking from "../../../abis/veStaking.json"
import votingEscrow from "../../../abis/votingEscrow.json"
import { getAPR } from "../../../Utils/getAPR"
// import { walletBalance } from '../../../Utils/getAiusBalance'
import loadConfig from './loadConfig'
import { BigNumber } from 'ethers';
import { fetchArbiusData } from '../../../Utils/getArbiusData'
// import { AIUS_wei } from "../../../Utils/constantValues";
import Web3 from 'web3';
import { getTokenIDs } from '../../../Utils/gantChart/contractInteractions'
import { AIUS_wei, t_max } from "../../../Utils/constantValues";
import Loader from '../Loader/Index'
import Gantt from './GanttChartTest'

function DashBoard({ data, isLoading, isError, protocolData }) {
    const { address, isConnected } = useAccount()
    const { chain, chains } = useNetwork()
    console.log(chain, "CONNECT chain")
    console.log(isConnected, "IS CONNECT")
    const config = loadConfig();
    const VE_STAKING_ADDRESS = config.veStakingAddress;
    const VOTING_ESCROW_ADDRESS = config.votingEscrowAddress;

    const walletBalance = data && !isLoading ? BigNumber.from(data._hex) / AIUS_wei : 0;
    const [rewardRate, setRewardRate] = useState(0);
    const [totalSupply, setTotalSupply] = useState(0);
    const [veSupplyData, setVESupplyData] = useState(0);
    const [escrowBalanceData, setEscrowBalanceData] = useState(0);
    const [tokenIDs, setTokenIDs] = useState([]);
    const [windowStartDate, setWindowStartDate] = useState(new Date('2024-02-20'))
    const [windowEndDate, setWindowEndDate] = useState(new Date('2026-02-20'))
    const [noCols, setNoCols] = useState((windowEndDate?.getFullYear() - windowStartDate?.getFullYear()) * 12 + windowEndDate?.getMonth() - windowStartDate?.getMonth())
    const [loading, setLoading] = useState(false);

    const veAIUSBalance = (staked, startDate, endDate) => {
        const t = endDate - startDate;
        const a_b = staked + 0
        return a_b * (t / t_max);
    }
    const getMonthDifference = (startDate, endDate) => {
        console.log(startDate, "STARTDATE", startDate.getMonth(), endDate)
        let diff = (startDate.getFullYear() * 12 + startDate.getMonth()) - (endDate.getFullYear() * 12 + endDate.getMonth())
        return diff
    }
    // const [walletBalance, setWalletBalance] = useState(0);
    // const [protocolData, setProtocolData] = useState([]);
    /*const rewardRate = useContractRead({
        address: VE_STAKING_ADDRESS,
        abi: veStaking.abi,
        functionName: 'rewardRate',
        args: [],
        enabled: isConnected
    })

    const totalSupply = useContractRead({
        address: VE_STAKING_ADDRESS,
        abi: veStaking.abi,
        functionName: 'totalSupply',
        args: [],
        enabled: isConnected
    })

    const { data: veSupplyData, isLoading: veSupplyIsLoading, isError: veSupplyIsError } = useContractRead({
        address: VOTING_ESCROW_ADDRESS,
        abi: votingEscrow.abi,
        functionName: 'supply',
        args: [],
        enabled: isConnected
    })*/

    useEffect(() => {
        const f = async () => {
            setLoading(true);
            alert("Address changed calling again" + address)
            try {

                const web3 = new Web3(window.ethereum);
                const votingEscrowContract = new web3.eth.Contract(votingEscrow.abi, VOTING_ESCROW_ADDRESS);
                const veStakingContract = new web3.eth.Contract(veStaking.abi, VE_STAKING_ADDRESS);

                const _rewardRate = await veStakingContract.methods.rewardRate().call()
                const _totalSupply = await veStakingContract.methods.totalSupply().call()
                const _veSupplyData = await votingEscrowContract.methods.supply().call()



                setRewardRate(_rewardRate / AIUS_wei)
                setTotalSupply(_totalSupply / AIUS_wei)
                setVESupplyData(_veSupplyData)


                // prepiing sliding cards and ganttChart
                const _escrowBalanceData = await votingEscrowContract.methods.balanceOf(address).call()
                setEscrowBalanceData(_escrowBalanceData);
                let tokens = await getTokenIDs(address, _escrowBalanceData);

                //alert(_escrowBalanceData.toString() + "and" + tokens.length?.toString())
                console.log(_escrowBalanceData, tokens, "TTSSTAKES SSS")

                // ganttChart
                let mergedTokensData = {
                    "slidingCards": {},
                    "ganttChart": {}
                }
                let finalStakingData = {
                    "firstUnlockDate": 0,
                    "totalStaked": 0,
                    "totalGovernancePower": 0,
                    "allStakes": []
                }
                console.log(mergedTokensData, finalStakingData, "CONSOLEing")

                let lastDate = 0;
                let earliestDate = 0;
                tokens.forEach(token => {
                    if (Number(token?.locked__end) > lastDate) {
                        lastDate = Number(token?.locked__end)
                        console.log(lastDate, "LAST DATE")

                    }
                    if (Number(token?.user_point_history__ts) < earliestDate || earliestDate === 0) {
                        earliestDate = Number(token?.user_point_history__ts)
                    }

                })
                if (earliestDate && lastDate) {
                    console.log("HERE");

                    earliestDate = new Date(earliestDate * 1000);
                    console.log(earliestDate, "EARLIEST DATE HERE")

                    lastDate = new Date(lastDate * 1000)
                    setWindowStartDate(earliestDate);
                    setWindowEndDate(lastDate);
                    setNoCols((lastDate.getFullYear() - earliestDate.getFullYear()) * 12 + lastDate.getMonth() - earliestDate.getMonth() + 2)
                }
                // console.log(earliestDate, "EARLIEST DATE")

                tokens.forEach(token => {

                    finalStakingData["totalStaked"] = finalStakingData["totalStaked"] + Number(token?.locked.amount) / AIUS_wei;
                    finalStakingData["totalGovernancePower"] = finalStakingData["totalGovernancePower"] + Number(token?.balanceOfNFT) / AIUS_wei;

                    if (finalStakingData["firstUnlockDate"] == 0 || finalStakingData["firstUnlockDate"] > Number(token?.locked__end)) {


                        finalStakingData["firstUnlockDate"] = Number(token?.locked__end)
                        console.log(finalStakingData["firstUnlockDate"], "FINAL", new Date().getTime())
                        // console.log();

                    }
                    console.log({ earliestDate });
                    console.log("LOCKED DOt end", token.locked.end);

                    finalStakingData["allStakes"].push({
                        "staked": Number(token?.locked.amount) / AIUS_wei,
                        "endDate": new Date(Number(token?.locked__end) * 1000).toISOString().split('T')[0],

                        "startDate": new Date(Number(token?.user_point_history__ts) * 1000).toISOString().split('T')[0],
                        "currentDate": new Date().toLocaleDateString('en-US'),
                        "governancePower": Number(token?.balanceOfNFT) / AIUS_wei,
                        "veAIUSBalance": veAIUSBalance(
                            Number(token?.locked.amount) / AIUS_wei,
                            Number(token?.user_point_history__ts),
                            Number(token?.locked__end)
                        ),


                        "stake_start": getMonthDifference(new Date(Number(token?.user_point_history__ts) * 1000), earliestDate),
                        "staked_till_now": getMonthDifference(new Date(Number(token?.locked__end) * 1000), new Date(Number(token?.user_point_history__ts) * 1000)) > 0 ? getMonthDifference(new Date(), new Date(Number(token?.user_point_history__ts) * 1000)) : 0,
                        "stake_completion": getMonthDifference(new Date(Number(token?.locked__end) * 1000), new Date()) > 0 ? getMonthDifference(new Date(Number(token?.locked__end) * 1000), new Date()) : 0
                    })

                    // console.log(finalStakingData["firstUnlockDate"], "FINAL", new Date().getTime(), "DIFF", finalStakingData["firstUnlockDate"] * 1000 - new Date().getTime())
                })
                if(earliestDate){
                    finalStakingData["firstUnlockDate"] = parseInt((Math.abs(new Date(finalStakingData["firstUnlockDate"] * 1000) - new Date().getTime()) / 1000) / 86400)
                    // earliestDate = new Date(earliestDate * 1000);
                    finalStakingData["stake_start_date"] = `${earliestDate.toLocaleString('en-us', { month: 'short', year: 'numeric' }).toString().slice(0, 3)},${earliestDate.getFullYear().toString().slice(-2)}`
                    console.log(finalStakingData["firstUnlockDate"], "FUND")

                    mergedTokensData["ganttChart"] = finalStakingData;
                    mergedTokensData["slidingCards"] = tokens;
                }
                setTokenIDs(mergedTokensData);
                setLoading(false);

            } catch (e) {

                console.log(e)
                setLoading(false);
            }

        }
        if (address) {

            f();
        }
    }, [address, chain?.id])
    /* DASHBOARD CALLS ENDS HERE */


    console.log(tokenIDs, "TOKEN IDS")







    return (
        <div className='xl:w-section-width w-mobile-section-width text-black-text mx-auto max-w-center-width py-10 lg:py-16' id="dashboard">
            <div className='flex justify-start items-baseline gap-3'><h1 className='text-[#4A28FF] lato-bold text-[40px]'><span className="hidden um:inline">veAIUS</span> Dashboard </h1> <Image src={aius_icon} width={"auto"} height={33} alt="" /></div>

            <div className='xl:grid grid-cols-3 gap-10 my-10 mt-14'>
                <div className="col-span-1 h-auto">

                    <div className='rounded-2xl p-8 bg-white-background stake-box-shadow h-full stake-box-shadow'>

                        <h1 className='text-[#4A28FF] text-[20px] font-semibold'>Wallet</h1>
                        <div className='grid grid-cols-2 gap-[1vw] 2xl:gap-[2vw] mt-6 xl:mt-8 mb-10'>

                            <div className='flex flex-col gap-8 justify-center items-start'>
                                <div>
                                    <h2 className="text-[14px]  text-[#8D8D8D] font-semibold">Balance</h2>
                                    <h2 className='text-[16px] 2xl:text-[18px] font-semibold mt-[2px]'>{walletBalance?.toLocaleString()} <span className="text-[11px] font-medium">AIUS</span></h2>
                                </div>
                                <div>
                                    <h2 className="text-[14px] text-[#8D8D8D] font-semibold">Historical LP Profit</h2>
                                    <div className='flex justify-start items-center gap-2 mt-[2px]'> <h2 className='text-[16px] 2xl:text-[18px] font-semibold'>0 %</h2>
                                        <Image src={gysr_logo_wallet} width={22} height={22} alt="" />
                                    </div>
                                </div>
                            </div>
                            <div className='flex flex-col gap-8 justify-center items-start'>
                                <div>
                                    <h2 className="text-[14px] text-[#8D8D8D] font-semibold">Wallet TVL</h2>
                                    <h2 className='text-[16px] 2xl:text-[18px] font-semibold mt-[2px]'>$ {protocolData?.data?.AIUS?.quote?.USD?.price ? (protocolData?.data?.AIUS?.quote?.USD?.price * walletBalance)?.toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) : 0}</h2>
                                </div>
                                <div>
                                    <h2 className="text-[14px] text-[#8D8D8D] font-semibold">APR</h2>
                                    <h2 className='text-[16px] 2xl:text-[18px] font-semibold mt-[2px]'>{totalSupply && rewardRate ? getAPR(rewardRate, totalSupply)?.toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }) : 0}%</h2>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='mt-10 xl:mt-0 col-span-2'>
                    <div className='pl-2'>
                        <div className='rounded-2xl px-8 py-3 w-full bg-white-background stake-box-shadow mb-2'>
                            <h1 className='text-[#4A28FF] text-[20px] font-semibold'>My Stakes</h1>
                        </div>
                    </div>
                    <div className=''>
                        {loading ? <div className='h-[300px] pl-2'>
                            <Loader />
                        </div> : (tokenIDs?.slidingCards && tokenIDs?.slidingCards.length > 0) ? <SlidingCards isLoading={isLoading} totalEscrowBalance={escrowBalanceData} tokenIDs={tokenIDs?.slidingCards} rewardRate={rewardRate} totalSupply={totalSupply} walletBalance={walletBalance} /> : <div className='h-[300px] flex justify-center items-center pl-2'>
                            <div className=' bg-[#fff] rounded-2xl w-full h-full flex justify-center items-center'>
                                <h1 className='text-[#4A28FF] text-[20px] font-semibold'>No Stakes Found</h1>

                            </div>
                        </div>}

                    </div>
                </div>
            </div>
            <div className='hidden xl:grid grid-cols-1 xl:grid-cols-3 gap-10 mt-10'>
                <div className="col-span-1 block h-auto">
                    <div className='rounded-2xl py-8 px-2 um:p-8 bg-white-background stake-box-shadow h-full stake-box-shadow'>
                        <h1 className='text-[#4A28FF] text-[20px] font-semibold'>Protocol Info</h1>
                        <div className='grid grid-cols-2 gap-[1vw] 2xl:gap-[2vw] mt-6 xl:mt-8 mb-10'>
                            <div className='flex flex-col gap-8  justify-center items-start'>
                                <div>
                                    <h2 className="text-[14px]  text-[#8D8D8D] font-semibold">AIUS Staked</h2>
                                    <h2 className='text-[16px] 2xl:text-[18px] font-semibold mt-[2px]'>{veSupplyData ? (Number(veSupplyData) / AIUS_wei).toFixed(2) : 0}</h2>
                                </div>
                                <div>
                                    <h2 className="text-[14px]  text-[#8D8D8D] font-semibold">Total Supply</h2>
                                    <h2 className='text-[16px] 2xl:text-[18px] font-semibold mt-[2px]'>{protocolData?.data?.AIUS?.total_supply.toLocaleString()} <span className="text-[11px] font-medium">AIUS</span></h2>
                                </div>
                            </div>
                            <div className='flex flex-col gap-8  justify-center items-start'>
                                <div>
                                    <h2 className="text-[14px]  text-[#8D8D8D] font-semibold">AIUS Market Cap</h2>
                                    <h2 className='text-[16px] 2xl:text-[18px] font-semibold mt-[2px]'>${new Intl.NumberFormat('en-US', {
                                        notation: 'compact',
                                        compactDisplay: 'short',
                                        maximumFractionDigits: 2,
                                        minimumFractionDigits: 2

                                    }).format(protocolData?.data?.AIUS?.self_reported_market_cap)} </h2>
                                </div>
                                <div>
                                    <h2 className="text-[14px]  text-[#8D8D8D] font-semibold">Circulating supply</h2>
                                    <h2 className='text-[16px] 2xl:text-[18px] font-semibold mt-[2px]'>{protocolData?.data?.AIUS?.self_reported_circulating_supply.toLocaleString('en-US', {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    })} <span className="text-[11px] font-medium">AIUS</span></h2>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='hidden xl:block col-span-2 pl-2 h-full'>
                {/* <GanttChart isLoading={loading} allStakingData={tokenIDs?.ganttChart} noCols={noCols} windowStartDate={windowStartDate} windowEndDate={windowEndDate} />  */}
                    {
                        loading ?
                            <div className='h-[300px]'>
                                <Loader />
                            </div>
                        : <Gantt allStakingData={ (tokenIDs?.ganttChart && tokenIDs?.ganttChart.allStakes && tokenIDs?.ganttChart.allStakes.length > 0) ?
                                    tokenIDs?.ganttChart
                                    : []
                                } />
                        /*: <div className='h-[300px] flex justify-center items-center'>
                            <div className=' bg-[#fff] rounded-2xl w-full h-full flex justify-center items-center'>
                                <h1 className='text-[#4A28FF] text-[20px] font-semibold'>No Stakes Found</h1>
                            </div>
                        </div>*/
                    }
                </div>
            </div>
        </div>
    )
}

export default DashBoard