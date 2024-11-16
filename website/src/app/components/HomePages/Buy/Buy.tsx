'use client';
import React from 'react';
import white_logo from '@/app/assets/images/white_logo.png';
import arrow from '@/app/assets/images/arrow.png';
import tick from '@/app/assets/images/tick.png';
import Image from 'next/image';
import Link from 'next/link';
import { Fade } from 'react-awesome-reveal';

export default function Buy() {
  const info = [
    'Pay for AI generations',
    'Participate in governance',
    'Accrue fees via staking',
    'Provide LP for rewards',
    'Earn via proof of useful work',
    'Promote free and open AI',
  ];

  return (
    <div className="bg-white-background bg-[url('../app/assets/images/buy_background.png')] bg-cover bg-no-repeat py-16 lg:py-24">
      <div className='mx-auto w-mobile-section-width max-w-center-width lg:w-section-width'>
        <div className='flex flex-col items-center justify-between lg:flex-row'>
          <div className='w-[100%] lg:w-[70%]'>
            <div>
              <h2 className='lato-bold fade-container mb-6 text-mobile-header text-black-text lg:text-header 2xl:text-header-2xl'>
                <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
                  Buy Arbius (AIUS)
                </Fade>
              </h2>
            </div>
            <div>
              <Fade direction='up' triggerOnce={true}>
                <div className='mb-6'>
                  <p className='lato-regular text-para text-subtext-three'>
                    Arbius is still at an early experimental stage. No
                    expectation of future income is implied. Join our community
                    and see what there is to offer.
                  </p>
                </div>
              </Fade>
              <Fade direction='up' triggerOnce={true}>
                <div className='flex flex-wrap items-center gap-4'>
                  {info.map((singleInfo) => {
                    return (
                      <div
                        className='flex w-[100%] items-center gap-2 md:w-[40%]'
                        key={singleInfo}
                      >
                        <div className='mt-[1px] flex h-[18px] w-[18px] items-center justify-center rounded-full bg-tick-bacground'>
                          <Image src={tick} alt='check mark' width={8} />
                        </div>
                        <p className='lato-regular text-[16px] text-subtext-three'>
                          {singleInfo}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Fade>
            </div>
            <Fade direction='up' triggerOnce={true}>
              <div className='mt-12'>
                <Link
                  href='https://app.uniswap.org/swap?outputCurrency=0x8AFE4055Ebc86Bd2AFB3940c0095C9aca511d852'
                  className='inline-block'
                  target='_blank'
                >
                  <button
                    type='button'
                    className='group relative flex items-center gap-3 rounded-full bg-black-background px-8 py-2'
                  >
                    <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-8 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                    <p className='lato-bold relative z-10 text-original-white'>
                      Buy on Uniswap
                    </p>
                    <Image
                      src={arrow}
                      width={18}
                      className='relative z-10'
                      alt='right arrow'
                    />
                  </button>
                </Link>
              </div>
            </Fade>
          </div>
          <Fade direction='up' triggerOnce={true} className=''>
            <div className='hidden lg:block'>
              <div className='ml-[auto] flex h-[220px] w-[220px] items-center justify-center rounded-[50%] bg-purple-background'>
                <Image src={white_logo} width={150} alt='arbius white' />
              </div>
            </div>
          </Fade>
        </div>
      </div>
    </div>
  );
}
