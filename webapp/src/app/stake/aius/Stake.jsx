"use client"
import React from "react"
import arbius_logo_without_name from '@/app/assets/images/arbius_logo_without_name.png'
import Image from "next/image"
export default function Stake(){
    return(
        <div>
            <div className="bg-white-background h-[395px] stake-box-shadow rounded-2xl p-8 box-border">
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-stake font-Sequel-Sans-Medium-Head text-[18px]">Amount to lock</p>
                        <p className="text-available font-Sequel-Sans-Light-Body text-[15px]">Available 0.0 AIUS</p>
                    </div>
                    <div>
                        <div className="border border-[#2F2F2F] rounded-3xl flex items-center">
                            <div className="bg-stake-input flex items-center gap-2 justify-center rounded-l-3xl  p-2 box-border">
                                <div className="bg-white-background w-[30px] h-[30px] rounded-[50%] flex items-center justify-center ">
                                   <Image src={arbius_logo_without_name} width={15} alt="arbius"/>
                                </div>
                                <p className="pr- text-aius font-Sequel-Sans-Medium-Head text-[15px]">AIUS</p>
                            </div>
                            <div className="w-[94%]">
                                <input className="w-[100%] border-0 outline-none rounded-r-3xl p-2 font-Sequel-Sans-Medium-Head text-[15px]" type="number" placeholder="0.0"/>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <p className="mt-6 mb-4 text-[22px] font-Sequel-Sans-Medium-Head  text-stake">Locking for 5 months for 0.0 AIUS voting power.</p>
                    <div className="mb-6">
                            <p>Slider</p>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="bg-apr rounded-2xl w-[48%] py-4 px-4 box-border">
                        <p className="text-[16px] font-Sequel-Sans-Light-Body mb-4 text-original-white">APR</p>
                        <p className="text-[20px] font-Sequel-Sans-Medium-Head text-original-white">75%</p>
                    </div>
                    <div className="bg-apr rounded-2xl w-[48%] py-4 px-4 box-border">
                        <p className="text-[16px] font-Sequel-Sans-Light-Body mb-4 text-original-white">ve-AIUS Balance</p>
                        <p className="text-[20px] font-Sequel-Sans-Medium-Head text-original-white">0.00 ve-AIUS</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* Rectangle 30652 */
