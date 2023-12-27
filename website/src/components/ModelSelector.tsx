import { ChangeEventHandler } from 'react';
import Config from '@/config.json';
import { models } from '@/models';

interface Props {
  value: string;
  onChange: ChangeEventHandler<HTMLSelectElement>;
}

export default function ModelSelector({ value, onChange }: Props) {
  return (
    <div className="sm:col-span-6">
      <label htmlFor="model" className="block text-sm font-medium leading-6 text-gray-900">
        Model:
      </label>
      <div className="mt-2">
        <select
          onChange={onChange}
          value={value}
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-cyan-800 sm:max-w-xs sm:text-sm sm:leading-6 bg-white dark:bg-[#26242d]"
        >
          { models.map(([id, title]) => (
            <option
              key={id}
              value={id}
            >
              {title}
            </option>
          )) }
        </select>
      </div>
    </div>
  );
}
