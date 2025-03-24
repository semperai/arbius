'use client';
import React, { useEffect, useState } from 'react';
import RootLayout from '@/app/layout';
import { useAccount, useContractRead, useSwitchNetwork } from 'wagmi';
import Config from '@/config.one.json';
import Tabs from '@/app/components/Stake/LPStaking/Tabs';
import TopHeaderSection from '@/app/components/Stake/LPStaking/TopHeaderSection';
import { getAPR } from '@/app/utils/getAPR';
import { AIUS_wei, t_max, infuraUrl, alchemyUrl } from '@/app/Utils/constantValues';
import Web3 from 'web3';
import veStaking from '@/app/abis/veStaking.json';

export default function LPStaking() {
  const [data, setData] = useState(null);

  const getWeb3 = async() => {
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
    
    const f = async () => {
      try{
        const web3 = await getWeb3();

        const veStakingContract = new web3.eth.Contract(
          veStaking.abi,
          Config.v4_veStakingAddress
        );

        const _rewardRate = await veStakingContract.methods.rewardRate().call();
        const _totalSupply = await veStakingContract.methods.totalSupply().call();
        console.log(_rewardRate, _totalSupply)
        const apr = await getAPR(_rewardRate, _totalSupply)

        setData({
          "univ2Staked": "673",
          "aiusStaked": "13.5k",
          "apr": (apr ? apr?.toFixed(2) : "0") + "%"
        })        
      }catch(e){
        console.log("F1 error", e)
      }
    }

    const f1 = async () => {
      try{
        const web3 = await getWeb3();

        const veStakingContract = new web3.eth.Contract(
          veStaking.abi,
          Config.v4_veStakingAddress
        );

        const _rewardRate = await veStakingContract.methods.rewardRate().call();
        const _totalSupply = await veStakingContract.methods.totalSupply().call();
        console.log(_rewardRate, _totalSupply)
        const apr = await getAPR(_rewardRate, _totalSupply)

        setData({
          "univ2Staked": "673",
          "aiusStaked": "13.5k",
          "apr": (apr ? apr?.toFixed(2) : "0") + "%"
        })        
      }catch(e){
        console.log("F1 error", e)
      }
    }

    f();
    //f1();

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