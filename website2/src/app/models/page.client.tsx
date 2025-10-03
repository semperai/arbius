'use client'

import { useState } from 'react'
import Link from 'next/link'

const models = [
  {
    id: 'qwen-qwq-32b',
    name: 'Qwen QwQ 32b',
    description: 'A multilingual large language model with strong reasoning and coding capabilities.',
    emissions: '22.1%',
    fees: '0.00700',
  },
  {
    id: 'wai-sdxl-nsfw',
    name: 'WAI SDXL (NSFW)',
    description: 'Stable Diffusion XL model optimized for generation of NSFW waifu-style images.',
    emissions: '58.6%',
    fees: '0.00350',
  },
  {
    id: 'm8b-uncensored',
    name: 'M8B-uncensored',
    description: 'Uncensored instruct model, optimized for GGUF with obliterated constraints removed.',
    emissions: '19.3%',
    fees: '0.00003',
  },
]

export default function ModelsPageClient() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="mb-6 text-5xl font-bold text-gray-900">DeFi for AI</h1>
          <p className="max-w-3xl text-lg text-gray-700 leading-relaxed mb-4">
            Model creators, you are now first class citizens. Set your own fees (or none) for invocations of your models and allow people to invest in them as tokenized assets.
          </p>
          <p className="max-w-3xl text-lg text-gray-700 leading-relaxed">
            Generations using your model will be performed by a decentralized worldwide network of solvers competing to serve them the fastest.
          </p>
          <Link href="https://docs.arbius.ai/register-model" target="_blank" rel="noopener noreferrer" className="inline-block pt-6 font-bold text-primary hover:text-purple-600">
            Register your model →
          </Link>
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
              aria-label="Search for AI models"
            />
            <svg className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
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
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">{model.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-1">{model.description}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 ml-4">
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
      </div>
    </div>
  )
}
