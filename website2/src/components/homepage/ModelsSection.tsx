'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import aiGenerationDesktop from '@/app/assets/images/ai_generation.png'
import aiGenerationMobile from '@/app/assets/images/ai_generation_mobile.png'
import amicaDesktop from '@/app/assets/images/amica.png'
import amicaMobile from '@/app/assets/images/amica_mobile.png'
import marketplaceDesktop from '@/app/assets/images/marketplace.png'
import marketplaceMobile from '@/app/assets/images/marketplace_mobile.png'

type ModelInfo = {
  text: string
  imageDesktop: string
  imageMobile: string
  link?: string
}

const models: Record<string, ModelInfo> = {
  'Generative AI': {
    text: 'Be part of the burgeoning AI economy! Users can now share in the value generated from AI, and model creators are now able to monetize their creations, or choose to host them free of cost. Our generative AI is handled by a global decentralized network of accelerated compute solvers.',
    imageDesktop: aiGenerationDesktop.src,
    imageMobile: aiGenerationMobile.src,
  },
  'Amica': {
    text: 'Amica is an open source AI persona chatbot interface that provides emotion, bi-directional text to speech, audial interpretation, and visual recognition based interactions.',
    imageDesktop: amicaDesktop.src,
    imageMobile: amicaMobile.src,
    link: 'https://personas.heyamica.com',
  },
  'Marketplace': {
    text: 'Arbius has created a one of a kind ecosystem where agents for the first time can source their own compute. True autonomy starts here! Utilizing decentralized escrow, fully autonomous agents can earn as well as purchase services from other agents and humans alike.',
    imageDesktop: marketplaceDesktop.src,
    imageMobile: marketplaceMobile.src,
  },
}

export function ModelsSection() {
  const [selectedModel, setSelectedModel] = useState<keyof typeof models>('Generative AI')

  return (
    <div className="py-24" style={{ backgroundImage: 'linear-gradient(142.65deg, rgba(146, 189, 255, .02) -27.23%, rgba(81, 54, 255, .1) 31.69%, hsla(0, 0%, 100%, .159) 60.92%, rgba(212, 179, 255, .2) 101.25%)' }}>
      <div className="m-auto flex w-[90%] max-w-[2000px] flex-col items-center justify-between gap-12 lg:w-[80%] lg:flex-row">
        <div className="w-full lg:w-[50%]">
          <div className="Gradient-transparent-text mb-4 bg-gradient-to-r from-purple-600 to-pink-500 text-[14px] font-bold">
            Multi-Model Economy!
          </div>

          <h2 className="mb-6 text-[45px] font-semibold text-gray-900 lg:text-[50px]">
            DeFi for AI
          </h2>

          <p className="text-[16px] text-gray-700 leading-relaxed">
            OSS (open source software) models such as Llama 3, Deepseek R1 and others can now be part of a shared AI economy for all. Arbius handles accelerated compute matchmaking for each request, pairing the best solvers to each task for rewards. Through its utility, ecosystem participants can steer the economy and share in the value generated from AI.
          </p>

          <div className="mt-8 hidden lg:block">
            <div className="flex gap-8 border-b border-gray-200">
              {Object.keys(models).map((item) => (
                <button
                  key={item}
                  className={`cursor-pointer pb-3 text-[15px] transition-colors ${
                    selectedModel === item
                      ? 'border-b-2 border-purple-600 text-purple-600 font-medium'
                      : 'text-gray-600 hover:text-purple-600'
                  }`}
                  onClick={() => setSelectedModel(item as keyof typeof models)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-8 rounded-3xl bg-purple-50/60 p-8">
              <h3 className="text-[24px] font-semibold text-purple-600">
                {selectedModel}
              </h3>
              <p className="mt-4 text-[15px] text-gray-700 leading-relaxed">
                {models[selectedModel].text}
              </p>

              {models[selectedModel].link && (
                <Link href={models[selectedModel].link!} target="_blank" rel="noopener noreferrer">
                  <button
                    type="button"
                    className="mt-6 flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
                  >
                    Try now →
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 w-full lg:mt-0 lg:w-[45%]">
          <div className="relative ml-auto hidden h-[520px] w-full max-w-[440px] items-center justify-center rounded-[40px] bg-gradient-to-br from-purple-200 to-blue-200 p-2 lg:flex">
            <div className="relative h-full w-full overflow-hidden rounded-[36px]">
              <Image
                src={models[selectedModel].imageDesktop}
                alt={selectedModel}
                fill
                className="object-cover transition-opacity duration-500"
              />
            </div>
          </div>

          {/* Mobile View */}
          <div className="block lg:hidden space-y-16">
            {Object.entries(models).map(([name, model]) => (
              <div key={name}>
                <div className="relative flex h-[240px] w-full items-center justify-center rounded-[50px]">
                  <Image
                    src={model.imageMobile}
                    alt={name}
                    width={400}
                    height={240}
                    className="h-[240px] w-full rounded-[20px] object-cover"
                  />
                </div>
                <div className="mt-[10px]">
                  <h3 className="mb-4 mt-4 text-[28px] font-medium text-secondary">
                    {name}
                  </h3>
                  <p className="mb-[10px] text-gray-700">{model.text}</p>
                  {model.link && (
                    <Link href={model.link} target="_blank" rel="noopener noreferrer">
                      <button
                        type="button"
                        className="group relative mt-5 flex items-center gap-3 rounded-full bg-black-background px-8 py-2"
                      >
                        <div className="absolute left-0 z-0 h-full w-full rounded-full bg-[linear-gradient(96.52deg,#9162F7_-25.28%,#FB567E_94%)] px-8 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                        <span className="relative z-10 font-bold text-original-white">
                          Try now
                        </span>
                        <span className="relative z-10">→</span>
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
