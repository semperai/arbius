import Image from 'next/image'
import React from 'react'
import info_icon from "../../../assets/images/info_icon.png"

function Notifications() {
  return (
    <div className='lg:w-section-width w-mobile-section-width mx-auto mb-12 max-w-center-width block xl:hidden p-4 rounded-xl bg-[#ECE4FF] text-[#4A28FF] border-2 border-[#4A28FF] text-center'>

        <div className='flex justify-start items-center gap-2'>
            <Image src={info_icon} width={8} height={8} />
            <p>Switch to Desktop to connect your wallet and start 
            staking </p>
        </div>

    </div>
  )
}

export default Notifications