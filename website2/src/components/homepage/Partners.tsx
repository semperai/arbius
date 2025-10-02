'use client'

import Image, { StaticImageData } from 'next/image'
import arbitrumImg from '@/app/assets/images/arbitrum.png'
import labsImg from '@/app/assets/images/labs.png'
import nosanaImg from '@/app/assets/images/nosana.png'
import poloniexImg from '@/app/assets/images/poloniex.png'
import coinexImg from '@/app/assets/images/coinex.png'
import exabitsImg from '@/app/assets/images/exabits.png'
import weboasisImg from '@/app/assets/images/weboasis.png'
import unicrowImg from '@/app/assets/images/unicrow_logo.png'
import independentAiImg from '@/app/assets/images/independent_ai.jpg'
import img6079 from '@/app/assets/images/6079.jpg'

const partnersData: { name: string; image: StaticImageData; url: string }[] = [
  {
    name: 'Arbitrum',
    image: arbitrumImg,
    url: 'https://arbitrum.io/',
  },
  {
    name: 'Alignment Lab',
    image: labsImg,
    url: 'https://alignmentlab.ai/',
  },
  {
    name: 'Nosana',
    image: nosanaImg,
    url: 'https://nosana.io/',
  },
  {
    name: 'Poloniex',
    image: poloniexImg,
    url: 'https://poloniex.com/',
  },
  {
    name: 'CoinEx',
    image: coinexImg,
    url: 'https://www.coinex.com/en',
  },
  {
    name: 'Exabits',
    image: exabitsImg,
    url: 'https://www.exabits.ai/',
  },
  {
    name: 'Web Oasis',
    image: weboasisImg,
    url: 'https://weboasis.io/',
  },
  {
    name: 'Unicrow',
    image: unicrowImg,
    url: 'https://unicrow.io/',
  },
  {
    name: 'Independent AI',
    image: independentAiImg,
    url: 'https://independentai.institute/',
  },
  {
    name: '6079',
    image: img6079,
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
                  className="h-[30px] w-auto object-contain"
                  priority={index < 3}
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
                  className="h-[30px] w-auto object-contain"
                  priority={index < 3}
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
