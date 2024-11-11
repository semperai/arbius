import React from 'react';
import crossIcon from '@/app/assets/images/cross.png';
import Image from 'next/image';
function Popup({ isPopupOpen, setIsPopupOpen }) {
  return (
    <div className='fixed inset-0 z-50 flex h-full items-center justify-center overflow-y-hidden backdrop-blur-lg'>
      <div className='w-[600px] rounded-[25px] bg-white-background p-8 shadow-md'>
        <div className='flex items-center justify-between'>
          <h1 className='text-[18px]'>Confirm</h1>

          <Image
            src={crossIcon}
            width={12}
            className='cursor-pointer'
            onClick={() => setIsPopupOpen(false)}
          />
        </div>

        <p className='my-6 text-[11px] font-thin'>
          <span className='font-Geist-SemiBold text-[14px]'>NOTE : </span>{' '}
          Claiming rewards resets your GYSR multiplier and vesting period. You
          may optionally add GYSR to your new staked position.
        </p>

        <div className=''>
          <p className='my-6 w-[max-content] border-b-[1px] border-grey-text pb-1 font-Geist-Regular text-[14px] text-grey-text'>
            <span className='font-Geist-SemiBold text-[16px] text-black-text text-opacity-100'>
              Claim :{' '}
            </span>
            1.1244555525121245454{' '}
            <span className='font-Geist-SemiBold text-[16px] text-black-text text-opacity-100'>
              AIUS{' '}
            </span>
          </p>
        </div>

        <div className='flex items-baseline justify-start gap-4'>
          <div className='mt-6 flex w-[100%] justify-center rounded-[25px]'>
            <input
              className='w-[70%] rounded-l-[25px] rounded-r-none border-[1px] border-r-0 p-2 focus:outline-none lg:p-3'
              placeholder='0'
            />
            <div className='flex w-[50%] items-center justify-center gap-2 rounded-l-none rounded-r-[25px] border-[1px] border-l-0 bg-[#E6DFFF] p-2 lg:gap-4 lg:p-3'>
              <h className='text-[10px] font-medium lg:text-[15px]'>GYSR</h>
              <div className='flex items-center rounded-full bg-[#5E40FD] px-3 py-[1px] text-original-white'>
                <p className='pb-[2px] text-[6px] lg:text-[12px]'>max</p>
              </div>
            </div>
          </div>
          <div>
            <h1 className='text-[30px] font-medium'>1.00x</h1>
          </div>
        </div>

        <div className='mt-8 w-full'>
          <button
            type='button'
            className='group relative flex w-[100%] items-center gap-3 rounded-full bg-black-background px-8 py-2 lg:w-[100%]'
            onClick={() => setIsStakeClicked(true)}
          >
            <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-8 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
            <p className='relative z-10 mb-1 w-[100%] text-original-white lg:w-[100%]'>
              Claim
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Popup;
