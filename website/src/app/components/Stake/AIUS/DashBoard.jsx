import React from 'react'
// import Slider from './Slider'
import SlidingCards from './SlidingCards'
import Image from 'next/image'
import aius_icon from "../../../assets/images/aius_icon.png"
import gysr_logo_wallet from "../../../assets/images/gysr_logo_wallet.png"
import GanttChart from './GanttChart'
function DashBoard() {
    return (
        <div className='xl:w-section-width w-mobile-section-width text-black-text mx-auto max-w-center-width py-16' id="dashboard">
            <div className='flex justify-start items-baseline gap-3'><h1 className='text-[#4A28FF] lato-bold text-[40px]'>veAIUS Dashboard </h1> <Image src={aius_icon} width={"auto"} height={33} /></div>

            <div className='hidden xl:grid grid-cols-3 gap-10 my-10 mt-14'>
                <div className="col-span-1 h-auto">

                    <div className='rounded-2xl p-8 bg-white-background stake-box-shadow h-full stake-box-shadow'>

                        <h1 className='text-[#4A28FF] text-[20px] font-semibold'>Wallet</h1>
                        <div className='grid grid-cols-2 2xl:gap-[2vw] mt-6 xl:mt-8 mb-10'>

                            <div className='flex flex-col gap-8 justify-center items-start'>
                                <div>
                                    <h2 className="text-[14px]  text-[#8D8D8D] font-semibold">Balance</h2>
                                    <h2 className='text-[16px] 2xl:text-[18px] font-semibold mt-[2px]'>641.12451 AIUS</h2>

                                </div>
                                <div>
                                    <h2 className="text-[14px] text-[#8D8D8D] font-semibold">Historical LP Profit %</h2>
                                    <div className='flex justify-start items-center gap-2 mt-[2px]'> <h2 className='text-[16px] 2xl:text-[18px] font-semibold'>+ 41.12%</h2>
                                        <Image src={gysr_logo_wallet} width={22} height={22} />
                                    </div>

                                </div>


                            </div>
                            <div className='flex flex-col gap-8 justify-center items-start'>
                                <div>
                                    <h2 className="text-[14px] text-[#8D8D8D] font-semibold">Wallet TVL</h2>
                                    <h2 className='text-[16px] 2xl:text-[18px] font-semibold mt-[2px]'>$142.12</h2>

                                </div>

                                <div>
                                    <h2 className="text-[14px] text-[#8D8D8D] font-semibold">Estimated Total APR</h2>
                                    <h2 className='text-[16px] 2xl:text-[18px] font-semibold mt-[2px]'>12.4512%</h2>

                                </div>

                            </div>

                        </div>
                    </div>
                </div>
                <div className='col-span-2 '>

                    <div className='pl-2'>
                        <div className='rounded-2xl px-8 py-3 w-full bg-white-background stake-box-shadow mb-2'>
                            <h1 className='text-[#4A28FF] text-[20px] font-semibold'>My Stakes</h1>
                        </div>
                    </div>

                    <div className=''>

                        <SlidingCards />

                    </div>

                </div>

            </div>
            <div className='grid grid-cols-1 xl:grid-cols-3 gap-10 my-10 '>
                <div className="col-span-1 block h-auto">

                    <div className='rounded-2xl p-8 bg-white-background stake-box-shadow h-full stake-box-shadow'>

                        <h1 className='text-[#4A28FF] text-[20px] font-semibold'>Protocol Info</h1>
                        <div className='grid grid-cols-2 2xl:gap-[2vw] mt-6 xl:mt-8 mb-10'>

                            <div className='flex flex-col gap-8  justify-center items-start'>
                                <div>
                                    <h2 className="text-[14px]  text-[#8D8D8D] font-semibold">AIUS Staked</h2>
                                    <h2 className='text-[16px] 2xl:text-[18px] font-semibold mt-[2px]'>15% / $1,500,000</h2>


                                </div>
                                <div>
                                    <h2 className="text-[14px]  text-[#8D8D8D] font-semibold">Total Supply</h2>
                                    <h2 className='text-[16px] 2xl:text-[18px] font-semibold mt-[2px]'>1,000,000 AIUS</h2>


                                </div>

                            </div>
                            <div className='flex flex-col gap-8  justify-center items-start'>
                                <div>
                                    <h2 className="text-[14px]  text-[#8D8D8D] font-semibold">AIUS Market Cap</h2>
                                    <h2 className='text-[16px] 2xl:text-[18px] font-semibold mt-[2px]'>$10.04M </h2>


                                </div>
                                <div>
                                    <h2 className="text-[14px]  text-[#8D8D8D] font-semibold">Circulating supply</h2>
                                    <h2 className='text-[16px] 2xl:text-[18px] font-semibold mt-[2px]'>145,432 AIUS</h2>


                                </div>

                            </div>

                        </div>


                    </div>
                </div>
                <div className='hidden xl:block col-span-2 pl-2 h-full'>

                    <GanttChart />



                </div>

            </div>

        </div>
    )
}

export default DashBoard