import { infuraUrl, alchemyUrl, infuraUrlEth, alchemyUrlEth } from '@/app/Utils/constantValues';
import Web3 from 'web3';

export const getWeb3 = async() => {
    return await fetch(alchemyUrl, {
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
        .then(_data => {
          if (_data.error) {
            console.error("Alchemy error:", _data.error.message);
            let web3 = new Web3(new Web3.providers.HttpProvider(infuraUrl));
            return web3
          } else {
            let web3 = new Web3(new Web3.providers.HttpProvider(alchemyUrl));
            console.log("Successfully connected. Block number:", _data.result);
            return web3
          }
        })
        .catch((err) => {
          console.log("Request failed:", err)
          let web3 = new Web3(new Web3.providers.HttpProvider(infuraUrl));
          return web3
        });
}

export const getWeb3Sepolia = async() => {

    return await fetch(alchemyUrlEth, {
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
            let web3 = new Web3(new Web3.providers.HttpProvider(infuraUrlEth));
            return web3
          } else {
            let web3 = new Web3(new Web3.providers.HttpProvider(alchemyUrlEth));
            console.log("Successfully connected. Block number:", data.result);
            return web3
          }
        })
        .catch((err) => {
          console.log("Request failed:", err)
          let web3 = new Web3(new Web3.providers.HttpProvider(infuraUrlEth));
          return web3
        });
  }
