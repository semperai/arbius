import Image from 'next/image'
import React from 'react'

function GradientCrad({ heading, subheading, para, logo,data }) {
    return (
        <div className='bg-buy-hover py-4 px-6 rounded-xl text-[#ffffff]'>
            <div className='flex justify-start items-baseline'>

                <h1 className='text-[20px] lg:text-[25px] font-medium'>{heading}</h1>
                <h2 className='text-[15px] lg:text-[20px] font-medium pl-2'>{subheading}</h2>

            </div>

            <div className='mt-4 flex justify-between items-center'>

                <h3 className='text-[11px] lg:text-para '>{para}</h3>
                <div className='relative w-[20px] lg:w-[30px] h-auto '>

                    <Image src={logo} />

                </div>

            </div>

        </div>
    )
}

export default GradientCrad