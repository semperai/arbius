'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { GetServerSideProps } from 'next';
import Stake from '../app/components/Stake/AIUS/Stake';
import Steps from '../app/components/Stake/AIUS/Steps';
import Process from '../app/components/Stake/AIUS/Process';
import { Fade } from 'react-awesome-reveal';
import RootLayout from '@/app/layout';
import Tabs from '../app/components/Stake/AIUS/Tabs';
import Notifications from '../app/components/Stake/AIUS/Notifications';
import {
  useAccount,
  useReadContract,
  useChainId,
} from 'wagmi';
import baseTokenV1 from '../app/abis/baseTokenV1.json';
import { fetchArbiusData } from '../app/Utils/getArbiusData';
import { BigNumber } from 'ethers';
import Config from '@/config.one.json';

type AIUSProps = {
  protocolData: {
    totalStaked: BigNumber;
    totalStakers: BigNumber;
    totalRewards: BigNumber;
    totalStakedUSD: BigNumber;
    totalRewardsUSD: BigNumber;
    totalStakedUSDString: string;
    totalRewardsUSDString: string;
    totalStakedString: string;
    totalRewardsString: string;
    apy: BigNumber;
    apyString: string;
    totalStakedApy: BigNumber;
    totalStakedApyString: string;
    totalStakedApyUSD: BigNumber;
    totalStakedApyUSDString: string;
  };
};

export default function AIUS({ protocolData }: AIUSProps) {
  const [selectedtab, setSelectedTab] = useState('Dashboard');
  const { address, isConnected } = useAccount();
  const [updateValue, setUpdateValue] = useState(0);
  const chainId = useChainId();

  const forceSwitchChain = async (chainId: number) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error) {
      if (error.code === 4902) {
        // Chain not added? Add it dynamically
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [getChainConfig(chainId)], // Define `getChainConfig` for Arbitrum/Mainnet
        });
      }
    }
  };


  useEffect(() => {
    const CHAIN = process?.env?.NEXT_PUBLIC_AIUS_ENV === 'dev' ? 421614 : 42161;
    forceSwitchChain(CHAIN)
  }, [chainId]);

  const { data, isError, isLoading } = useReadContract({
    address: Config.baseTokenAddress as `0x${string}`,
    abi: baseTokenV1.abi,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: isConnected,
    },
  });

  return (
    <RootLayout>
      <div className=''>
        <div className='pb-8 pt-24 xl:pb-24'>
          <div className='mx-auto w-mobile-section-width max-w-center-width lg:w-section-width'>
            <div>
              <div className='flex items-center gap-2'>
                <h2 className='lato-bold mb-4 text-[8vw] text-black-text lg:text-header 2xl:text-header-2xl'>
                  <Fade delay={0.1} cascade damping={0.05} triggerOnce={true}>
                    veAIUS Staking
                  </Fade>
                </h2>

                {/*
                <Fade direction='up' triggerOnce={true}>
                  <div className='mb-4 inline-block rounded-2xl bg-[#ece9fe] px-3 py-2 lg:mb-0'>
                    <p className='lato-regular bg-[#ece9fe] text-[8px] text-[#4A28FF] lg:text-[14px]'>
                      Coming Soon!
                    </p>
                  </div>
                </Fade>
                */}
              </div>
              <div className='flex flex-col justify-between gap-4 lg:flex-row lg:gap-0'>
                <div className='w-[100%] lg:w-[48%]'>
                  <Stake
                    selectedtab={selectedtab}
                    setSelectedTab={setSelectedTab}
                    data={data}
                    isLoading={isLoading}
                    isError={isError}
                    updateValue={updateValue}
                    setUpdateValue={setUpdateValue}
                  />
                </div>
                <div className='w-[100%] lg:w-[48%]'>
                  <div className='mb-4'>
                    <Steps />
                  </div>
                  <div>
                    <Process />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Notifications />
        {/* tabs */}
        <Tabs
          selectedtab={selectedtab}
          setSelectedTab={setSelectedTab}
          data={data}
          isLoading={isLoading}
          isError={isError}
          protocolData={protocolData}
          updateValue={updateValue}
          setUpdateValue={setUpdateValue}
        />
      </div>
    </RootLayout>
  );
}

export const getServerSideProps: GetServerSideProps<AIUSProps> = async (context) => {
  const data = await fetchArbiusData();
  console.log(data, 'ARBIUS DATA');
  return {
    props: {
      protocolData: data,
    },
  };
}
