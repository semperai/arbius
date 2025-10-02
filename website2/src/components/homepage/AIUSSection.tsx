import Image from 'next/image'
import Link from 'next/link'

export function AIUSSection() {
  return (
    <div className="bg-white bg-[url('/buy_background.png')] bg-cover bg-no-repeat py-16 text-black-text lg:py-24">
      <div className="m-auto w-[90%] lg:w-[80%]">
        <div className="mb-6 flex items-center gap-4 text-[45px] font-medium text-black-text lg:text-[50px] 2xl:text-[70px]">
          <Image src="/aius_square_logo.svg" alt="AIUS" width={60} height={60} />
          <h2>veAIUS</h2>
        </div>

        <div className="mt-[30px] flex flex-col-reverse items-start justify-between lg:flex-row lg:items-center">
          <div className="basis-[30%]">
            <h3 className="mb-6 text-[45px] font-medium text-black-text lg:text-[50px] 2xl:text-[70px]">
              Shared Inference Fees
            </h3>
            <p>
              veAIUS stakers share in fees from AI model inferences, providing a passive income stream as the network grows.
            </p>

            <Link href="/aius">
              <button
                type="button"
                className="group relative mt-[20px] flex items-center gap-3 rounded-full bg-black-background px-8 py-2 lg:px-10"
              >
                <div className="absolute left-0 z-0 h-full w-full rounded-full bg-gradient-to-r from-purple-text to-blue-500 px-10 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                <div className="relative z-10 text-original-white lg:text-[100%]">
                  Stake
                </div>
              </button>
            </Link>
          </div>

          <div className="mb-[40px] basis-[50%] lg:mb-0">
            <Image
              src="/inference_fees.png"
              alt="Inference Fees"
              width={600}
              height={400}
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-[80px] flex flex-col items-center justify-between lg:flex-row">
          <div className="mb-[40px] basis-[50%] lg:mb-0">
            <Image
              src="/model_inference.png"
              alt="Model Inference"
              width={600}
              height={400}
              className="w-full"
            />
          </div>

          <div className="basis-[40%]">
            <h3 className="mb-6 text-[45px] font-medium text-black-text lg:text-[50px] 2xl:text-[70px]">
              Boosting AI Model Inference
            </h3>
            <p>
              veAIUS holders can direct higher rewards to specific AI models, making those models more attractive to run.
            </p>
            <Link href="/aius?section=Gauge">
              <button
                type="button"
                className="group relative mt-[20px] flex items-center gap-3 rounded-full bg-black-background px-5 py-2 lg:px-8"
              >
                <div className="absolute left-0 z-0 h-full w-full rounded-full bg-gradient-to-r from-purple-text to-blue-500 px-10 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                <div className="relative z-10 text-original-white lg:text-[100%]">
                  View Gauges
                </div>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
