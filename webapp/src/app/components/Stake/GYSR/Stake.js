import React from 'react'
import { useState } from 'react'
import walletImage from '../../../assets/images/ion_wallet-outline.png'
import Image from 'next/image'
function Stake() {
    const [isStakeClicked, setIsStakeClicked] = useState(false)
    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-mobile-section-width lg:w-[90%] m-[auto]">

                {isStakeClicked ? (<>
                    <div className="rounded-2xl p-6 lg:p-10 flex flex-col justify-between h-[500px] bg-white-background stake-card">
                        <div>
                            <h1 className="text-[15px] lg:text-[20px] font-medium">Stake</h1>
                            <div className="flex justify-start items-end mt-6 gap-20">

                                <div>
                                    <div className="flex justify-start items-baseline">
                                        <h1 className="text-[25px] lg:text-[30px] font-medium">0.000</h1>
                                        <p className="text-para ">Uni-V2</p>
                                    </div>
                                    <h1 className="text-[8px] lg:text-[13px] font-medium">Wallet Balance</h1>

                                </div>


                                <div>
                                    <div className="flex justify-start items-baseline">
                                        <h1 className="text-[25px] lg:text-[30px] font-medium">90</h1>
                                        <p className="text-para ">Days</p>
                                    </div>
                                    <h1 className="text-[8px] lg:text-[13px] font-medium">Bonus Period</h1>
                                </div>

                            </div>
                            <div className="rounded-[25px]  flex justify-center w-[100%] mt-6">
                                <input className="p-2 lg:p-3 border-[1px] border-r-0 rounded-l-[25px] rounded-r-none w-[70%] focus:outline-none" placeholder="Amount of UNI-V2 to stake" />
                                <div className="p-2 lg:p-3 w-[30%] rounded-r-[25px] rounded-l-none  border-[1px] border-l-0 bg-[#E6DFFF] flex justify-center gap-2 lg:gap-4 items-center">
                                    <h className="text-[10px] lg:text-[15px] font-medium">UNI-V2</h>
                                    <div className=" bg-[#5E40FD] rounded-full px-3 py-[1px] text-original-white flex items-center">
                                        <p className="text-[6px] lg:text-[12px] pb-[2px]">max</p>
                                    </div>
                                </div>
                            </div>

                        </div>


                        <div className="flex justify-end items-center gap-4">
                            <button type="button" className="relative group bg-black py-2  px-8 rounded-full flex items-center  gap-3" onClick={() => setIsStakeClicked(true)}>
                                <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-8 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <p className="relative z-10 text-original-white text-[13px] font-Sequel-Sans-Medium-Head mb-[1px]">Approve SUNI-V2</p>
                            </button>

                            <button type="button" className="relative group bg-[#121212] py-2 bg-opacity-5 px-8 rounded-full flex items-center  gap-3" onClick={() => setIsStakeClicked(true)}>
                                <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-8 rounded-full  opacity-0  transition-opacity duration-500"></div>
                                <p className="relative z-10 text-[#101010] opacity-30 text-[15px] font-Sequel-Sans-Medium-Head mb-[1px]">Stake</p>
                            </button>
                        </div>

                    </div>

                    <div className="rounded-2xl p-6 lg:p-10 flex flex-col justify-between h-[500px] bg-white-background stake-card">

                        <div>
                            <h1 className="text-[15px] lg:text-[20px] font-medium">Unstake</h1>
                            <div className="flex justify-start items-end mt-6 mb-8 gap-[100px]">

                                <div>
                                    <div className="flex justify-start items-baseline">
                                        <h1 className="text-[25px] lg:text-[30px] font-medium">0</h1>
                                        <p className="text-para ">Uni-V2</p>
                                    </div>
                                    <h1 className="text-[8px] lg:text-[13px] font-medium">Wallet Balance</h1>
                                </div>


                                <div>
                                    <div className="flex justify-start items-baseline">
                                        <h1 className="text-[25px] lg:text-[30px] font-medium">0</h1>
                                        <p className="text-para ">AIUS</p>
                                    </div>
                                    <h1 className="text-[8px] lg:text-[13px] font-medium">Claimable Rewards</h1>


                                </div>

                            </div>

                            <hr className="opacity-10" />

                            <div className="flex justify-start gap-[50px] mt-4">
                                <div >

                                    <h1 className="text-[16px]">382 AIUS</h1>
                                    <h2 className="text-[15px] font-medium">Global Unlocked</h2>

                                </div>
                                <div >

                                    <h1 className="text-[16px]">-</h1>
                                    <h2 className="text-[15px] font-medium">Total Mult</h2>

                                </div>
                                <div >

                                    <h1 className="text-[16px]">-</h1>
                                    <h2 className="text-[15px] font-medium">Time Staked</h2>

                                </div>
                            </div>
                            <div className="rounded-[25px]  flex justify-center w-[100%] mt-6">
                                <input className="p-2 lg:p-3 border-[1px] border-r-0 rounded-l-[25px] rounded-r-none w-[70%] focus:outline-none" placeholder="Amount of UNI-V2 to stake" />
                                <div className="p-2 lg:p-3 w-[30%] rounded-r-[25px] rounded-l-none  border-[1px] border-l-0 bg-[#E6DFFF] flex justify-center gap-2 lg:gap-4 items-center">
                                    <h className="text-[10px] lg:text-[15px] font-medium">UNI-V2</h>
                                    <div className=" bg-[#5E40FD] rounded-full px-3 py-[1px] text-original-white flex items-center">
                                        <p className="text-[6px] lg:text-[12px] pb-[2px]">max</p>
                                    </div>
                                </div>


                            </div>
                            <div className="flex justify-between items-center">
                                <div className="w-[70%] flex justify-start items-end gap-4">
                                    <div className="rounded-[25px]  flex justify-center w-[100%] mt-6">
                                        <input className="p-2 lg:p-3 border-[1px] border-r-0 rounded-l-[25px] rounded-r-none w-[70%] focus:outline-none" placeholder="0" />
                                        <div className="p-2 lg:p-3 w-[50%] rounded-r-[25px] rounded-l-none  border-[1px] border-l-0 bg-[#E6DFFF] flex justify-center gap-2 lg:gap-4 items-center">
                                            <h className="text-[10px] lg:text-[15px] font-medium">GYSR</h>
                                            <div className=" bg-[#5E40FD] rounded-full px-3 py-[1px] text-original-white flex items-center">
                                                <p className="text-[6px] lg:text-[12px] pb-[2px]">max</p>
                                            </div>
                                        </div>


                                    </div>
                                    <div>
                                        <h1 className="text-[30px] font-medium">1.00x</h1>
                                    </div>
                                </div>

                                <div className="text-[#101010] text-[15px] text-opacity-10 font-medium mt-4 pr-4">
                                    <h1 className="">You'll Receive</h1>
                                    <h1>0.000 AIUS</h1>

                                </div>


                            </div>

                            <div className="flex justify-end items-center gap-4 mt-6">
                                <button type="button" className="relative group bg-[#121212] py-2 bg-opacity-5 px-8 rounded-full flex items-center  gap-3" onClick={() => setIsStakeClicked(true)}>
                                    <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-8 rounded-full  opacity-0  transition-opacity duration-500"></div>
                                    <p className="relative z-10 text-[#101010] opacity-30 text-[15px] font-Sequel-Sans-Medium-Head mb-[1px]">Stake</p>

                                </button>
                                <button type="button" className="relative group bg-[#121212] py-2 bg-opacity-5 px-8 rounded-full flex items-center  gap-3" onClick={() => setIsStakeClicked(true)}>
                                    <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-8 rounded-full  opacity-0  transition-opacity duration-500"></div>
                                    <p className="relative z-10 text-[#101010] opacity-30 text-[15px] font-Sequel-Sans-Medium-Head mb-[1px]">Stake</p>

                                </button>
                            </div>
                        </div>



                    </div>

                </>) : (<>
                    <div className="rounded-2xl p-6 lg:p-10 flex flex-col justify-between h-[350px] lg:h-[500px] bg-white-background stake-card">
                        <div>
                            <h1 className="text-[15px] lg:text-[20px] font-medium">Stake</h1>
                            <p className="text-[11px] lg:text-para mt-6">Please connect a wallet to interact with this pool!</p>
                        </div>


                        <div className="flex justify-center items-center ">

                            <div className="relative w-[100px] h-[100px] lg:w-[150px] lg:h-[150px]">

                                <Image src={walletImage} fill />

                            </div>

                        </div>
                        <div className="flex justify-center lg:justify-end">

                            <button type="button" className="relative group bg-black py-2  px-8 rounded-full flex items-center  gap-3 w-[100%] lg:w-[auto]" onClick={() => setIsStakeClicked(true)}>
                                <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-8 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <p className="relative z-10 text-original-white font-Sequel-Sans-Medium-Head mb-1 w-[100%] lg:w-[auto]">Connect Wallet</p>

                            </button>

                        </div>

                    </div>

                    <div className="rounded-2xl p-6 lg:p-10 flex flex-col justify-between h-[350px] lg:h-[500px] bg-white-background stake-card">
                        <div>
                            <h1 className="text-[15px] lg:text-[20px] font-medium">Unstake</h1>
                            <p className="text-[11px] lg:text-para mt-6">Please connect a wallet to interact with this pool!</p>
                        </div>


                        <div className="flex justify-center items-center ">

                            <div className="relative w-[100px] h-[100px] lg:w-[150px] lg:h-[150px]">

                                <Image src={walletImage} fill />

                            </div>

                        </div>
                        <div className="flex justify-center lg:justify-end">

                            <button type="button" className="relative group bg-black py-2  px-8 rounded-full flex items-center  gap-3 w-[100%] lg:w-[auto]" onClick={() => setIsStakeClicked(true)}>
                                <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-8 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <p className="relative z-10 text-original-white font-Sequel-Sans-Medium-Head mb-1 w-[100%] lg:w-[auto]">Connect Wallet</p>

                            </button>

                        </div>

                    </div>
                </>)}


            </div>

        </>
    )
}

export default Stake