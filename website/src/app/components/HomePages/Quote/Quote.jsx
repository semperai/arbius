'use client';
import React from 'react';
import quote from '@/app/assets/images/quote.png';
import quote_two from '@/app/assets/images/quote_two.png';
import Image from 'next/image';
import { Fade } from 'react-awesome-reveal';
export default function Quote() {
  return (
    <div className='bg-white-background pb-20 pt-10 lg:pb-24 lg:pt-24'>
      <div className='mx-auto w-mobile-section-width max-w-center-width lg:w-section-width'>
        <Fade direction='up' triggerOnce={true}>
          <div className='mx-auto w-[98%] md:w-[90%]'>
            <div>
              <Image src={quote} alt='quote' width={30} />
            </div>
            <div className='mx-auto w-[80%]'>
              <p className='lato-bold text-center text-[20px] text-black-text'>
                The price of any commodity tends to gravitate toward the
                production cost. If the price is below cost, then production
                slows down. If the price is above cost, profit can be made by
                generating and selling more. At the same time, the increased
                production would increase the difficulty, pushing the cost of
                generating towards the price.
              </p>
              <p className='lato-regular mt-6 text-center font-normal text-original-black'>
                -Satoshi Nakamoto
              </p>
            </div>
            <div>
              <Image
                className='ml-auto mt-[-50px]'
                src={quote_two}
                alt='quote'
                width={30}
              />
            </div>
          </div>
        </Fade>
      </div>
    </div>
  );
}
