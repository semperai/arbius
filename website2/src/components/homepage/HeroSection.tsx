import Link from 'next/link'

export function HeroSection() {
  return (
    <div className="mt-[72px] bg-[url('/peer_background.jpg')] bg-cover lg:flex lg:h-[75vh] lg:items-center">
      <div className="m-auto w-[90%] max-w-[2000px] py-16 lg:w-[80%] lg:p-0 lg:py-24">
        <div className="w-full xl:w-[65%]">
          <div className="Gradient-transparent-text mb-2 bg-gradient-to-r from-purple-text to-blue-500 text-[16px] lg:mb-0 lg:text-[12px]">
            Welcome to Arbius!
          </div>

          <h1 className="mb-6 text-[45px] leading-[50px] text-black-text lg:text-[50px] lg:leading-none">
            Peer-to-peer machine learning
          </h1>

          <div>
            <p className="text-para text-subtext-one lg:w-[105%]">
              Arbius is a decentralized network for machine learning and a
              token with a fixed total supply like Bitcoin. New coins are
              generated with GPU power by participating in the network. There
              is no central authority to create new coins. Arbius is fully
              open-source. Holders vote on-chain for protocol upgrades.
              Models operate as DAOs with custom rules for distribution and rewards,
              providing a way for model creators to earn income.
            </p>

            <div className="mt-[30px] flex items-center gap-[20px]">
              <Link href="https://arbius.ai/paper.pdf" target="_blank">
                <button
                  type="button"
                  className="group relative flex items-center gap-3 rounded-full border border-original-black bg-transparent px-5 py-2 text-original-black hover:border-transparent hover:text-white lg:px-8"
                >
                  <div className="absolute left-0 z-0 h-full w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-8 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                  <div className="relative z-10 lg:text-[100%]">
                    Read Whitepaper
                  </div>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
