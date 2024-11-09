import Image from 'next/image';
import React from 'react';
import info_icon from '../../../assets/images/info_icon.png';

function Notifications() {
  return (
    <div className='mx-auto mb-12 block w-mobile-section-width max-w-center-width rounded-xl border-2 border-purple-text bg-light-purple-background p-4 text-center text-purple-text lg:w-section-width xl:hidden'>
      <div className='flex items-center justify-start gap-2'>
        <Image src={info_icon} width={8} height={8} />
        <p>Switch to Desktop to connect your wallet and start staking </p>
      </div>
    </div>
  );
}

export default Notifications;
