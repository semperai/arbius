'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type ModelInfo = {
  text: string
  image: string
  link?: string
}

const models: Record<string, ModelInfo> = {
  'Generative AI': {
    text: 'Be part of the burgeoning AI economy! Users can now share in the value generated from AI, and model creators are now able to monetize their creations, or choose to host them free of cost. Our generative AI is handled by a global decentralized network of accelerated compute solvers.',
    image: '/ai_generation.png',
  },
  'Amica': {
    text: 'Amica is an open source AI persona chatbot interface that provides emotion, bi-directional text to speech, audial interpretation, and visual recognition based interactions.',
    image: '/amica.png',
    link: 'https://amica.arbius.ai/',
  },
  'Marketplace': {
    text: 'Arbius has created a one of a kind ecosystem where agents for the first time can source their own compute. True autonomy starts here! Utilizing decentralized escrow, fully autonomous agents can earn as well as purchase services from other agents and humans alike.',
    image: '/marketplace.png',
  },
}

export function ModelsSection() {
  const [selectedModel, setSelectedModel] = useState<keyof typeof models>('Generative AI')

  return (
    <div className="bg-gradient-to-r from-blue-50/20 via-purple-50/20 to-pink-50/20 py-24">
      <div className="m-auto flex w-[90%] max-w-[2000px] flex-col items-center justify-between lg:w-[80%] lg:flex-row">
        <div className="w-full lg:w-[50%]">
          <div className="Gradient-transparent-text mb-2 bg-gradient-to-r from-purple-600 to-pink-500 text-[16px] lg:mb-0 lg:text-[12px]">
            Multi-Model Economy!
          </div>

          <h2 className="mb-6 text-[45px] font-medium text-black-text lg:text-[50px] 2xl:text-[70px]">
            DeFi for AI
          </h2>

          <p className="text-para text-subtext-two">
            OSS (open source software) models such as Llama 3, Deepseek R1 and others can now be part of a shared AI economy for all. Arbius handles accelerated compute matchmaking for each request, pairing the best solvers to each task for rewards. Through its utility, ecosystem participants can steer the economy and share in the value generated from AI.
          </p>

          <div className="mt-[30px] hidden lg:block">
            <div className="flex w-full justify-between border-b">
              {Object.keys(models).map((item) => (
                <button
                  key={item}
                  className={`cursor-pointer pb-[20px] text-[17px] text-subtext-two transition-colors hover:text-purple-text ${
                    selectedModel === item ? 'border-b-2 gradient-border text-blue-text' : ''
                  }`}
                  onClick={() => setSelectedModel(item as keyof typeof models)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-[30px]">
              <h3 className="text-[28px] font-medium text-blue-text transition-opacity duration-500">
                {selectedModel}
              </h3>
              <p className="mt-[10px] w-[80%] text-subtext-two lg:min-h-[180px]">
                {models[selectedModel].text}
              </p>

              {models[selectedModel].link && (
                <Link href={models[selectedModel].link!} target="_blank">
                  <button
                    type="button"
                    className="group relative mt-[20px] flex items-center gap-3 overflow-hidden rounded-full bg-black-background px-8 py-2"
                  >
                    <div className="absolute left-0 z-0 h-full w-full rounded-full bg-gradient-to-r from-purple-text to-blue-500 px-8 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                    <span className="relative z-10 font-bold text-original-white">
                      Try now
                    </span>
                    <span className="relative z-10">→</span>
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 w-full lg:mt-0 lg:w-[50%]">
          <div className="relative ml-auto hidden h-[500px] w-[320px] items-center justify-center rounded-[50px] lg:flex">
            <Image
              src={models[selectedModel].image}
              alt={selectedModel}
              width={320}
              height={500}
              className="absolute left-0 top-0 h-[500px] w-auto rounded-[30px] object-cover transition-opacity duration-500"
            />
            <span className="absolute bottom-[20px] right-[20px]">
              <Image
                src="/arbius_logo_round.png"
                alt="Arbius"
                width={50}
                height={50}
                className="h-[50px] w-auto"
              />
            </span>
          </div>

          {/* Mobile View */}
          <div className="block lg:hidden space-y-16">
            {Object.entries(models).map(([name, model]) => (
              <div key={name}>
                <div className="relative flex h-[240px] w-full items-center justify-center rounded-[50px]">
                  <Image
                    src={model.image}
                    alt={name}
                    width={400}
                    height={240}
                    className="h-[240px] w-full rounded-[20px] object-cover"
                  />
                </div>
                <div className="mt-[10px]">
                  <h3 className="mb-4 mt-4 text-[28px] font-medium text-blue-text">
                    {name}
                  </h3>
                  <p className="mb-[10px] text-subtext-two">{model.text}</p>
                  {model.link && (
                    <Link href={model.link} target="_blank">
                      <button
                        type="button"
                        className="group relative mt-5 flex items-center gap-3 rounded-full bg-black-background px-8 py-2"
                      >
                        <div className="absolute left-0 z-0 h-full w-full rounded-full bg-gradient-to-r from-purple-text to-blue-500 px-8 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
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
