'use client'

import Image from 'next/image'
import { Fade } from 'react-awesome-reveal'
import privacyIcon from '@/app/assets/images/privacy.png'
import codeIcon from '@/app/assets/images/code.png'
import aiIcon from '@/app/assets/images/ai.png'

const cards = [
  {
    id: '1',
    icon: privacyIcon,
    title: 'Decentralized AI Miners',
    content:
      'Miners are rewarded for Proof of Useful Work. Contestation ensures miner honesty, tasks are confirmed on a decentralized network and are available within seconds.',
    background: "bg-[url('/secure_background.png')]",
  },
  {
    id: '2',
    icon: codeIcon,
    title: 'Direct Integration',
    content:
      "Generations done via Arbius's mining network directly outputs requests to downstream applications such as webapps, marketplaces, AI agents, chat-bots or used for gaming.",
    background: "bg-[url('/integration_background.png')]",
  },
  {
    id: '3',
    icon: aiIcon,
    title: 'DeFi AI',
    content:
      "Model creators are able to set a base fee for invocations, allowing them to monetize their creations. A portion of the revenue is also distributed to Arbius DAO's treasury and to those who hold veAIUS.",
    background: "bg-[url('/ai_background.png')]",
  },
]

export function DemocraticSection() {
  return (
    <div className="bg-[linear-gradient(78.34deg,rgba(146,189,255,0.02)_-6.48%,rgba(81,54,255,0.1)_45.24%,rgba(212,179,255,0.2)_106.31%)] py-24">
      <div className="mx-auto w-[90%] max-w-[2000px] lg:w-[80%]">
        <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
          <h2 className="font-[family-name:var(--font-lato)] font-bold mb-6 break-words text-[35px] leading-tight text-gray-900 lg:text-[50px] 2xl:text-[70px]">
            We dream of open and accessible AI
          </h2>
        </Fade>
        <Fade direction="up" triggerOnce={true}>
          <p className="font-[family-name:var(--font-lato)] font-normal w-full text-[16px] text-gray-600 lg:w-[70%]">
            Arbius is controlled by its users, not monopolized by large
            corporations and governments. The design of Arbius makes it
            difficult or impossible to censor usage, allowing for anyone
            in the world to interact with AI models permissionlessly.
          </p>
          <br />
          <p className="font-[family-name:var(--font-lato)] font-normal w-full text-[16px] text-gray-600 lg:w-[70%]">
            AI model owners can now utilize a distributed network of
            miners and attribute request origins, ensuring high uptime and
            integrity. By decentralizing the hosting process, Arbius
            offers a robust foundation for building reliable and
            transparent AI-driven applications on top of a censorship
            resistant network.
          </p>
        </Fade>

        <Fade direction="up" triggerOnce={true}>
          <div className="mt-24 hidden items-center justify-between lg:flex">
            {cards.map((card) => (
              <div
                key={card.id}
                className={`h-[400px] w-[30%] transform rounded-3xl bg-cover bg-no-repeat p-6 transition-all duration-500 hover:-translate-y-1 xl:h-[320px] ${card.background}`}
              >
                <div className="mb-10">
                  <Image src={card.icon} alt={card.title} width={20} height={20} />
                </div>
                <h3 className="font-[family-name:var(--font-lato)] font-bold relative z-10 text-[25px] text-gray-800">
                  {card.title}
                </h3>
                <p className="font-[family-name:var(--font-lato)] font-normal relative z-10 mt-6 text-[16px] text-gray-800">
                  {card.content}
                </p>
              </div>
            ))}
          </div>
        </Fade>

        {/* Mobile View - Simple Stack */}
        <div className="mt-12 flex flex-col gap-6 lg:hidden">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`rounded-3xl bg-cover bg-no-repeat p-6 ${card.background}`}
            >
              <div className="mb-6">
                <Image src={card.icon} alt={card.title} width={20} height={20} />
              </div>
              <h3 className="font-[family-name:var(--font-lato)] font-bold text-[25px] text-gray-800">
                {card.title}
              </h3>
              <p className="font-[family-name:var(--font-lato)] font-normal mt-4 text-[16px] text-gray-800">
                {card.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
