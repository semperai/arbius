import React from "react";
import weboasis from "../../../assets/images/weboasis.png";
import poloniex from "../../../assets/images/poloniex.png";
import coinex from "../../../assets/images/coinex.png";
import labs from "../../../assets/images/labs.png";
import exabits from "../../../assets/images/exabits.png";
import nosana from "../../../assets/images/nosana.png";
import arbitrum from "../../../assets/images/arbitrum.png";
import unicrow from "../../../assets/images/unicrow_logo.png"
import Image from "next/image";

export default function Partners() {

  const partnersData = {
    "arbitrum": {
      "image": arbitrum,
      "url": "https://arbitrum.io/"
    },
    "labs": {
      "image": labs,
      "url": "https://alignmentlab.ai/"
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
    },
    "Unicrow": {
      "image": unicrow,
      "url": "https://unicrow.io/"
    }
  }

  return (
    <div className="relative">
      <div className="CollaboratorsMarquee">
        <div className="ArbiusPartners flex items-center justify-around pt-[40px] pb-[40px] MarqueeContainer PartnersMarqueeContainer">
          {
            Object.keys(partnersData).map(function (partner, index) {
              return <div className="px-8" key={index}>
                <a href={partnersData[partner].url} target="_blank"><Image className={partner} src={partnersData[partner].image} priority={true} alt="" /></a>
              </div>
            })
          }
        </div>
        <div
          className="ArbiusPartners flex items-center justify-around pt-[40px] pb-[40px] MarqueeContainer PartnersMarqueeContainer"
          aria-hidden="true"
        >
          {
            Object.keys(partnersData).map(function (partner, index) {
              return <div className="px-8" key={index}>
                <a href={partnersData[partner].url} target="_blank"><Image className={partner} src={partnersData[partner].image} priority={true} alt="" /></a>
              </div>
            })
          }
        </div>
      </div>
    </div>
  );
}
