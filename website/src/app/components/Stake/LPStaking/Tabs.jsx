'use client';
import React, { useState, useEffect } from 'react';
import ActivityTable from '@/app/components/Stake/LPStaking/ActivityTable';
import Stake from '@/app/components/Stake/LPStaking/Stake';
import Stats from '@/app/components/Stake/LPStaking/Stats';

const tabs = ['Stake', 'Stats', 'Activity'];
const mobiletabs = ['Stats', 'Activity'];
function Tabs({ data }) {
  const [selectedTab, setSelectedTab] = useState('Stake');
  const [mobileSelectedTab, setMobileSelectedTab] = useState('Stats');

  // useEffect(() => {
  //   if (typeof window !== 'undefined') {
  //     // const handleResize = () => {
  //     const isMobile = window.innerWidth <= 768;
  //     console.log(window.innerWidth);
  //     if (isMobile) {
  //       setSelectedTab('Stats');
  //     }
  //     // };
  //   }
  // }, []);

  return (
    <>
      <div className='m-[auto] w-mobile-section-width max-w-center-width lg:w-section-width'>
        <div className='justify-start lg:flex'>
          <div className='all-stake stake-items flex w-[50%] w-full justify-between'>
            {tabs.map(function (item, index) {
              return (
                <div
                  className={`font-[600] ${selectedTab === item ? 'selected' : 'non-selected'} hover:text-purple-text`}
                  // onClick={() => {
                  //   setSelectedTab(item);
                  // }}
                  key={index}
                >
                  {item}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className='min-w-full max-w-center-width bg-aius-stake pb-4 pt-4 lg:py-24'>
        {/*<div className='m-[auto] w-mobile-section-width lg:hidden lg:w-[90%]'>
          <div className='mb-6 flex w-[100%] justify-center rounded-full bg-white-background lg:hidden'>
            {mobiletabs.map(function (item, index) {
              return (
                <div className='w-[50%]' key={index}>
                  <button
                    type='button'
                    className={`${mobileSelectedTab === item ? 'bg-buy-hover text-original-white' : 'text-subtext-three'} flex w-[100%] items-center justify-center rounded-full py-4`}
                    // onClick={() => {
                    //   setMobileSelectedTab(item);
                    //   setSelectedTab(item);
                    // }}
                  >
                    <p className='relative z-10 mb-1'>{item}</p>
                  </button>
                </div>
              );
            })}
          </div>
        </div>*/}

        {selectedTab === 'Stake' && <Stake />}
        {selectedTab === 'Stats' && <Stats data={data} />}
        {selectedTab === 'Activity' && (
          <div className='m-[auto] w-mobile-section-width max-w-center-width pb-16 pt-8 lg:w-section-width'>
            <ActivityTable />
          </div>
        )}
      </div>
    </>
  );
}

export default Tabs;
