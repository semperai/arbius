'use client';
import React, { useEffect, useState } from 'react';
import RootLayout from '@/app/layout';
import { useAccount, useContractRead, useSwitchNetwork } from 'wagmi';
import Tabs from '@/app/components/Stake/LPStaking/Tabs';
import TopHeaderSection from '@/app/components/Stake/LPStaking/TopHeaderSection';
import { getAPR } from '@/app/Utils/getAPR';
import { AIUS_wei, infuraUrlSepolia, alchemyUrlSepolia } from '@/app/Utils/constantValues';
import Web3 from 'web3';
import veStaking from '@/app/abis/veStaking.json';
import { AbiItem } from 'web3-utils';
import Config from '@/config.eth.json';

export default function LPStaking() {
  const [data, setData] = useState(null);

  const CHAIN = process?.env?.NEXT_PUBLIC_AIUS_ENV === 'dev' ? 11155111 : 1;
  const { switchNetwork: switchNetworkArbitrum } = useSwitchNetwork({
    chainId: CHAIN,
  });

  useEffect(() => {
    const f = async () => {
      try {
        const check = await window.ethereum?.request({ method: 'eth_accounts' }); // Request account access if needed
        if (check?.length) {
          await window.ethereum?.request({ method: 'eth_requestAccounts' });
        }
      } catch (error) {}
    };

    f();
    switchNetworkArbitrum?.();
  }, [switchNetworkArbitrum]);


  const getWeb3Sepolia = async() => {
    let infuraUrl = infuraUrlSepolia;
    let alchemyUrl = alchemyUrlSepolia;

    return await fetch(infuraUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_blockNumber",
          params: []
        }),
      })
      .then(res => res.json())
        .then(data => {
          if (data.error) {
            console.error("Infura error:", data.error.message);
            let web3 = new Web3(new Web3.providers.HttpProvider(alchemyUrl));
            return web3
          } else {
            let web3 = new Web3(new Web3.providers.HttpProvider(infuraUrl));
            console.log("Successfully connected. Block number:", data.result);
            return web3
          }
        })
        .catch((err) => {
          console.log("Request failed:", err)
          let web3 = new Web3(new Web3.providers.HttpProvider(alchemyUrl));
          return web3
        });
  }

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
        }]
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

        const apr = await getAPR(_rewardRate, _totalSupply)

        //@ts-ignore
        setData({
          // @ts-ignore
          "univ2Staked": _balanceUNIV2,
          // @ts-ignore
          "aiusStaked": _balanceAIUS,
          // @ts-ignore
          "apr": (apr ? apr?.toFixed(0) : "0") + "%"
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