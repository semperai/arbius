'use client'

import Image, { StaticImageData } from 'next/image'
import kasumiImg from '@/app/assets/images/team/kasumi.png'
import masterPigImg from '@/app/assets/images/team/master_pig.png'
import beskayImg from '@/app/assets/images/team/beskay.png'
import damienImg from '@/app/assets/images/team/damien.png'
import deedazImg from '@/app/assets/images/team/deedaz.png'
import charlieImg from '@/app/assets/images/team/charlie.png'
import oscarImg from '@/app/assets/images/team/oscar.png'
import teamBackgroundImg from '@/app/assets/images/team/team_background.jpg'

const teamMembers: Array<{
  name: string
  title: string
  telegram: string
  image: StaticImageData
}> = [
  {
    name: 'Kasumi',
    title: 'Founder & Vision Lead',
    telegram: 'kasumi_null',
    image: kasumiImg,
  },
  {
    name: 'J Master Pig',
    title: 'Operations Lead',
    telegram: 'slowsynapse',
    image: masterPigImg,
  },
  {
    name: 'Beskay',
    title: 'Developer',
    telegram: 'beskay0x',
    image: beskayImg,
  },
  {
    name: 'Damien',
    title: 'Developer',
    telegram: '',
    image: damienImg,
  },
  {
    name: 'DeeDaz',
    title: 'UX Designer',
    telegram: '',
    image: deedazImg,
  },
  {
    name: 'Charlie',
    title: 'Social Media Manager',
    telegram: 'charliesjv',
    image: charlieImg,
  },
  {
    name: 'Oscar',
    title: 'Graphics & Video Lead',
    telegram: 'osalas08',
    image: oscarImg,
  },
]

export default function TeamPageClient() {
  return (
    <div
      className="min-h-screen bg-cover bg-center py-16"
      style={{ backgroundImage: `url(${teamBackgroundImg.src})` }}
    >
      <div className="mx-auto w-[90%] max-w-[1300px] md:w-[80%]">
        {/* Header */}
        <div className="mb-12 pt-12">
          <h1 className="mb-4 text-[48px] font-bold text-gray-900 lg:text-[60px]">
            Meet Our Team
          </h1>
          <p className="max-w-md text-lg text-gray-700">
            Meet the passionate and talented team bringing free and open AI to the world.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {teamMembers.map((member, index) => (
            <div key={index} className="group relative overflow-hidden rounded-2xl">
              {/* Member Image */}
              <div className="relative aspect-square w-full">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Telegram Badge */}
              {member.telegram && (
                <a
                  href={`https://t.me/${member.telegram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-2 top-2 flex items-center justify-center gap-1 rounded-2xl bg-white/70 px-3 py-1.5 backdrop-blur-sm transition-all hover:bg-white md:px-4 md:py-2"
                >
                  <div className="relative flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 md:h-5 md:w-5">
                    <svg
                      className="h-2 w-2 text-white md:h-2.5 md:w-2.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-900 md:text-sm">
                    @{member.telegram}
                  </span>
                </a>
              )}

              {/* Name and Title */}
              <div className="absolute bottom-2 left-[2.5%] w-[95%] rounded-2xl bg-white/70 p-3 text-center backdrop-blur-sm md:p-4">
                <h3 className="text-sm font-bold text-[#0A0047] md:text-base">
                  {member.name}
                </h3>
                <p className="mt-1 text-xs text-[#0A0047]/70 md:text-sm">
                  {member.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
