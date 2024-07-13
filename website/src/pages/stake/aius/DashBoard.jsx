import React from 'react'
// import Slider from './Slider'
import SlidingCards from './SlidingCards'
import Image from 'next/image'
import aius_icon from "../../../app/assets/images/aius_icon.png"
import GanttChart from './GanttChart'
function DashBoard() {
    return (
        <div className='xl:w-section-width w-mobile-section-width mx-auto max-w-center-width py-24'>
            <div className='flex justify-start items-baseline gap-3'><h1 className='text-[#4A28FF] text-[40px]'>veAIUS Dashboard </h1> <Image src={aius_icon} width={"auto"} height={33} /></div>

            <div className='hidden xl:grid grid-cols-3 gap-10 my-10 mt-14'>
                <div className="col-span-1 h-auto">

                    <div className='rounded-2xl p-8 bg-white-background stake-box-shadow h-full stake-box-shadow'>

                        <h1 className='text-[#4A28FF] text-[20px] font-semibold'>Wallet</h1>
                        <div className='flex justify-start gap-12 mt-6 mb-10'>

                            <div className='flex flex-col gap-6 justify-center items-start'>
                                <div>
                                    <h2 className="text-[14px]  opacity-30 font-semibold">Balance</h2>
                                    <h2 className='text-[16px] font-semibold'>641.12451 AIUS</h2>

                                </div>
                                <div>
                                    <h2 className="text-[14px] opacity-30 font-semibold">Wallet TVL</h2>
                                    <h2 className='text-[16px] font-semibold'>$142.12</h2>

                                </div>

                            </div>
                            <div className='flex flex-col gap-6 justify-center items-start'>
                                <div>
                                    <h2 className="text-[14px] opacity-30 font-semibold">Historical LP Profit %</h2>
                                    <h2 className='text-[16px] font-semibold'>+ 41.12%</h2>

                                </div>
                                <div>
                                    <h2 className="text-[14px] opacity-30 font-semibold">Estimated Total APR</h2>
                                    <h2 className='text-[16px] font-semibold'>12.4512%</h2>

                                </div>

                            </div>

                        </div>
                    </div>
                </div>
                <div className='col-span-2'>

                    <div className='rounded-2xl px-8 py-3 w-full bg-white-background stake-box-shadow'>
                        <h1 className='text-[#4A28FF] text-[20px] font-semibold'>My Stakes</h1>
                    </div>

                    <div className=''>

                        <SlidingCards />

                    </div>

                </div>

            </div>
            <div className='grid grid-cols-1 xl:grid-cols-3 gap-10 my-10 '>
                <div className="col-span-1 block h-full">

                    <div className='rounded-2xl p-8 bg-white-background stake-box-shadow h-full stake-box-shadow'>

                        <h1 className='text-[#4A28FF] text-[20px] font-semibold'>Protocol Info</h1>
                        <div className='flex justify-start xl:justify-start gap-8 lg:gap-[8rem] xl:gap-12 mt-6 mb-10'>

                            <div className='flex flex-col gap-6 justify-center items-start'>
                                <div>
                                    <h2 className="text-[14px]  opacity-30 font-semibold">AIUS Staked</h2>
                                    <h2 className='text-[16px] font-semibold'>15% / $1,500,000</h2>


                                </div>
                                <div>
                                    <h2 className="text-[14px]  opacity-30 font-semibold">Total Supply</h2>
                                    <h2 className='text-[16px] font-semibold'>1,000,000 AIUS</h2>


                                </div>

                            </div>
                            <div className='flex flex-col gap-6 justify-center items-start'>
                                <div>
                                    <h2 className="text-[14px]  opacity-30 font-semibold">AIUS Market Cap</h2>
                                    <h2 className='text-[16px] font-semibold'>$10.04M </h2>


                                </div>
                                <div>
                                    <h2 className="text-[14px]  opacity-30 font-semibold">Circulating supply</h2>
                                    <h2 className='text-[16px] font-semibold'>145,432 AIUS</h2>


                                </div>

                            </div>

                        </div>


                    </div>
                </div>
                <div className='hidden xl:block col-span-2 pl-6 h-full'>

                    <GanttChart/>



                </div>

            </div>

        </div>
    )
}

export default DashBoard