import Image from 'next/image'
import Link from 'next/link'
import communityBox from '@/app/assets/images/community_box.png'

const platforms = [
  {
    id: '2',
    name: 'AIUS Swap Market',
    content: 'Exchange AIUS in a decentralized way here.',
    buttonText: 'Visit Swap Market',
    link: 'https://swap.cow.fi/#/1/swap/ETH/0x8AFE4055Ebc86Bd2AFB3940c0095C9aca511d852',
    background: 'bg-gradient-to-br from-purple-50 to-blue-50',
  },
]

export function CommunitySection() {
  return (
    <div className="bg-[linear-gradient(180deg,#fbfbfb_70.03%,#4a28ff_330.54%)] py-16 lg:py-24">
      <div className="mx-auto box-border w-[90%] max-w-[2000px] bg-white py-10 lg:w-[80%]">
        <div className="mb-6">
          <h2 className="mb-2 text-[45px] leading-[60px] text-gray-900 lg:text-[50px] lg:leading-none 2xl:text-[70px]">
            dApps & Community
          </h2>
          <div className="flex items-center gap-4">
            <h2 className="text-[45px] text-gray-900 lg:text-[50px] 2xl:text-[70px]">
              Initiatives
            </h2>
            <Image
              src={communityBox}
              width={40}
              height={40}
              alt="box"
              className="mt-1"
            />
          </div>
        </div>

        <div className="mb-12">
          <p className="w-full text-para text-gray-600 lg:w-[70%]">
            Discover diverse dApps and community initiatives on the Arbius
            Network, each supported by our DAO and enhancing our
            blockchain ecosystem with innovative and collaborative
            services.
          </p>
        </div>

        <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:gap-0 2xl:justify-start 2xl:gap-[12%]">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className={`${platform.background} relative h-auto w-[95%] rounded-3xl bg-cover bg-no-repeat p-6 md:h-[250px] md:w-[45%] 2xl:w-[30%]`}
            >
              <Link
                href={platform.link}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 z-10 block md:hidden"
              />

              <h3 className="text-[25px] font-bold text-[#000000]">
                {platform.name}
              </h3>

              <p className="mt-6 text-[16px] text-gray-800">
                {platform.content}
              </p>

              <div className="mt-6">
                <Link
                  href={platform.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bottom-12 inline-block md:absolute"
                >
                  <button
                    type="button"
                    className="group relative flex items-center gap-3 rounded-full bg-black-background px-8 py-2"
                  >
                    <div className="absolute left-0 z-0 h-full w-full rounded-full bg-[linear-gradient(96.52deg,#9162F7_-25.28%,#FB567E_94%)] px-8 py-2 opacity-0 transition-opacity duration-500 md:group-hover:none lg:group-hover:opacity-100"></div>
                    <p className="relative z-10 font-bold text-original-white">
                      {platform.buttonText}
                    </p>
                    <span className="relative z-10">→</span>
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
