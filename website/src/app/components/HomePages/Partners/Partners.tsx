import React from 'react';
import { StaticImageData } from 'next/image';
import weboasis from '../../../assets/images/weboasis.png';
import poloniex from '../../../assets/images/poloniex.png';
import coinex from '../../../assets/images/coinex.png';
import labs from '../../../assets/images/labs.png';
import exabits from '../../../assets/images/exabits.png';
import nosana from '../../../assets/images/nosana.png';
import arbitrum from '../../../assets/images/arbitrum.png';
import unicrow from '../../../assets/images/unicrow_logo.png';
import independent_ai from '../../../assets/images/independent_ai.jpg';
import SIX079 from '../../../assets/images/6079.jpg';
import Image from 'next/image';

type Partner = {
  image: StaticImageData;
  url: string;
}

const partnersData: Record<string, Partner> = {
  arbitrum: {
    image: arbitrum,
    url: 'https://arbitrum.io/',
  },
  labs: {
    image: labs,
    url: 'https://alignmentlab.ai/',
  },
  nosana: {
    image: nosana,
    url: 'https://nosana.io/',
  },
  poloniex: {
    image: poloniex,
    url: 'https://poloniex.com/',
  },
  coinex: {
    image: coinex,
    url: 'https://www.coinex.com/en',
  },
  exabits: {
    image: exabits,
    url: 'https://www.exabits.ai/',
  },
  weboasis: {
    image: weboasis,
    url: 'https://weboasis.io/',
  },
  Unicrow: {
    image: unicrow,
    url: 'https://unicrow.io/',
  },
  independent_ai: {
    image: independent_ai,
    url: "https://independentai.institute/"
  },
  SIX079: {
    image: SIX079,
    url: "https://6079.ai/"
  }
};


export default function Partners() {
  return (
    <div className='relative'>
      <div className='CollaboratorsMarquee'>
        <div className='ArbiusPartners MarqueeContainer PartnersMarqueeContainer flex items-center justify-around pb-[40px] pt-[40px]'>
          {Object.keys(partnersData).map((partner, index) => {
            return (
              <div className='px-8' key={index}>
                <a href={partnersData[partner].url} target='_blank'>
                  <Image
                    className={partner}
                    src={partnersData[partner].image}
                    priority={true}
                    alt=''
                  />
                </a>
              </div>
            );
          })}
        </div>
        <div
          className='ArbiusPartners MarqueeContainer PartnersMarqueeContainer flex items-center justify-around pb-[40px] pt-[40px]'
          aria-hidden='true'
        >
          {Object.keys(partnersData).map((partner, index) => {
            return (
              <div className='px-8' key={index}>
                <a href={partnersData[partner].url} target='_blank'>
                  <Image
                    className={partner}
                    src={partnersData[partner].image}
                    priority={true}
                    alt=''
                  />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
