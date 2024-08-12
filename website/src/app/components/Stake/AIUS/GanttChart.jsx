"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image';
import info_icon from "../../../assets/images/info_icon.png"
import votingEscrow from "../../../abis/votingEscrow.json"
import config from "../../../../sepolia_config.json"
import { useAccount, useContractRead, useContractReads } from 'wagmi';
import { AIUS_wei, t_max } from "../../../Utils/constantValues";

function GanttChart(props) {

    const [windowStartDate, setWindowStartDate] = useState(new Date('2024-02-20'))
    const [windowEndDate, setWindowEndDate] = useState(new Date('2026-02-20'))
    const [noCols, setNoCols] = useState((windowEndDate?.getFullYear() - windowStartDate?.getFullYear()) * 12 + windowEndDate?.getMonth() - windowStartDate?.getMonth())
    const [markedMonths, setMarkedMonths] = useState([])

    console.log({ noCols }, windowStartDate, windowEndDate)


    const [totalEscrowBalance, setTotalEscrowBalance] = useState(0)
    const VOTING_ESCROW_ADDRESS = config.votingEscrowAddress;
    const { address, isConnected } = useAccount()
    const [allStakingData, setAllStakingData] = useState({});

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
            console.log("the loop", i, totalEscrowBalance)
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
    console.log(tokenIDs, "TIOD")
    useEffect(() => {
        console.log(escrowBalanceData, "ESCROW")
        if (escrowBalanceData) {
            setTotalEscrowBalance(Number(escrowBalanceData?._hex))
        }
    }, [escrowBalanceData])


    const stakingData = useContractReads({
        contracts: (tokenIDs) ? tokenIDs.flatMap(tokenId => {
            return [
                {
                    address: VOTING_ESCROW_ADDRESS,
                    abi: votingEscrow.abi,
                    functionName: 'locked',
                    args: [
                        Number(tokenId?._hex)
                    ],
                    enabled: isConnected
                },
                {
                    address: VOTING_ESCROW_ADDRESS,
                    abi: votingEscrow.abi,
                    functionName: 'locked__end',
                    args: [
                        Number(tokenId?._hex)
                    ],
                    enabled: isConnected
                },
                {
                    address: VOTING_ESCROW_ADDRESS,
                    abi: votingEscrow.abi,
                    functionName: 'user_point_history__ts',
                    args: [
                        Number(tokenId?._hex),
                        1
                    ],
                    enabled: isConnected
                },
                {
                    address: VOTING_ESCROW_ADDRESS,
                    abi: votingEscrow.abi,
                    functionName: 'balanceOfNFT',
                    args: [
                        Number(tokenId?._hex)
                    ],
                    enabled: isConnected
                }
            ]
        }) : null
    })
    console.log(stakingData, "stake_dta")

    const veAIUSBalance = (staked, startDate, endDate) => {
        const t = endDate - startDate;
        const a_b = staked + 0
        return a_b * (t / t_max);
    }

    useEffect(() => {
        let finalData = {
            "firstUnlockDate": 0,
            "totalStaked": 0,
            "totalGovernancePower": 0,
            "allStakes": []
        }
        console.log("STA DATA", stakingData?.data?.length)
        let earliestDate = 0;
        let lastDate = 0;

        if (stakingData?.data?.length && stakingData?.data?.[0]) {
            let totalStakes = stakingData.data.length / 4;
            let stakeData = stakingData.data;

            for (let i = 0; i < totalStakes; i++) {
                if(Number(stakeData[(i*4)+1]._hex) > lastDate){
                    lastDate = Number(stakeData[(i*4)+1]?._hex)
                }
                if(Number(stakeData[(i*4)+2]._hex) < earliestDate || earliestDate === 0){
                    earliestDate = Number(stakeData[(i*4)+2]?._hex)
                }
            }
            if(earliestDate && lastDate){
                earliestDate = new Date(earliestDate * 1000);
                lastDate = new Date(lastDate * 1000)
                setWindowStartDate(earliestDate);
                setWindowEndDate(lastDate);
                setNoCols((lastDate.getFullYear() - earliestDate.getFullYear()) * 12 + lastDate.getMonth() - earliestDate.getMonth() + 2)
            }
            console.log(earliestDate, "EARLIEST DATE")

            for (let i = 0; i < totalStakes; i++) {
                finalData["totalStaked"] = finalData["totalStaked"] + Number(stakeData[(i * 4)]?.amount?._hex) / AIUS_wei;
                if (finalData["firstUnlockDate"] == 0 || finalData["firstUnlockDate"] > Number(stakeData[(i * 4) + 1]._hex)) {
                    console.log(finalData["firstUnlockDate"], "FUNLD")
                    finalData["firstUnlockDate"] = Number(stakeData[(i * 4) + 1]._hex);
                }
                finalData["totalGovernancePower"] = finalData["totalGovernancePower"] + Number(stakeData[(i * 4) + 3]._hex) / AIUS_wei;
                finalData["allStakes"].push({
                    "staked": Number(stakeData[(i * 4)]?.amount?._hex) / AIUS_wei,
                    "lockedEndDate": new Date(Number(stakeData[(i * 4) + 1]._hex) * 1000).toLocaleDateString('en-US'),
                    "lockedStartDate": new Date(Number(stakeData[(i * 4) + 2]._hex) * 1000).toLocaleDateString('en-US'),
                    "currentDate": new Date().toLocaleDateString('en-US'),
                    "governancePower": Number(stakeData[(i * 4) + 3]._hex) / AIUS_wei,
                    "veAIUSBalance": veAIUSBalance(
                        Number(stakeData[(i * 4)]?.amount?._hex) / AIUS_wei,
                        Number(stakeData[(i * 4) + 2]._hex),
                        Number(stakeData[(i * 4) + 1]._hex)
                    ),
                    "stake_start": getMonthDifference(new Date(Number(stakeData[(i * 4) + 2]._hex) * 1000), earliestDate),
                    "staked_till_now": getMonthDifference(new Date(), new Date(Number(stakeData[(i * 4) + 2]._hex) * 1000)),
                    "stake_completion": getMonthDifference(new Date(Number(stakeData[(i * 4) + 1]._hex) * 1000), new Date()) 
                })
            }
            finalData["firstUnlockDate"] = parseInt(((new Date(finalData["firstUnlockDate"] * 1000) - new Date().getTime()) / 1000) / 86400)
            finalData["stake_start_date"] = `${earliestDate.toLocaleString('en-us', { month: 'short', year: 'numeric' }).toString().slice(0, 3)},${earliestDate.getFullYear().toString().slice(-2)}`
            console.log(finalData["firstUnlockDate"], "FUND")
        }
        setAllStakingData(finalData)
    }, [stakingData?.data?.length])

    console.log(allStakingData, "ALLSTAKE DATa")
    // pre processing the data for gantt chart dist


    const getMonthDifference = (startDate, endDate) => {
        console.log(startDate, "STARTDATE", startDate.getMonth())
        let diff = (startDate.getFullYear() * 12 + startDate.getMonth()) - (endDate.getFullYear() * 12 + endDate.getMonth())
        return diff
    }
    // data = data.map((item) => {
    //     let stake_start_date = new Date(item.stake_start)
    //     let staked_till_now_date = new Date(item.staked_till_now)
    //     let stake_completion_date = new Date(item.stake_completion)

    //     let stake_start = getMonthDifference(stake_start_date, windowStartDate)
    //     let staked_till_now = getMonthDifference(staked_till_now_date, stake_start_date)
    //     let stake_completion = getMonthDifference(stake_completion_date, staked_till_now_date)

    //     // console.log({ stake_start });
    //     return {
    //         stake_start: stake_start,
    //         staked_till_now: staked_till_now,
    //         stake_completion: stake_completion,


    //         stake_start_date: `${stake_start_date.toLocaleString('en-us', { month: 'short', year: 'numeric' }).toString().slice(0, 3)},${stake_start_date.getFullYear().toString().slice(-2)}`,

    //     }
    // })
    // console.log(data, "HATA")


    useEffect(() => {
        let marked =[];
        console.log({noCols});
        
        // mark every 4th month from windowStartDate to windowEndDate
        for(let i = 0; i < noCols; i++){
            if(i % 4 === 0){
                marked.push({
                    month : windowStartDate.getTime() + i * 30 * 24 * 60 * 60 * 1000,
                    key:i

                })
            }
            if(i === noCols - 1 && noCols %4===0){
                marked.push({
                    month : windowEndDate.getTime() + i * 30 * 24 * 60 * 60 * 1000,
                    key:noCols-1

                })
            }
        }
        console.log(marked, "MARKED")
        
        setMarkedMonths(marked)

    },[noCols, windowStartDate, windowEndDate])

    console.log(allStakingData, "allStakingData")
    
    return (
        <div className='rounded-2xl p-8 px-10 bg-white-background stake-box-shadow relative h-full stake-box-shadow'>
            <h1 className='text-[#4A28FF] text-[20px] font-semibold'>Staking</h1>
            <div className='flex justify-between items-center mt-6 mb-3'>
                <div>
                    <h2 className="text-[14px] text-[#8D8D8D] font-semibold">First unlock in</h2>
                    <h2 className='text-[16px] font-semibold'>{allStakingData?.firstUnlockDate} days</h2>

                </div>
                <div>
                    <h2 className="text-[14px] text-[#8D8D8D] font-semibold">Total Staked</h2>
                    <h2 className='text-[16px] font-semibold'>{allStakingData?.totalStaked?.toFixed(2)} <span className="text-[11px] font-medium">AIUS</span></h2>

                </div>
                <div className='relative'>
                    <h2 className="text-[14px] text-[#8D8D8D] font-semibold">Governance Power</h2>
                    <div className='flex justify-start items-center gap-1'>

                        <h2 className='text-[16px] font-semibold'>{allStakingData?.totalGovernancePower?.toFixed(2)}</h2>
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
                                    item?.staked_till_now === 0 && item?.stake_completion  ===0 && (

                                        <div className={`bg-[#eeeeee] h-[.4rem] my-3 ${item?.staked_till_now === 0 ? 'rounded-full' : 'rounded-r-full'} relative z-20 w-[5%]`} >
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
                                <div className={ markedMonths[containsStakeStart].key === noCols-1 ? `text-end text-[.55rem] text-[#4A28FF]`: 'text-start text-[.55rem] text-[#4A28FF]'} key={key}>
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