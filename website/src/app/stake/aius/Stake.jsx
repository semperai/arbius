'use client';
import React, { useState } from 'react';
import arbius_logo_without_name from '@/app/assets/images/arbius_logo_without_name.png';
import Image from 'next/image';
import ReactSlider from 'react-slider';
export default function Stake() {
  const [sliderValue, setSliderValue] = useState(0);
  const [duration, setDuration] = useState({
    months: 0,
    weeks: 0,
  });
  return (
    <div>
      <div className='stake-box-shadow box-border flex h-auto flex-col justify-between rounded-2xl bg-white-background px-8 pb-8 pt-8 lg:h-[535px] lg:pt-14 2xl:h-[480px] 2xl:pt-10'>
        <div>
          <div>
            <div className='mb-4 flex items-center justify-between'>
              <p className='lato-bold text-[18px] text-stake'>Amount to lock</p>
              <p className='lato-regular text-[15px] text-available'>
                Available 0.0 AIUS
              </p>
            </div>
            <div>
              <div className='flex items-center rounded-3xl border border-[#2F2F2F]'>
                <div className='box-border flex items-center justify-center gap-2 rounded-l-3xl bg-stake-input p-2'>
                  <div className='flex h-[30px] w-[30px] items-center justify-center rounded-[50%] bg-white-background'>
                    <Image
                      src={arbius_logo_without_name}
                      width={15}
                      alt='arbius'
                    />
                  </div>
                  <p className='pr- lato-bold text-[15px] text-aius'>AIUS</p>
                </div>
                <div className='w-[94%]'>
                  <input
                    className='lato-bold w-[100%] rounded-r-3xl border-0 p-2 text-[15px] outline-none'
                    type='number'
                    placeholder='0.0'
                  />
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className='lato-bold mb-8 mt-8 h-12 text-[15px] text-stake lg:text-[20px]'>
              Locking for{' '}
              {duration.months !== 0
                ? `${duration.months} ${duration.months === 1 ? 'month' : 'months'} `
                : `${duration.weeks} ${duration.weeks <= 1 ? 'week' : 'weeks'}`}{' '}
              for 0.0 AIUS voting power.
            </p>
            <div className='mb-10'>
              <div className='mb-8'>
                <ReactSlider
                  className='rounded-2xl border-4 border-b border-[#ECECEC] text-original-white'
                  thumbClassName=' w-[28px] h-[28px] ml-[-5px] bg-thumb cursor-pointer rounded-[50%] flex items-center justify-center border-0 mt-[-14px] outline-none'
                  markClassName='customSlider-mark'
                  marks={4}
                  min={0}
                  step={0.25}
                  max={24}
                  defaultValue={0}
                  value={sliderValue}
                  onChange={(value) => {
                    console.log(value);
                    if (value < 1) {
                      setDuration({ ...duration, months: 0, weeks: 4 * value });
                    } else {
                      setDuration({ ...duration, months: value, weeks: 0 });
                    }
                    setSliderValue(value);
                  }}
                  renderMark={(props) => {
                    props.className =
                      'customSlider-mark customSlider-mark-before text-[16px] text-start ml-[0px] w-[16.66%]';
                    return (
                      <span {...props}>
                        <h1>{props.key}</h1>
                      </span>
                    );
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className='mt-8 flex items-center justify-between'>
          <div className='box-border w-[48%] rounded-2xl bg-apr px-4 py-4'>
            <p className='lato-regular mb-4 text-[12px] text-original-white md:text-[16px]'>
              APR
            </p>
            <p className='lato-bold text-[16px] text-original-white md:text-[20px]'>
              0%
            </p>
          </div>
          <div className='box-border w-[48%] rounded-2xl bg-apr px-4 py-4'>
            <p className='lato-regular mb-4 text-[12px] text-original-white md:text-[16px]'>
              veAIUS Balance
            </p>
            <p className='lato-bold text-[16px] text-original-white md:text-[20px]'>
              0.00 veAIUS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
