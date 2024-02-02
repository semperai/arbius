import { useState } from 'react'
import Image from 'next/image';
import { WalletIcon, ClipboardIcon } from '@heroicons/react/24/outline'
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
  }
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
        className="aspect-[3/2] w-full rounded-2xl object-cover"
        src={imageUrl}
        alt=""
        width={600}
        height={600}
        />
      <h3 className="mt-6 text-lg font-semibold leading-8 text-gray-900">{name}</h3>
      <p className="text-base leading-7 text-gray-600">{role}</p>
      <p className="mt-4 text-base leading-7 text-gray-600">{description}</p>

      { contracts.token && (
        <>
          <div className="mt-2 flex rounded-md shadow-sm">
            <div className="relative flex flex-grow items-stretch focus-within:z-10 text-xs">
              <input
                type="text"
                name={contracts.token}
                id={contracts.token}
                className="block w-full rounded-none rounded-l-md border-0 py-0 pl-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-xs sm:leading-6"
                placeholder="Contract Address"
                value={contracts.token}
                readOnly={true}
              />
            </div>
            <button
              type="button"
              className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-1 text-xs font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              title="Copy Contract Address to Clipboard"
              onClick={() => navigator.clipboard.writeText(contracts.token!)}
            >
              <ClipboardIcon className="-ml-0.5 h-5 w-5 text-gray-400" aria-hidden="true" />
              Copy
            </button>
          </div>
    
          <div>
            <div className={(walletConnected ? 'hidden' : '') + " full-w flex justify-start mt-10"}>
              <ConnectWallet update={setWalletConnected} />
            </div>
    
            { walletConnected && (
              <>
                <div className="full-w flex justify-between mt-10">
                  <div className="flex justify-start">
                    <div>
                      <strong>Balance:</strong>
                    </div>
                    <div className="pl-1 text-md m-auto">
                      <TokenBalance
                        show={true}
                        update={() => {}}
                        token={contracts.token as `0x${string}`}
                      />
                    </div>
                  </div>
                  <div>
                    <button
                      className="ml-3 px-2 block bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:border-sky-500 focus:ring-sky-500 focus:ring-1"
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
            ) }
          </div>
        </>
      )}
      { ! contracts.token && (
        <>
          <div className="mt-3">
            <strong className="text-slate-500">This model has no fee</strong>
          </div>
        </>
      ) }
    </li>
  )
}
