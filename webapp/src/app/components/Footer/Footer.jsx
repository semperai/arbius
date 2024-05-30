"use client"
import React from "react"
import github from '@/app/assets/images/github.png'
import discord from '@/app/assets/images/discord.png'
import telegram from '@/app/assets/images/telegram.png'
import twitter from '@/app/assets/images/twitter.png'
import Image from "next/image"
import Link from "next/link"
import { Fade } from "react-awesome-reveal"
export default function Footer(){
    const footerLinks = [
        {
            id:"1",
            name:"Generate",
            link:"https://arbius.ai/generate"
        },
        {
            id:"2",
            name:"Staking",
            link:"https://app.gysr.io/pool/0xf0148b59d7f31084fb22ff969321fdfafa600c02?network=ethereum"
        },
        {
            id:"3",
            name:"Models",
            link:"https://arbius.ai/models"
        },
        {
            id:"4",
            name:"Explorer",
            link:"https://arbius.ai/explorer"
        },
        {
            id:"5",
            name:"Upgrade",
            link:"https://arbius.ai/upgrade"
        },
        {
            id:"6",
            name:"Docs",
            link:"https://docs.arbius.ai/"
        }
    ]
    const socialIcons = [
        {
            id:"1",
            image:github,
            link:"https://github.com/semperai/arbius",
            alt:"Github"
        },
        {
            id:"2",
            image:twitter,
            link:"https://x.com/arbius_ai",
            alt:"X"
        },
        {
            id:"3",
            image:telegram,
            link:"https://t.me/arbius_ai",
            alt:"Telegram"
        },
        {
            id:"4",
            image:discord,
            link:"https://discord.com/invite/eXxXMRCMzZ",
            alt:"Discord"
        }
    ]
    return(
        <div className="bg-white-background py-20">
            <div className="w-section-width mx-auto max-w-center-width">
            <Fade direction="up" triggerOnce={true}>
                <div className="w-[80%] mx-auto">
                    <div className="flex items-center justify-between">
                        {
                            footerLinks.map((link)=>{
                                return (
                                    <Link href={link.link} target="_blank" key={link.id}>
                                        <div  className="cursor-pointer">
                                            <p className="text-footer-text font-Geist-Regular font-medium text-[18px]">{link.name}</p>
                                        </div>
                                    </Link>
                                )
                            })
                        }
                    </div>
                    <div className="w-[30%] mx-auto mt-10">
                        <div className="flex items-center justify-between">
                        {
                            socialIcons.map((social)=>{
                                return(
                                    <Link href={social.link} target="_blank" key={social.id}>
                                        <div  className="cursor-pointer">
                                            <Image src={social.image} alt={social.alt} width={30}/>
                                        </div>
                                    </Link>
                                )
                            })
                        }
                        </div>
                    </div>
                </div>
              </Fade>  
            </div>
        </div>
    )
}
