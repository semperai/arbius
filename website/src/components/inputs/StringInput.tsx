import { useState } from 'react'

interface Props {
  variable: string;
  value: string;
  setValue: (v: string) => void;
}

export default function StringInput({ variable, value, setValue }: Props) {
  return (
    <input
      type="text"
      name={variable}
      id={variable}
      value={value}
      onChange={(e) => { setValue(e.target.value); }}
      autoComplete="off"
      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-cyan-800 sm:max-w-xs sm:text-sm sm:leading-6 bg-white dark:bg-[#26242d]"
    />
  );
}
