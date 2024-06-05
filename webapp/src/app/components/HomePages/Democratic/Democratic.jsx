"use client"
import React from "react"
import privacy from '@/app/assets/images/privacy.png'
import ai from '@/app/assets/images/ai.png'
import code from '@/app/assets/images/code.png'
import Image from "next/image"
import { Fade} from "react-awesome-reveal";
import Carousel from "./Carousel"
export default function Democratic(){
    const cardsData=[
        {
            id:"1",
            icon:privacy,
            title:"Secure generation",
            content:"As long as a majority of the miners are honest, tasks are confirmed on a decentralized network and are available within seconds.",
            background:"bg-[url('./assets/images/secure_background.png')]"
        },
        {
            id:"2",
            icon:code,
            title:"Easy Integration",
            content:"Easy Integration. Generations done via Arbius may be directly connected to downstream applications such as webapps, NFT marketplaces, chat-bots or gaming.",
            background:"bg-[url('./assets/images/integration_background.png')]"
        },
        {
            id:"3",
            icon:ai,
            title:"DeFi AI",
            content:"Model creators are able to set a base fee for invocations of their model, delivering revenue to those who hold the models token.",
            background:"bg-[url('./assets/images/ai_background.png')]"
        }
    ]
    return(
        <div className="bg-democratic-gradient py-24">
            <div className="lg:w-section-width w-mobile-section-width mx-auto max-w-center-width">
                <div>
                    <div>
                        <div>
                            <h2 className="font-Sequel-Sans-Medium-Head lg:text-header text-mobile-header text-black-text mb-6 fade-container">
                                <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}> 
                                    We make AI democratic
                                </Fade>
                            </h2>
                            <Fade direction="up" triggerOnce={true}>
                                <p className="text-subtext-three font-Sequel-Sans-Light-Body text-para lg:w-[70%] w-[100%]">Arbius is controlled by its users, not monopolized by large corporations and governments. The design of Arbius makes it difficult or impossible to censor usage, allowing for anyone in the world to interact with AI models permissionlessly.</p>
                            </Fade>
                        </div>
                    </div>
                    <Fade direction="up" triggerOnce={true}>
                        <div>
                            <div className="mt-24 lg:flex hidden items-center justify-between">
                                {
                                    cardsData.map((card)=>{
                                        return (
                                            <div className={`w-[30%] xl:h-[320px] h-[400px] transform transition-all duration-500 hover:-translate-y-1 cursor-pointer ${card.background} bg-no-repeat bg-cover rounded-3xl p-6`} key={card.id}>
                                                <div className="mb-10">
                                                    <Image src={card.icon} alt={card.title} width={20}/>
                                                </div>
                                                <div>
                                                    <h3 className="text-card-heading font-Sequel-Sans-Medium-Head text-[25px]">{card.title}</h3>
                                                </div>
                                                <div>
                                                    <p className="text-card-heading font-Sequel-Sans-Light-Body text-[16px] mt-6">{card.content}</p>
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </div>
                    </Fade>
                    <div className="lg:hidden block">
                        <Carousel cardsData={cardsData}/>
                    </div>
                </div>
            </div>
        </div>
    )
}

