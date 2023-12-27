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
        className={(disabled ? 'opacity-25 hover:cursor-default ' : 'opacity-95 hover:opacity-100 ') + "relative inline-flex items-center justify-center inline-block px-3 py-2 overflow-hidden font-semibold text-indigo-600 rounded-lg group text-sm shadow-sm hover:shadow w-28 border-slate-200 border text-shadow transition nightwind-prevent-block"}

        disabled={disabled}
        onClick={onClick}
      >
        <span className="absolute top-0 left-0 w-40 h-40 -mt-10 -ml-3 transition-all duration-700 bg-red-500 rounded-full blur-md ease"></span>
        <span className="absolute inset-0 w-full h-full transition duration-700 group-hover:rotate-180 ease">
        <span className="absolute bottom-0 left-0 w-24 h-24 -ml-10 bg-purple-500 rounded-full blur-md"></span>
        <span className="absolute bottom-0 right-0 w-24 h-24 -mr-10 bg-pink-500 rounded-full blur-md"></span>
        </span>
        <span className="relative text-white">{text}</span>
      </button>
    </form>
  );
}
