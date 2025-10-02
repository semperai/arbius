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

const footerLinks = [
  { name: 'Upgrade', link: '/upgrade', external: false },
  { name: 'Media', link: '/media', external: false },
  { name: 'Docs', link: 'https://docs.arbius.ai/', external: true },
  { name: 'Models', link: '/models', external: false },
  { name: 'Blog', link: 'https://blog.arbius.ai/', external: true },
  { name: 'veAIUS', link: '/aius', external: false },
  { name: 'LP Staking', link: '/lp-staking', external: false },
  { name: 'Arbitrum Bridge', link: 'https://bridge.arbitrum.io/', external: true },
  { name: 'Team', link: '/team', external: false },
]

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
                    <div className="shadow-[0px_4px_10px_rgba(0,0,0,0.05)] group relative flex h-[50px] w-[50px] items-center justify-center rounded-xl bg-white">
                      <div className="absolute left-0 z-[-10] h-full w-full rounded-xl bg-[linear-gradient(95.28deg,#4A28FF_17.25%,#92BDFF_123.27%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                      <Image src={social.image} alt={social.alt} width={20} height={20} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {footerLinks.slice(0, 3).map((link) => (
                <Link
                  href={link.link}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  key={link.link}
                >
                  <p className="font-[family-name:var(--font-lato)] text-right text-[16px] font-medium text-[#393939] hover:text-purple-text">
                    {link.name}
                  </p>
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              {footerLinks.slice(3, 6).map((link) => (
                <Link
                  href={link.link}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  key={link.link}
                >
                  <p className="font-[family-name:var(--font-lato)] text-right text-[16px] font-medium text-[#393939] hover:text-purple-text">
                    {link.name}
                  </p>
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              {footerLinks.slice(6, 9).map((link) => (
                <Link
                  href={link.link}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  key={link.link}
                >
                  <p className="font-[family-name:var(--font-lato)] text-right text-[16px] font-medium text-[#393939] hover:text-purple-text">
                    {link.name}
                  </p>
                </Link>
              ))}
            </div>
            <div>
              <button
                className="group flex cursor-pointer items-center gap-4"
                onClick={scrollTop}
                aria-label="Scroll back to top of page"
              >
                <p className="font-[family-name:var(--font-lato)] text-[14px] text-[#393939] group-hover:text-purple-text">
                  Back to top
                </p>
                <Image
                  src={smallArrow}
                  className="rotate-[-90deg]"
                  alt="up arrow"
                />
              </button>
            </div>
          </div>
          <div className="h-[1.5px] w-full bg-[#F4F4F4]"></div>
          <div className="mt-10">
            <p className="font-[family-name:var(--font-lato)] text-[14px] text-[#39393980]">
              &copy; Arbius 2025
            </p>
          </div>
        </div>

        {/* Mobile Footer */}
        <div className="block lg:hidden">
          <div className="flex w-full flex-col justify-between">
            <div>
              <Image
                src={arbiusLogo}
                className="h-[40px] w-auto"
                alt="arbius"
              />
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
              <div className="mt-6 flex flex-row justify-between">
                <div className="mt-4 flex flex-col flex-wrap items-start gap-4 lm:mt-0 lm:gap-0 lg:flex-row">
                  {footerLinks.slice(0, 5).map((link) => (
                    <Link
                      href={link.link}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      key={link.link}
                    >
                      <p className="font-[family-name:var(--font-lato)] text-right text-[16px] font-medium text-[#393939] hover:text-purple-text">
                        {link.name}
                      </p>
                    </Link>
                  ))}
                </div>
                <div className="mt-4 flex flex-col flex-wrap items-start gap-4 lm:mt-0 lm:gap-0 lg:flex-row">
                  {footerLinks.slice(-4).map((link) => (
                    <Link
                      href={link.link}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      key={link.link}
                    >
                      <p className="font-[family-name:var(--font-lato)] text-right text-[16px] font-medium text-[#393939] hover:text-purple-text">
                        {link.name}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="mt-6">
                <p className="font-[family-name:var(--font-lato)] text-[13px] text-[#39393980]">
                  &copy; Arbius 2025
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
})
