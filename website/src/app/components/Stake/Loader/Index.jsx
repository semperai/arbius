import React from 'react'
import Lottie from "lottie-react";
import loaderJson from './loader.json'
function Loader() {
    return (
        <div className='w-full h-full flex justify-center items-center rounded-xl p-4 bg-[#fff]'>
            <div className='flex justify-center items-center'>
                <h1 className='mr-[-20px] z-20 text-[#4A28FF] text-[20px] font-semibold'>Loading Stakes</h1>
                <Lottie animationData={loaderJson} loop={true} autoPlay={true} style={{ width: 'auto', height: '100px', borderRadius: '20px', objectFit: 'cover' }} />
            </div>
        </div>
    )
}

export default Loader