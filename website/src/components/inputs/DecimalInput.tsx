import { useState } from 'react';

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

interface Props {
  variable: string;
  min: number;
  max: number;
  value: number;
  setValue: (n: number) => void;
}

export default function DecimalInput({
  variable,
  min,
  max,
  value,
  setValue,
}: Props) {
  return (
    <input
      type='number'
      name={variable}
      id={variable}
      step={0.0000001}
      min={min}
      max={max}
      value={value}
      onChange={(e) => {
        setValue(clamp(parseFloat(e.target.value), min, max));
      }}
      autoComplete='off'
      className='bg-white text-gray-900 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-[#26242d] dark:focus:ring-cyan-800 sm:max-w-xs sm:text-sm sm:leading-6'
    />
  );
}
