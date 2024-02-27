import { useState } from 'react'

interface Props {
  variable: string;
  value: string;
  setValue: (v: string) => void;
}

export default function FileInput({ variable, value, setValue }: Props) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Use reader.result which contains the file's data as a base64 encoded string
        setValue(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
      <input
          type="file"
          name={variable}
          id={variable}
          onChange={handleFileChange}
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-cyan-800 sm:max-w-xs sm:text-sm sm:leading-6 bg-white dark:bg-[#26242d]"
      />
  );
}