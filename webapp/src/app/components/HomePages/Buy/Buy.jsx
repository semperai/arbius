"use client"
import React from "react"
import white_logo from '@/app/assets/images/white_logo.png'
import arrow from '@/app/assets/images/arrow.png'
import tick from '@/app/assets/images/tick.png'
import Image from "next/image"
import Link from "next/link"
import { Fade} from "react-awesome-reveal";
export default function Buy(){
    const info = [
        "Pay for AI generations",
        "Participate in governance",
        "Accrue fees via delegation",
        "Stake LP for residual income",
        "Earn by validating network",
        "Promote free and open AI"
    ]
    return(
        <div className="bg-white-background py-24 bg-[url('./assets/images/buy_background.png')] bg-no-repeat bg-cover">
            <div className="lg:w-section-width w-mobile-section-width mx-auto max-w-center-width">
                <div className="flex items-center lg:flex-row flex-col justify-between">
                    <div className="lg:w-[70%] w-[100%]">
                        <div>
                            <h2 className="font-Sequel-Sans-Medium-Head lg:text-header text-mobile-header text-black-text mb-6 fade-container">
                                <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
                                    Buy Arbius (AIUS)
                                </Fade>
                            </h2>
                        </div>
                        <div>
                            <Fade direction="up" triggerOnce={true}>
                                <div className="mb-6">
                                    <p className="text-subtext-three font-Sequel-Sans-Light-Body text-para">Arbius is still at an early experimental stage. No expectation of future income is implied. Join our community and see what there is to offer.</p>
                                </div>
                            </Fade>
                            <Fade direction="up" triggerOnce={true}>
                                <div className="flex items-center flex-wrap gap-4">
                                    {
                                        info.map((singleInfo)=>{
                                            return (
                                                <div className="flex items-center gap-2 md:w-[40%] w-[100%]" key={singleInfo} >
                                                <div className="w-[18px] mt-[1px] h-[18px] bg-tick-bacground rounded-full flex items-center justify-center"> 
                                                    <Image src={tick} alt="check mark" width={8}/>
                                                    </div>  
                                                    <p className="text-subtext-three font-Sequel-Sans-Light-Body text-[16px]">{singleInfo}</p>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            </Fade>
                        </div>
                        <Fade direction="up" triggerOnce={true}>
                            <div className="mt-12">
                                <Link href="https://app.uniswap.org/swap" className="inline-block" target="_blank">
                                  <button type="button" className=" relative group bg-black  py-2 px-8 rounded-full flex items-center  gap-3">
                                      <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-10 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        <p className="text-original-white font-Sequel-Sans-Medium-Head mb-1 relative z-10">Buy on Uniswap</p>
                                        <Image src={arrow} width={18} className=" relative z-10"  alt="right arrow"/>
                                    </button>
                                </Link>
                            </div>
                        </Fade>
                    </div>
                    <Fade direction="up" triggerOnce={true}>
                        <div  className="w-[25%] lg:block hidden">
                            <div className="w-[220px] h-[220px] bg-purple-background rounded-[50%] flex items-center justify-center">
                                <Image src={white_logo} width={150} alt="arbius white"/>
                            </div>
                        </div>
                    </Fade>
                </div>
            </div>
        </div>
    )
}