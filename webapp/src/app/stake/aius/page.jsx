import React from "react"
import Stake from "./Stake"
import Steps from "./Steps"
import Process from "./Process"
export default function AIUS(){
    return(
        <div className="bg-aius-stake py-24">
            <div className="lg:w-section-width w-mobile-section-width mx-auto max-w-center-width">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="lato-regular text-[8vw] lg:text-header-xl 2xl:text-header-xl  text-black-text mb-4">veAIUS Staking</h2>
                        <div className="bg-[#FAF9F6] inline-block py-2 px-3 rounded-2xl">
                            <p className="text-[#4A28FF] text-[8px]  lg:text-[14px] lato-regular">Coming Soon!</p>
                        </div>
                    </div>
                    <div className="flex lg:flex-row flex-col lg:gap-0 gap-4 justify-between">
                        <div className="lg:w-[48%] w-[100%]">
                            <Stake/>
                        </div>
                        <div className="lg:w-[48%] w-[100%]">
                           <div className="mb-4">
                                <Steps/>
                            </div>
                            <div>
                                <Process/>
                            </div> 
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
