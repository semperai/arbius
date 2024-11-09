import { useEffect } from 'react';
import { ethers } from 'ethers';

interface Props {
  value: string;
  setValue: (a: string) => void;
  balance: string;
  modelFee: ethers.BigNumber;
}

export default function FeeInput({
  value,
  setValue,
  balance,
  modelFee,
}: Props) {
  function checkRange() {
    if (parseFloat(value) < parseFloat(ethers.utils.formatEther(modelFee))) {
      setValue(ethers.utils.formatEther(modelFee));
    }
    if (parseFloat(value) > parseFloat(balance)) {
      setValue(balance);
    }
  }

  useEffect(() => {
    checkRange();
  }, [balance, modelFee]);

  return (
    <div>
      <div className='relative rounded-md shadow-sm'>
        <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
          <span className='text-gray-500 sm:text-sm'>Fee</span>
        </div>
        <input
          type='number'
          name='fee'
          id='fee'
          min={ethers.utils.formatEther(modelFee)}
          max={balance}
          step={0.01}
          className='bg-white text-gray-900 block w-full rounded-md border-0 py-1.5 pl-12 pr-20 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-[#26242d] dark:focus:ring-cyan-800 sm:text-sm sm:leading-6'
          placeholder='5'
          value={value}
          onChange={(e) => {
            const value = e.target.value;
            if (
              parseFloat(value) < parseFloat(ethers.utils.formatEther(modelFee))
            ) {
              setValue(ethers.utils.formatEther(modelFee));
            } else if (parseFloat(value) > parseFloat(balance)) {
              setValue(balance);
            } else {
              setValue(value);
            }
          }}
          aria-describedby='price-token'
        />
        <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3'>
          <span
            className='text-gray-500 text-xs font-semibold'
            id='price-token'
          >
            ARBIUS
          </span>
        </div>
      </div>
      <div className='text-slate-500 pl-1 pt-1 text-xs'>
        Model Fee: {ethers.utils.formatEther(modelFee)}
      </div>
    </div>
  );
}
