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

    const f1 = async () => {
      try{
        const web3 = await getWeb3();
        const UNIV2_ADDRESS = "0x5919827b631d1a1ab2ed01fbf06854968f438797";
        const StakingAddress = "0x0476ad06c62d743cae0bf743e745ff44962c62f2";
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
        const veStakingContract = new web3.eth.Contract(
          veStaking.abi,
          Config.v4_veStakingAddress
        );

        const univ2Contract = new web3.eth.Contract(
          balanceOfABI,
          UNIV2_ADDRESS
        )
        const aiusTokenContract = new web3.eth.Contract(
          balanceOfABI,
          Config.v4_baseTokenAddress
        )

        const _rewardRate = await veStakingContract.methods.rewardRate().call();
        const _totalSupply = await veStakingContract.methods.totalSupply().call();
        console.log(_rewardRate, _totalSupply, "SUPP")
        const _balanceAIUS = await aiusTokenContract.methods.balanceOf(StakingAddress).call()
        console.log("worked 1")
        const _balanceUNIV2 = 0//await univ2Contract.methods.balanceOf(StakingAddress).call()
        console.log("worked 2")
        console.log("balances", _balanceAIUS, _balanceUNIV2)
        const apr = await getAPR(_rewardRate, _totalSupply)

        setData({
          "univ2Staked": _balanceUNIV2,
          "aiusStaked": _balanceAIUS,
          "apr": (apr ? apr?.toFixed(2) : "0") + "%"
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