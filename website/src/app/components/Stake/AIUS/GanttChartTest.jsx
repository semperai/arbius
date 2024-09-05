
"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image';
import info_icon from "../../../assets/images/info_icon.png"
import votingEscrow from "../../../abis/votingEscrow.json"
// import config from "../../../../sepolia_config.json"
import loadConfig from './loadConfig';
import { useAccount, useContractRead, useContractReads } from 'wagmi';

import { getTokenIDs, getTotalEscrowBalance, init } from '../../../Utils/gantChart/contractInteractions';
const CustomGanttChart = ({ allStakingData }) => {
    //   const tasks = [
    //   { name: 'Task 1', startDate: '2024-09-01', endDate: '2025-03-15' },
    //   { name: 'Task 2', startDate: '2024-09-02', endDate: '2024-09-25' },
    //   { name: 'Task 3', startDate: '2024-09-03', endDate: '2024-10-05' },
    // ];
    const tasks = allStakingData?.allStakes ? allStakingData?.allStakes : [];
    const today = new Date();
    const earliestStart = new Date(Math.min(...tasks.map(task => new Date(task.startDate))));
    const latestEnd = new Date(Math.max(...tasks.map(task => new Date(task.endDate))));
    const totalDays = (latestEnd - earliestStart) / (1000 * 60 * 60 * 24);
    const getElapsedAndRemainingPercentages = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const totalDuration = endDate - startDate;
        const elapsedDuration = Math.max(0, Math.min(today - startDate, totalDuration));
        const remainingDuration = Math.max(0, totalDuration - elapsedDuration);
        return {
            elapsed: (elapsedDuration / totalDuration) * 100,
            remaining: (remainingDuration / totalDuration) * 100
        };
    };
    const getPositionAndWidth = (start, end) => {
        const startPosition = (new Date(start) - earliestStart) / (1000 * 60 * 60 * 24);
        const width = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24);
        return {
            left: `${(startPosition / totalDays) * 100}%`,
            width: `${(width / totalDays) * 100}%`,
        };
    };
    const generateMonthTimeline = () => {
        const months = [];
        let currentDate = new Date(earliestStart);
        currentDate.setDate(1); // Start from the first day of the month
        while (currentDate <= latestEnd) {
            months.push(new Date(currentDate));
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        return months.map((month, index) => {
            const position = (month - earliestStart) / (1000 * 60 * 60 * 24);
            const width = (index === months.length - 1 ? totalDays - position : 30) / totalDays * 100;
            return (
                <div key={month.toISOString()} className="month-marker" style={{ left: `${(position / totalDays) * 100}%`, width: `${width}%`, color: "#4A28FF" }}>
                    {/*month.toLocaleString('default', { month: 'short', year: 'numeric' })*/}
                    { index % 4 == 0 ?
                        new Intl.DateTimeFormat('en', { year: '2-digit', month: 'short' }).format(month)
                        : ""
                    }
                </div>
            );
        });
    };

    function convertToUSDate(dateString) {
        const date = new Date(dateString);
        
        // Get month, day, and year
        const month = date.getMonth() + 1; // getMonth() returns 0-11
        const day = date.getDate();
        const year = date.getFullYear();
      
        // Pad month and day with leading zeros if necessary
        const formattedMonth = month.toString().padStart(2, '0');
        const formattedDay = day.toString().padStart(2, '0');
      
        // Return the formatted date string
        return `${formattedMonth}/${formattedDay}/${year}`;
      }
    return (

        <div className='rounded-2xl pt-8 px-10 bg-white-background stake-box-shadow relative h-full stake-box-shadow '>
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

            <div className='pt-2' id="gantt-chart">

                <div className="gantt-chart">

                    {tasks.map((task, index) => {
                        const { elapsed, remaining } = getElapsedAndRemainingPercentages(task.startDate, task.endDate);
                        return (
                            <div key={index} className="task-row">
                                <div className="task-info">
                                    {/* <span className="task-name">{task.name}</span>
                                    <span className="task-dates">
                                        {new Date(task.startDate).toLocaleDateString()} - {new Date(task.endDate).toLocaleDateString()}
                                    </span> */}
                                </div>
                                <div className="task-bar-container my-4">
                                    <div
                                        className="task-bar"
                                        style={getPositionAndWidth(task.startDate, task.endDate)}
                                    >
                                        <div className="task-progress-elapsed" style={{ width: `${elapsed}%` }} />
                                        <div className="task-progress-remaining" style={{ width: `${remaining}%` }} />

                                    </div>
                                    <div className='absolute bottom-[8px]  ' style={getPositionAndWidth(task.startDate, task.endDate)} >
                                        <h1 className='text-[.65rem] w-max'><span className='font-semibold opacity-60'>Locked Until</span>  <span className='opacity-100 ml-1'>{convertToUSDate(task?.endDate)}</span></h1>

                                    </div>
                                    <div className='absolute top-[8px] flex justify-between min-w-[160px] ' style={getPositionAndWidth(task.startDate, task.endDate)} >
                                        <h1 className='text-[.65rem] opacity-80 font-semibold text-[#4A28FF] whitespace-pre'>{task?.staked} AIUS Staked</h1>
                                        <h1 className={` text-[.65rem] font-semibold text-[#4A28FF] whitespace-pre`}>{task?.veAIUSBalance?.toFixed(2)} veAIUS</h1>
                                        
                                    </div>

                                </div>
                            </div>
                        );
                    })}
                    <div className="timeline">
                        {generateMonthTimeline()}
                    </div>
                    <style jsx>{`
        .gantt-chart {
          width: 100%;
          padding-top: 30px;
        }
        .timeline {
          position: relative;
          bottom: 0;
          font-size: 0.65rem;
          left: 0;
          right: 0;
          height: 20px;
          display: flex;
        }
        .month-marker {
          height: 100%;
          border-left: 1px solid #ccc;
          padding-left: 5px;
          font-size: 0.8em;
          color: #4A28FF;
        }
        .task-row {
          display: flex;
          margin-bottom: 10px;
          align-items: center;
        }
        .task-info {
          
        }
        .task-name {
          font-weight: bold;
          display: block;
        }
        .task-dates {
          font-size: 0.8em;
          color: #666;
        }
        .task-bar-container {
          flex-grow: 1;
          height: .4rem;
          border-radius: 4rem;
          background-color: #fff;
          position: relative;
        }
        .task-bar {
          position: absolute;
          height: 100%;
          border-radius: 4rem;
          display: flex;
        }
        .task-progress-elapsed {
          height: 100%;
          background-color: #4A28FF;
          border-radius: 4rem;
        }
        .task-progress-remaining {
          height: 100%;
          background-color: #eeeeee;
          border-top-right-radius: 4rem;
          border-bottom-right-radius: 4rem;
          position: relative;
          left: -2px;
        }
      `}</style>
                </div>

            </div>
            { tasks?.length == 0 ? <div className='flex justify-center items-center'>
                <div className=' bg-[#fff] rounded-2xl w-full h-full flex justify-center items-center'>
                    <h1 className='text-[#4A28FF] text-[20px] font-semibold'>No Stakes Found</h1>
                </div>
            </div> : null }

        </div>

    );
};
export default CustomGanttChart;