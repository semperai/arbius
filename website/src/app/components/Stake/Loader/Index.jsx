import React from 'react';
import Lottie from 'lottie-react';
import loaderJson from './loader.json';
function Loader({ loadingText, height, width}) {
  return (
    <div className='flex h-full w-full items-center justify-center rounded-xl bg-[#fff] p-4'>
      <div className='flex items-center justify-center'>
        <h1 className='z-20 mr-[-20px] text-[20px] font-semibold text-[#4A28FF]'>
          {loadingText}
        </h1>
        <Lottie
          animationData={loaderJson}
          loop={true}
          autoPlay={true}
          style={{
            width: width,
            height: height,
            borderRadius: '20px',
            objectFit: 'cover',
            background: 'transparent'
          }}
        />
      </div>
    </div>
  );
}

export default Loader;
