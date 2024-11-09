'use client';
import React from 'react';
import Image from 'next/image';
import { Fade } from 'react-awesome-reveal';
import Link from 'next/link';
import arrow from '../assets/images/right_arrow.png';
import step1 from '../assets/images/staking_upgrade.jpg';
import step2 from '../assets/images/amica_update_2.jpg';
import step3 from '../assets/images/tokenomics_upgrade.jpg';
import step4 from '../assets/images/kasumi_upgrade.jpg';
import step5 from '../assets/images/partnership_update.jpg';
import { useEffect } from 'react';
import amica_update_2 from '../assets/images/amica_update_2.jpg';
import amica_launch from '../assets/images/amica_launch.jpg';
import amica_token_launch from '../assets/images/amica_token_launch.jpg';
import pre_launch from '../assets/images/pre_launch.jpg';
import VideoThumbnail from '../components/VideoComponent/videoThumbnail';

const posts = [
  {
    title: 'Introducing AIUS Staking',
    description:
      '$AIUS staking is being worked on. Staked holders can enjoy a constant APR/APY and wield their voting power to determine which AI models will receive more rewards. Get ready to shape the future of computing and network incentives.',
    date: 'May 27, 2024',
    image: step1,
    url: 'https://x.com/arbius_ai/status/1795184308199551008',
  },
  {
    title: 'Arbius Network Upgrade ',
    description:
      'The Arbius Network Upgrade is imminent. The Arbius network is about to undergo its most significant upgrade since its launch. We are introducing a new feature where task creators will now receive a 10% reward from the rewards pool. This will add new possibilities for users.',
    date: 'April 30, 2024',
    image: step3,
    url: 'https://x.com/arbius_ai/status/1785401938550444218',
  },
  {
    title: 'Kasumi-2 Demo Video',
    description:
      'We are thrilled to announce Kasumi2 Open Beta. Kasumi2 is an autonomous AI agent that performs actions in the Arbius network. It is a miner, has its own wallet, can retrieve results from Arbius AI models, and runs its own individual LLM model.',
    date: 'April 27, 2024',
    image: step4,
    url: 'https://x.com/arbius_ai/status/1783980046111150589',
  },
  {
    title: 'Amica Launch Trailer',
    description: '',
    date: 'March 21, 2024',
    image: amica_launch,
    url: 'https://x.com/arbius_ai/status/1770547201669746702',
  },
  {
    title: 'Arbius Launch Video',
    description: '',
    date: 'February 14, 2024',
    image: amica_token_launch,
    url: 'https://x.com/arbius_ai/status/1757597553456017507/video/1',
  },
  {
    title: 'Pre-Launch Video ',
    description: '',
    date: 'February 2, 2024',
    image: pre_launch,
    url: 'https://x.com/arbius_ai/status/1753478542497607913/video/1',
  },
];
export default function ArbiusMedia() {
  return (
    <div className='h-[100%] w-[100%] bg-media-gradient py-20'>
      <div className='m-[auto] w-mobile-section-width max-w-center-width lg:w-[90%] lg:p-0 xl:w-section-width'>
        <div className='pb-10 pt-10'>
          <div className='flex flex-col items-center justify-between pb-5 lg:flex-row'>
            <div className='w-[100%] lg:w-[70%] 2xl:w-[50%]'>
              <div>
                <h2 className='lato-regular fade-container mb-2 text-mobile-header text-black-text lg:text-header-xl 2xl:text-header-xl'>
                  <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
                    Arbius Media
                  </Fade>
                </h2>
              </div>
              <div>
                <Fade direction='up' triggerOnce={true}>
                  <div className='mb-4'>
                    <p className='lato-regular text-large-description text-subtext-three'>
                      See what’s happening across the Arbius Ecosystem.
                    </p>
                  </div>
                </Fade>
              </div>
              <Link href='https://x.com/arbius_ai' target='_blank'>
                <button
                  type='button'
                  className='group relative flex items-center gap-3 rounded-full border-[1px] border-original-black bg-white-background px-8 py-2 hover:border-original-white'
                >
                  <div class='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-8 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                  <p className='lato-bold relative z-10 text-original-black group-hover:text-original-white'>
                    View more
                  </p>
                  <Image
                    src={arrow}
                    width={18}
                    className='relative z-10 invert filter group-hover:filter-none'
                    alt='right arrow'
                  />
                </button>
              </Link>
            </div>
          </div>
        </div>
        <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'>
          {posts.map((post, index) => (
            <div key={index}>
              <div
                id='image-parent'
                className='relative flex h-[260px] w-[350px] items-center justify-center rounded-[30px] border-transparent bg-models-gradient'
              >
                <VideoThumbnail
                  thumbnailSrc={post.image}
                  altText='kokok'
                  url={post.url}
                />
              </div>
              <div className='p-2'>
                <h2 className='lato-bold text-large-description text-black-text'>
                  {post.title}
                </h2>
                <p className='lato-Regular mt-2 text-subtext-one'>
                  {post.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
