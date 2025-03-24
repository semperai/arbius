import React, { useEffect } from 'react';
import { useState } from 'react';
import walletImage from '../../../assets/images/ion_wallet-outline.png';
import Image from 'next/image';
import Popup from './Popup';
import HintBox from '../../HintBox/Hintbox';
import { approveUNIV2 } from '@/app/Utils/approveUniv2';
import { stakeTokens } from '@/app/Utils/staking';
import { claimTokens } from '@/app/Utils/claim';
import { useWeb3Modal } from '@web3modal/react'; // main arbius component
import { useAccount } from 'wagmi';
import { unstakeTokens } from '@/app/Utils/unstake';
import { claimableRewards } from '@/app/Utils/claimableRewards';
import { stakeTokenBalance } from '@/app/Utils/stakedTokenBalance';

function Stake() {
  const { isConnected, isConnecting, isDisconnected } = useAccount();
  const { open: openWeb3Modal } = useWeb3Modal();
  const [currentHoverId, setCurrentHoverId] = useState(null);

  function convertLargeNumber(numberStr) {
    // Convert the string to a BigInt
    let number = BigInt(0);

    // Divide the large number by 10^20 and convert it to a floating-point number
    let scaledNumber = (Number(number) / 1e20).toFixed(2);

    return scaledNumber;
  }

  return (
    <>
      {false && (
        <Popup isPopupOpen={true} setIsPopupOpen={()=>{}} />
      )}
      <div className='m-[auto] grid w-mobile-section-width max-w-center-width grid-cols-1 gap-8 pb-8 pt-8 lg:w-section-width lg:grid-cols-2'>
        {true ? (
          <>
            <div className='stake-card flex h-[auto] flex-col justify-between rounded-2xl bg-white-background p-6 lg:p-10'>
              <div>
                <h1 className='text-[15px] font-medium text-[#4A28FF] lg:text-[20px]'>
                  Stake
                </h1>
                <div className='mt-6 flex items-end justify-between gap-6'>
                  <div className='mt-6 max-h-[150px] w-1/2 rounded-[10px] lp-stake-bg-gradient p-6 py-4 shadow-none transition-all hover:shadow-stats'>
                    <div className='flex items-baseline justify-start'>
                      <h1 className='text-[25px] font-medium text-purple-text xl:text-[38px]'>
                        0.000
                      </h1>
                      <p className='ml-2 text-para text-black-text'>Uni-V2</p>
                    </div>
                    <h1 className='text-[8px] font-medium text-black-text lg:text-[13px]'>
                      Wallet Balance
                    </h1>
                  </div>

                  <div className='mt-6 flex max-h-[150px] w-1/2 flex-col justify-center rounded-[10px] lp-stake-bg-gradient p-6 py-4 text-[#101010] shadow-none transition-all hover:cursor-pointer hover:shadow-stats'>
                    <div
                      className='flex items-baseline justify-start'
                      id='RewardsPeriod'
                    >
                      <h1 className='text-[25px] font-medium text-purple-text xl:text-[38px]'>
                        90
                      </h1>
                      <p className='ml-2 text-para text-black-text'>Days</p>
                    </div>

                    <h1 className='text-[8px] font-medium text-black-text lg:text-[13px]'>
                      Rewards Period
                    </h1>
                    {/*<HintBox
                      content={
                        'The multiplier on your stake will increase from 1.00x to 3.00x over 90 days'
                      }
                      customStyle={{}}
                      link={null}
                      boxStyle={{ width: '200px', top: '50%', zIndex: 10 }}
                      hoverId={'RewardsPeriod'}
                      currentHoverId={currentHoverId}
                      setCurrentHoverId={setCurrentHoverId}
                    />*/}
                  </div>
                </div>
                <div className='mt-6 flex w-[100%] justify-center rounded-[25px] text-[#101010]'>
                  <div className='flex w-[30%] items-center justify-center gap-2 rounded-l-[25px] rounded-r-none border-[1px] border-l-0 bg-[#E6DFFF] p-2 px-2 lg:gap-2 lg:p-3'>
                    <h className='text-[10px] font-medium lg:text-[14px]'>
                      UNI-V2
                    </h>
                  </div>
                  <div className='flex w-[75%] flex-row justify-between rounded-l-none rounded-r-[25px] border-[1.5px] border-l-0 bg-original-white p-2 focus:outline-none lg:p-3'>
                    <div className='w-[80%]'>
                      <input
                        className='w-[100%] bg-original-white text-[13px] italic outline-none'
                        placeholder='Amount of UNI-V2 to stake'
                      />
                    </div>
                    <div className='maxButtonHover flex items-center rounded-full px-3 py-[1px] text-original-white'>
                      <p className='pb-[2px] text-[6px] lg:text-[11px]'>max</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className='mt-4 flex items-center justify-end gap-4 text-[#101010] md:mb-0'>
                <button
                  type='button'
                  className='group relative flex items-center gap-3 rounded-full bg-black-background px-8 py-2'
                  id={'approveUniV2'}
                  onClick={() => {
                    // handleApproveClick()
                  }}
                >
                  <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-8 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                  <p className='relative z-10 text-[13px] text-original-white'>
                    Approve UNI-V2
                  </p>
                  {/*<HintBox
                    content={
                      'Approve the Pool to access $UNI-V2 in your wallet in order to stake'
                    }
                    customStyle={{ arrowLeft: '40%' }}
                    link={null}
                    boxStyle={{ width: '200px', top: '50%', zIndex: 10 }}
                    hoverId={'approveUniV2'}
                    currentHoverId={currentHoverId}
                    setCurrentHoverId={setCurrentHoverId}
                  />*/}
                </button>

                <button
                  type='button'
                  className='group relative flex items-center gap-3 rounded-full bg-[#121212] bg-opacity-5 px-8 py-2'
                  onClick={() => connectWallet()}
                >
                  <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full px-8 py-2 opacity-0 transition-opacity duration-500'></div>
                  <p className='relative z-10 text-[15px] text-[#101010] opacity-30'>
                    Stake
                  </p>
                </button>
              </div>
            </div>

            <div className='stake-card flex h-[auto] flex-col justify-between rounded-2xl bg-white-background p-6 lg:p-10'>
              <div>
                <h1 className='text-[15px] font-medium text-[#4A28FF] lg:text-[20px]'>
                  Unstake
                </h1>
                <div className='mt-6 flex items-end justify-start gap-6 text-[#101010]'>
                  <div className='mt-6 flex max-h-[150px] w-1/2 flex-col justify-center rounded-[10px] lp-stake-bg-gradient p-6 py-4 text-[#101010] shadow-none transition-all hover:cursor-pointer hover:shadow-stats'>
                    <div
                      id='unstakeBalance'
                      className='flex items-baseline justify-start'
                    >
                      <h1 className='text-[25px] font-medium text-purple-text xl:text-[38px]'>
                        1234
                        &nbsp;
                      </h1>
                      <p className='text-para text-black-text'>Uni-V2</p>
                      {/*<HintBox
                        content={'Total UNI-V2 you have staked in this Pool'}
                        customStyle={{}}
                        link={null}
                        boxStyle={{ width: '200px', top: '50%', zIndex: 10 }}
                        hoverId={'unstakeBalance'}
                        currentHoverId={currentHoverId}
                        setCurrentHoverId={setCurrentHoverId}
                      />*/}
                    </div>
                    <h1 className='text-[8px] font-medium lg:text-[13px]'>
                      Staked
                    </h1>
                  </div>

                  <div className='mt-6 flex max-h-[150px] w-1/2 flex-col justify-center rounded-[10px] lp-stake-bg-gradient p-6 py-4 text-[#101010] shadow-none transition-all hover:cursor-pointer hover:shadow-stats'>
                    <div
                      id='claimableRewards'
                      className='flex items-baseline justify-start'
                    >
                      <h1 className='text-[25px] font-medium text-purple-text xl:text-[38px]'>
                        0.0001
                        &nbsp;
                      </h1>
                      <p className='text-para'>AIUS</p>
                      {/*<HintBox
                        content={'Your estimated rewards if you unstake now'}
                        customStyle={{}}
                        link={null}
                        boxStyle={{ width: '200px', top: '50%', zIndex: 10 }}
                        hoverId={'claimableRewards'}
                        currentHoverId={currentHoverId}
                        setCurrentHoverId={setCurrentHoverId}
                      />*/}
                    </div>
                    <h1 className='text-[8px] font-medium text-[#101010] lg:text-[13px]'>
                      Claimable Rewards
                    </h1>
                  </div>
                </div>

                <hr className='opacity-10' />

                {/*<div className='mt-4 flex justify-center gap-[50px] text-[#101010]'>
                  <div>
                    <div className='flex flex-row gap-1'>
                      <h1 className='lato-bold text-[25px] text-[#4A28FF]'>
                        382
                      </h1>
                      <h1 className='mb-1 self-end text-[14px]'>AIUS</h1>
                    </div>
                    <h2 className='text-[15px] font-medium' id='globalUnlocked'>
                      Global Unlocked
                    </h2>
                    <HintBox
                      content={
                        'Total AIUS currently unlocked for entire pool. This number is important to keep an eye on for timing your unstakes.'
                      }
                      customStyle={{ arrowLeft: '50%', marginBottom: '' }}
                      link={null}
                      boxStyle={{ width: '200px', top: '0%', zIndex: 10 }}
                      hoverId={'globalUnlocked'}
                      currentHoverId={currentHoverId}
                      setCurrentHoverId={setCurrentHoverId}
                    />
                  </div>
                  <div className='h-[60px] w-[1px] bg-[#5E40FD1A]'></div>
                  <div>
                    <div className='flex flex-row gap-1 text-[#101010]'>
                      <h1 className='lato-bold text-[25px] text-[#4A28FF]'>
                        1.25
                      </h1>
                      <h1 className='mb-1 self-end text-[14px]'>X</h1>
                    </div>
                    <h2 className='text-[15px] font-medium'>Total Mult</h2>
                  </div>

                  <div className='h-[60px] w-[1px] bg-[#5E40FD1A]'></div>
                  <div>
                    <div className='flex flex-row gap-1'>
                      <h1 className='lato-bold text-[25px] text-[#4A28FF]'>
                        10
                      </h1>
                      <h1 className='mb-1 self-end text-[14px]'>days</h1>
                    </div>
                    <h2 className='text-[15px] font-medium'>Time Staked</h2>
                  </div>
                </div>*/}
                <div className='mt-6 flex w-[100%] justify-center rounded-[25px] text-[#101010]'>
                  <div className='flex w-[25%] items-center justify-center gap-2 rounded-l-[25px] rounded-r-none border-[1px] border-l-0 bg-[#E6DFFF] p-2 px-2 lg:gap-2 lg:p-3'>
                    <h className='text-[10px] font-medium lg:text-[14px]'>
                      UNI-V2
                    </h>
                  </div>
                  <div className='flex w-[75%] flex-row justify-between rounded-l-none rounded-r-[25px] border-[1.5px] border-l-0 bg-original-white p-2 focus:outline-none lg:p-3'>
                    <div className='w-[80%]'>
                      <input
                        className='w-[100%] bg-original-white text-[13px] italic outline-none'
                        placeholder='Amount of UNI-V2 to unstake'
                      />
                    </div>
                    {/*<div className='maxButtonHover flex items-center rounded-full px-3 py-[1px] text-original-white'>
                      <p className='pb-[2px] text-[6px] lg:text-[11px]'>max</p>
                    </div>*/}
                  </div>
                </div>


                <div className='mt-6 flex items-center justify-end gap-4'>
                  <button
                    type='button'
                    className='group relative flex items-center gap-3 rounded-full bg-[#121212] bg-opacity-5 px-8 py-2'
                    onClick={() => claimTokens()}
                  >
                    <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full px-8 py-2 opacity-0 transition-opacity duration-500'></div>
                    <p className='relative z-10 mb-[1px] text-[15px] text-[#101010] opacity-30'>
                      Claim
                    </p>
                  </button>
                  <button
                    type='button'
                    className='group relative flex items-center gap-3 rounded-full bg-[#121212] px-8 py-2'
                    onClick={() => unstakeTokens()}
                  >
                    <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-8 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                    <p className='relative z-10 mb-[1px] text-[15px] text-original-white'>
                      Unstake & Claim
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className='stake-card flex h-[350px] flex-col justify-between rounded-2xl bg-white-background p-6 lg:h-[auto] lg:p-10'>
              <div>
                <h1 className='text-[15px] font-medium lg:text-[20px]'>
                  Stake
                </h1>
                <p className='mt-6 text-[11px] lg:text-para'>
                  Please connect a wallet to interact with this pool!
                </p>
              </div>

              <div className='flex items-center justify-center lg:mb-16 lg:mt-16'>
                <div className='relative h-[100px] w-[100px] lg:h-[100px] lg:w-[100px]'>
                  <Image src={walletImage} fill />
                </div>
              </div>
              <div className='flex justify-center lg:justify-end'>
                <button
                  type='button'
                  className='group relative flex w-[100%] items-center gap-3 rounded-full bg-black-background px-8 py-2 lg:w-[auto]'
                  onClick={() => connectWallet()}
                >
                  <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-8 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                  <p className='relative z-10 mb-1 w-[100%] text-original-white lg:w-[auto]'>
                    Connect Wallet
                  </p>
                </button>
              </div>
            </div>

            <div className='stake-card flex h-[350px] flex-col justify-between rounded-2xl bg-white-background p-6 lg:h-[auto] lg:p-10'>
              <div>
                <h1 className='text-[15px] font-medium lg:text-[20px]'>
                  Unstake
                </h1>
                <p className='mt-6 text-[11px] lg:text-para'>
                  Please connect a wallet to interact with this pool!
                </p>
              </div>

              <div className='flex items-center justify-center lg:mb-16 lg:mt-16'>
                <div className='relative h-[100px] w-[100px] lg:h-[100px] lg:w-[100px]'>
                  <Image src={walletImage} fill />
                </div>
              </div>
              <div className='flex justify-center lg:justify-end'>
                <button
                  type='button'
                  className='group relative flex w-[100%] items-center gap-3 rounded-full bg-black-background px-8 py-2 lg:w-[auto]'
                  onClick={() => connectWallet()}
                >
                  <div className='absolute left-0 z-0 h-[100%] w-[100%] rounded-full bg-buy-hover px-8 py-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>
                  <p className='relative z-10 mb-1 w-[100%] text-original-white lg:w-[auto]'>
                    Connect Wallet
                  </p>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default Stake;
