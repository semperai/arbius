'use client'

import Link from 'next/link'
import { Fade } from 'react-awesome-reveal'
import heroBackground from '@/app/assets/images/hero-background.webp'

export function HeroSection() {
  return (
    <div
      className="font-[family-name:var(--font-lato)] font-bold pt-[72px] bg-cover bg-center bg-no-repeat lg:flex lg:h-[75vh] lg:items-center"
      style={{ backgroundImage: `url(${heroBackground.src})` }}
    >
      <div className="m-auto w-[90%] max-w-[2000px] py-16 lg:w-[80%] lg:p-0 lg:py-24">
        <div className="w-full xl:w-[65%]">
          <Fade direction="up" triggerOnce={true}>
            <div className="Gradient-transparent-text mb-2 bg-[linear-gradient(90deg,#4A28FF_0.5%,#9ED6FF_50%)] text-[16px] lg:mb-0 lg:text-[12px]">
              Welcome to Arbius!
            </div>
          </Fade>

          <div className="hidden text-[45px] text-gray-900 lg:block lg:text-[50px]">
            <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
              Peer-to-peer
            </Fade>
          </div>
          <div className="mb-6 mt-[-15px] hidden text-[45px] text-gray-900 lg:block lg:text-[50px]">
            <Fade delay={0.1} cascade damping={0.1} triggerOnce={true}>
              machine learning
            </Fade>
          </div>
          <div className="text-[45px] text-gray-900 lg:hidden">
            <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
              Peer-to-peer
            </Fade>
          </div>
          <div className="mb-6 mt-[-15px] text-[45px] text-gray-900 lg:hidden">
            <Fade delay={0.1} cascade damping={0.1} triggerOnce={true}>
              machine learning
            </Fade>
          </div>

          <div>
            <Fade direction="up" triggerOnce={true}>
              <div className="font-[family-name:var(--font-lato)] font-normal text-[16px] text-gray-950">
                Arbius is a decentralized network for machine learning and a
                token with a fixed total supply like Bitcoin. New coins are
                generated with GPU power by participating in the network. There
                is no central authority to create new coins. Arbius is fully
                open-source. Holders vote on-chain for protocol upgrades.
                Models operate as DAOs with custom rules for distribution and rewards,
                providing a way for model creators to earn income.
              </div>
            </Fade>
            <Fade direction="up" triggerOnce={true}>
              <div className="mt-[30px] flex items-center gap-[20px]">
                <Link href="https://arbius.ai/paper.pdf" target="_blank" rel="noopener noreferrer">
                  <div>
                    <button
                      type="button"
                      className="group relative flex items-center gap-3 rounded-full border-[1px] border-black bg-transparent px-5 py-2 text-black hover:border-transparent hover:text-white lg:px-8"
                    >
                      <div className="absolute left-0 z-0 h-full w-full rounded-full bg-[linear-gradient(96.52deg,#9162F7_-25.28%,#FB567E_94%)] px-8 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                      <div className="font-[family-name:var(--font-lato)] font-normal relative z-10 lg:text-[100%]">
                        Read Whitepaper
                      </div>
                    </button>
                  </div>
                </Link>
              </div>
            </Fade>
          </div>
        </div>
      </div>
    </div>
  )
}
