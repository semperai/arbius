'use client';
import React from 'react';
import right_arrow from '@/app/assets/images/arrow.png';
import Image from 'next/image';
import { Fade } from 'react-awesome-reveal';
import Link from 'next/link';
import Wand from '@/app/assets/images/wand.svg'

export default function MachineLearningSection() {
  return (
    <div className="lato-bold mt-[72px] bg-[url('../app/assets/images/peer_background.jpg')] bg-cover lg:flex lg:h-[75vh] lg:items-center">
      <div className='m-[auto] w-mobile-section-width max-w-center-width py-16 lg:w-section-width lg:p-0 lg:py-24'>
        <div className='w-[100%] xl:w-[65%]'>
          {/*<Fade direction='up' triggerOnce={true}>
            <div className='mb-2 text-[16px] lg:mb-0 lg:text-[12px] px-3 py-2 font-normal text-[#290ACF] bg-[#290ACF14] flex items-center justify-start justify-self-start border-[2px] border-[#4A28FF1A] rounded-[15px]'>
              <Image className="mt-[-2px]" src={Wand} alt="" />
              Welcome to Arbius
            </div>
          </Fade>*/}
          <Fade direction='up' triggerOnce={true}>
            <div className='Gradient-transparent-text mb-2 bg-background-gradient-txt text-[16px] lg:mb-0 lg:text-[12px]'>
              Welcome to Arbius!
            </div>
          </Fade>

          <div className='fade-container hidden text-mobile-header text-black-text lg:block lg:text-header'>
            <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
              Peer-to-peer
            </Fade>
          </div>
          <div className='fade-container mb-6 mt-[-15px] hidden text-mobile-header text-black-text lg:block lg:text-header'>
            <Fade delay={0.1} cascade damping={0.1} triggerOnce={true}>
              machine learning
            </Fade>
          </div>
          <div className='fade-container mb-6 text-mobile-header leading-[50px] text-black-text lg:hidden lg:leading-none'>
            <Fade delay={0.1} cascade damping={0.1} triggerOnce={true} duration={500}>
              Peer-to-peer machine learning
            </Fade>
          </div>

          <div>
            <Fade direction='up' triggerOnce={true}>
              <div className='lato-regular header-para text-para text-subtext-one'>
                Arbius is a decentralized network for machine learning and a
                token with a fixed total supply like Bitcoin. New coins are
                generated with GPU power by participating in the network. There
                is no central authority to create new coins. Arbius is fully
                open-source. Holders vote on-chain for protocol upgrades.
                Models operate as DAOs with custom rules for distribution and rewards,
                providing a way for model creators to earn income.
              </div>
            </Fade>
            <Fade direction='up' triggerOnce={true}>
              <div className='mt-[30px] flex items-center gap-[20px]'>
                <Link href={'https://arbiusplayground.com/chat'} target='_blank'>
                  <div>
                    <button
                      type='button'
                      className='group relative flex items-center gap-3 rounded-full bg-black-background px-5 py-2 lg:px-8'
                    >
                      <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-10 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                      <div className='lato-regular relative z-10 text-original-white lg:text-[100%]'>
                        Try now
                      </div>
                      <Image
                        src={right_arrow}
                        width={18}
                        className='relative z-10'
                        alt='right arrow'
                      />
                    </button>
                  </div>
                </Link>
                <Link href={'https://arbius.ai/paper.pdf'} target='_blank'>
                  <div>
                    <button
                      type='button'
                      className='group relative flex items-center gap-3 rounded-full border-[1px] border-original-black bg-transparent px-5 py-2 text-original-black hover:border-[transparent] hover:text-[white] lg:px-8'
                    >
                      <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-button-gradient px-8 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                      <div className='lato-regular relative z-10 lg:text-[100%]'>
                        Read Whitepaper
                      </div>
                    </button>
                  </div>
                </Link>
              </div>
            </Fade>
          </div>
        </div>
      </div>
    </div>
  );
}
