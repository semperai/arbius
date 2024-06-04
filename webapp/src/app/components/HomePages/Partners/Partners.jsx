import React from "react";
import weboasis from "../../../assets/images/weboasis.png";
import poloniex from "../../../assets/images/poloniex.png";
import coinex from "../../../assets/images/coinex.png";
import labs from "../../../assets/images/labs.png";
import exabits from "../../../assets/images/exabits.png";
import gysr from "../../../assets/images/nosana.png";
import arbitrum from "../../../assets/images/arbitrum.png";
import Image from "next/image";

export default function Partners() {
  return (
    <div className="relative">
      <div className="text-center text-[20px]  text-grey-text pt-[20px]">
        trusted by
      </div>

      <div className="CollaboratorsMarquee">
        <div className="ArbiusPartners flex items-center justify-around pt-[20px] pb-[40px] MarqueeContainer">
          <div className="px-8">
            <Image src={arbitrum} alt="" />
          </div>
          <div className="px-8">
            <Image src={labs} alt="" />
          </div>
          <div className="px-8">
            <Image src={gysr} alt="" />
          </div>
          <div className="px-8">
            <Image src={poloniex} alt="" />
          </div>
          <div className="px-8">
            <Image src={coinex} alt="" />
          </div>
          <div className="px-8">
            <Image src={exabits} alt="" />
          </div>
          <div className="px-8 ">
            <Image src={weboasis} alt="" />
          </div>
        </div>
        <div
          className="ArbiusPartners flex items-center justify-around pt-[20px] pb-[40px] MarqueeContainer"
          aria-hidden="true"
        >
          <div className="px-8">
            <Image src={arbitrum} alt="" />
          </div>
          <div className="px-8">
            <Image src={labs} alt="" />
          </div>
          <div className="px-8">
            <Image src={gysr} alt="" />
          </div>
          <div className="px-8">
            <Image src={poloniex} alt="" />
          </div>
          <div className="px-8">
            <Image src={coinex} alt="" />
          </div>
          <div className="px-8">
            <Image src={exabits} alt="" />
          </div>
          <div className="px-8 ">
            <Image src={weboasis} alt="" />
          </div>
        </div>
      </div>
    </div>
  );
}
