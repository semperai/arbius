'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import arbiusLogo from '@/app/assets/images/logo.png'
import aiGenerationImg from '@/app/assets/images/ai_generation.png'
import qwenImg from '@/app/assets/images/qwen.png'
import llamaImg from '@/app/assets/images/llama.png'
import kandinskyImg from '@/app/assets/images/kandinsky.png'

const models = [
  {
    id: 'qwen-qwq-32b',
    image: qwenImg,
    name: 'Qwen QwQ 32b',
    description: 'A multilingual large language model with strong reasoning and coding capabilities.',
    emissions: '22.1%',
    fees: '0.00700',
    repository: 'Github',
    repositoryUrl: 'https://github.com',
  },
  {
    id: 'wai-sdxl-nsfw',
    image: null,
    name: 'WAI SDXL (NSFW)',
    description: 'Stable Diffusion XL model optimized for generation of NSFW waifu-style images.',
    emissions: '58.6%',
    fees: '0.00350',
    repository: 'Github',
    repositoryUrl: 'https://github.com',
  },
  {
    id: 'm8b-uncensored',
    image: null,
    name: 'M8B-uncensored',
    description: 'Uncensored instruct model, optimized for GGUF with obliterated constraints removed.',
    emissions: '19.3%',
    fees: '0.00003',
    repository: 'Github',
    repositoryUrl: 'https://github.com',
  },
]

export default function ModelsPage() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        {/* Header Section */}
        <div className="mb-12 flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <h1 className="mb-4 text-5xl font-bold text-gray-900">Arbius Models</h1>
            <p className="max-w-2xl text-gray-700">
              Explore the advanced AI models of Arbius, a decentralized machine learning network powered by AIUS and Proof-of-Useful-Work (PoUW).
            </p>
            <Link href="https://docs.arbius.ai/register-model" target="_blank" rel="noopener noreferrer" className="inline-block pt-4 font-bold text-primary hover:text-purple-600">
              Register your model →
            </Link>
          </div>

          <div className="relative h-48 w-full overflow-hidden rounded-3xl lg:h-64 lg:w-96">
            <Image
              src={aiGenerationImg}
              alt="AI Models"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search Model name or ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
            <svg className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Model Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {models.map((model) => (
            <div
              key={model.id}
              className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-purple-300 hover:shadow-xl"
            >
              {/* Icon and Name */}
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                  {model.image ? (
                    <Image
                      src={model.image}
                      alt={model.name}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{model.name}</h3>
              </div>

              {/* Description */}
              <p className="mb-6 min-h-[60px] text-sm leading-relaxed text-gray-600">
                {model.description}
              </p>

              {/* Stats Grid */}
              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-purple-50 px-4 py-3">
                  <span className="text-sm font-medium text-gray-700">Emissions</span>
                  <span className="text-lg font-bold text-purple-600">{model.emissions}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
                  <span className="text-sm font-medium text-gray-700">Fees</span>
                  <span className="text-lg font-bold text-blue-600">
                    {model.fees} <span className="text-sm font-normal text-gray-500">AIUS</span>
                  </span>
                </div>
              </div>

              {/* Repository Link */}
              <Link
                href={model.repositoryUrl}
                target="_blank"
                className="flex items-center justify-center gap-2 rounded-lg border-2 border-gray-200 bg-white px-4 py-3 font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                View on Github
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
