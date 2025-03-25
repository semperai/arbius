'use client';
import React, { useEffect, useState } from 'react';
import RootLayout from '@/app/layout';
import { useAccount, useContractRead, useSwitchNetwork } from 'wagmi';
import Config from '@/config.one.json';
import Tabs from '@/app/components/Stake/LPStaking/Tabs';
import TopHeaderSection from '@/app/components/Stake/LPStaking/TopHeaderSection';
import { getAPR } from '@/app/Utils/getAPR';
import { AIUS_wei } from '@/app/Utils/constantValues';
import Web3 from 'web3';
import veStaking from '@/app/abis/veStaking.json';
import { AbiItem } from 'web3-utils';

export default function LPStaking() {
  const [data, setData] = useState(null);

  const CHAIN = process?.env?.NEXT_PUBLIC_AIUS_ENV === 'dev' ? 11155111 : 1;
  const { switchNetwork: switchNetworkArbitrum } = useSwitchNetwork({
    chainId: CHAIN,
  });

  useEffect(() => {
    console.log('switch');
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
    let infuraUrl = "https://sepolia.infura.io/v3/0a5cec7a39384fe3a6daad7a86cc9d99";
    let alchemyUrl = "https://sepolia.g.alchemy.com/v2/-ajhFQTtft1QCDeaEzApe9eSnPQgQE7N";

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
        const UNIV2_ADDRESS = "0x5919827b631d1a1ab2ed01fbf06854968f438797";
        const StakingAddress = "0x0476ad06c62d743cae0bf743e745ff44962c62f2";
        const AIUSAddress = "0xc4e93fEAA88638889ea85787D9ab7C751C87C29B";

        let stakingToken = "";
        let rewardsToken = "";
        let networkName = "sepolia";

        if (networkName === "mainnet") {
          stakingToken = "0xCB37089fC6A6faFF231B96e000300a6994d7a625"; // UNI-V2
          rewardsToken = "0x8AFE4055Ebc86Bd2AFB3940c0095C9aca511d852"; // AIUS
          //stakingRewards = "TBA";
        } else if (networkName === "sepolia") {
          stakingToken = "0x5919827b631D1a1Ab2Ed01Fbf06854968f438797"; // UNI-V2
          rewardsToken = "0xc4e93fEAA88638889ea85787D9ab7C751C87C29B"; // AIUS
          //stakingRewards = "0x0476ad06c62d743cae0bf743e745ff44962c62f2"; 
        }

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
        console.log(veStakingContract, univ2Contract, aiusTokenContract)
        const _rewardRate = await veStakingContract.methods.rewardRate().call();
        console.log(_rewardRate, "RR")
        const _totalSupply = await veStakingContract.methods.totalSupply().call();
        console.log(_rewardRate, _totalSupply, "SUPP")
        const _balanceAIUS = await aiusTokenContract.methods.balanceOf(StakingAddress).call()
        console.log("worked 1")
        const _balanceUNIV2 = await univ2Contract.methods.balanceOf(StakingAddress).call()
        console.log("worked 2")
        console.log("balances", _balanceAIUS, _balanceUNIV2)
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