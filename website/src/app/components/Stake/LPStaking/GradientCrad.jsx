import Image from 'next/image';
import React from 'react';
import info_icon from '@/app/assets/images/info_icon_white.png';

function GradientCrad({ heading, subheading, para, logo, data, showInfo, info_text }) {
  return (
    <div className='rounded-xl bg-buy-hover px-3 lm:px-6 py-4 text-[#ffffff] relative'>
      <div className='flex items-baseline justify-start'>
        <h1 className='text-[20px] font-medium lg:text-[25px]'>{heading}</h1>
        <h2 className='pl-2 text-[15px] font-medium lg:text-[20px]'>
          {subheading}
        </h2>
      </div>
      { showInfo ? <div className='group absolute right-3 top-3 cursor-pointer'>
        <Image src={info_icon} width={20} height={20} alt='info' />
        <div className='lato-bold absolute right-6 top-0 hidden rounded-md bg-white-background p-2 text-center text-[.7rem] text-black-text group-hover:block w-[130px] z-[2]'>
          {info_text}
        </div>
      </div> : null }
      <div className='mt-4 flex items-center justify-between'>
        <h3 className='text-[11px] lg:text-para'>{para}</h3>
        <div className='relative h-auto w-[25px] lm:w-[30px]'>
          <Image src={logo} alt="" />
        </div>
      </div>
    </div>
  );
}

export default GradientCrad;
