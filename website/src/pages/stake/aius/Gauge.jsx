import React from 'react'

function Gauge() {
  return (
    <div  className='lg:w-section-width w-mobile-section-width mx-auto max-w-center-width py-24'>
        <div className='flex justify-between items-center w-full'>
            <div className='flex justify-start items-center gap-4 w-full h-auto'>
                <h1 className='text-[40px] text-[#4A28FF] mb-2'>Gauge</h1>
                <div className='rounded-md bg-white flex justify-between h-auto w-[70%]'>
                    <input className='bg-transparent p-2 py-3 h-full border-0 focus:outline-none ' />

                </div>
            </div>

            <div className='text-[#4A28FF] text-sm w-[30%] text-end'>
                <h1>Voting starts in   02 D : 13 Hr : 16 Min</h1>
            </div>

        </div>

    </div>
  )
}

export default Gauge