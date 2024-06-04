"use client"
import React from "react"
import quote from '@/app/assets/images/quote.png'
import quote_two from '@/app/assets/images/quote_two.png'
import Image from "next/image"
import { Fade} from "react-awesome-reveal";
export default function Quote(){
    return (
        <div className="bg-white-background lg:pt-24 lg:pb-24 pt-10 pb-20">
            <div className="lg:w-section-width w-mobile-section-width mx-auto max-w-center-width">
                <Fade direction="up" triggerOnce={true}>
                    <div className="md:w-[90%] w-[98%] mx-auto" >
                        <div>
                            <Image src={quote} alt="quote" width={30}/>
                        </div>
                        <div className="w-[80%] mx-auto" >
                            <p className="text-black-text font-Sequel-Sans-Medium-Head text-center text-[20px]">The price of any commodity tends to gravitate toward the production cost. If the price is below cost, then production slows down. If the price is above cost, profit can be made by generating and selling more. At the same time, the increased production would increase the difficulty, pushing the cost of generating towards the price.</p>
                            <p className=" mt-6 font-Sequel-Sans-Light-Body text-center text-original-black font-normal">-Satoshi Nakamoto</p>
                        </div>
                        <div >
                            <Image className="ml-auto mt-[-50px]" src={quote_two} alt="quote" width={30}/>
                        </div>
                    </div>
                </Fade>
            </div>
        </div>
    )
}