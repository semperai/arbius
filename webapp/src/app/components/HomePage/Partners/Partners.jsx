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
        <div>
            <div className="ArbiusPartners flex items-center justify-around p-[50px_0]">
                <div><Image src={arbitrum} alt="" /></div>
                <div><Image src={labs} alt="" /></div>
                <div><Image src={gysr} alt="" /></div>
                <div><Image src={poloniex} alt="" /></div>
                <div><Image src={coinex} alt="" /></div>
                <div><Image src={exabits} alt="" /></div>
                <div><Image src={weboasis} alt="" /></div>
            </div>
        </div>
    )
}
