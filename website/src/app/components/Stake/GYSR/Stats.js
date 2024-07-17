"use client"
import Image from 'next/image';
import React from 'react'
import clock from '../../../assets/images/time_(2).png'
import HintBox from '../../HintBox/Hintbox';
import { useState } from 'react';
function Stats({data}) {
    const [currentHoverId, setCurrentHoverId] = useState(null);
    function epochToDate(epochTime) {
        // Create a new Date object using the epoch time (in milliseconds)
        let date = new Date(epochTime * 1000);
    
        // Extract the date components
        let year = date.getFullYear();
        let month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based, so we add 1
        let day = date.getDate().toString().padStart(2, '0');
        let hours = date.getHours().toString().padStart(2, '0');
        let minutes = date.getMinutes().toString().padStart(2, '0');
        let seconds = date.getSeconds().toString().padStart(2, '0');
    
        // Format the date string
        let formattedDate = `${year}/${month}/${day}`;
    
        return formattedDate;
    }
    function daysBetweenCurrentAndPassedDate(passedDate) {
        // Current date
        const currentDate = new Date();
    
        // Parse the passed date string into a Date object
        const passedDateTime = Date.parse(passedDate);
        if (isNaN(passedDateTime)) {
            return "Invalid date"; // Handle invalid date input
        }
        const passedDateObj = new Date(passedDateTime);
    
        // Calculate the difference in milliseconds
        const timeDifference =   passedDateObj.getTime() - currentDate.getTime() ;
    
        // Convert milliseconds to days
        const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));
    
        return daysDifference + 1;
    }
    const dataConst = [
        {
            time: epochToDate(data.pool.createdTimestamp),
            message: "Pool Created"
        },
        {
            time: epochToDate(data.pool.fundings[0].start),
            message: "Funding 1 starts"
        },
        {
            time: epochToDate(data.pool.fundings[0].end),
            message: "Funding 1 ends"
        },
        {
            time: epochToDate(data.pool.fundings[1].start),
            message: "Funding 2 starts"
        },
        {
            time: epochToDate(data.pool.fundings[1].end),
            message: "Funding 1 ends"
        },
        {
            time: epochToDate(data.pool.end),
            message: "Pool ends"
        },
    ]
    return (
        <>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-mobile-section-width lg:w-section-width m-[auto] py-24 max-w-center-width text-[#101010]">

                <div className="rounded-2xl p-6 lg:p-10 h-[auto]  lg:h-[auto]  bg-white-background stake-card">
                    <div>
                        <h1 className="text-[15px] lg:text-[20px] font-medium text-purple-text">Overview</h1>

                    </div>
                    <div className="mt-6 shadow-none p-6 py-4 rounded-[10px] max-h-[150px] transition-all hover:shadow-stats hover:cursor-pointer bg-[#F9F6FF]" id="totalStaked">
                        <div className="flex justify-start items-baseline" >
                            <h1 className="text-[25px] xl:text-[38px] font-medium text-purple-text">{parseFloat(data.pool.staked).toFixed(2) }</h1>
                            <p className="text-para ml-2 lato-bold">Uni-V2</p>
                            <HintBox
                                content={"Total UNI-V2 staked in this Geyser"}
                                customStyle={{
                                    backgroundColor:"#ffffff",
                                }}
                                link={null}
                                boxStyle={{ width: '200px', top: '50%', zIndex: 10, backgroundColor:"#ffffff" }}
                                hoverId={"totalStaked"}
                                
                                currentHoverId={currentHoverId}
                                setCurrentHoverId={setCurrentHoverId}
                            />
                        </div>
                        <h1 className="text-[8px] xl:text-[13px] font-medium">Currently Staked</h1>
                    </div>
                    <hr className="opacity-100 mt-6" />
                    <div className="flex justify-start gap-[40px] mt-4">
                        <div >
                            <h1 className="text-[24px] text-purple-text">${parseFloat(data.pool.tvl/1000000).toFixed(2) }M</h1>
                            <h2 className="text-[18px] font-medium" onClick={()=>claimRwards()}>Value locked</h2>
                        </div>
                        <div >
                            <h1 className="text-[24px] text-purple-text">$0&nbsp;</h1>
                            <h2 className="text-[18px] font-medium">24Hr Volumes</h2>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl p-6 lg:p-10 h-[auto] lg:h-[auto] bg-white-background stake-card">
                    <div>
                        <h1 className="text-[15px] lg:text-[20px] font-medium text-purple-text">Rewards</h1>
                    </div>
                    <div className="mt-6 shadow-none p-6 py-4 rounded-[10px] max-h-[150px] transition-all  bg-[#F9F6FF]" id="totalStaked">
                        <div className="flex justify-start items-baseline">
                            <h1 className="text-[25px] xl:text-[38px] font-medium text-purple-text">{parseFloat(data.pool.apr).toFixed(2)}%</h1>
                        </div>
                        <h1 className="text-[8px] xl:text-[13px] font-medium uppercase">apr</h1>
                    </div>

                    <hr className="opacity-100 mt-6" />

                    <div className="bg-[#F9F6FF] h-[300px] rounded-[25px]   p-8 mt-8">
                        <div className="">
                            <div className="flex justify-start items-baseline">
                                <h1 className="text-[20px] lg:text-[28px] font-medium">{parseFloat(data?.pool?.funded/1000).toFixed(2)}k&nbsp;</h1>
                                <p className="text-[14px] ">AIUS</p>
                            </div>
                            <h1 className="text-[8px] lg:text-[13px] font-medium">Funded Rewards</h1>
                        </div>
                        <div className="flex justify-start gap-[40px] mt-12 pb-8">
                            <div >
                                <h1 className="text-[20px] lato-bold">{parseFloat((data.pool.funded/1000-data.pool.distributed/1000).toFixed(2))}k AIUS</h1>
                                <h2 className="text-[14px] font-medium">Remaining</h2>
                            </div>
                            <div >
                                <h1 className="text-[20px] lato-bold">{parseFloat(data.pool.distributed/1000).toFixed(2)}k AIUS</h1>
                                <h2 className="text-[14px] font-medium">Distributed</h2>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="rounded-2xl p-6 lg:p-10 h-[auto] lg:h-[auto] bg-white-background stake-card text-[#101010]">
                    <div>
                        <h1 className="text-[15px] lg:text-[20px] font-medium text-purple-text">Schedule</h1>
                    </div>

                    <div className="mt-6 shadow-none p-6 py-4 rounded-[10px] max-h-[150px] transition-all hover:shadow-stats hover:cursor-pointer bg-[#F9F6FF]" id="remaningDyays">
                        <div className="flex justify-start items-baseline">
                            <h1 className="text-[25px] xl:text-[38px] font-medium text-purple-text" > {daysBetweenCurrentAndPassedDate(epochToDate(data.pool.end))}&nbsp;</h1>
                            <HintBox
                                content={"remaining days total in number"}
                                customStyle={{}}
                                link={null}
                                boxStyle={{ width: '200px', top: '50%', zIndex: 10 }}
                                hoverId={"remaningDyays"}
                                currentHoverId={currentHoverId}
                                setCurrentHoverId={setCurrentHoverId}
                            />
                            <p className="text-para ">Days</p>
                        </div>
                        <h1 className="text-[8px] xl:text-[13px] font-medium ">Remaining Duration</h1>




                    </div>
                    <hr className="opacity-100 mt-6 " />
                    <div className="bg-[#F9F6FF] rounded-[25px] p-6 mt-6 flex justify-center h-[300px] overflow-x-scroll" id="custom-scrollbar">
                        <div className="flex items-center relative left-[200px] text-[#101010]">
                            {dataConst?.map((item, idx) => (
                            <div className="relative flex flex-col items-center" key={idx}>
                                {idx % 2 === 0 ? (
                                <div className="text-[12px] relative left-[-50px] w-[100px]">
                                    <div className=' absolute top-[18px] text-left'>
                                    <h1 className='text-[12px] font-medium'>{item?.time}</h1>
                                    <h2 className=' opacity-70 '>{item?.message}</h2>
                                    </div>
                                </div>
                                ) : (
                                <div className="text-[12px] relative left-[-50px] w-[100px]">
                                    <div className='absolute top-[-60px] text-left'>
                                    <h1 className='text-[12px] font-medium'>{item?.time}</h1>
                                    <h2 className=' opacity-70 '>{item?.message}</h2>
                                    </div>
                                </div>
                                )}
                                {
                                    idx==0 || idx==dataConst.length -2?
                                    <div className="border-t-[1px] border-purple-text w-[100px] relative">
                                            <div className="w-[30px] h-[30px] border-[1px] bg-purple-text z-10  rounded-full absolute left-[50%] translate-x-[-50%] top-[50%] translate-y-[-50%] flex justify-center items-center"
                                            style={{left:idx==0?'10px':'90px'}}>
                                                <Image height={'100%'} width={'100%'} src={clock} alt="time"/>
                                            </div>
                                    </div>
                                    :idx==dataConst.length-1?null:<div className="border-t-[1px] border-purple-text w-[100px] relative">
                                    <div className="w-[8px] h-[8px] border-[1px] border-purple-text bg-white-background rounded-full absolute left-[50%] translate-x-[-50%] top-[50%] translate-y-[-50%]"></div>
                                    </div>
                                }
                            </div>
                            ))}
                        </div>
                    </div>





                </div>
            </div>
        </>
    )
}

export default Stats