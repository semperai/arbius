"use client"
import React from "react"
import github from '@/app/assets/images/github.png'
import discord from '@/app/assets/images/discord.png'
import telegram from '@/app/assets/images/telegram.png'
import twitter from '@/app/assets/images/twitter.png'
import Image from "next/image"
import Link from "next/link"
import { Fade } from "react-awesome-reveal"
import arbius_logo from '@/app/assets/images/arbius_logo.png'
import small_arrow from '@/app/assets/images/small_arrow.png'
export default function Footer(){
    const footerLinks = [
        {
            id:"1",
            name:"Generate",
            link:"https://arbius.ai/generate"
        },
        {
            id:"5",
            name:"Upgrade",
            link:"https://arbius.ai/upgrade"
        },
        {
            id:"2",
            name:"Staking",
            link:"https://app.gysr.io/pool/0xf0148b59d7f31084fb22ff969321fdfafa600c02?network=ethereum"
        },
        {
            id:"6",
            name:"Docs",
            link:"https://docs.arbius.ai/"
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
    const scrollTop=()=>{
        // document.querySelector("#scrollToTopButton").addEventListener("click", function() {
            window.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
        //   });
    }
    return(
        <div className="bg-white-background lg:py-20 py-10">
            <div className="lg:w-section-width w-mobile-section-width mx-auto max-w-center-width">
            <Fade direction="up" triggerOnce={true}>
                <div className=" lg:block hidden">
                    <div className="flex justify-between mb-10">
                        <div>
                            <div>
                                <Image src={arbius_logo} className="h-[40px] w-[auto]" alt="arbius"/>
                            </div>
                            <div className="flex items-center gap-4 mt-6">
                                {
                                    socialIcons.map((social)=>{
                                        return (
                                            <Link href={social.link} target="_blank" key={social.id}>  
                                                <div className="bg-white-background footer-icons-shadow w-[50px] h-[50px] rounded-xl flex items-center justify-center">
                                                    <Image src={social.image} alt={social.alt} width={20}/>
                                                </div>
                                            </Link>
                                         )
                                    })
                                }
                            </div>
                           
                        </div>
                        <div>
                            {
                                footerLinks.slice(0,3).map((link)=>{
                                    return(
                                        <Link href={link.link} target="_blank" key={link.id}>
                                            <div>
                                                <p className="text-[#393939] hover:text-purple-text font-Sequel-Sans-Light-Body text-[14px] mb-4">{link.name}</p>
                                            </div>
                                        </Link>
                                    )
                                })
                            }
                        </div>
                        <div>
                            {
                                footerLinks.slice(-3).map((link)=>{
                                    return(
                                        <Link href={link.link} target="_blank" key={link.id}>
                                            <div>
                                                <p className="text-[#393939]  hover:text-purple-text font-Sequel-Sans-Light-Body text-[14px] mb-4">{link.name}</p>
                                            </div>
                                        </Link>
                                    )
                                })
                            }
                        </div>
                        <div>
                            <div className="flex items-center gap-4 cursor-pointer group" onClick={scrollTop}>
                               <p className="text-[#393939] font-Sequel-Sans-Light-Body text-[14px] group-hover:text-purple-text">Back to top</p>
                               <Image src={small_arrow} className="rotate-[-90deg]" alt="arrow" width={8}/>
                            </div>
                        </div>
                    </div>
                            <div className="bg-[#F4F4F4] h-[1.5px] w-[100%]"></div>
                            <div className="mt-10">
                                <p className="text-copyright-text text-[14px] font-Sequel-Sans-Light-Body">&copy; Arbius 2024</p>
                            </div>
                </div>
                <div className="lg:hidden block">
                    <div className="flex lm:flex-row flex-col justify-between w-[100%] ">
                        <div>
                            <div>
                                <Image src={arbius_logo} className="h-[40px] w-[auto]" alt="arbius"/>
                            </div>
                            <div className="flex items-center gap-4 mt-6">
                                {
                                    socialIcons.map((social)=>{
                                        return (
                                            <Link href={social.link} target="_blank" key={social.id}>  
                                                <div className="bg-white-background footer-icons-shadow w-[50px] h-[50px] rounded-xl flex items-center justify-center">
                                                    <Image src={social.image} alt={social.alt} width={20}/>
                                                </div>
                                            </Link>
                                         )
                                    })
                                }
                            </div>
                            <div className="mt-10">
                                <p className="text-copyright-text text-[13px] font-Sequel-Sans-Light-Body">&copy; Arbius 2024</p>
                            </div>
                        </div>
                        <div>
                            <div className="flex lm:flex-col flex-row lm:gap-0 gap-4 lm:mt-0 mt-4 flex-wrap">
                                {
                                    footerLinks.map((link)=>{
                                        return(
                                            <Link href={link.link} target="_blank" key={link.id}>
                                                <div>
                                                    <p className="text-[#393939] font-Sequel-Sans-Light-Body text-right font-medium text-[16px]">{link.name}</p>
                                                </div>
                                            </Link>
                                        )
                                    })
                                }
                            </div>
                        </div>
                    </div>
                </div>
              </Fade>  
            </div>
        </div>
    )
}

