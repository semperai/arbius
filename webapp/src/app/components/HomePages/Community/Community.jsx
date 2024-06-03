"use client"
import React from "react"
import community_box from '@/app/assets/images/community_box.png'
import arbius_data from '@/app/assets/images/arbius_data.png'
import arrow from '@/app/assets/images/arrow.png'
import Image from "next/image"
import Link from "next/link"
import { Fade} from "react-awesome-reveal";
export default function Community(){
    const platforms = [
        {
            id:"1",
            name:"",
            nameType:"Image",
            content:"Arbius Data is a Block Explorer and Analytics Platform for the Arbius’s network.",
            buttonText:"Visit Arbiusdata",
            link:"https://arbiusdata.io/",
            nameImage:arbius_data,
            background:"bg-[url('./assets/images/arbiusdata_background.png')]",
            hover_background:"hover:bg-[url('./assets/images/arbiusdata_hover_background.png')]"
        },
        {
            id:"2",
            name:"AIUS Swap Market",
            nameType:"",
            content:"This marketplace enables miners to deposit ETH or any ERC-20 token as a reward for AIUS depositors.",
            buttonText:"Visit Swap Market",
            link:"https://app.uniswap.org/swap",
            background:"bg-[url('./assets/images/swap_market_background.png')]",
            hover_background:"hover:bg-[url('./assets/images/swap_market_hover_background.png')]"
        }
    ]
    return (
        <div className="bg-white-background py-24  bg-[url('./assets/images/buy_background.png')] bg-no-repeat bg-cover">
            <div className="lg:w-section-width w-mobile-section-width mx-auto max-w-center-width">
                <div>
                    <div>
                        <div className="mb-6">
                            <h2 className="font-Sequel-Sans-Medium-Head text-header text-black-text fade-container ">
                                <Fade delay={0.1} cascade damping={0.1} triggerOnce={true}> 
                                   dApps & Community
                                </Fade>
                            </h2>
                            <h2 className="font-Sequel-Sans-Medium-Head text-header text-black-text flex items-center gap-4 fade-container">
                                <Fade delay={0.1} cascade damping={0.1} triggerOnce={true}>
                                  Initiatives.
                                </Fade> 
                            <span>
                                <Fade direction="up" triggerOnce={true}>
                                    <Image className="mt-1" src={community_box} width={40} alt="box"/>
                                </Fade>
                            </span>
                            </h2>
                        </div>
                        <Fade direction="up" triggerOnce={true}>
                            <div className="mb-12">
                                <p className="text-subtext-three font-Sequel-Sans-Light-Body text-para">Discover diverse dApps and community initiatives on the Arbius Network, each supported by our DAO and enhancing our blockchain ecosystem with innovative and collaborative services.</p>
                            </div>
                        </Fade>
                    </div>
                    <Fade direction="up" triggerOnce={true}>
                        <div>
                            <div className="flex md:flex-row flex-col md:gap-0 gap-4 items-center justify-between">
                                {
                                    platforms.map((platform)=>{
                                        return (
                                            <div className={`${platform.background}  bg-no-repeat bg-cover rounded-3xl p-6 md:w-[45%] md:h-[250px] w-[95%] h-auto`} key={platform.id}>
                                                <div>
                                                    {
                                                        platform?.nameType==="Image"?
                                                        <Image src={platform?.nameImage} alt={platform?.name} width={150}/>
                                                        :<h3 className="text-card-heading font-Sequel-Sans-Medium-Head text-[25px]">{platform?.name}</h3>
                                                    }
                                                </div>
                                                <div>
                                                    <p className="text-card-heading font-Sequel-Sans-Light-Body text-[16px] mt-6">{platform.content}</p>
                                                </div>
                                                <div className="mt-6">
                                                <Link href={platform.link} target="_blank" className="inline-block">   
                                                    <button type="button" className="relative group bg-black py-2  px-10 rounded-full flex items-center  gap-3">
                                                        <div class="absolute w-[100%] h-[100%] left-0 z-0 py-2 px-10 rounded-full bg-buy-hover opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                                        <p className="relative z-10 text-original-white font-Sequel-Sans-Medium-Head mb-1">{platform.buttonText}</p>
                                                        <Image src={arrow} width={18} className="relative z-10"  alt="right arrow"/>
                                                    </button>
                                                </Link>
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </div>
                    </Fade>
                </div>
            </div>
        </div>
    )
}