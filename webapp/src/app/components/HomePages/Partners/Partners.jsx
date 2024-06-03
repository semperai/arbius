import React from "react";
import weboasis from "../../../assets/images/weboasis.png";
import poloniex from "../../../assets/images/poloniex.png";
import coinex from "../../../assets/images/coinex.png";
import labs from "../../../assets/images/labs.png";
import exabits from "../../../assets/images/exabits.png";
import gysr from "../../../assets/images/gysr.png";
import arbitrum from "../../../assets/images/arbitrum.png";
import Image from 'next/image';

export default function Partners(){
    return (
        <div className="CollaboratorsMarquee">
            <div className="ArbiusPartners flex items-center justify-around p-[80px_0] MarqueeContainer">
                
                <div className="px-5 md:px-0"><Image src={arbitrum} alt="" /></div>
                <div className="px-5 md:px-0"><Image src={labs} alt="" /></div>
                <div className="px-5 md:px-0"><Image src={gysr} alt="" /></div>
                <div className="px-5 md:px-0"><Image src={poloniex} alt="" /></div>
                <div className="px-5 md:px-0"><Image src={coinex} alt="" /></div>
                <div className="px-5 md:px-0"><Image src={exabits} alt="" /></div>
                <div className="relative "><div className="absolute text-[12px] top-[-30px] right-0 text-grey-text">trusted by</div><Image src={weboasis} alt="" /></div>
            </div>
            <div className="ArbiusPartners flex items-center justify-around p-[80px_0] MarqueeContainer" aria-hidden="true">
                
                <div className="px-5 md:px-0"><Image src={arbitrum} alt="" /></div>
                <div className="px-5 md:px-0"><Image src={labs} alt="" /></div>
                <div className="px-5 md:px-0"><Image src={gysr} alt="" /></div>
                <div className="px-5 md:px-0"><Image src={poloniex} alt="" /></div>
                <div className="px-5 md:px-0"><Image src={coinex} alt="" /></div>
                <div className="px-5 md:px-0"><Image src={exabits} alt="" /></div>
                <div className="relative "><div className="absolute text-[12px] top-[-30px] right-0 text-grey-text">trusted by</div><Image src={weboasis} alt="" /></div>
            </div>
        </div>
    )
}
