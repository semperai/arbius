import React from 'react'
import Image from 'next/image';
import info_icon from "../../../app/assets/images/info_icon.png"
function GanttChart() {
    let windowStartDate = '2024-02-20'
    let windowEndDate = '2026-02-20';

    windowStartDate = new Date(windowStartDate)
    windowEndDate = new Date(windowEndDate)


    let data = [
        {
            stake_start: '2024-06-20',
            staked_till_now: '2024-10-20',
            stake_completion: '2025-11-25'
        },
        {
            stake_start: '2024-11-20',
            staked_till_now: '2025-11-20',
            stake_completion: '2026-01-25'
        },
        {
            stake_start: '2024-02-20',
            staked_till_now: '2024-10-20',
            stake_completion: '2026-02-20'
        },

    ]
    // pre processing the data for gantt chart dist


    const getMonthDifference = (startDate, endDate) => {
        let diff = (startDate.getFullYear() * 12 + startDate.getMonth()) - (endDate.getFullYear() * 12 + endDate.getMonth())
        return diff
    }
    data = data.map((item) => {
        let stake_start_date = new Date(item.stake_start)
        let staked_till_now_date = new Date(item.staked_till_now)
        let stake_completion_date = new Date(item.stake_completion)

        let stake_start = getMonthDifference(stake_start_date, windowStartDate)
        let staked_till_now = getMonthDifference(staked_till_now_date, stake_start_date)
        let stake_completion = getMonthDifference(stake_completion_date, staked_till_now_date)

        console.log({ stake_start });
        return {
            stake_start: stake_start,
            staked_till_now: staked_till_now,
            stake_completion: stake_completion,


            stake_start_date: `${stake_start_date.toLocaleString('en-us', { month: 'short', year: 'numeric' }).toString().slice(0, 3)},${stake_start_date.getFullYear().toString().slice(-2)}`,

        }
    })
    return (
        <div className='rounded-2xl p-8 px-10 bg-white stake-box-shadow relative h-full stake-box-shadow'>
            <h1 className='text-[#4A28FF] text-[20px] font-semibold'>Staking</h1>
            <div className='flex justify-between items-center mt-6 mb-3'>
                <div>
                    <h2 className="text-[14px] opacity-30">First unlock in</h2>
                    <h2 className='text-[16px]'>95 Days</h2>

                </div>
                <div>
                    <h2 className="text-[14px] opacity-30">Total Staked</h2>
                    <h2 className='text-[16px]'>340.21 AIUS</h2>

                </div>
                <div className='relative'>
                    <h2 className="text-[14px] opacity-30">Governance Power</h2>
                    <div className='flex justify-start items-center gap-1'>

                        <h2 className='text-[16px]'>25</h2>
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

                    <div id='info' className='hidden absolute top-12 left-0  bg-white stake-box-shadow p-2 rounded-xl z-40 w-[150px]'>
                        <h1 className='text-[.5rem] opacity-30'>As your stake(s) age, this value decays from the original veAIUS balance. To increase this value, extend your stake(s). </h1>
                    </div>



                </div>


            </div>

            <div className='max-h-[144px] overflow-y-auto mb-2 relative'>

                {
                    data?.map((item, key) => {
                        return <div className=' my-3'>


                            <div className='item-grid' key={key}>

                                {item?.stake_start !== 0 && (

                                    <div className={`   bg-transparent h-[.4rem] my-3 rounded-full  z-20`} style={{
                                        gridColumn: `span ${item?.stake_start} / span ${item?.stake_start}`
                                    }}>
                                    </div>
                                )}


                                {item?.staked_till_now !== 0 && (

                                    <div className={` bg-[#4A28FF] h-[.4rem] my-3 rounded-full relative z-20`} id='start-stake' style={{
                                        gridColumn: `span ${item?.staked_till_now} / span ${item?.staked_till_now}`
                                    }}>
                                        <h1 className='absolute left-0 bottom-[8px] text-[.6rem] opacity-30'>Locked Until</h1>
                                        <h1 className='absolute left-0 top-[8px] text-[.6rem] opacity-30 text-[#4A28FF]'>7.021 AIUS Staked</h1>
                                    </div>
                                )}
                                {
                                    item?.stake_completion !== 0 && (

                                        <div className={` bg-gray-300  h-[.4rem] my-3 rounded-r-full relative z-20`} style={{
                                            gridColumn: `span ${item?.stake_completion} / span ${item?.stake_completion}`
                                        }}>
                                            <h1 className='absolute right-0 bottom-[8px] text-[.7rem] text-[#4A28FF] min-w-[90px]'>14.12 veAIUS</h1>
                                        </div>
                                    )
                                }

                            </div>
                        </div>
                    })
                }

            </div>

            <div className='item-grid absolute bottom-[1.25rem] px-10 right-0 left-0'>
                {
                    Array(24).fill(null).map((item, key) => {
                        let containsStakeStart = data.findIndex(item => item.stake_start === key);
                        console.log({ containsStakeStart });
                        if (containsStakeStart !== -1)
                            return (
                                <div className='text-start text-[.55rem] text-[#4A28FF]'>
                                    <h1>{data[containsStakeStart].stake_start_date}</h1>

                                </div>
                            )

                        else
                            return <div></div>
                    })
                }

            </div>
            <div className='item-grid absolute bottom-[.0rem] right-0 left-0 px-10'>

                {
                    Array(24).fill(null).map((item, key) => {
                        return <div className={key == 23 ? 'w-full border-x-[1px] border-[#4828ff4f] pt-2' : 'w-full border-l-[1px] border-[#4828ff4f] pt-2'}>
                            <div className='w-full bg-[#EDEDED] h-[.35rem]'>

                            </div>

                        </div>
                    })
                }

            </div>
        </div>
    )
}

export default GanttChart   