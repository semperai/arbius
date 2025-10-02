'use client'

import Link from 'next/link'
import { ModelCard } from '@/components/models/ModelCard'

const models = [
  {
    name: 'Kandinsky 2',
    role: 'Image Generation',
    description: 'text2img model trained on LAION HighRes and fine-tuned on internal datasets',
    imageUrl: '/models/kandinsky2.jpg',
    cid: '0x1220511fdf0e88fa9adba98a7693cca89b5d9f3181da4815b0f0500aa4315b38d17d',
    contracts: {},
  },
]

export default function ModelsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-24 sm:py-32">
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20"></div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              DeFi for AI
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Model creators, you are now first class citizens. Set your own fees (or none) for
              invocations of your models and allow people to invest in them as tokenized assets.
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Generations using your model will be performed by a decentralized worldwide network
              of solvers competing to serve them the fastest.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-2xl lg:mx-0 lg:max-w-none">
            <Link
              href="https://docs.arbius.ai/register-model"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-white px-6 py-3 font-semibold text-white transition-colors hover:bg-white hover:text-purple-900"
            >
              Register Model <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Models Grid */}
      <div className="mx-auto mt-16 max-w-7xl px-6 pb-24 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-black-text">Available Models</h2>
          <p className="mt-2 text-subtext-three">
            Browse and interact with AI models on the Arbius network
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {models.map((model) => (
            <ModelCard key={model.name} {...model} />
          ))}
        </div>

        {models.length === 0 && (
          <div className="rounded-2xl bg-gray-50 p-12 text-center">
            <p className="text-gray-600">No models available yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  )
}
