import React from 'react';
import { useEffect } from 'react';
import Image from 'next/image';
import gysr from '@/app/assets/images/gysr_logo_without_name.png';
import unilogo from '@/app/assets/images/unilogo.png';
import arbiuslogorounded from '@/app/assets/images/arbiuslogo_rounded.png';
import arbiuslogo_lpstake from '@/app/assets/images/arbiuslogo_lpstake.svg';
import GradientCrad from '@/app/components/Stake/LPStaking/GradientCrad';
import Link from 'next/link';
import { AIUS_wei } from '@/app/Utils/constantValues';

function TopHeaderSection({ data }) {

  // function formatNumber(num) {
  //   if (num >= 1_000_000) {
  //     return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  //   } else if (num >= 1_000) {
  //     return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  //   } else {
  //     return num.toString();
  //   }
  // }

  const headerCardData = [
    {
      heading: data ? Number(data?.univ2Staked / AIUS_wei).toFixed(0) : 0,
      subheading: 'UNI-V2',
      para: 'Staked',
      logo: unilogo,
    },
    {
      heading: data ? Number(data?.aiusStaked / AIUS_wei).toFixed(0) : 0,
      subheading: 'AIUS',
      para: 'Remaining',
      logo: arbiuslogorounded,
    },
    {
      heading: data ? data?.apr : 0,
      subheading: '',
      para: 'APR',
      logo: arbiuslogorounded,
    },
  ];
  return (
    <>
      <div className='m-[auto] w-mobile-section-width max-w-center-width pt-24 pb-8 um:py-24 lg:w-section-width'>
        <div>
          <div className='flex items-center justify-start'>
            <div className='hidden md:block relative h-[auto] w-[50px]'>
              <Image src={arbiuslogo_lpstake} />
            </div>

            <div className='flex items-baseline justify-start pl-2'>
              <h1 className='text-[28px] um:text-mobile-header font-medium text-card-heading lg:text-header'>
                AIUS Uniswap V2 LP Staking
                <div className='inline-block align-middle md:hidden relative h-[auto] w-[30px] um:w-[50px] ml-2'>
                  <Image src={arbiuslogo_lpstake} />
                </div>
              </h1>
            </div>
          </div>
          <p className='mt-4 um:mt-6 text-para text-subtext-three'>
            Stake AIUS and ETH, earn AIUS rewards.
          </p>

          <div className='mt-8 grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
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
            <p className='mt-6 font-medium text-[14px] text-available decoration-[#4A28FF] hover:text-[#4A28FF] hover:underline'>
              Get UNI-V2 by providing liquidity on Uniswap ➚
            </p>
          </Link>
        </div>
      </div>
    </>
  );
}

export default TopHeaderSection;
