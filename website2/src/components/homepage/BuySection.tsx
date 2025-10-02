import Image from 'next/image'
import Link from 'next/link'

const info = [
  'Pay for AI generations',
  'Participate in governance',
  'Accrue fees via staking',
  'Provide LP for rewards',
  'Earn via proof of useful work',
  'Promote free and open AI',
]

export function BuySection() {
  return (
    <div className="bg-white bg-[url('/buy_background.png')] bg-cover bg-no-repeat py-16 lg:py-24">
      <div className="mx-auto w-[90%] max-w-[2000px] lg:w-[80%]">
        <div className="flex flex-col items-center justify-between lg:flex-row">
          <div className="w-full lg:w-[70%]">
            <h2 className="mb-6 text-[45px] text-black-text lg:text-[50px] 2xl:text-[70px]">
              Buy Arbius (AIUS)
            </h2>

            <div className="mb-6">
              <p className="text-para text-subtext-three">
                Arbius is still at an early experimental stage. No
                expectation of future income is implied. Join our community
                and see what there is to offer.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {info.map((singleInfo) => (
                <div
                  className="flex w-full items-center gap-2 md:w-[40%]"
                  key={singleInfo}
                >
                  <div className="mt-[1px] flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#DFECFF]">
                    <Image src="/tick.png" alt="check mark" width={8} height={8} />
                  </div>
                  <p className="text-[16px] text-subtext-three">
                    {singleInfo}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <Link
                href="https://app.uniswap.org/swap?outputCurrency=0x8AFE4055Ebc86Bd2AFB3940c0095C9aca511d852"
                className="inline-block"
                target="_blank"
              >
                <button
                  type="button"
                  className="group relative flex items-center gap-3 rounded-full bg-black-background px-8 py-2"
                >
                  <div className="absolute left-0 z-0 h-full w-full rounded-full bg-gradient-to-r from-purple-text to-blue-500 px-8 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                  <p className="relative z-10 font-bold text-original-white">
                    Buy on Uniswap
                  </p>
                  <span className="relative z-10">→</span>
                </button>
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="ml-auto flex h-[220px] w-[220px] items-center justify-center rounded-full bg-purple-background">
              <Image src="/white_logo.png" width={150} height={150} alt="arbius white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
