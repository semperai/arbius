import React from 'react';
export default function Process() {
  return (
    <div>
      <div className='stake-box-shadow box-border h-auto rounded-2xl bg-white-background px-8 pb-8 pt-8 lg:h-[250px] lg:pt-10 2xl:h-[200px] 2xl:pt-8'>
        <div>
          <p className='lato-bold mb-4'>ve-AIUS Process Overview:</p>
        </div>
        <div>
          <p className='lato-regular mb-2'>Lock AIUS: Receive veAIUS NFTs.</p>
          <p className='lato-regular mb-2'>
            Vote: veAIUS holders vote weekly for AI models, earning rewards.
          </p>
          <p className='lato-regular mb-2'>
            Emission Distribution: Managed by voter gauges based on veAIUS
            governance power.
          </p>
        </div>
      </div>
    </div>
  );
}
