'use client'

import Image from 'next/image'
import Link from 'next/link'
import bgRectModels from '@/app/assets/images/bg_rect_models.png'

const models = [
  {
    id: 'qwen-qwq-32b',
    icon: 'Q',
    iconBg: 'from-purple-500 to-blue-500',
    name: 'Qwen QwQ 32b',
    description: 'A multilingual large language model with strong reasoning and coding capabilities.',
    emissions: '22.1%',
    fees: '0.00700',
    repository: 'Github',
    repositoryUrl: 'https://github.com',
  },
  {
    id: 'wai-sdxl-nsfw',
    icon: 'W',
    iconBg: 'from-pink-500 to-purple-500',
    name: 'WAI SDXL (NSFW)',
    description: 'Stable Diffusion XL model optimized for generation of NSFW waifu-style images.',
    emissions: '58.6%',
    fees: '0.00350',
    repository: 'Github',
    repositoryUrl: 'https://github.com',
  },
  {
    id: 'm8b-uncensored',
    icon: 'M',
    iconBg: 'from-blue-500 to-cyan-500',
    name: 'M8B-uncensored',
    description: 'Uncensored instruct model, optimized for GGUF with obliterated constraints removed.',
    emissions: '19.3%',
    fees: '0.00003',
    repository: 'Github',
    repositoryUrl: 'https://github.com',
  },
]

export function ArbiusModelsSection() {
  return (
    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-24">
      <div className="mx-auto w-[90%] max-w-[2000px] lg:w-[80%]">
        {/* Header Section */}
        <div className="mb-12 flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="mb-6">
              <h2 className="text-5xl font-bold text-gray-900">Arbius Models</h2>
            </div>
            <p className="max-w-2xl text-gray-700">
              Explore the advanced AI models of Arbius, a decentralized machine learning network powered by AIUS and Proof-of-Useful-Work (PoUW).
            </p>
          </div>

          <div className="relative h-48 w-full overflow-hidden rounded-3xl lg:h-64 lg:w-96">
            <Image
              src={bgRectModels}
              alt="AI Models"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Model List - Minimal Row Layout */}
        <div className="space-y-2">
          {models.map((model) => (
            <div
              key={model.id}
              className="group flex items-center justify-between rounded-xl bg-white px-6 py-3 shadow-sm transition-all duration-200 hover:shadow-md"
            >
              {/* Model Info */}
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">{model.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-1">{model.description}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Emissions</p>
                  <p className="text-sm font-semibold text-purple-600">{model.emissions}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Fees</p>
                  <p className="text-sm font-semibold text-blue-600">{model.fees} AIUS</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* See All Models Button */}
        <div className="mt-8 text-center">
          <Link href="/models">
            <button className="rounded-full bg-black px-8 py-3 font-medium text-white transition-colors hover:bg-gray-800 cursor-pointer">
              See All Models
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
