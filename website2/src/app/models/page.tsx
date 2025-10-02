'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import arbiusLogo from '@/app/assets/images/logo.png'
import aiGenerationImg from '@/app/assets/images/ai_generation.png'

const models = [
  {
    id: 'qwen-qwq-32b',
    icon: '🧠',
    name: 'Qwen QwQ 32b',
    description: 'A multilingual large language model with strong reasoning and coding capabilities.',
    emissions: '22.1%',
    fees: '0.00700',
    repository: 'Github',
    repositoryUrl: 'https://github.com',
  },
  {
    id: 'wai-sdxl-nsfw',
    icon: '🎨',
    name: 'WAI SDXL (NSFW)',
    description: 'Stable Diffusion XL model optimized for generation of NSFW waifu-style images.',
    emissions: '58.6%',
    fees: '0.00350',
    repository: 'Github',
    repositoryUrl: 'https://github.com',
  },
  {
    id: 'm8b-uncensored',
    icon: '💬',
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
  const [filterBy, setFilterBy] = useState('GPU')

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        {/* Header Section */}
        <div className="mb-12 flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="mb-6 flex items-center gap-3">
              <h1 className="text-5xl font-bold text-black-text">Arbius Models</h1>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-600">
                <Image src={arbiusLogo} alt="Arbius" width={40} height={40} className="brightness-0 invert" />
              </div>
            </div>
            <p className="max-w-2xl text-gray-700">
              Explore the advanced AI models of Arbius, a decentralized machine learning network powered by AIUS and Proof-of-Useful-Work (PoUW).
            </p>
            <Link href="https://amica.arbius.ai" target="_blank">
              <button className="mt-6 rounded-full bg-black px-8 py-3 font-medium text-white transition-colors hover:bg-gray-800">
                Amica
              </button>
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

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
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

          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option>Filter by: GPU</option>
              <option>Filter by: Emissions</option>
              <option>Filter by: Fees</option>
            </select>
          </div>
        </div>

        {/* Table Header */}
        <div className="mb-4 grid grid-cols-12 gap-4 rounded-t-2xl border-2 border-purple-200 bg-white px-6 py-4">
          <div className="col-span-3 text-sm font-semibold text-gray-900">Model Name</div>
          <div className="col-span-4 text-sm font-semibold text-gray-900">Description</div>
          <div className="col-span-2 text-sm font-semibold text-gray-900">Emissions</div>
          <div className="col-span-2 text-sm font-semibold text-gray-900">Fees</div>
          <div className="col-span-1 text-sm font-semibold text-gray-900">Repository</div>
        </div>

        {/* Model Cards */}
        <div className="space-y-4">
          {models.map((model) => (
            <div
              key={model.id}
              className="grid grid-cols-12 gap-4 rounded-2xl border-2 border-purple-200 bg-white px-6 py-6 transition-shadow hover:shadow-lg"
            >
              <div className="col-span-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-2xl">
                  {model.icon}
                </div>
                <span className="font-semibold text-gray-900">{model.name}</span>
              </div>
              <div className="col-span-4 flex items-center">
                <p className="text-sm text-gray-600">{model.description}</p>
              </div>
              <div className="col-span-2 flex items-center">
                <span className="text-gray-900">{model.emissions}</span>
              </div>
              <div className="col-span-2 flex items-center">
                <span className="text-gray-900">{model.fees} <span className="text-xs text-gray-500">AIUS</span></span>
              </div>
              <div className="col-span-1 flex items-center">
                <Link href={model.repositoryUrl} target="_blank" className="flex items-center gap-1 text-gray-900 hover:text-purple-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm underline">Github</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
