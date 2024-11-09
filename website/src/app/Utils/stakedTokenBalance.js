import Web3 from 'web3';
// import { abi as stakingAbi } from './Staking.json'; // Import the ABI of the staking contract
const POOL_ADDRESS = '0xF0148B59D7F31084Fb22FF969321FDfAfA600C02';
// import Pool from '../src/app/abis/pool.json'
import Pool from '@gysr/core/abis/Pool.json';
export const stakeTokenBalance = async (amount) => {
  const web3 = new Web3(window.ethereum);
  const pool = new web3.eth.Contract(Pool, POOL_ADDRESS);
  const accounts = await web3.eth.getAccounts();
  const account = accounts[0];

  const balance = await pool.methods
    .stakingBalances('0xEe16DbAa6629F9f8fF9622BD03c9bdF5bb847C7F')
    .call();
  return balance;
};
