import React from "react";
import weboasis from "../../../assets/images/weboasis.png";
import poloniex from "../../../assets/images/poloniex.png";
import coinex from "../../../assets/images/coinex.png";
import labs from "../../../assets/images/labs.png";
import exabits from "../../../assets/images/exabits.png";
import nosana from "../../../assets/images/nosana.png";
import arbitrum from "../../../assets/images/arbitrum.png";
import Image from "next/image";

export default function Partners() {

  const partnersData = {
    "arbitrum": {
      "image": arbitrum,
      "url": "https://arbitrum.io/"
    },
    "labs": {
      "image": labs,
      "url": ""
    },
    "nosana": {
      "image": nosana,
      "url": "https://nosana.io/"
    },
    "poloniex": {
      "image": poloniex,
      "url": "https://poloniex.com/"
    },
    "coinex": {
      "image": coinex,
      "url": "https://www.coinex.com/en"
    },
    "exabits": {
      "image": exabits,
      "url": "https://www.exabits.ai/"
    },
    "weboasis": {
      "image": weboasis,
      "url": "https://weboasis.io/"
    }
  }

  return (
    <div className="relative">
      {/* <div className="text-center text-[16px] text-grey-text absolute top-[6px] left-[50%] translate-x-[-50%]">
        trusted by
      </div> */}

      <div className="CollaboratorsMarquee">
        <div className="ArbiusPartners flex items-center justify-around pt-[40px] pb-[40px] MarqueeContainer PartnersMarqueeContainer">
          {
            Object.keys(partnersData).map(function(partner, indedx){
              return <div className="px-8">
                      <a href={partnersData[partner].url}><Image className={partner} src={partnersData[partner].image} alt="" /></a>
                    </div>
            })
          }
        </div>
        <div
          className="ArbiusPartners flex items-center justify-around pt-[40px] pb-[40px] MarqueeContainer PartnersMarqueeContainer"
          aria-hidden="true"
        >
          {
            Object.keys(partnersData).map(function(partner, indedx){
              return <div className="px-8">
                      <a href={partnersData[partner].url}><Image className={partner} src={partnersData[partner].image} alt="" /></a>
                    </div>
            })
          }
        </div>
      </div>
    </div>
  );
}
