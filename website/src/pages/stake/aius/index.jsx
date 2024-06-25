"use client"
import React from "react"
import Stake from "./Stake"
import Steps from "./Steps"
import Process from "./Process"
import { Fade } from "react-awesome-reveal"
import Header from '@/app/components/Header/Header'
import Footer from '@/app/components/Footer/Footer'

export default function AIUS() {
    return (
        <div className="bg-white-background">
        <Header />
        <div className="bg-aius-stake py-24">
            <div className="lg:w-section-width w-mobile-section-width mx-auto max-w-center-width">
                <div>
                    <div className="flex items-center gap-2">

                        <h2 className="lato-regular text-[8vw] lg:text-header-xl 2xl:text-header-xl  text-black-text mb-4">
                            <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
                                veAIUS Staking
                            </Fade>
                        </h2>

                        <Fade direction="up" triggerOnce={true}>
                            <div className="bg-[#FAF9F6] inline-block py-2 px-3 rounded-2xl mb-4 lg:mb-0">
                                <p className="text-[#4A28FF] text-[8px]  lg:text-[14px] lato-regular">Coming Soon!</p>
                            </div>

                        </Fade>

                    </div>
                    <div className="flex lg:flex-row flex-col lg:gap-0 gap-4 justify-between">
                        <div className="lg:w-[48%] w-[100%]">
                            <Stake />
                        </div>
                        <div className="lg:w-[48%] w-[100%]">
                            <div className="mb-4">
                                <Steps />
                            </div>
                            <div>
                                <Process />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <Footer />
        </div>
    )
}