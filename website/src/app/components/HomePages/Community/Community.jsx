'use client';
import React from 'react';
import community_box from '@/app/assets/images/community_box.png';
import arbius_data from '@/app/assets/images/Arbiusdata_logo.svg';
import arrow from '@/app/assets/images/arrow.png';
import Image from 'next/image';
import Link from 'next/link';
import { Fade } from 'react-awesome-reveal';
export default function Community() {
  const platforms = [
    {
      id: '1',
      name: '',
      nameType: 'Image',
      content:
        'Arbius Data is a Block Explorer and Analytics Platform for Arbius’ network.',
      buttonText: 'Visit Arbiusdata',
      link: 'https://arbiusdata.io/',
      nameImage: arbius_data,
      background: "bg-[url('../app/assets/images/arbiusdata_background.png')]",
    },
    {
      id: '2',
      name: 'AIUS Swap Market',
      nameType: '',
      content: 'Exchange AIUS in a decentralized way here.',
      buttonText: 'Visit Swap Market',
      link: 'https://swap.cow.fi/#/1/swap/ETH/0x8AFE4055Ebc86Bd2AFB3940c0095C9aca511d852',
      background: "bg-[url('../app/assets/images/swap_market_background.png')]",
    },
  ];
  return (
    <div className="bg-[url('../app/assets/images/buy_background.png')] bg-cover bg-no-repeat py-16 lg:py-24">
      <div className='mx-auto box-border w-mobile-section-width max-w-center-width bg-white-background py-10 lg:w-section-width'>
        <div>
          <div>
            <div className='mb-6'>
              <h2 className='lato-bold fade-container text-mobile-header leading-[60px] text-black-text lg:text-header lg:leading-none 2xl:text-header-2xl'>
                <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
                  dApps & Community
                </Fade>
              </h2>
              <h2 className='lato-bold fade-container flex items-center gap-4 text-mobile-header text-black-text lg:mt-2 lg:text-header 2xl:text-header-2xl'>
                <Fade delay={0.1} cascade damping={0.1} triggerOnce={true}>
                  Initiatives
                </Fade>
                <span>
                  <Fade direction='up' triggerOnce={true}>
                    <Image
                      className='mt-1'
                      src={community_box}
                      width={40}
                      alt='box'
                    />
                  </Fade>
                </span>
              </h2>
            </div>
            <Fade direction='up' triggerOnce={true}>
              <div className='mb-12'>
                <p className='lato-regular w-[100%] text-para text-subtext-three lg:w-[70%]'>
                  Discover diverse dApps and community initiatives on the Arbius
                  Network, each supported by our DAO and enhancing our
                  blockchain ecosystem with innovative and collaborative
                  services.
                </p>
              </div>
            </Fade>
          </div>
          <Fade direction='up' triggerOnce={true}>
            <div>
              <div className='flex flex-col items-center justify-between gap-6 md:flex-row md:gap-0 2xl:justify-start 2xl:gap-[12%]'>
                {platforms.map((platform) => {
                  return (
                    <div
                      className={`${platform.background} relative h-auto w-[95%] rounded-3xl bg-cover bg-no-repeat p-6 md:h-[250px] md:w-[45%] 2xl:w-[30%]`}
                      key={platform.id}
                    >
                      <Link
                        href={platform.link}
                        target='_blank'
                        className='absolute inset-0 z-10 block md:hidden'
                      ></Link>
                      <div>
                        {platform?.nameType === 'Image' ? (
                          <Image
                            src={platform?.nameImage}
                            alt={platform?.name}
                            width={150}
                          />
                        ) : (
                          <h3 className='lato-bold text-[25px] text-[#000000]'>
                            {platform?.name}
                          </h3>
                        )}
                      </div>
                      <div>
                        <p className='lato-regular mt-6 text-[16px] text-card-heading'>
                          {platform.content}
                        </p>
                      </div>
                      <div className='mt-6'>
                        <Link
                          href={platform.link}
                          target='_blank'
                          className='bottom-12 inline-block md:absolute'
                        >
                          <button
                            type='button'
                            className='group relative flex items-center gap-3 rounded-full bg-black-background px-8 py-2'
                          >
                            <div class='md:group-hover:none absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-8 py-2 opacity-0 transition-opacity duration-500 lg:group-hover:opacity-100'></div>
                            <p className='lato-bold relative z-10 text-original-white'>
                              {platform.buttonText}
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
                    </div>
                  );
                })}
              </div>
            </div>
          </Fade>
        </div>
      </div>
    </div>
  );
}
