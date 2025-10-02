'use client'

import Image from 'next/image'
import Link from 'next/link'

const posts = [
  {
    title: 'Introducing AIUS Staking',
    description:
      '$AIUS staking is being worked on. Staked holders can enjoy a constant APR/APY and wield their voting power to determine which AI models will receive more rewards. Get ready to shape the future of computing and network incentives.',
    date: 'May 27, 2024',
    image: '/media/staking_upgrade.jpg',
    url: 'https://x.com/arbius_ai/status/1795184308199551008',
  },
  {
    title: 'Arbius Network Upgrade',
    description:
      'The Arbius Network Upgrade is imminent. The Arbius network is about to undergo its most significant upgrade since its launch. We are introducing a new feature where task creators will now receive a 10% reward from the rewards pool. This will add new possibilities for users.',
    date: 'April 30, 2024',
    image: '/media/tokenomics_upgrade.jpg',
    url: 'https://x.com/arbius_ai/status/1785401938550444218',
  },
  {
    title: 'Kasumi-2 Demo Video',
    description:
      'We are thrilled to announce Kasumi2 Open Beta. Kasumi2 is an autonomous AI agent that performs actions in the Arbius network. It is a miner, has its own wallet, can retrieve results from Arbius AI models, and runs its own individual LLM model.',
    date: 'April 27, 2024',
    image: '/media/kasumi_upgrade.jpg',
    url: 'https://x.com/arbius_ai/status/1783980046111150589',
  },
  {
    title: 'Amica Launch Trailer',
    description: '',
    date: 'March 21, 2024',
    image: '/media/amica_launch.jpg',
    url: 'https://x.com/arbius_ai/status/1770547201669746702',
  },
  {
    title: 'Arbius Launch Video',
    description: '',
    date: 'February 14, 2024',
    image: '/media/amica_token_launch.jpg',
    url: 'https://x.com/arbius_ai/status/1757597553456017507/video/1',
  },
  {
    title: 'Pre-Launch Video',
    description: '',
    date: 'February 2, 2024',
    image: '/media/pre_launch.jpg',
    url: 'https://x.com/arbius_ai/status/1753478542497607913/video/1',
  },
]

export default function MediaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-20">
      <div className="mx-auto w-[90%] max-w-[2000px] lg:w-[80%]">
        {/* Header */}
        <div className="mb-16">
          <div className="mb-8">
            <h1 className="mb-4 text-[45px] font-bold text-black-text lg:text-[60px]">
              Arbius Media
            </h1>
            <p className="max-w-2xl text-lg text-subtext-three">
              See what&apos;s happening across the Arbius Ecosystem.
            </p>
          </div>

          <Link
            href="https://x.com/arbius_ai"
            target="_blank"
            className="group inline-flex items-center gap-3 rounded-full border-2 border-black-text bg-white px-8 py-3 font-semibold text-black-text transition-all hover:bg-black-text hover:text-white"
          >
            <span>View more</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {/* Media Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {posts.map((post, index) => (
            <Link
              key={index}
              href={post.url}
              target="_blank"
              className="group overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl"
            >
              {/* Video Thumbnail */}
              <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
                    <svg
                      className="h-8 w-8 text-purple-text"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Post Info */}
              <div className="p-6">
                <h3 className="mb-2 text-xl font-bold text-black-text group-hover:text-purple-text">
                  {post.title}
                </h3>
                <p className="mb-3 text-sm text-gray-500">{post.date}</p>
                {post.description && (
                  <p className="line-clamp-3 text-sm text-gray-600">{post.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
