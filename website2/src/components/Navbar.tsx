'use client'

import Link from 'next/link'
import { WalletConnect } from './WalletConnect'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-purple-text">
              Arbius
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/playground"
              className="text-subtext-two hover:text-purple-text transition-colors"
            >
              Playground
            </Link>
            <Link
              href="/aius"
              className="text-subtext-two hover:text-purple-text transition-colors"
            >
              AIUS
            </Link>
            <Link
              href="/lp-staking"
              className="text-subtext-two hover:text-purple-text transition-colors"
            >
              LP Staking
            </Link>
            <Link
              href="/models"
              className="text-subtext-two hover:text-purple-text transition-colors"
            >
              Models
            </Link>
            <Link
              href="/team"
              className="text-subtext-two hover:text-purple-text transition-colors"
            >
              Team
            </Link>
          </div>

          {/* Right side - Theme toggle and Wallet */}
          <div className="flex items-center gap-4">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-lg p-2 text-subtext-two hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? '🌞' : '🌙'}
              </button>
            )}
            <WalletConnect />
          </div>
        </div>
      </div>
    </nav>
  )
}
