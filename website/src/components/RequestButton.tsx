import { MouseEventHandler } from 'react';

interface Props {
  disabled: boolean;
  text: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
}

export default function RequestButton({ disabled, text, onClick }: Props) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <button
        className={
          (disabled
            ? 'opacity-25 hover:cursor-default '
            : 'opacity-95 hover:opacity-100 ') +
          'text-shadow group nightwind-prevent-block text-indigo-600 border-slate-200 relative inline-block inline-flex w-28 items-center justify-center overflow-hidden rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm transition hover:shadow'
        }
        disabled={disabled}
        onClick={onClick}
      >
        <span className='ease bg-red-500 absolute left-0 top-0 -ml-3 -mt-10 h-40 w-40 rounded-full blur-md transition-all duration-700'></span>
        <span className='ease absolute inset-0 h-full w-full transition duration-700 group-hover:rotate-180'>
          <span className='bg-purple-500 absolute bottom-0 left-0 -ml-10 h-24 w-24 rounded-full blur-md'></span>
          <span className='bg-pink-500 absolute bottom-0 right-0 -mr-10 h-24 w-24 rounded-full blur-md'></span>
        </span>
        <span className='text-white relative'>{text}</span>
      </button>
    </form>
  );
}
