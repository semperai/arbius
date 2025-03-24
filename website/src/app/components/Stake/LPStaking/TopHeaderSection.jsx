import React from 'react';
import { useEffect } from 'react';
import Image from 'next/image';
import gysr from '@/app/assets/images/gysr_logo_without_name.png';
import unilogo from '@/app/assets/images/unilogo.png';
import arbiuslogorounded from '@/app/assets/images/arbiuslogo_rounded.png';
import arbiuslogo_lpstake from '@/app/assets/images/arbiuslogo_lpstake.svg';
import GradientCrad from '@/app/components/Stake/LPStaking/GradientCrad';
import Link from 'next/link';
function TopHeaderSection({ data }) {
  const headerCardData = [
    {
      heading: data ? data?.univ2Staked : '',
      subheading: 'UNI-V2',
      para: 'Staked',
      logo: unilogo,
    },
    {
      heading: data ? data?.aiusStaked : '',
      subheading: 'AIUS',
      para: 'Remaining',
      logo: arbiuslogorounded,
    },
    {
      heading: data ? data?.apr : '',
      subheading: '',
      para: 'APR',
      logo: arbiuslogorounded,
    },
  ];
  return (
    <>
      <div className='m-[auto] w-mobile-section-width max-w-center-width py-24 lg:w-section-width'>
        <div>
          <div className='flex items-center justify-start'>
            <div className='relative h-[auto] w-[50px]'>
              <Image src={arbiuslogo_lpstake} />
            </div>

            <div className='flex items-baseline justify-start pl-2'>
              <h1 className='text-mobile-header font-medium text-card-heading lg:text-header 2xl:text-header-2xl'>
                AIUS LP Stake
              </h1>
            </div>
          </div>
          <p className='mt-6 text-para text-subtext-three'>
            Stake AIUS and ETH, earn AIUS rewards.
          </p>

          <div className='mt-8 grid gap-6 grid-cols-4'>
            {headerCardData.map((item, key) => {
              return (
                <GradientCrad
                  data={data}
                  key={key}
                  heading={item?.heading}
                  subheading={item?.subheading}
                  para={item?.para}
                  logo={item?.logo}
                />
              );
            })}
          </div>

          <Link
            href='https://app.uniswap.org/add/v2/0x8afe4055ebc86bd2afb3940c0095c9aca511d852/ETH?chain=mainnet'
            target='_blank'
          >
            <p className='mt-6 text-para font-medium text-available decoration-[#4A28FF] hover:text-[#4A28FF] hover:underline'>
              Get UNI-V2 by providing liquidity on Uniswap ➚
            </p>
          </Link>
        </div>
      </div>
    </>
  );
}

export default TopHeaderSection;
