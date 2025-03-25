import Image from 'next/image';
import React from 'react';

function GradientCrad({ heading, subheading, para, logo, data }) {
  return (
    <div className='rounded-xl bg-buy-hover px-3 lm:px-6 py-4 text-[#ffffff]'>
      <div className='flex items-baseline justify-start'>
        <h1 className='text-[20px] font-medium lg:text-[25px]'>{heading}</h1>
        <h2 className='pl-2 text-[15px] font-medium lg:text-[20px]'>
          {subheading}
        </h2>
      </div>

      <div className='mt-4 flex items-center justify-between'>
        <h3 className='text-[11px] lg:text-para'>{para}</h3>
        <div className='relative h-auto w-[25px] lm:w-[30px]'>
          <Image src={logo} />
        </div>
      </div>
    </div>
  );
}

export default GradientCrad;
