import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import Image from 'next/image';
import Config from '@/config.json';
import {
  CloudArrowUpIcon,
  LockClosedIcon,
  ServerIcon,
  CheckCircleIcon,
} from '@heroicons/react/20/solid'

import LogoSquareImg from '@/../public/logo-square-home.png';
import LogoSquareImgWhite from '@/../public/logo-square-home-white.png';

import Chip1 from '@/../public/home-examples/1.png';
import Chip2 from '@/../public/home-examples/2.png';
import Chip3 from '@/../public/home-examples/3.png';
import Chip4 from '@/../public/home-examples/4.png';
import Chip5 from '@/../public/home-examples/5.png';

const benefits = [
  'Pay for AI generations',
  'Participate in governance',
  'Accrue fees via delegation',
  'Stake LP for residual income',
  'Earn by validating network',
  'Promote free and open AI',
];

export default function HomePage() {
  const [colorWordsClasses, setColorWordsClasses] = useState([
    'text-gray-900',
    'text-gray-900',
    'text-gray-900',
    'text-gray-900',
    'text-gray-900',
  ]);

  useEffect(() => {
    setTimeout(() => {
      function turnon(idx: number, c: string) {
        let classes = [
          'text-gray-900',
          'text-gray-900',
          'text-gray-900',
          'text-gray-900',
          'text-gray-900',
        ];

        classes[idx] = c;
        setColorWordsClasses(classes);
      }

      const t = 1200;

      setTimeout(() => { turnon(0, 'text-cyan-400') },    t*0); 
      setTimeout(() => { turnon(1, 'text-green-400') },   t*1.05); 
      setTimeout(() => { turnon(2, 'text-fuchsia-400') }, t*2.1); 
      setTimeout(() => { turnon(3, 'text-amber-500') },   t*3.15); 
      setTimeout(() => { turnon(4, 'text-rose-500') },    t*4.2); 
      setTimeout(() => { turnon(0, 'text-gray-900') },    t*5.25);  // reset
    }, 8000);
  }, []);

  return (
    <Layout title="Arbius" full>
      <main>
        <div className="relative isolate">
          <svg
            className="absolute inset-x-0 top-0 -z-10 h-[64rem] w-full stroke-gray-200 [mask-image:radial-gradient(32rem_32rem_at_center,white,transparent)]"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="1f932ae7-37de-4c0a-a8b0-a6e3b4d44b84"
                width={200}
                height={200}
                x="50%"
                y={-1}
                patternUnits="userSpaceOnUse"
              >
                <path d="M.5 200V.5H200" fill="none" />
              </pattern>
            </defs>
            <svg x="50%" y={-1} className="overflow-visible fill-gray-50">
              <path
                d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
                strokeWidth={0}
              />
            </svg>
            <rect width="100%" height="100%" strokeWidth={0} fill="url(#1f932ae7-37de-4c0a-a8b0-a6e3b4d44b84)" />
          </svg>
          <div
            className="absolute left-1/2 right-0 top-0 -z-10 -ml-24 transform-gpu overflow-hidden blur-3xl lg:ml-24 xl:ml-48"
            aria-hidden="true"
          >
            <div
              className="aspect-[801/1036] w-[50.0625rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
              style={{
                clipPath:
                  'polygon(63.1% 29.5%, 100% 17.1%, 76.6% 3%, 48.4% 0%, 44.6% 4.7%, 54.5% 25.3%, 59.8% 49%, 55.2% 57.8%, 44.4% 57.2%, 27.8% 47.9%, 35.1% 81.5%, 0% 97.7%, 39.2% 100%, 35.2% 81.4%, 97.2% 52.8%, 63.1% 29.5%)',
              }}
            />
          </div>

          <div className="overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 pb-32 pt-36 sm:pt-60 lg:px-8 lg:pt-32">
              <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
                <div className="w-full max-w-xl lg:shrink-0 xl:max-w-2xl">
                  <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                    <span className={`${colorWordsClasses[0]} hover:text-cyan-400 transition`}>Peer</span>
                    -
                    <span className={`${colorWordsClasses[1]} hover:text-green-400 transition`}>to</span>
                    -
                    <span className={`${colorWordsClasses[2]} hover:text-fuchsia-400 transition`}>peer </span>
                    <span className={`${colorWordsClasses[3]} hover:text-amber-500 transition`}>machine </span>
                    <span className={`${colorWordsClasses[4]} hover:text-rose-500 transition`}>learning</span>
                  </h1>
                  <p className="relative mt-6 text-lg leading-8 text-gray-600 sm:max-w-md lg:max-w-none">
                    Arbius is a decentralized network for machine learning and a token with a fixed supply like Bitcoin.
                    New coins are generated with GPU power by participating in the network.
                    There is no central authority to create new coins.
                    Arbius is fully open-source.
                    Holders vote on-chain for protocol upgrades.
                    Models operate as DAOS with custom rules for distribution and rewards, providing a way for model creators to earn income.
                  </p>
                  <div className="mt-10 flex items-center gap-x-6">

                    <Link
                      href="/generate"
                      className={'opacity-95 hover:opacity-100 relative inline-flex items-center justify-center inline-block px-3 py-2 overflow-hidden font-semibold text-indigo-600 rounded-lg group text-sm shadow-sm hover:shadow w-28 border-slate-200 border text-shadow transition nightwind-prevent-block'}

                    >
                      <span className="absolute top-0 left-0 w-40 h-40 -mt-10 -ml-3 transition-all duration-700 bg-red-500 rounded-full blur-md ease"></span>
                      <span className="absolute inset-0 w-full h-full transition duration-700 group-hover:rotate-180 ease">
                      <span className="absolute bottom-0 left-0 w-24 h-24 -ml-10 bg-purple-500 rounded-full blur-md"></span>
                      <span className="absolute bottom-0 right-0 w-24 h-24 -mr-10 bg-pink-500 rounded-full blur-md"></span>
                      </span>
                      <span className="relative text-white">Try now</span>
                    </Link>

                    <Link
                      href="/paper.pdf"
                      className="text-sm font-semibold leading-6 text-gray-900 p-2 rounded-lg border border-transparent hover:border-slate-100 dark:hover:border-transparent transition ease-out shadow-sm"
                    >
                      Read whitepaper <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
                <div className="mt-14 flex justify-end gap-8 sm:-mt-44 sm:justify-start sm:pl-20 lg:mt-0 lg:pl-0 select-none">
                  <div className="ml-auto w-44 flex-none space-y-8 pt-32 sm:ml-0 sm:pt-80 lg:order-last lg:pt-36 xl:order-none xl:pt-80">
                    <div className="relative">
                      <Image
                        src={Chip1}
                        alt="Chip1"
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                  </div>
                  <div className="mr-auto w-44 flex-none space-y-8 sm:mr-0 sm:pt-52 lg:pt-36">
                    <div className="relative">
                      <Image
                        src={Chip2}
                        alt="Chip2"
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                    <div className="relative">
                      <Image
                        src={Chip3}
                        alt="Chip3"
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                  </div>
                  <div className="w-44 flex-none space-y-8 pt-32 sm:pt-0">
                    <div className="relative">
                      <Image
                        src={Chip4}
                        alt="Chip4"
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                    <div className="relative">
                      <Image
                        src={Chip5}
                        alt="Chip5"
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 px-6 py-12 sm:py-16 lg:px-8">
          <div className="mx-auto text-center px-4">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              We make AI democratic.
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-lg leading-8 text-gray-300">
              Arbius is controlled by its users, not monopolized by large corporations and governments. The design of Arbius makes it difficult or impossible to censor usage, allowing for anyone in the world to interact with AI models permissionlessly.
            </p>
          </div>
        </div>

        <div className="relative isolate overflow-hidden bg-white dark:bg-[#16141d] py-24 sm:py-32">
          <div
            className="absolute -top-80 left-[max(6rem,33%)] -z-10 transform-gpu blur-3xl sm:left-1/2 md:top-20 lg:ml-20 xl:top-3 xl:ml-56"
            aria-hidden="true"
          >
            <div
              className="aspect-[801/1036] w-[50.0625rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
              style={{
                clipPath:
                  'polygon(63.1% 29.6%, 100% 17.2%, 76.7% 3.1%, 48.4% 0.1%, 44.6% 4.8%, 54.5% 25.4%, 59.8% 49.1%, 55.3% 57.9%, 44.5% 57.3%, 27.8% 48%, 35.1% 81.6%, 0% 97.8%, 39.3% 100%, 35.3% 81.5%, 97.2% 52.8%, 63.1% 29.6%)',
              }}
            />
          </div>
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:mx-0">
              <p className="text-lg font-semibold leading-8 tracking-tight text-indigo-600">
                Imagine more
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Economically Optimized
              </h1>
              <p className="mt-6 text-xl leading-8 text-gray-700">
                Have computationally hard tasks performed at a market rate by a decentralized network of solvers.
              </p>
            </div>
            <div className="mx-auto mt-16 pb-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:mt-10 lg:max-w-none lg:grid-cols-12">
              <div className="relative lg:order-last lg:col-span-5">
                <svg
                  className="absolute -top-[40rem] left-1 -z-10 h-[64rem] w-[175.5rem] -translate-x-1/2 stroke-gray-900/10 [mask-image:radial-gradient(64rem_64rem_at_111.5rem_0%,white,transparent)]"
                  aria-hidden="true"
                >
                  <defs>
                    <pattern
                      id="e87443c8-56e4-4c20-9111-55b82fa704e3"
                      width={200}
                      height={200}
                      patternUnits="userSpaceOnUse"
                    >
                      <path d="M0.5 0V200M200 0.5L0 0.499983" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" strokeWidth={0} fill="url(#e87443c8-56e4-4c20-9111-55b82fa704e3)" />
                </svg>
                <figure className="border-l border-indigo-600 pl-8">
                  <blockquote className="text-xl font-medium leading-8 tracking-tight text-gray-900">
                    <p>
                      The price of any commodity tends to gravitate toward the production cost. If the price is below cost, then production slows down. If the price is above cost, profit can be made by generating and selling more. At the same time, the increased production would increase the difficulty, pushing the cost of generating towards the price.
                    </p>
                  </blockquote>
                  <figcaption className="mt-8 flex gap-x-4">
                    <div className="text-sm leading-6 my-auto">
                      <div className="font-semibold text-gray-900">Satoshi Nakamoto</div>
                    </div>
                  </figcaption>
                </figure>
              </div>
              <div className="max-w-xl text-base leading-7 text-gray-700 lg:col-span-7">
                <p>
                  The Arbius network has solvers competing with each other to provide solutions to tasks proposed by users, at the lowest cost. Initially, the task reward provides a way for solvers to earn Arbius, allowing users to pay little or no fees, but over time a market rate will develop matching the underlying compute cost. Solvers are incentivized to optimize their software to generate results for users as fast as possible to increase their profitability.
                </p>
                <ul role="list" className="mt-8 max-w-xl space-y-8 text-gray-600">
                  <li className="flex gap-x-3">
                    <LockClosedIcon className="mt-1 h-5 w-5 flex-none text-indigo-600" aria-hidden="true" />
                    <span>
                      <strong className="font-semibold text-gray-900">Secure generation.</strong> As long as a majority of the solvers are honest, tasks complete accurately within seconds.
                    </span>
                  </li>
                  <li className="flex gap-x-3">
                    <ServerIcon className="mt-1 h-5 w-5 flex-none text-indigo-600" aria-hidden="true" />
                    <span>
                      <strong className="font-semibold text-gray-900">Integration.</strong> Generations provided by Arbius may be used in downstream applications, such as NFTs, marketplaces, gaming, or gambling.
                    </span>
                  </li>
                  <li className="flex gap-x-3">
                    <CloudArrowUpIcon className="mt-1 h-5 w-5 flex-none text-indigo-600" aria-hidden="true" />
                    <span>
                      <strong className="font-semibold text-gray-900">DeFi AI.</strong> Model creators are able to set a base fee for invocations of their model, delivering revenue to those who hold the models token.
                    </span>
                  </li>
                </ul>
                <p className="mt-8">
                </p>

                <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">
                  Economic rules
                </h2>
                <p className="mt-6">
                  The Arbius token has a max supply of 1 million tokens. Arbius is minted through task rewards following a continuous halving process, where the first year 50% is designed to be minted, 75% second year, 87.5% the third year, and so on.
                </p>
                <p className="mt-2">
                  Task rewards follow an adjustment algorithm where the reward changes based on the ratio of total supply to expected total supply. The more collective GPU power is being used to mine Arbius, the more the reward is reduced, targeting the above emission schedule.
                </p>
                <p className="mt-2">
                  These rules are enforced by the smart contract. While they will not change for Arbius, other tokens using Arbius&apos;s technology may change them to suit their needs.
                </p>
                <p className="mt-2">
                  Tasks may include a fee, which is transferred to solver upon completion of the task. Once the task reward is reduced, all tasks which hope to be solved are expected to provide a market set fee for completion. 
                </p>
                <p className="mt-2">
                  Models may set a fee required to be able to invoke them. This fee is subtracted from the task fee, and is distributed to the model contract. Model contracts may be tokens which perform economic activity with the collected fees, or a multisig or other contract.
                </p>
                <p className="mt-2">
                  10% of all newly created Arbius is sent to the Arbius DAO. The DAO is controlled by holders of Arbius tokens and operates entirely on-chain.
                </p>
                <p className="mt-2">
                  An additional 10% of all newly created Arbius is continually provided to those staking DML/ETH LP tokens.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#16141d] sm:py-8 md:py-24">
            <div className="relative isolate">
              <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-2xl flex-col gap-16 bg-black/5 px-6 py-16 ring-1 ring-black/10 sm:rounded-3xl sm:p-2 lg:mx-0 lg:max-w-none lg:flex-row lg:items-center lg:py-20 xl:gap-x-20 xl:px-20">
                  <div
                    className="w-96 max-w-full flex-none rounded-2xl object-scale-down shadow-xl aspect-square relative"
                  >
                    <Image
                      className="object-scale-down dark:hidden"
                      src={LogoSquareImg}
                      alt="Arbius"
                    />

                    <Image
                      className="object-scale-down hidden dark:inline"
                      src={LogoSquareImgWhite}
                      alt="Arbius"
                    />
                  </div>
                  <div className="w-full flex-auto">
                    <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
                      Buy Arbius (DML)
                    </h2>
                    <p className="mt-6 text-lg leading-8 text-gray-700">
                      Arbius is still at an early experimental stage. No expectation of future income is implied. Join our community and see what there is to offer.
                    </p>
                    <ul
                      role="list"
                      className="mt-10 grid grid-cols-1 gap-x-8 gap-y-3 text-base leading-7 text-black sm:grid-cols-2"
                    >
                      {benefits.map((benefit) => (
                        <li key={benefit} className="flex gap-x-3">
                          <CheckCircleIcon className="h-7 w-5 flex-none" aria-hidden="true" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-10 flex">
                      <a
                        href={`https://app.sushi.com/swap?inputCurrency=ETH&outputCurrency=${Config.baseTokenAddress}&chainId=42170`}
                        className="text-sm font-semibold leading-6 text-indigo-400"
                        target="_blank"
                      >
                        Buy on SushiSwap <span aria-hidden="true">&rarr;</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="absolute inset-x-0 -top-16 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
                aria-hidden="true"
              >
                <div
                  className="aspect-[1318/752] w-[82.375rem] flex-none bg-gradient-to-r from-[#80caff] to-[#4f46e5] opacity-25"
                  style={{
                    clipPath:
                      'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
                  }}
                />
              </div>
            </div>
          </div>

        </div>


      </main>


    </Layout>
  )
}
