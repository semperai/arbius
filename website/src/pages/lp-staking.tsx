'use client';
import React, { useEffect, useState, useCallback } from 'react';
import RootLayout from '@/app/layout';
import { useChainId } from 'wagmi';
import Tabs from '@/app/components/Stake/LPStaking/Tabs';
import TopHeaderSection from '@/app/components/Stake/LPStaking/TopHeaderSection';
import { getAPR } from '@/app/Utils/getAPR';
import { AIUS_wei, infuraUrlEth, alchemyUrlEth } from '@/app/Utils/constantValues';
import { getWeb3Sepolia } from '@/app/Utils/getWeb3RPC';
import veStaking from '@/app/abis/veStaking.json';
import { AbiItem } from 'web3-utils';
import Config from '@/config.eth.json';

export default function LPStaking() {
  const [data, setData] = useState(null);

  const chainId = useChainId();

  const forceSwitchChain = async (chainId: number) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        console.log("Error : Chain not defined")
        // Chain not added? Add it dynamically
        // await window.ethereum.request({
        //   method: 'wallet_addEthereumChain',
        //   params: [getChainConfig(chainId)], // Define `getChainConfig` for Arbitrum/Mainnet
        // });
      }
    }
  };

  useEffect(() => {
    const CHAIN = process?.env?.NEXT_PUBLIC_AIUS_ENV === 'dev' ? 11155111 : 1;
    forceSwitchChain(CHAIN)
  }, [chainId]);


  useEffect(() => {

    const f1 = async () => {
      try{
        const web3Sepola = await getWeb3Sepolia();
        const UNIV2_ADDRESS = Config.UNIV2_ADDRESS;
        const StakingAddress = Config.STAKING_REWARD_ADDRESS;
        const AIUSAddress = Config.AIUS_TOKEN_ADDRESS;


        const balanceOfABI = [{
          "constant": true,
          "inputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "name": "balanceOf",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        },
        {"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]

        const veStakingContract = new web3Sepola.eth.Contract(
          veStaking.abi as AbiItem[],
          StakingAddress
        );

        const univ2Contract = new web3Sepola.eth.Contract(
          balanceOfABI as AbiItem[],
          UNIV2_ADDRESS
        )
        const aiusTokenContract = new web3Sepola.eth.Contract(
          balanceOfABI as AbiItem[],
          AIUSAddress
        )

        const _rewardRate = await veStakingContract.methods.rewardRate().call();

        const _totalSupply = await veStakingContract.methods.totalSupply().call();

        const _balanceAIUS = await aiusTokenContract.methods.balanceOf(StakingAddress).call()

        const _balanceUNIV2 = await univ2Contract.methods.balanceOf(StakingAddress).call()

        const _totalSupplyOfUNIV2 = await univ2Contract.methods.totalSupply().call()

        const _balanceOfAIUS_UNIV2 = await aiusTokenContract.methods.balanceOf(UNIV2_ADDRESS).call()

        const apr = await getAPR(_rewardRate, _totalSupply)

        const APR_PER_AIUS = (apr * Number(_totalSupplyOfUNIV2) ) / Number(_balanceOfAIUS_UNIV2)

        //@ts-ignore
        setData({
          // @ts-ignore
          "univ2Staked": _balanceUNIV2,
          // @ts-ignore
          "aiusStaked": _balanceAIUS,
          // @ts-ignore
          "apr": (APR_PER_AIUS ? APR_PER_AIUS?.toFixed(0) : "0") + "%"
        })        
      }catch(e){
        console.log("F1 error", e)
      }
    }

    f1();

  },[])

  return (
    <RootLayout>
      <div>
        <div className='relative' id='body'>
          <TopHeaderSection data={data} />
          <Tabs data={data} />
        </div>
      </div>
    </RootLayout>
  );
}