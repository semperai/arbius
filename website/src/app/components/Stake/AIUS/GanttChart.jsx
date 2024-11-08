"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image';
import info_icon from "../../../assets/images/info_icon.png"
import votingEscrow from "../../../abis/votingEscrow.json"
// import config from "../../../../sepolia_config.json"
import loadConfig from './loadConfig';
import { useAccount, useContractRead, useContractReads } from 'wagmi';

import { getTokenIDs, getTotalEscrowBalance, init } from '../../../Utils/gantChart/contractInteractions';

function GanttChart({ allStakingData, windowStartDate, windowEndDate, noCols }) {


    const [markedMonths, setMarkedMonths] = useState([])
    console.log({ noCols }, windowStartDate, windowEndDate)
    const config = loadConfig();

    const [totalEscrowBalance, setTotalEscrowBalance] = useState(0)
    const VOTING_ESCROW_ADDRESS = config.votingEscrowAddress;
    const { address, isConnected } = useAccount()
    // const [allStakingData, setAllStakingData] = useState({});
    const [contract, setContract] = useState(null);
    const [stakingData, setStakingData] = useState([]);
    // let data = [
    //     {
    //         stake_start: '2024-02-20',
    //         staked_till_now: '2024-10-20',
    //         stake_completion: '2024-11-25',
    //         total_staked: 14.124,
    //         staked_now: 14.124,
    //     },
    //     {
    //         stake_start: '2024-11-20',
    //         staked_till_now: '2024-12-20',
    //         stake_completion: '2025-01-25',
    //         total_staked: 14.124,
    //         staked_now: 7.021,
    //     },


    // ]

    // const { data: escrowBalanceData, isLoading: escrowBalanceIsLoading, isError: escrowBalanceIsError } = useContractRead({
    //     address: VOTING_ESCROW_ADDRESS,
    //     abi: votingEscrow.abi,
    //     functionName: 'balanceOf',
    //     args: [
    //         address
    //     ],
    //     enabled: isConnected
    // })


    // const { data: tokenIDs, isLoading: tokenIDsIsLoading, isError: tokenIDsIsError } = useContractReads({
    //     contracts: (totalEscrowBalance) ? new Array(totalEscrowBalance).fill(0).map((i, index) => {
    //         console.log("the loop", i, totalEscrowBalance)
    //         return {
    //             address: VOTING_ESCROW_ADDRESS,
    //             abi: votingEscrow.abi,
    //             functionName: 'tokenOfOwnerByIndex',
    //             args: [
    //                 address,
    //                 index
    //             ]
    //         }
    //     }) : null,
    // });
    // console.log(tokenIDs, "TIOD")
    // useEffect(() => {
    //     console.log(escrowBalanceData, "ESCROW")
    //     if (escrowBalanceData) {
    //         setTotalEscrowBalance(Number(escrowBalanceData?._hex))
    //     }
    // }, [escrowBalanceData])

    // const loadData = async () => {
    //     const contract = await init();
    //     console.log(contract, "CONTRACT")
    //     setContract(contract);
    //     const totalEscrowBalance = await getTotalEscrowBalance(contract, address);
    //     console.log(totalEscrowBalance, "TOTALESCROWBALANCE")
    //     const tokens = await getTokenIDs(contract, address, totalEscrowBalance);
    //     let finalStakingData = {
    //         "firstUnlockDate": 0,
    //         "totalStaked": 0,
    //         "totalGovernancePower": 0,
    //         "allStakes": []
    //     }
    //     let earliestDate = 0;
    //     let lastDate = 0;


    //     tokens.forEach(token => {
    //         if (Number(token?.locked__end) > lastDate) {
    //             lastDate = Number(token?.locked__end)
    //             console.log(lastDate, "LAST DATE")

    //         }
    //         if (Number(token?.user_point_history__ts) < earliestDate || earliestDate === 0) {
    //             earliestDate = Number(token?.user_point_history__ts)
    //         }

    //     })
    //     if (earliestDate && lastDate) {
    //         console.log("HERE");

    //         earliestDate = new Date(earliestDate * 1000);
    //         console.log(earliestDate, "EARLIEST DATE HERE")

    //         lastDate = new Date(lastDate * 1000)
    //         setWindowStartDate(earliestDate);
    //         setWindowEndDate(lastDate);
    //         setNoCols((lastDate.getFullYear() - earliestDate.getFullYear()) * 12 + lastDate.getMonth() - earliestDate.getMonth() + 2)
    //     }
    //     // console.log(earliestDate, "EARLIEST DATE")

    //     tokens.forEach(token => {

    //         finalStakingData["totalStaked"] = finalStakingData["totalStaked"] + Number(token?.locked.amount) / AIUS_wei;
    //         finalStakingData["totalGovernancePower"] = finalStakingData["totalGovernancePower"] + Number(token?.balanceOfNFT) / AIUS_wei;

    //         if (finalStakingData["firstUnlockDate"] == 0 || finalStakingData["firstUnlockDate"] > Number(token?.locked__end)) {


    //             finalStakingData["firstUnlockDate"] = Number(token?.locked__end)
    //             console.log(finalStakingData["firstUnlockDate"], "FINAL", new Date().getTime())
    //             // console.log();

    //         }
    //         console.log({ earliestDate });

    //         finalStakingData["allStakes"].push({
    //             "staked": Number(token?.locked.amount) / AIUS_wei,
    //             "lockedEndDate": new Date(Number(token?.locked__end) * 1000).toLocaleDateString('en-US'),
    //             "lockedStartDate": new Date(Number(token?.user_point_history__ts) * 1000).toLocaleDateString('en-US'),
    //             "currentDate": new Date().toLocaleDateString('en-US'),
    //             "governancePower": Number(token?.balanceOfNFT) / AIUS_wei,
    //             "veAIUSBalance": veAIUSBalance(
    //                 Number(token?.locked.amount) / AIUS_wei,
    //                 Number(token?.user_point_history__ts),
    //                 Number(token?.locked__end)
    //             ),


    //             "stake_start": getMonthDifference(new Date(Number(token?.user_point_history__ts) * 1000), earliestDate),
    //             "staked_till_now": getMonthDifference(new Date(), new Date(Number(token?.user_point_history__ts) * 1000)),
    //             "stake_completion": getMonthDifference(new Date(Number(token?.locked__end) * 1000), new Date())
    //         })

    //         // console.log(finalStakingData["firstUnlockDate"], "FINAL", new Date().getTime(), "DIFF", finalStakingData["firstUnlockDate"] * 1000 - new Date().getTime())
    //     })

    //     finalStakingData["firstUnlockDate"] = parseInt((Math.abs(new Date(finalStakingData["firstUnlockDate"] * 1000) - new Date().getTime()) / 1000) / 86400)
    //     // earliestDate = new Date(earliestDate * 1000);
    //     finalStakingData["stake_start_date"] = `${earliestDate.toLocaleString('en-us', { month: 'short', year: 'numeric' }).toString().slice(0, 3)},${earliestDate.getFullYear().toString().slice(-2)}`
    //     console.log(finalStakingData["firstUnlockDate"], "FUND")



    //     console.log(tokens, "TOKENS")
    //     setAllStakingData(finalStakingData);
    // }

    useEffect(() => {
        console.log("LOAD DATA")
        // loadData();
    }, [address])


    // const stakingData = useContractReads({
    //     contracts: (tokenIDs) ? tokenIDs.flatMap(tokenId => {
    //         return [
    //             {
    //                 address: VOTING_ESCROW_ADDRESS,
    //                 abi: votingEscrow.abi,
    //                 functionName: 'locked',
    //                 args: [
    //                     Number(tokenId?._hex)
    //                 ],
    //                 enabled: isConnected
    //             },
    //             {
    //                 address: VOTING_ESCROW_ADDRESS,
    //                 abi: votingEscrow.abi,
    //                 functionName: 'locked__end',
    //                 args: [
    //                     Number(tokenId?._hex)
    //                 ],
    //                 enabled: isConnected
    //             },
    //             {
    //                 address: VOTING_ESCROW_ADDRESS,
    //                 abi: votingEscrow.abi,
    //                 functionName: 'user_point_history__ts',
    //                 args: [
    //                     Number(tokenId?._hex),
    //                     1
    //                 ],
    //                 enabled: isConnected
    //             },
    //             {
    //                 address: VOTING_ESCROW_ADDRESS,
    //                 abi: votingEscrow.abi,
    //                 functionName: 'balanceOfNFT',
    //                 args: [
    //                     Number(tokenId?._hex)
    //                 ],
    //                 enabled: isConnected
    //             }
    //         ]
    //     }) : null
    // })



    // useEffect(() => {
    //     let finalData = {
    //         "firstUnlockDate": 0,
    //         "totalStaked": 0,
    //         "totalGovernancePower": 0,
    //         "allStakes": []
    //     }
    //     console.log("STACKING DATA", stakingData)
    //     let earliestDate = 0;
    //     let lastDate = 0;

    //     if (stakingData?.data?.length && stakingData?.data?.[0]) {
    //         let totalStakes = stakingData.data.length / 4;
    //         let stakeData = stakingData.data;
    //         console.log();

    //         for (let i = 0; i < totalStakes; i++) {
    //             if(Number(stakeData[(i*4)+1]) > lastDate){
    //                 lastDate = Number(stakeData[(i*4)+1])
    //             }
    //             if(Number(stakeData[(i*4)+2]) < earliestDate || earliestDate === 0){
    //                 earliestDate = Number(stakeData[(i*4)+2])
    //             }
    //         }

    //         if(earliestDate && lastDate){
    //             earliestDate = new Date(earliestDate * 1000);
    //             console.log(earliestDate, "EARLIEST DATE")

    //             lastDate = new Date(lastDate * 1000)
    //             setWindowStartDate(earliestDate);
    //             setWindowEndDate(lastDate);
    //             setNoCols((lastDate.getFullYear() - earliestDate.getFullYear()) * 12 + lastDate.getMonth() - earliestDate.getMonth() + 2)
    //         }
    //         console.log(earliestDate, "EARLIEST DATE")

    //         for (let i = 0; i < totalStakes; i++) {
    //             finalData["totalStaked"] = finalData["totalStaked"] + Number(stakeData[(i * 4)]?.amount) / AIUS_wei;
    //             if (finalData["firstUnlockDate"] == 0 || finalData["firstUnlockDate"] > Number(stakeData[(i * 4) + 1])) {
    //                 console.log(finalData["firstUnlockDate"], "FUNLD")
    //                 finalData["firstUnlockDate"] = Number(stakeData[(i * 4) + 1]);
    //             }
    //             finalData["totalGovernancePower"] = finalData["totalGovernancePower"] + Number(stakeData[(i * 4) + 3]) / AIUS_wei;
    //             finalData["allStakes"].push({
    //                 "staked": Number(stakeData[(i * 4)]?.amount) / AIUS_wei,
    //                 "lockedEndDate": new Date(Number(stakeData[(i * 4) + 1]) * 1000).toLocaleDateString('en-US'),
    //                 "lockedStartDate": new Date(Number(stakeData[(i * 4) + 2]) * 1000).toLocaleDateString('en-US'),
    //                 "currentDate": new Date().toLocaleDateString('en-US'),
    //                 "governancePower": Number(stakeData[(i * 4) + 3]) / AIUS_wei,
    //                 "veAIUSBalance": veAIUSBalance(
    //                     Number(stakeData[(i * 4)]?.amount) / AIUS_wei,
    //                     Number(stakeData[(i * 4) + 2]),
    //                     Number(stakeData[(i * 4) + 1])
    //                 ),
    //                 "stake_start": getMonthDifference(new Date(Number(stakeData[(i * 4) + 2]) * 1000), earliestDate),
    //                 "staked_till_now": getMonthDifference(new Date(), new Date(Number(stakeData[(i * 4) + 2]) * 1000)),
    //                 "stake_completion": getMonthDifference(new Date(Number(stakeData[(i * 4) + 1]) * 1000), new Date()) 
    //             })
    //         }
    //         finalData["firstUnlockDate"] = parseInt(((new Date(finalData["firstUnlockDate"] * 1000) - new Date().getTime()) / 1000) / 86400)
    //         finalData["stake_start_date"] = `${earliestDate.toLocaleString('en-us', { month: 'short', year: 'numeric' }).toString().slice(0, 3)},${earliestDate.getFullYear().toString().slice(-2)}`
    //         console.log(finalData["firstUnlockDate"], "FUND")
    //     }
    //     setAllStakingData(finalData)
    // }, [stakingData])

    console.log(allStakingData, "ALLSTAKE DATa")
    // pre processing the data for gantt chart dist






    useEffect(() => {
        let marked = [];
        console.log({ noCols });

        // mark every 4th month from windowStartDate to windowEndDate
        for (let i = 0; i < noCols; i++) {
            if (i % 4 === 0) {
                marked.push({
                    month: windowStartDate.getTime() + i * 30 * 24 * 60 * 60 * 1000,
                    key: i

                })
            }
            if (i === noCols - 1 && noCols % 4 === 0) {
                marked.push({
                    month: windowEndDate.getTime() + i * 30 * 24 * 60 * 60 * 1000,
                    key: noCols - 1

                })
            }
        }
        console.log(marked, "MARKED")

        setMarkedMonths(marked)

    }, [noCols, windowStartDate, windowEndDate])

    console.log(allStakingData, "allStakingData")

    return (
        <div className='rounded-2xl p-8 px-10 bg-white-background stake-box-shadow relative h-full stake-box-shadow'>
            <h1 className='text-[#4A28FF] text-[20px] font-semibold'>Staking</h1>
            <div className='flex justify-between items-center mt-6 mb-3'>
                <div>
                    <h2 className="text-[14px] text-[#8D8D8D] font-semibold">First unlock in</h2>
                    <h2 className='text-[16px] font-semibold'>{allStakingData?.firstUnlockDate ? allStakingData?.firstUnlockDate : "0"} days</h2>

                </div>
                <div>
                    <h2 className="text-[14px] text-[#8D8D8D] font-semibold">Total Staked</h2>
                    <h2 className='text-[16px] font-semibold'>{allStakingData?.totalStaked ? allStakingData?.totalStaked?.toFixed(2) : "0"} <span className="text-[11px] font-medium">AIUS</span></h2>

                </div>
                <div className='relative'>
                    <h2 className="text-[14px] text-[#8D8D8D] font-semibold">Governance Power</h2>
                    <div className='flex justify-start items-center gap-1'>

                        <h2 className='text-[16px] font-semibold'>{allStakingData?.totalGovernancePower ? allStakingData?.totalGovernancePower?.toFixed(2) : "0"}</h2>
                        <div className=' cursor-pointer grayscale-[1] opacity-30 hover:grayscale-0 hover:opacity-100' onMouseOver={() => {
                            document.getElementById("info").style.display = "flex"
                        }}
                            onMouseLeave={() => {
                                document.getElementById("info").style.display = "none"
                            }}
                        >
                            <Image src={info_icon} height={13} width={13} />
                        </div>
                    </div>

                    <div id='info' className='hidden absolute top-12 left-0  bg-white-background stake-box-shadow p-2 rounded-xl z-40 w-[150px]'>
                        <h1 className='text-[.6rem] opacity-60'>As your stake(s) age, this value decays from the original veAIUS balance. To increase this value, extend your stake(s). </h1>
                    </div>



                </div>


            </div>

            <div className='max-h-[156px]  py-2 overflow-y-auto mb-2 relative' id="gantt-chart">

                {
                    allStakingData?.allStakes?.map((item, key) => {
                        return <div className='py-2' key={key}>
                            <div className='item-grid' style={{ display: 'grid', gridTemplateColumns: `repeat(${noCols}, 1fr) ` }}>
                                {item?.stake_start !== 0 && (
                                    <div className={`bg-transparent h-[.4rem] my-3 rounded-full z-20`} style={{
                                        gridColumn: `span ${item?.stake_start} / span ${item?.stake_start}`
                                    }}>
                                    </div>
                                )}


                                {item?.staked_till_now !== 0 && (
                                    <div className={` bg-[#4A28FF] h-[.4rem] my-3 rounded-full relative z-20`} id='start-stake' style={{
                                        gridColumn: `span ${item?.staked_till_now} / span ${item?.staked_till_now}`
                                    }}>
                                        <h1 className='absolute left-0 bottom-[8px] text-[.65rem] font-semibold w-max'><span className='opacity-60'>Locked Until</span>  <span className='opacity-100 ml-1'>{item?.lockedEndDate}</span></h1>
                                        <h1 className='mt-[8px] text-[.65rem] opacity-80 font-semibold text-[#4A28FF] w-[100px]'>{item?.staked} AIUS Staked</h1>
                                    </div>
                                )}
                                {
                                    item?.stake_completion !== 0 && (
                                        <div className={`bg-[#eeeeee] h-[.4rem] my-3 ${item?.staked_till_now === 0 ? 'rounded-full' : 'rounded-r-full'} relative z-20`} style={{
                                            gridColumn: `span ${item?.stake_completion} / span ${item?.stake_completion}`
                                        }}>
                                            {
                                                item?.staked_till_now === 0 ? (
                                                    <>
                                                        <h1 className='absolute left-0 bottom-[8px] text-[.65rem] font-semibold w-max'><span className='opacity-60'>Locked Until</span>  <span className='opacity-100 ml-1'>{item?.lockedEndDate}</span></h1>
                                                        <div className='flex justify-between items-center  gap-2'>
                                                            <h1 className=' mt-[8px] text-[.65rem] opacity-80 font-semibold text-[#4A28FF] w-[100px] whitespace-pre'>{item?.staked} AIUS Staked</h1>
                                                            <h1 className={` mt-[7.5px] text-end text-[.7rem] font-semibold text-[#4A28FF] w-[80px] whitespace-pre`}>{item?.veAIUSBalance?.toFixed(2)} veAIUS</h1>

                                                        </div></>
                                                ) : (
                                                    <h1 className={` mt-[7.5px] text-end text-[.7rem] font-semibold text-[#4A28FF] min-w-[80px] `}>{item?.veAIUSBalance?.toFixed(2)} veAIUS</h1>
                                                )
                                            }
                                        </div>
                                    )
                                }

                                {
                                    item?.staked_till_now === 0 && item?.stake_completion === 0 && (

                                        <div className={`h-[.4rem] my-3 ${item?.staked_till_now === 0 ? 'rounded-full' : 'rounded-r-full'} ${new Date(item?.lockedEndDate).getTime() <= new Date().getTime() ? 'bg-[#4A28FF]' : 'bg-[#eeeeee]'}  relative z-20 w-[5%]`} >
                                            {
                                                item?.staked_till_now === 0 ? (
                                                    <>
                                                        <h1 className='absolute left-0 bottom-[8px] text-[.65rem] font-semibold w-max'><span className='opacity-60'>Locked Until</span>  <span className='opacity-100 ml-1'>{item?.lockedEndDate}</span></h1>
                                                        <div className='flex justify-between items-center  gap-2'>
                                                            <h1 className=' mt-[8px] text-[.65rem] opacity-80 font-semibold text-[#4A28FF] w-[100px] whitespace-pre'>{item?.staked} AIUS Staked</h1>
                                                            <h1 className={` mt-[7.5px] text-end text-[.7rem] font-semibold text-[#4A28FF] w-[80px] whitespace-pre`}>{item?.veAIUSBalance?.toFixed(2)} veAIUS</h1>

                                                        </div></>
                                                ) : (
                                                    <h1 className={` mt-[7.5px] text-end text-[.7rem] font-semibold text-[#4A28FF] min-w-[80px] `}>{item?.veAIUSBalance?.toFixed(2)} veAIUS</h1>
                                                )
                                            }
                                        </div>

                                    )
                                }



                            </div>
                        </div>
                    })
                }

            </div>

            <div className='item-grid absolute bottom-[1.25rem] px-[2.7rem] right-0 left-0' style={{ display: 'grid', gridTemplateColumns: `repeat(${noCols}, 1fr)` }}>
                {allStakingData?.allStakes?.length ?
                    Array(noCols).fill(null).map((item, key) => {
                        let containsStakeStart = markedMonths?.findIndex(item => item?.key === key);
                        // console.log({ containsStakeStart });
                        if (containsStakeStart !== -1)
                            return (
                                <div className={markedMonths[containsStakeStart].key === noCols - 1 ? `text-end text-[.55rem] text-[#4A28FF]` : 'text-start text-[.55rem] text-[#4A28FF]'} key={key}>
                                    <h1>{`${new Date(markedMonths[containsStakeStart]?.month)?.toLocaleString('en-us', { month: 'short', year: 'numeric' }).toString().slice(0, 3)},${new Date(markedMonths[containsStakeStart]?.month).getFullYear().toString().slice(-2)}`}</h1>
                                </div>
                            )

                        else
                            return <div></div>
                    }) : null
                }

            </div>
            <div className='item-grid absolute bottom-[.0rem] right-0 left-0 px-[2.7rem]' style={{ display: 'grid', gridTemplateColumns: `repeat(${noCols}, 1fr) ` }}>

                {allStakingData?.allStakes?.length ?
                    Array(noCols).fill(null).map((item, key) => {
                        return <div className={key == noCols - 1 ? 'w-full border-x-[1px] border-[#4828ff4f] pt-2' : 'w-full border-l-[1px] border-[#4828ff4f] pt-2'} key={key}>
                            <div className='w-full bg-[#EDEDED] h-[.35rem]'>
                            </div>
                        </div>
                    }) : null
                }

            </div>
        </div>
    )
}

export default GanttChart   