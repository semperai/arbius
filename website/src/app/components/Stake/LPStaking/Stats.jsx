'use client';
import Image from 'next/image';
import React from 'react';
import clock from '@/app/assets/images/time_(2).png';
import HintBox from '@/app/components/HintBox/Hintbox';
import { useState } from 'react';
function Stats({ data }) {
  const [currentHoverId, setCurrentHoverId] = useState(null);
  function epochToDate(epochTime) {
    // Create a new Date object using the epoch time (in milliseconds)
    let date = new Date(epochTime * 1000);

    // Extract the date components
    let year = date.getFullYear();
    let month = date.getMonth() + 1; // Months are zero-based, so we add 1
    let day = date.getDate();

    // Format the date string
    let formattedDate = `${month}/${day}/${year}`;

    return formattedDate;
  }

  function daysBetweenCurrentAndPassedDate(passedDate) {
    // Current date
    const currentDate = new Date();

    // Parse the passed date string into a Date object
    const passedDateTime = Date.parse(passedDate);
    if (isNaN(passedDateTime)) {
      return 'Invalid date'; // Handle invalid date input
    }
    const passedDateObj = new Date(passedDateTime);

    // Calculate the difference in milliseconds
    const timeDifference = passedDateObj.getTime() - currentDate.getTime();

    // Convert milliseconds to days
    const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));

    return daysDifference + 1;
  }
  const dataConst = [
    {
      time: epochToDate(123456789),
      message: 'Pool Created',
    },
    {
      time: epochToDate(123456789),
      message: 'Funding 1 starts',
    },
    {
      time: epochToDate(178999999),
      message: 'Funding 1 ends',
    },
    {
      time: epochToDate(171999999),
      message: 'Funding 2 starts',
    },
    {
      time: epochToDate(172999999),
      message: 'Funding 1 ends',
    },
    {
      time: epochToDate(189000000),
      message: 'Pool ends',
    },
  ];
  return (
    <>
      <div className='m-[auto] grid w-mobile-section-width max-w-center-width grid-cols-1 gap-6 pb-8 pt-8 text-[#101010] lg:w-section-width xl:grid-cols-3'>
        <div className='stake-card h-[auto] rounded-2xl bg-white-background p-6 lg:h-[auto] lg:p-10'>
          <div>
            <h1 className='text-[15px] font-medium text-purple-text lg:text-[20px]'>
              Overview
            </h1>
          </div>
          <div
            className='mt-6 max-h-[150px] rounded-[10px] bg-[#F9F6FF] p-6 py-4 shadow-none transition-all hover:cursor-pointer hover:shadow-stats'
            id='totalStaked'
          >
            <div className='flex items-baseline justify-start'>
              <h1 className='text-[25px] font-medium text-purple-text xl:text-[38px]'>
                1234
              </h1>
              <p className='lato-bold ml-2 text-para'>Uni-V2</p>
              <HintBox
                content={'Total UNI-V2 staked in this Geyser'}
                customStyle={{
                  backgroundColor: '#ffffff',
                }}
                link={null}
                boxStyle={{
                  width: '200px',
                  top: '50%',
                  zIndex: 10,
                  backgroundColor: '#ffffff',
                }}
                hoverId={'totalStaked'}
                currentHoverId={currentHoverId}
                setCurrentHoverId={setCurrentHoverId}
              />
            </div>
            <h1 className='text-[8px] font-medium xl:text-[13px]'>
              Currently Staked
            </h1>
          </div>
          <hr className='mt-6 opacity-100' />
          <div className='mt-4 flex justify-start gap-[40px]'>
            <div>
              <h1 className='text-[24px] text-purple-text'>
                $ 123M
              </h1>
              <h2
                className='text-[18px] font-medium'
                onClick={() => claimRwards()}
              >
                Value Locked
              </h2>
            </div>
            <div>
              <h1 className='text-[24px] text-purple-text'>$0&nbsp;</h1>
              <h2 className='text-[18px] font-medium'>24hr Volume</h2>
            </div>
          </div>
        </div>
        <div className='stake-card h-[auto] rounded-2xl bg-white-background p-6 lg:h-[auto] lg:p-10'>
          <div>
            <h1 className='text-[15px] font-medium text-purple-text lg:text-[20px]'>
              Rewards
            </h1>
          </div>
          <div
            className='mt-6 max-h-[150px] rounded-[10px] bg-[#F9F6FF] p-6 py-4 shadow-none transition-all'
            id='totalStaked'
          >
            <div className='flex items-baseline justify-start'>
              <h1 className='text-[25px] font-medium text-purple-text xl:text-[38px]'>
                123%
              </h1>
            </div>
            <h1 className='text-[8px] font-medium uppercase xl:text-[13px]'>
              apr
            </h1>
          </div>

          <hr className='mt-6 opacity-100' />

          <div className='mt-8 h-[300px] rounded-[25px] bg-[#F9F6FF] p-8'>
            <div className=''>
              <div className='flex items-baseline justify-start'>
                <h1 className='text-[20px] font-medium lg:text-[28px]'>
                  123k&nbsp;
                </h1>
                <p className='text-[14px]'>AIUS</p>
              </div>
              <h1 className='text-[8px] font-medium opacity-70 lg:text-[13px]'>
                Funded Rewards
              </h1>
            </div>
            <div className='mt-12 flex justify-start gap-[40px] pb-8'>
              <div>
                <h1 className='lato-bold text-[20px]'>
                  123k AIUS
                </h1>
                <h2 className='text-[14px] font-medium opacity-70'>
                  Remaining
                </h2>
              </div>
              <div>
                <h1 className='lato-bold text-[20px]'>
                  123k AIUS
                </h1>
                <h2 className='text-[14px] font-medium opacity-70'>
                  Distributed
                </h2>
              </div>
            </div>
          </div>
        </div>

        <div className='stake-card h-[auto] rounded-2xl bg-white-background p-6 text-[#101010] lg:h-[auto] lg:p-10'>
          <div>
            <h1 className='text-[15px] font-medium text-purple-text lg:text-[20px]'>
              Schedule
            </h1>
          </div>

          <div
            className='mt-6 max-h-[150px] rounded-[10px] bg-[#F9F6FF] p-6 py-4 shadow-none transition-all hover:cursor-pointer hover:shadow-stats'
            id='remaningDyays'
          >
            <div className='flex items-baseline justify-start'>
              <h1 className='text-[25px] font-medium text-purple-text xl:text-[38px]'>
                {' '}
                {daysBetweenCurrentAndPassedDate(epochToDate(178909112))}
                &nbsp;
              </h1>
              <HintBox
                content={'remaining days total in number'}
                customStyle={{}}
                link={null}
                boxStyle={{ width: '200px', top: '50%', zIndex: 10 }}
                hoverId={'remaningDyays'}
                currentHoverId={currentHoverId}
                setCurrentHoverId={setCurrentHoverId}
              />
              <p className='text-para'>Days</p>
            </div>
            <h1 className='text-[8px] font-medium xl:text-[13px]'>
              Remaining Duration
            </h1>
          </div>
          <hr className='mt-6 opacity-100' />
          <div
            className='mt-6 flex h-[300px] justify-center overflow-x-scroll rounded-[25px] bg-[#F9F6FF] p-6'
            id='custom-scrollbar'
          >
            <div className='relative left-[200px] flex items-center text-[#101010]'>
              {dataConst?.map((item, idx) => (
                <div className='relative flex flex-col items-center' key={idx}>
                  {idx % 2 === 0 ? (
                    <div className='relative left-[-50px] w-[100px] text-[12px]'>
                      <div
                        className='absolute top-[18px] text-left'
                        style={{ right: idx == 0 ? '-20px' : '' }}
                      >
                        <h1 className='text-[12px] font-medium'>
                          {item?.time}
                        </h1>
                        <h2 className='opacity-70'>{item?.message}</h2>
                      </div>
                    </div>
                  ) : (
                    <div className='relative left-[-50px] w-[100px] text-[12px]'>
                      <div className='absolute top-[-60px] text-left'>
                        <h1 className='text-[12px] font-medium'>
                          {item?.time}
                        </h1>
                        <h2 className='opacity-70'>{item?.message}</h2>
                      </div>
                    </div>
                  )}
                  {idx == 0 || idx == dataConst.length - 2 ? (
                    <div className='relative w-[100px] border-t-[1px] border-purple-text'>
                      <div
                        className='absolute left-[50%] top-[50%] z-10 flex h-[30px] w-[30px] translate-x-[-50%] translate-y-[-50%] items-center justify-center rounded-full border-[1px] bg-purple-text'
                        style={{ left: idx == 0 ? '10px' : '90px' }}
                      >
                        <Image
                          height={'100%'}
                          width={'100%'}
                          src={clock}
                          alt='time'
                        />
                      </div>
                    </div>
                  ) : idx == dataConst.length - 1 ? null : (
                    <div className='relative w-[100px] border-t-[1px] border-purple-text'>
                      <div className='absolute left-[50%] top-[50%] h-[8px] w-[8px] translate-x-[-50%] translate-y-[-50%] rounded-full border-[1px] border-purple-text bg-white-background'></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Stats;
