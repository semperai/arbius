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
    url: 'https://x.com/arbius_ai/status/1785294028616114192',
  },
  {
    title: 'Solidity Summit',
    description:
      'Arbius was proud to be a participant at the Solidity Summit. The event was a great opportunity to connect with other projects in the Ethereum ecosystem and share our vision for decentralized machine learning.',
    date: 'March 4, 2024',
    image: '/media/kasumi_upgrade.jpg',
    url: 'https://x.com/arbius_ai/status/1764715084638314715',
  },
]

export default function MediaPageClient() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="mb-12">
          <h1 className="mb-4 text-5xl font-bold text-gray-900">Media & Press</h1>
          <p className="max-w-2xl text-lg text-gray-700">
            Latest news, updates, and press releases from Arbius. Follow our journey building the future of decentralized AI.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <Link
              key={index}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:shadow-xl"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <div className="mb-2 text-sm text-gray-500">{post.date}</div>
                <h3 className="mb-3 text-xl font-bold text-gray-900 group-hover:text-primary">
                  {post.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">{post.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
