import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import Config from '@/config.json';

export default function GetDMLButton() {
  return (
    <div>
      <a
        href={`https://app.sushi.com/swap?inputCurrency=ETH&outputCurrency=${Config.baseTokenAddress}&chainId=42170`}
        target="_blank"
      >
        <button
          className="opacity-95 hover:opacity-100 relative inline-flex items-center justify-center inline-block px-3 py-2 overflow-hidden font-semibold text-slate-900 rounded-lg group text-sm shadow-sm hover:shadow border border-slate-200 transition bg-slate-100 hover:bg-slate-50 w-40"
        >
          Get DML <ArrowTopRightOnSquareIcon className="ml-1 inline h-4 w-4 align-top -translate-y-0.5" aria-hidden="true" />
        </button>
      </a>
    </div>
  );
}
