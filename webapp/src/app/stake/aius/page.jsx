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
                        <h2 className="font-Sequel-Sans-Medium-Head lg:text-header 2xl:text-header-2xl text-mobile-header text-black-text mb-4">ve-AIUS Staking</h2>
                    </div>
                    <div className="flex justify-between">
                        <div className="w-[48%]">
                            <Stake/>
                        </div>
                        <div className="w-[48%]">
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
