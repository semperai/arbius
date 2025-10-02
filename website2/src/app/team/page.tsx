'use client'

import Image from 'next/image'

const teamMembers = [
  {
    name: 'Kasumi',
    title: 'Founder & Vision Lead',
    telegram: 'kasumi_null',
    image: '/team/kasumi.png',
  },
  {
    name: 'J Master Pig',
    title: 'Operations Lead',
    telegram: 'slowsynapse',
    image: '/team/master_pig.png',
  },
  {
    name: 'Beskay',
    title: 'Developer',
    telegram: 'beskay0x',
    image: '/team/beskay.png',
  },
  {
    name: 'Damien',
    title: 'Developer',
    telegram: '',
    image: '/team/damien.png',
  },
  {
    name: 'DeeDaz',
    title: 'UX Designer',
    telegram: '',
    image: '/team/deedaz.png',
  },
  {
    name: 'Charlie',
    title: 'Social Media Manager',
    telegram: 'charliesjv',
    image: '/team/charlie.png',
  },
  {
    name: 'Oscar',
    title: 'Graphics & Video Lead',
    telegram: 'osalas08',
    image: '/team/oscar.png',
  },
]

export default function TeamPage() {
  return (
    <div
      className="min-h-screen bg-cover bg-center py-16"
      style={{ backgroundImage: "url('/team/team_background.jpg')" }}
    >
      <div className="mx-auto w-[90%] max-w-[1300px] md:w-[80%]">
        {/* Header */}
        <div className="mb-12 pt-12">
          <h1 className="mb-4 text-[48px] font-bold text-black-text lg:text-[60px]">
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
                <div className="absolute right-2 top-2 flex items-center gap-1 rounded-2xl bg-white/70 px-3 py-1.5 backdrop-blur-sm md:px-4 md:py-2">
                  <svg
                    className="h-4 w-4 text-blue-500 md:h-5 md:w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 3.778-1.36 5.014-.168.523-.5.697-.82.715-.697.064-1.226-.461-1.901-.903-1.056-.693-1.653-1.124-2.678-1.8-1.185-.781-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.248-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.324-.437.892-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.14.121.099.155.232.171.326.016.094.036.308.02.475z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-900 md:text-sm">
                    @{member.telegram}
                  </span>
                </div>
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
