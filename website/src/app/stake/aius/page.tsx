'use client';
import React from 'react';
import Stake from './Stake';
import Steps from './Steps';
import Process from './Process';
import { Fade } from 'react-awesome-reveal';

export default function AIUS() {
  return (
    <div className='bg-aius-stake py-24'>
      <div className='mx-auto w-mobile-section-width max-w-center-width lg:w-section-width'>
        <div>
          <div className='flex items-center gap-2'>
            <h2 className='lato-regular mb-4 text-[8vw] text-black-text lg:text-header-xl 2xl:text-header-xl'>
              <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
                veAIUS Staking
              </Fade>
            </h2>

            <Fade direction='up' triggerOnce={true}>
              <div className='mb-4 inline-block rounded-2xl bg-[#FAF9F6] px-3 py-2 lg:mb-0'>
                <p className='lato-regular text-[8px] text-[#4A28FF] lg:text-[14px]'>
                  Coming Soon!
                </p>
              </div>
            </Fade>
          </div>
          <div className='flex flex-col justify-between gap-4 lg:flex-row lg:gap-0'>
            <div className='w-[100%] lg:w-[48%]'>
              <Stake />
            </div>
            <div className='w-[100%] lg:w-[48%]'>
              <div className='mb-4'>
                <Steps />
              </div>
              <div>
                <Process />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
