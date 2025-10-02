'use client'

import Image from 'next/image'

const partnersData = [
  {
    name: 'Arbitrum',
    image: '/arbitrum.png',
    url: 'https://arbitrum.io/',
  },
  {
    name: 'Alignment Lab',
    image: '/labs.png',
    url: 'https://alignmentlab.ai/',
  },
  {
    name: 'Nosana',
    image: '/nosana.png',
    url: 'https://nosana.io/',
  },
  {
    name: 'Poloniex',
    image: '/poloniex.png',
    url: 'https://poloniex.com/',
  },
  {
    name: 'CoinEx',
    image: '/coinex.png',
    url: 'https://www.coinex.com/en',
  },
  {
    name: 'Exabits',
    image: '/exabits.png',
    url: 'https://www.exabits.ai/',
  },
  {
    name: 'Web Oasis',
    image: '/weboasis.png',
    url: 'https://weboasis.io/',
  },
  {
    name: 'Unicrow',
    image: '/unicrow_logo.png',
    url: 'https://unicrow.io/',
  },
  {
    name: 'Independent AI',
    image: '/independent_ai.jpg',
    url: 'https://independentai.institute/',
  },
  {
    name: '6079',
    image: '/6079.jpg',
    url: 'https://6079.ai/',
  },
]

export function Partners() {
  return (
    <div className="relative overflow-hidden">
      <div className="flex w-full gap-8">
        {/* First marquee */}
        <div className="animate-marquee flex min-w-full shrink-0 items-center justify-around gap-8 py-10">
          {partnersData.map((partner, index) => (
            <div className="px-8" key={index}>
              <a href={partner.url} target="_blank" rel="noopener noreferrer">
                <Image
                  src={partner.image}
                  alt={partner.name}
                  width={100}
                  height={40}
                  className="h-[30px] w-auto object-contain"
                />
              </a>
            </div>
          ))}
        </div>

        {/* Duplicate for seamless loop */}
        <div className="animate-marquee flex min-w-full shrink-0 items-center justify-around gap-8 py-10" aria-hidden="true">
          {partnersData.map((partner, index) => (
            <div className="px-8" key={index}>
              <a href={partner.url} target="_blank" rel="noopener noreferrer">
                <Image
                  src={partner.image}
                  alt={partner.name}
                  width={100}
                  height={40}
                  className="h-[30px] w-auto object-contain"
                />
              </a>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        .animate-marquee {
          animation: marquee 55s linear infinite;
        }

        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
