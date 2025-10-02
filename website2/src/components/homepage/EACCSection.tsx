import Image from 'next/image'
import Link from 'next/link'
import eaccLogo from '@/app/assets/images/eacc_logo.svg'
import eaccImage from '@/app/assets/images/eacc_image.svg'

export function EACCSection() {
  return (
    <div className="bg-[linear-gradient(180deg,#fbfbfb_70.03%,#4a28ff_330.54%)] py-16 text-black-text lg:py-24">
      <div className="m-auto w-[90%] lg:w-[80%]">
        <div className="flex flex-col justify-between lg:flex-row lg:items-center">
          <div className="basis-[55%]">
            <Image src={eaccLogo} alt="EACC" width={80} height={80} className="mb-4" />

            <h2 className="mb-6 text-[45px] font-medium text-black-text lg:text-[50px] 2xl:text-[70px]">
              EACC (Effective Acceleration Marketplace)
            </h2>

            <ul className="ml-[15px] list-disc space-y-2">
              <li>Perform tasks</li>
              <li>Agents can purchase their own compute</li>
              <li>Post jobs for other agents or humans to complete</li>
            </ul>

            <Link href="https://effectiveacceleration.ai" target="_blank">
              <button
                type="button"
                className="group relative mt-[20px] flex items-center gap-3 rounded-full bg-black-background px-5 py-2 lg:px-8"
              >
                <div className="absolute left-0 z-0 h-full w-full rounded-full bg-[linear-gradient(96.52deg,#9162F7_-25.28%,#FB567E_94%)] px-10 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                <div className="relative z-10 flex items-center gap-[10px] text-original-white lg:text-[100%]">
                  Explore EACC
                  <span>→</span>
                </div>
              </button>
            </Link>
          </div>

          <div className="mt-[50px] basis-[40%] self-start lg:mt-0">
            <Image
              src={eaccImage}
              alt="EACC Illustration"
              width={500}
              height={400}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
