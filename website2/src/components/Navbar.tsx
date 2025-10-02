'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import arbiusLogo from '@/app/assets/images/arbius_logo.png'
import externalLink from '@/app/assets/images/external_link.png'
import arbiusLogoWithoutName from '@/app/assets/images/arbius_logo_without_name.png'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [stakingDropdownOpen, setStakingDropdownOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollTopRef = useRef(0)

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Handle scroll to hide/show navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop

      if (scrollTop > lastScrollTopRef.current && !mobileMenuOpen && scrollTop > 80) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      lastScrollTopRef.current = scrollTop <= 0 ? 0 : scrollTop
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [mobileMenuOpen])

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[9999] bg-white border-b border-gray-100 transition-all duration-300 ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="max-w-[2000px] mx-auto px-6 lg:px-[5%]">
          <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src={arbiusLogo}
              alt="Arbius Logo"
              width={124}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:gap-8">
            {/* Staking Dropdown */}
            <div className="relative group">
              <button
                className="text-gray-700 hover:text-purple-text transition-colors flex items-center gap-1"
                onMouseEnter={() => setStakingDropdownOpen(true)}
                onMouseLeave={() => setStakingDropdownOpen(false)}
              >
                Staking
                <svg
                  className={`w-4 h-4 transition-transform ${stakingDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl transition-all duration-200 ${
                  stakingDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
                }`}
                onMouseEnter={() => setStakingDropdownOpen(true)}
                onMouseLeave={() => setStakingDropdownOpen(false)}
              >
                <div className="p-3 space-y-2">
                  <Link
                    href="/lp-staking"
                    target="_blank"
                    className="block p-4 rounded-xl bg-gray-50 text-gray-900 hover:bg-gradient-to-r hover:from-[#4A28FF] hover:to-[#92BDFF] hover:text-white transition-all duration-300 group/item"
                  >
                    <Image
                      src={arbiusLogoWithoutName}
                      alt=""
                      width={20}
                      height={20}
                      className="mb-2"
                    />
                    <div className="font-bold mb-1">LP Staking</div>
                    <div className="text-sm opacity-90">Provide liquidity, earn AIUS rewards.</div>
                  </Link>

                  <Link
                    href="/aius"
                    target="_blank"
                    className="block p-4 rounded-xl bg-gray-50 text-gray-900 hover:bg-gradient-to-r hover:from-[#4A28FF] hover:to-[#92BDFF] hover:text-white transition-all duration-300 group/item"
                  >
                    <Image
                      src={arbiusLogoWithoutName}
                      alt=""
                      width={20}
                      height={20}
                      className="mb-2"
                    />
                    <div className="font-bold mb-1">veAIUS</div>
                    <div className="text-sm opacity-90">Lock AIUS, earn rewards over time.</div>
                  </Link>
                </div>
              </div>
            </div>

            <Link href="https://personas.heyamica.com" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-purple-text transition-colors">
              Amica
            </Link>

            <Link href="https://effectiveacceleration.ai" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-purple-text transition-colors">
              Marketplace
            </Link>

            <Link href="https://docs.arbius.ai/" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-purple-text transition-colors flex items-center gap-1">
              Docs
              <Image src={externalLink} alt="" width={12} height={12} className="w-3 h-3 opacity-60" />
            </Link>

            <Link href="https://bridge.arbitrum.io/?destinationChain=arbitrum-one&sourceChain=ethereum" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-purple-text transition-colors">
              Bridge
            </Link>

            <Link href="/media" target="_blank" className="text-gray-700 hover:text-purple-text transition-colors">
              Media
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-3 text-gray-700 hover:text-purple-text"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={`block h-0.5 w-full bg-current transition-transform duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 w-full bg-current transition-transform duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
      </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-white z-[10000] overflow-y-auto">
          <div className="px-8 py-8 space-y-8">
            {/* Staking Section */}
            <div>
              <button
                onClick={() => setStakingDropdownOpen(!stakingDropdownOpen)}
                className="w-full flex items-center justify-between text-2xl font-medium text-black"
              >
                Staking
                <svg
                  className={`w-6 h-6 transition-transform ${stakingDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {stakingDropdownOpen && (
                <div className="mt-6 space-y-4 pl-6">
                  <Link
                    href="/lp-staking"
                    target="_blank"
                    onClick={closeMobileMenu}
                    className="block p-4 rounded-xl bg-gray-50"
                  >
                    <Image src={arbiusLogoWithoutName} alt="" width={20} height={20} className="mb-2" />
                    <div className="font-bold mb-1">LP Staking</div>
                    <div className="text-sm text-gray-600">Provide liquidity, earn AIUS rewards.</div>
                  </Link>

                  <Link
                    href="/aius"
                    target="_blank"
                    onClick={closeMobileMenu}
                    className="block p-4 rounded-xl bg-gray-50"
                  >
                    <Image src={arbiusLogoWithoutName} alt="" width={20} height={20} className="mb-2" />
                    <div className="font-bold mb-1">veAIUS</div>
                    <div className="text-sm text-gray-600">Lock AIUS, earn rewards over time.</div>
                  </Link>
                </div>
              )}
            </div>

            <Link href="https://personas.heyamica.com" target="_blank" rel="noopener noreferrer" onClick={closeMobileMenu} className="block text-2xl font-medium text-black">
              Amica
            </Link>

            <Link href="https://effectiveacceleration.ai" target="_blank" rel="noopener noreferrer" onClick={closeMobileMenu} className="block text-2xl font-medium text-black">
              Marketplace
            </Link>

            <Link href="https://docs.arbius.ai/" target="_blank" rel="noopener noreferrer" onClick={closeMobileMenu} className="block text-2xl font-medium text-black flex items-center gap-2">
              Docs
              <Image src={externalLink} alt="" width={12} height={12} className="w-3 h-3 opacity-60" />
            </Link>

            <Link href="https://bridge.arbitrum.io/?destinationChain=arbitrum-one&sourceChain=ethereum" target="_blank" rel="noopener noreferrer" onClick={closeMobileMenu} className="block text-2xl font-medium text-black">
              Bridge
            </Link>

            <Link href="/media" target="_blank" onClick={closeMobileMenu} className="block text-2xl font-medium text-black">
              Media
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
