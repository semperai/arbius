import React from 'react';
export default function Process() {
  return (
    <div>
      <div className='stake-box-shadow box-border flex h-auto items-center rounded-2xl bg-white-background px-8 pb-8 pt-8 text-original-black lg:h-[246px] lg:pt-10 2xl:h-[242px] 2xl:pt-8'>
        <div>
          <div>
            <p className='lato-bold mb-4'>veAIUS Process Overview:</p>
          </div>
          <div>
            <p className='lato-regular mb-2 !font-[350]'>
              Lock AIUS: Receive veAIUS NFTs, earning rewards.
            </p>
            <p className='lato-regular mb-2 !font-[350]'>
              Vote: veAIUS holders vote weekly for AI models.
            </p>
            <p className='lato-regular mb-2 !font-[350]'>
              Emission Distribution: Managed by voter gauges based on veAIUS governance power.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
