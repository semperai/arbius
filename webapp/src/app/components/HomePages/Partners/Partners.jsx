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
      {/* <div className="text-center text-[16px] text-grey-text absolute top-[6px] left-[50%] translate-x-[-50%]">
        trusted by
      </div> */}

      <div className="CollaboratorsMarquee">
        <div className="ArbiusPartners flex items-center justify-around pt-[40px] pb-[40px] MarqueeContainer PartnersMarqueeContainer">
          <div className="px-8">
            <Image className="arbitrum" src={arbitrum} alt="" />
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
          className="ArbiusPartners flex items-center justify-around pt-[40px] pb-[40px] MarqueeContainer PartnersMarqueeContainer"
          aria-hidden="true"
        >
          <div className="px-8">
            <Image className="arbitrum" src={arbitrum} alt="" />
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
