import {
  useAccount,
  useReadContract,
  useWriteContract,
  useTransaction,
  useChainId,
} from 'wagmi';
import type { Abi } from 'viem';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

import Link from 'next/link';
import Image from 'next/image';
import Layout from '@/components/Layout';
import TokenBalance from '@/components/TokenBalance';
import IncreaseAllowanceButton from '@/components/IncreaseAllowanceButton';
import Config from '@/config.json';
import OneToOneConvertArtifact from '@/artifacts/OneToOneConvert.sol/OneToOneConvert.json';

const DEFAULT_CHAIN = parseInt(process.env.NEXT_PUBLIC_CHAINID || '31337');
const ETH_CHAIN = parseInt(process.env.NEXT_PUBLIC_ETH_CHAINID || '1');

export default function UpgradePage() {
  const chainId = useChainId();

  const [upgradeButtonDisabled, setUpgradeButtonDisabled] = useState(false);
  const [v1TokenAddress, setV1TokenAddress] = useState('');
  const [v2TokenAddress, setV2TokenAddress] = useState('');
  const [oneToOneAddress, setOneToOneAddress] = useState('');

  useEffect(() => {
    if (chainId) {
      if (chainId == ETH_CHAIN) {
        setV1TokenAddress(Config.l1TokenAddress);
        setV2TokenAddress(Config.v2_l1TokenAddress);
        setOneToOneAddress(Config.l1OneToOneAddress);
      }
      if (chainId == DEFAULT_CHAIN) {
        setV1TokenAddress(Config.baseTokenAddress);
        setV2TokenAddress(Config.v2_baseTokenAddress);
        setOneToOneAddress(Config.l2OneToOneAddress);
      }
    }
  }, [chainId]);

  const [tokenABalance, setTokenABalance] = useState(ethers.BigNumber.from(0));
  const [tokenBBalance, setTokenBBalance] = useState(ethers.BigNumber.from(0));
  const [needsAllowance, setNeedsAllowance] = useState(false);

  console.log('chain', chainId);

  const { data: convertData, writeContract: convertWrite } = useWriteContract();

  const handleConvert = async () => {
    if (!convertWrite) return;
    await convertWrite({
      address: oneToOneAddress as `0x${string}`,
      abi: OneToOneConvertArtifact.abi as Abi,
      functionName: 'swap',
      args: [tokenABalance],
    });
  };

  function clickUpgrade() {
    async function f() {
      setUpgradeButtonDisabled(true);
      await handleConvert();
    }

    f();
  }

  return (
    <Layout title='Upgrade' enableEth={true} full>
      <TokenBalance
        show={false}
        update={setTokenABalance}
        token={v1TokenAddress as `0x${string}`}
      />
      <TokenBalance
        show={false}
        update={setTokenBBalance}
        token={v2TokenAddress as `0x${string}`}
      />

      <main>
        <div className='bg-gray-900 relative isolate overflow-hidden py-24 sm:py-32'>
          <Image
            src='/upgrade-hero.jpg'
            alt=''
            className='absolute inset-0 -z-10 h-full w-full object-cover object-right md:object-center'
            fill
          />
          <div
            className='hidden sm:absolute sm:-top-10 sm:right-1/2 sm:-z-10 sm:mr-10 sm:block sm:transform-gpu sm:blur-3xl'
            aria-hidden='true'
          >
            <div
              className='aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr from-[#ff4694] to-[#776fff] opacity-20'
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
          <div
            className='absolute -top-52 left-1/2 -z-10 -translate-x-1/2 transform-gpu blur-3xl sm:top-[-28rem] sm:ml-16 sm:translate-x-0 sm:transform-gpu'
            aria-hidden='true'
          >
            <div
              className='aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr from-[#ff4694] to-[#776fff] opacity-20'
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
          <div className='nightwind-prevent-block mx-auto max-w-7xl px-6 lg:px-8'>
            <div className='mx-auto max-w-2xl lg:mx-0'>
              <h2 className='text-white text-4xl font-bold tracking-tight sm:text-6xl'>
                Upgrade AIUS
              </h2>
              <p className='text-gray-300 mt-6 text-lg leading-8'>
                Arbius tokens have been upgraded. Deposit your v1 tokens and you
                will receive new AIUS in exchange, 1:1. Convert before March 10,
                12:00 A.M. (UTC) to be eligible for an upcoming airdrop.
              </p>
            </div>
            <div className='mx-auto mt-10 max-w-2xl lg:mx-0 lg:max-w-none'>
              <div className='text-white grid grid-cols-1 gap-x-8 gap-y-6 text-base font-semibold leading-7 sm:grid-cols-2 md:flex lg:gap-x-10'>
                <div className='relative mt-2 rounded-md shadow-sm'>
                  <input
                    type='text'
                    value={ethers.utils.formatUnits(tokenABalance, 18)}
                    autoComplete='off'
                    readOnly={true}
                    className='bg-white text-gray-900 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-0 dark:bg-[#26242d] sm:max-w-xs sm:text-sm sm:leading-6'
                  />
                  <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3'>
                    <span
                      className='text-gray-500 sm:text-sm'
                      id='price-currency'
                    >
                      AIUS V1
                    </span>
                  </div>
                </div>

                <IncreaseAllowanceButton
                  updateNeedsAllowance={setNeedsAllowance}
                  token={v1TokenAddress as `0x${string}`}
                  to={oneToOneAddress as `0x${string}`}
                />

                {chainId && !needsAllowance && tokenABalance.gt(0) && (
                  <button
                    className='bg-black bg-opacity-50 px-4 py-1 outline transition hover:bg-opacity-60'
                    disabled={upgradeButtonDisabled}
                    onClick={clickUpgrade}
                  >
                    Upgrade <span aria-hidden='true'>→</span>
                  </button>
                )}
                {chainId && tokenABalance.eq(0) && (
                  <button
                    className='bg-black bg-opacity-50 px-4 py-1 outline transition hover:bg-opacity-60'
                    disabled={true}
                  >
                    No AIUS V1
                  </button>
                )}
              </div>
              <div className='text-white my-2 grid grid-cols-1 gap-x-8 gap-y-6 text-base font-semibold leading-7 sm:grid-cols-2 md:flex lg:gap-x-10'>
                <div className='relative mt-2 rounded-md shadow-sm'>
                  <input
                    type='text'
                    value={ethers.utils.formatUnits(tokenBBalance, 18)}
                    autoComplete='off'
                    readOnly={true}
                    className='bg-white text-gray-900 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-0 dark:bg-[#26242d] sm:max-w-xs sm:text-sm sm:leading-6'
                  />
                  <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3'>
                    <span
                      className='text-gray-500 sm:text-sm'
                      id='price-currency'
                    >
                      AIUS V2
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
