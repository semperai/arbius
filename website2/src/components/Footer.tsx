'use client'

import { memo } from 'react'
import Image, { StaticImageData } from 'next/image'
import Link from 'next/link'
import arbiusLogo from '@/app/assets/images/arbius_logo.png'
import smallArrow from '@/app/assets/images/small_arrow.png'
import githubIcon from '@/app/assets/images/github.png'
import twitterIcon from '@/app/assets/images/twitter.png'
import telegramIcon from '@/app/assets/images/telegram.png'
import discordIcon from '@/app/assets/images/discord.png'

const footerColumns = {
  product: [
    { name: 'Upgrade', link: '/upgrade', external: false },
    { name: 'Models', link: '/models', external: false },
    { name: 'Media', link: '/media', external: false },
  ],
  resources: [
    { name: 'Docs', link: 'https://docs.arbius.ai/', external: true },
    { name: 'Blog', link: 'https://blog.arbius.ai/', external: true },
    { name: 'Team', link: '/team', external: false },
    { name: 'Roadmap', link: '/roadmap', external: false },
  ],
  staking: [
    { name: 'veAIUS', link: '/aius', external: false },
    { name: 'LP Staking', link: '/lp-staking', external: false },
    { name: 'Arbitrum Bridge', link: 'https://bridge.arbitrum.io/', external: true },
  ],
}

const socialIcons: { image: StaticImageData; link: string; alt: string }[] = [
  { image: githubIcon, link: 'https://github.com/semperai/arbius', alt: 'Github' },
  { image: twitterIcon, link: 'https://x.com/arbius_ai', alt: 'X' },
  { image: telegramIcon, link: 'https://t.me/arbius_ai', alt: 'Telegram' },
  { image: discordIcon, link: 'https://discord.com/invite/eXxXMRCMzZ', alt: 'Discord' },
]

export const Footer = memo(function Footer() {
  const scrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <footer className="bg-white py-8 lg:py-20" role="contentinfo" aria-label="Site footer">
      <div className="mx-auto w-[90%] max-w-[2000px] lg:w-[80%]">
        {/* Desktop Footer */}
        <div className="hidden lg:block">
          <div className="mb-10 flex justify-between">
            {/* Logo and Social Icons */}
            <div>
              <Link href="/">
                <Image
                  src={arbiusLogo}
                  className="h-[40px] w-auto"
                  alt="arbius"
                />
              </Link>
              <div className="mt-6 flex items-center gap-4">
                {socialIcons.map((social) => (
                  <Link href={social.link} target="_blank" rel="noopener noreferrer" key={social.link}>
                    <div className="shadow-[0px_4px_10px_rgba(0,0,0,0.05)] group relative flex h-[50px] w-[50px] items-center justify-center rounded-xl bg-white transition-all hover:shadow-lg">
                      <div className="absolute left-0 z-[-10] h-full w-full rounded-xl bg-[linear-gradient(95.28deg,#4A28FF_17.25%,#92BDFF_123.27%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                      <Image src={social.image} alt={social.alt} width={20} height={20} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Product Column */}
            <div className="flex flex-col gap-3">
              {footerColumns.product.map((link) => (
                <Link
                  href={link.link}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  key={link.link}
                >
                  <p className="text-right text-[16px] font-medium text-gray-700 transition-colors hover:text-primary">
                    {link.name}
                  </p>
                </Link>
              ))}
            </div>

            {/* Resources Column */}
            <div className="flex flex-col gap-3">
              {footerColumns.resources.map((link) => (
                <Link
                  href={link.link}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  key={link.link}
                >
                  <p className="text-right text-[16px] font-medium text-gray-700 transition-colors hover:text-primary">
                    {link.name}
                  </p>
                </Link>
              ))}
            </div>

            {/* Staking Column */}
            <div className="flex flex-col gap-3">
              {footerColumns.staking.map((link) => (
                <Link
                  href={link.link}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  key={link.link}
                >
                  <p className="text-right text-[16px] font-medium text-gray-700 transition-colors hover:text-primary">
                    {link.name}
                  </p>
                </Link>
              ))}
            </div>

            {/* Back to Top */}
            <div>
              <button
                className="group flex cursor-pointer items-center gap-4"
                onClick={scrollTop}
                aria-label="Scroll back to top of page"
              >
                <p className="text-[14px] text-gray-700 transition-colors group-hover:text-primary">
                  Back to top
                </p>
                <Image
                  src={smallArrow}
                  className="h-3 w-auto rotate-[-90deg] transition-transform group-hover:-translate-y-1"
                  alt="up arrow"
                  width={12}
                  height={12}
                />
              </button>
            </div>
          </div>

          <div className="h-[1.5px] w-full bg-gray-100"></div>

          <div className="mt-10">
            <p className="text-[14px] text-gray-400">
              &copy; Arbius 2025
            </p>
          </div>
        </div>

        {/* Mobile Footer */}
        <div className="block lg:hidden">
          <div className="flex w-full flex-col">
            {/* Logo */}
            <Link href="/">
              <Image
                src={arbiusLogo}
                className="h-[40px] w-auto"
                alt="arbius"
              />
            </Link>

            {/* Social Icons */}
            <div className="mt-6 flex items-center gap-4">
              {socialIcons.map((social) => (
                <Link href={social.link} target="_blank" rel="noopener noreferrer" key={social.link}>
                  <div className="shadow-[0px_4px_10px_rgba(0,0,0,0.05)] group relative flex h-[50px] w-[50px] items-center justify-center rounded-xl bg-white">
                    <div className="absolute left-0 z-[-10] h-full w-full rounded-xl bg-[linear-gradient(95.28deg,#4A28FF_17.25%,#92BDFF_123.27%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                    <Image src={social.image} alt={social.alt} width={20} height={20} />
                  </div>
                </Link>
              ))}
            </div>

            {/* Links Grid */}
            <div className="mt-8 grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="flex flex-col gap-4">
                {footerColumns.product.map((link) => (
                  <Link
                    href={link.link}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    key={link.link}
                  >
                    <p className="text-[16px] font-medium text-gray-700 hover:text-primary">
                      {link.name}
                    </p>
                  </Link>
                ))}
                {footerColumns.resources.map((link) => (
                  <Link
                    href={link.link}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    key={link.link}
                  >
                    <p className="text-[16px] font-medium text-gray-700 hover:text-primary">
                      {link.name}
                    </p>
                  </Link>
                ))}
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-4">
                {footerColumns.staking.map((link) => (
                  <Link
                    href={link.link}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    key={link.link}
                  >
                    <p className="text-[16px] font-medium text-gray-700 hover:text-primary">
                      {link.name}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-8">
              <p className="text-[13px] text-gray-400">
                &copy; Arbius 2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
})
