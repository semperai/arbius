'use client';
import React, { useEffect, useState, useRef } from 'react';
import { ethers } from 'ethers';
import ArbiusLogo from '../../assets/images/arbius_logo.png';
import external_link from '../../assets/images/external_link.png';
import down_arrow from '../../assets/images/down_arrow.png';
//import amica_l from "../../assets/images/amica_l.png";
//import kasumi_l from "../../assets/images/kasumi_l.png";
import arbius from '../../assets/images/arbius_logo_without_name.png';
import gysr from '../../assets/images/gysr_logo_without_name.png';
import kandinsky from '../../assets/images/kandinsky.png';

import Image from 'next/image';
import arbiusBWlogo from '../../assets/images/connect_logo.png';
import { usePathname, useRouter } from 'next/navigation';
import AnimateHeight from 'react-animate-height';
import Link from 'next/link';

import ConnectWallet from '@/components/ConnectWallet'; // main arbius component
import { useWeb3Modal } from '@web3modal/react'; // main arbius component
import { useAccount, useContractRead } from 'wagmi'; // main arbius component
import baseTokenV1 from '../../abis/baseTokenV1.json';
import getAIUSBalance from '../../Utils/aiusWalletBalance';
import { BigNumber } from 'ethers';
import { AIUS_wei } from '../../Utils/constantValues';
import Config from '@/config.one.json';

export default function Header() {
  const [headerOpen, setHeaderOpen] = useState(false);
  const [stakingOpen, setStakingOpen] = useState(true);
  const [modelsOpen, setModelsOpen] = useState(true);
  const [activeLink, setActiveLink] = useState('');
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const route = pathname.replace('/', '');

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setStakingOpen(false);
      setModelsOpen(false);
    }
  }, []);

  useEffect(() => {
    function handleScroll() {
      const st = window.pageYOffset || document.documentElement.scrollTop;

      if (headerRef.current) {
        if (st > lastScrollTop && !headerOpen) {
          headerRef.current.style.opacity = '0';
        } else {
          headerRef.current.style.opacity = '1';
        }
      }

      setLastScrollTop(st <= 0 ? 0 : st);
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollTop]);

  const { isConnected, isConnecting, isDisconnected, address } = useAccount();
  const { open: openWeb3Modal } = useWeb3Modal();

  const [walletConnected, setWalletConnected] = useState(false);
  // const [walletBalance, setWalletBalance] = useState(0);
  const [loadingWeb3Modal, setLoadingWeb3Modal] = useState(false);

  useEffect(() => {
    // if(localStorage.getItem('aiusBalance')){
    //   const wallet=getAIUSBalance()
    //   // setWalletBalance(localStorage.getItem('aiusBalance'))
    //   setWalletConnected(true);
    // }
    // else{
    setWalletConnected(isConnected);
    // }
  }, [isConnected]);

  function clickConnect() {
    (async () => {
      setLoadingWeb3Modal(true);
      await openWeb3Modal();
      setLoadingWeb3Modal(false);
    })();
  }

  const { data, isError, isLoading } = useContractRead({
    address: Config.v4_baseTokenAddress as `0x${string}`,
    abi: baseTokenV1.abi,
    functionName: 'balanceOf',
    args: [address],
    enabled: isConnected,
  });

  function formatBalance(num: string) {
    if (Number.isInteger(num)) {
      return num.toString().split('.')[0];
    } else {
      const numStr = num.toString().split('.')[0];
      return numStr.length < 3 ? Number(num).toFixed(2) : numStr;
    }
  }

  let walletBalance = '0';
  if (data && !isLoading) {
    walletBalance = formatBalance(ethers.utils.formatEther(data as BigNumber));
  }

  return (
    <div
      className={`fixed top-0 z-[9999] w-[100%] bg-[white] transition-all duration-300`}
      ref={headerRef}
    >
      <div className='m-auto flex w-[90%] max-w-center-width justify-between py-4'>
        <div className='flex items-center'>
          <Link href='/'>
            <Image
              className='h-[40px] w-[auto]'
              src={ArbiusLogo}
              alt='Arbius Logo'
            />
          </Link>
        </div>
        <div
          className={`${
            headerOpen ? 'w-[100%] pb-[90px] lg:pb-0' : 'w-[0%]'
          } lg:no-fixed-element fixed-element flex flex-col overflow-auto lg:flex-row lg:items-center lg:overflow-visible`}
        >
          <div className='links-parent link-block m-[auto] mt-[30px] flex w-[100%] flex-col items-start justify-between gap-[40px] text-[24px] text-[original-black] lg:m-[auto] lg:w-[auto] lg:flex-row lg:items-center lg:text-[16px] lg:text-[gray]'>
            {/*
            <Link href={"/generate"} target="_blank">
              <div className="item hover:text-purple-text">Generate</div>
            </Link>
            */}

            <div className='link-with-image group relative w-[auto]'>
              <div
                className={`link lg:block ${activeLink == 'aius' ? '!text-purple-text' : 'hover:!text-purple-text'}`}
                onClick={() => setStakingOpen(!stakingOpen)}
              >
                Staking
                <Image
                  className='ext-link hidden max-w-[unset] lg:block'
                  src={external_link}
                  alt=''
                />
                <Image
                  className={`${
                    stakingOpen ? 'mb-1 rotate-[180deg]' : ''
                  } mobile-height ext-link mt-2 block transition lg:hidden`}
                  src={down_arrow}
                  alt=''
                />
              </div>
              <div className='absolute left-[-18px] bg-[black] p-[15px_50px] opacity-0'></div>
              <AnimateHeight height={stakingOpen ? 'auto' : 0}>
                <div className='lg:staking lg:hidden lg:translate-x-[-30%] lg:translate-y-[25px] lg:group-hover:flex'>
                  <Link
                    href={
                      'https://app.gysr.io/pool/0xf0148b59d7f31084fb22ff969321fdfafa600c02?network=ethereum'
                    }
                    onClick={() => {
                      setHeaderOpen(!headerOpen);
                    }}
                  >
                    <div className='staking-block relative'>
                      <div className='absolute right-2 top-2 hidden rounded-2xl bg-[#FBFBFB1A] p-2 opacity-0 lg:block'>
                        <p className='lato-regular text-[12px] text-original-white'>
                          Coming Soon
                        </p>
                      </div>
                      <Image
                        className='h-[auto] w-[20px] lg:h-[20px] lg:w-[auto]'
                        src={gysr}
                        alt=''
                      />
                      <div className='lato-bold'>GYSR</div>
                      <div>Provide liquidity, earn AIUS rewards.</div>
                    </div>
                  </Link>
                  <Link
                    href={'/aius'}
                    onClick={() => {
                      setHeaderOpen(!headerOpen);
                    }}
                    target='_blank'
                  >
                    <div className='staking-block relative'>
                      <div className='badge absolute right-2 top-2 hidden rounded-2xl bg-[#f0efff] p-2 lg:block opacity-0'>
                        <p className='lato-regular badge-text text-[12px] text-[#4A28FF]'>
                          Coming Soon
                        </p>
                      </div>
                      <Image
                        className='h-[auto] w-[20px] lg:h-[20px] lg:w-[auto]'
                        src={arbius}
                        alt=''
                      />
                      <div>veAIUS</div>
                      <div>Lock AIUS, earn rewards over time.</div>
                    </div>
                  </Link>
                </div>
              </AnimateHeight>
            </div>

            <Link href={'https://heyamica.com/'} target='_blank'>
              <div className='item hover:text-purple-text'>Amica</div>
            </Link>

            <div className='link-with-image group relative'>
              <div
                className='link hover:!text-purple-text'
                onClick={() => setModelsOpen(!modelsOpen)}
              >
                <h1>Models</h1>
                <Image
                  className={`${
                    modelsOpen ? 'mb-1 rotate-[180deg]' : ''
                  } mobile-height ext-link mt-2 block inline transition lg:hidden`}
                  src={down_arrow}
                  alt=''
                />
              </div>
              <div className='absolute left-[-18px] ml-[-5px] bg-[black] p-[15px_50px] opacity-0'></div>
              <AnimateHeight height={modelsOpen ? 'auto' : 0}>
                <div className='lg:staking lg:hidden lg:translate-x-[-40%] lg:translate-y-[25px] lg:group-hover:flex'>
                  <Link href={'/generate'} target='_blank'>
                    <div className='staking-block'>
                      <div className='badge absolute right-2 top-2 hidden rounded-2xl bg-[#f0efff] p-2 lg:block'>
                        <p className='lato-regular badge-text text-[12px] text-[#4A28FF]'>
                          Paused
                        </p>
                      </div>
                      <Image
                        className='h-[auto] w-[20px] lg:h-[20px] lg:w-[auto]'
                        src={kandinsky}
                        alt=''
                      />
                      <div>Kandinsky 2</div>
                      <div>Image Generation</div>
                    </div>
                  </Link>
                  <Link href={'#'}>
                    <div className='staking-block'>
                      <div className='badge absolute right-2 top-2 hidden rounded-2xl bg-[#f0efff] p-2 lg:block'>
                        <p className='lato-regular badge-text text-[12px] text-[#4A28FF]'>
                          Coming Soon
                        </p>
                      </div>
                      <Image
                        className='lg:w-[auto]] h-[auto] w-[20px] lg:h-[20px]'
                        src={kandinsky}
                        alt=''
                      />
                      <div>Llama 3.1 405B</div>
                      <div>Text Generation</div>
                    </div>
                  </Link>
                  <Link href={'#'}>
                    <div className='staking-block'>
                      <div className='badge absolute right-2 top-2 hidden rounded-2xl bg-[#f0efff] p-2 lg:block'>
                        <p className='lato-regular badge-text text-[12px] text-[#4A28FF]'>
                          Coming Soon
                        </p>
                      </div>
                      <Image
                        className='h-[auto] w-[20px] lg:h-[20px] lg:w-[auto]'
                        src={kandinsky}
                        alt=''
                      />
                      <div>Llama 3.2 90B</div>
                      <div>Multi-modal</div>
                    </div>
                  </Link>
                </div>
              </AnimateHeight>
            </div>

            <Link href={'/explorer'} target='_blank'>
              <div className='item hover:text-purple-text'>Explorer</div>
            </Link>

            <Link href={'https://docs.arbius.ai/'} target='_blank'>
              <div className='link-with-image'>
                <div className='link hover:!text-purple-text'>
                  Docs
                  <Image className='ext-link' src={external_link} alt='' />
                </div>
              </div>
            </Link>
            <Link
              href={'/media'}
              onClick={() => {
                setHeaderOpen(!headerOpen);
              }}
              target='_blank'
            >
              <div
                className={`item lg:block ${activeLink == 'media' ? '!text-purple-text' : 'hover:!text-purple-text'}`}
              >
                Media
              </div>
            </Link>
          </div>
          <div className='relative mb-[100px] mt-[20px] hidden lg:mb-[0] lg:ml-[40px] lg:mt-[0] lg:block'>
            <div>
              {/*<button className="hover:bg-buy-hover transition-all ease-in duration-300 bg-[black] p-[5px_25px] rounded-[20px] text-[white] text-[14px]">Connect</button>*/}
              <button
                type='button'
                className='group relative m-[auto] flex items-center gap-3 rounded-full bg-black-background lm:p-[7px_150px] lg:px-8 lg:py-2'
                onClick={clickConnect}
              >
                <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover opacity-0 transition-opacity duration-500 group-hover:opacity-100 lm:p-[7px_150px] lg:px-8 lg:py-2'></div>
                <div className='lato-bold relative z-10 mt-[-1.5px] flex flex-row items-center gap-2 text-original-white'>
                  {walletConnected ? (
                    <Image
                      className='mt-[1px] h-[10px] w-[auto]'
                      style={{ filter: 'invert(1)' }}
                      src={arbiusBWlogo}
                      height={20}
                      alt='connected'
                    />
                  ) : null}
                  {walletConnected ? walletBalance : 'Connect'}
                </div>
              </button>
            </div>
          </div>
        </div>
        <div className='MobileHeader flex items-center lg:hidden'>
          <div
            id='menu'
            className={`relative ${headerOpen ? 'open' : ''} right-1`}
            onClick={() => setHeaderOpen(!headerOpen)}
          >
            <div
              id='menu-bar1'
              className='my-2 h-[2px] w-[29px] rounded-[20px] bg-hamburger-background transition-all duration-500 ease-in-out'
            ></div>
            <div
              id='menu-bar3'
              className='my-2 h-[2px] w-[29px] rounded-[20px] bg-hamburger-background transition-all duration-500 ease-in-out'
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
