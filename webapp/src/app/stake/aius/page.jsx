import React from "react"
import Stake from "./Stake"
import Steps from "./Steps"
import Process from "./Process"
export default function AIUS(){
    return(
        <div className="bg-aius-stake py-24">
            <div className="lg:w-section-width w-mobile-section-width mx-auto max-w-center-width">
                <div>
                    <div>
                        <h2 className="lato-bold lg:text-header 2xl:text-header-2xl text-mobile-header text-black-text mb-4">veAIUS Staking</h2>
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
