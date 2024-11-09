import { useState } from 'react';
import Image from 'next/image';
import { WalletIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import TokenBalance from '@/components/TokenBalance';
import ConnectWallet from '@/components/ConnectWallet';
import IncreaseAllowanceButton from '@/components/IncreaseAllowanceButton';
// import XBasicModelTokenStaking from '@/components/XBasicModelTokenStaking';
// import ModelLPStaking from '@/components/ModelLPStaking';

interface Props {
  name: string;
  role: string;
  description: string;
  imageUrl: string;
  cid: string;
  contracts: {
    token?: string;
    xtoken?: string;
    lpstaking?: string;
    lp?: string;
  };
}

export default function ModelCard({
  name,
  role,
  description,
  imageUrl,
  cid,
  contracts,
}: Props) {
  const [walletConnected, setWalletConnected] = useState(false);

  return (
    <li key={name}>
      <Image
        className='aspect-[3/2] w-full rounded-2xl object-cover'
        src={imageUrl}
        alt=''
        width={600}
        height={600}
      />
      <h3 className='text-gray-900 mt-6 text-lg font-semibold leading-8'>
        {name}
      </h3>
      <p className='text-gray-600 text-base leading-7'>{role}</p>
      <p className='text-gray-600 mt-4 text-base leading-7'>{description}</p>

      {contracts.token && (
        <>
          <div className='mt-2 flex rounded-md shadow-sm'>
            <div className='relative flex flex-grow items-stretch text-xs focus-within:z-10'>
              <input
                type='text'
                name={contracts.token}
                id={contracts.token}
                className='text-gray-900 block w-full rounded-none rounded-l-md border-0 py-0 pl-1.5 text-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:leading-6'
                placeholder='Contract Address'
                value={contracts.token}
                readOnly={true}
              />
            </div>
            <button
              type='button'
              className='text-gray-900 relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-1 text-xs font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
              title='Copy Contract Address to Clipboard'
              onClick={() => navigator.clipboard.writeText(contracts.token!)}
            >
              <ClipboardIcon
                className='text-gray-400 -ml-0.5 h-5 w-5'
                aria-hidden='true'
              />
              Copy
            </button>
          </div>

          <div>
            <div
              className={
                (walletConnected ? 'hidden' : '') +
                ' full-w mt-10 flex justify-start'
              }
            >
              <ConnectWallet update={setWalletConnected} />
            </div>

            {walletConnected && (
              <>
                <div className='full-w mt-10 flex justify-between'>
                  <div className='flex justify-start'>
                    <div>
                      <strong>Balance:</strong>
                    </div>
                    <div className='text-md m-auto pl-1'>
                      <TokenBalance
                        show={true}
                        update={() => {}}
                        token={contracts.token as `0x${string}`}
                      />
                    </div>
                  </div>
                  <div>
                    <button
                      className='bg-white border-slate-300 ml-3 block rounded-md border px-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500'
                      onClick={() => {}}
                    >
                      Swap
                    </button>
                  </div>
                </div>
                {/*
                <XBasicModelTokenStaking
                  basicModelTokenAddress={contracts.token as `0x${string}`}
                  xBasicModelTokenAddress={contracts.xtoken as `0x${string}`}
                />
                <ModelLPStaking
                  lpAddress={contracts.lp as `0x${string}`}
                  lpStakingAddress={contracts.lpstaking as `0x${string}`}
                />
                */}
              </>
            )}
          </div>
        </>
      )}
      {!contracts.token && (
        <>
          <div className='mt-3'>
            <strong className='text-slate-500'>This model has no fee</strong>
          </div>
        </>
      )}
    </li>
  );
}
