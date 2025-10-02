'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { AAWalletDisplay } from '@/lib/arbius-wallet/components/AAWalletDisplay'
import { useAccount } from 'wagmi'
import arbiusLogo from '@/app/assets/images/arbius_logo.png'
import externalLink from '@/app/assets/images/external_link.png'
import downArrow from '@/app/assets/images/down_arrow.png'
import arbiusLogoWithoutName from '@/app/assets/images/arbius_logo_without_name.png'
import arbiusLogoRound from '@/app/assets/images/arbius_logo_round.png'

export function Navbar() {
  const [headerOpen, setHeaderOpen] = useState(false)
  const [stakingOpen, setStakingOpen] = useState(true)
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollTopRef = useRef(0)
  const { isConnected } = useAccount()

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setStakingOpen(false)
    }
  }, [])

  useEffect(() => {
    function handleScroll() {
      const st = window.pageYOffset || document.documentElement.scrollTop

      // Hide navbar when scrolling down, show when scrolling up
      if (st > lastScrollTopRef.current && !headerOpen && st > 80) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      lastScrollTopRef.current = st <= 0 ? 0 : st
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [headerOpen])

  return (
    <nav
      className="fixed top-0 z-[9999] w-full bg-white transition-all duration-300"
      style={{ opacity: isVisible ? 1 : 0 }}
      aria-label="Main navigation"
    >
      <div className="m-auto flex w-[90%] max-w-[2000px] justify-between py-3">
        <div className="flex items-center">
          <Link href="/" aria-label="Arbius home">
            <Image
              className="h-[40px] w-auto"
              src={arbiusLogo}
              alt="Arbius Logo"
              width={124}
              height={40}
              priority
            />
          </Link>
        </div>
        <div
          className={`${
            headerOpen ? 'w-full pb-[90px] lg:pb-0' : 'w-0'
          } ${headerOpen ? 'fixed top-0 left-0 right-0 h-screen bg-white z-[9998] pt-[72px]' : 'lg:static lg:h-auto lg:pt-0'} flex flex-col overflow-auto lg:flex-row lg:items-center lg:overflow-visible`}
          role="navigation"
        >
          <div className="m-auto mt-[30px] flex w-full flex-col items-start justify-between gap-[40px] text-[24px] text-black lg:m-auto lg:w-auto lg:flex-row lg:items-center lg:text-[16px] lg:text-gray-700">
            <div className="group relative w-auto">
              <button
                className="cursor-pointer hover:text-purple-text lg:block"
                onClick={() => setStakingOpen(!stakingOpen)}
                aria-expanded={stakingOpen}
                aria-label="Staking menu"
              >
                Staking
                <Image
                  className="ml-1 inline-block hidden brightness-0 saturate-100 max-w-[unset] lg:block"
                  src={externalLink}
                  alt="external link icon"
                  width={12}
                  height={12}
                />
                <Image
                  className={`${
                    stakingOpen ? 'mb-1 rotate-180' : ''
                  } h-auto mt-2 block transition lg:hidden`}
                  src={downArrow}
                  alt={stakingOpen ? 'collapse menu' : 'expand menu'}
                />
              </button>
              <div className="absolute left-[-18px] bg-black p-[15px_50px] opacity-0"></div>
              <div
                className={`${stakingOpen ? 'block' : 'hidden'} lg:hidden lg:absolute lg:bg-white lg:rounded-2xl lg:shadow-[0px_4px_20px_rgba(0,0,0,0.1)] lg:p-5 lg:gap-4 lg:flex-col lg:z-[10000] lg:translate-x-[-30%] lg:translate-y-[25px] lg:group-hover:flex`}
                role="menu"
                aria-label="Staking options"
              >
                <Link
                  href="/lp-staking"
                  onClick={() => setHeaderOpen(!headerOpen)}
                  target="_blank"
                  role="menuitem"
                  aria-label="LP Staking - Provide liquidity, earn AIUS rewards"
                >
                  <div className="p-5 rounded-xl bg-[#F9F9F9] transition-all duration-300 cursor-pointer min-w-[200px] relative hover:bg-[linear-gradient(95.28deg,#4A28FF_17.25%,#92BDFF_123.27%)] hover:text-white">
                    <Image
                      className="h-auto w-[20px] lg:h-[20px] lg:w-auto"
                      src={arbiusLogoWithoutName}
                      alt="Arbius logo icon"
                    />
                    <div className="font-[family-name:var(--font-lato)] font-bold">LP Staking</div>
                    <div>Provide liquidity, earn AIUS rewards.</div>
                  </div>
                </Link>
                <Link
                  href="/aius"
                  onClick={() => setHeaderOpen(!headerOpen)}
                  target="_blank"
                  role="menuitem"
                  aria-label="veAIUS - Lock AIUS, earn rewards over time"
                >
                  <div className="p-5 rounded-xl bg-[#F9F9F9] transition-all duration-300 cursor-pointer min-w-[200px] relative hover:bg-[linear-gradient(95.28deg,#4A28FF_17.25%,#92BDFF_123.27%)] hover:text-white">
                    <Image
                      className="h-auto w-[20px] lg:h-[20px] lg:w-auto"
                      src={arbiusLogoWithoutName}
                      alt="Arbius logo icon"
                    />
                    <div>veAIUS</div>
                    <div>Lock AIUS, earn rewards over time.</div>
                  </div>
                </Link>
              </div>
            </div>

            <Link href="https://heyamica.com/" target="_blank" rel="noopener noreferrer">
              <div className="hover:text-purple-text">Amica</div>
            </Link>

            <Link href="https://effectiveacceleration.ai" target="_blank" rel="noopener noreferrer">
              <div className="hover:text-purple-text">Marketplace</div>
            </Link>

            <Link href="/mining">
              <div className="hover:text-purple-text">Mining</div>
            </Link>

            <Link href="https://docs.arbius.ai/" target="_blank" rel="noopener noreferrer" aria-label="Documentation (opens in new tab)">
              <div className="hover:text-purple-text">
                Docs
                <Image className="ml-1 inline-block brightness-0 saturate-100" src={externalLink} alt="external link icon" width={12} height={12} />
              </div>
            </Link>

            <Link
              href="https://bridge.arbitrum.io/?destinationChain=arbitrum-one&sourceChain=ethereum"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="hover:text-purple-text">Bridge</div>
            </Link>

            <Link
              href="/media"
              onClick={() => setHeaderOpen(!headerOpen)}
              target="_blank"
            >
              <div className="lg:block hover:text-purple-text">
                Media
              </div>
            </Link>
          </div>
          <div className="relative mb-[100px] mt-[20px] hidden lg:mb-0 lg:ml-[40px] lg:mt-0 lg:block">
            <div className="flex items-center gap-2">
              <ConnectButton />
              {isConnected && <AAWalletDisplay arbiusLogoSrc={arbiusLogoRound.src} />}
            </div>
          </div>
        </div>
        <div className="MobileHeader flex items-center lg:hidden">
          <button
            id="menu"
            className={`relative ${headerOpen ? 'open' : ''} right-1`}
            onClick={() => setHeaderOpen(!headerOpen)}
            aria-label={headerOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={headerOpen}
            aria-controls="mobile-navigation"
          >
            <div
              id="menu-bar1"
              className="my-2 h-[2px] w-[29px] rounded-[20px] bg-[#333333] transition-all duration-500 ease-in-out"
            ></div>
            <div
              id="menu-bar3"
              className="my-2 h-[2px] w-[29px] rounded-[20px] bg-[#333333] transition-all duration-500 ease-in-out"
            ></div>
          </button>
        </div>
      </div>
    </nav>
  )
}
