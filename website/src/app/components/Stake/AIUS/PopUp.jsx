import React from 'react';
import Image from 'next/image';

function PopUp({ setShowPopUp, children, isHidden = false }) {
  return (
    <div
      className={
        isHidden
          ? 'opacity-0'
          : 'fixed inset-0 z-50 flex h-full items-center justify-center overflow-y-hidden px-4 backdrop-blur-lg lg:px-0'
      }
      onClick={() => setShowPopUp(false)}
    >
      <div
        className='stake-box-shadow w-[500px] rounded-xl bg-white-background px-6 pb-6 pt-3'
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default PopUp;
