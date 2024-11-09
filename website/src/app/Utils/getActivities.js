import axios from 'axios';
import { hash } from 'crypto';
import { useEffect } from 'react';
import Web3 from 'web3';
const Pool = require('@gysr/core/abis/Pool.json'); // Import the ABI of the contract
const ETHERSCAN_API_KEY = 'YAFSITPZ9SYATJZCET8XPTNI2FWZSNIUT6';
const address = '0xF0148B59D7F31084Fb22FF969321FDfAfA600C02';

// Initialize Web3 with Infura provider (replace with your preferred provider)
const web3 = new Web3(
  new Web3.providers.HttpProvider(
    'https://mainnet.infura.io/v3/your_infura_project_id'
  )
);
// useEffect(() => {
//    fetchLogs('0xA8f103eEcfb619358C35F98c9372B31c64d3f4A1','0xF1d3c4aCFc34Cf910E90FE7F6af2aA668D095F83',ETHERSCAN_API_KEY)

// }, [])

// Function to decode transaction input based on ABI
async function decodeTransactionInput(inputData) {
  const input = inputData.input; // Input data from transaction
  const functionName = inputData.functionName
    .substring(0, inputData.functionName.indexOf('('))
    .trim(); // Function selector (first 4 bytes)

  // Find ABI entry for the function
  const functionAbi = Pool.find(
    (entry) => entry.name === functionName && entry.type === 'function'
  );

  if (functionAbi) {
    try {
      // Decode parameters
      const decodedParams = web3.eth.abi.decodeParameters(
        functionAbi.inputs,
        '0x' + input.slice(10)
      );

      let reward = 0;
      try {
        reward = await fetchLogs(
          '0xA8f103eEcfb619358C35F98c9372B31c64d3f4A1',
          inputData.from,
          ETHERSCAN_API_KEY,
          inputData.hash
        );
        reward = hexToDecimal(reward);
      } catch (error) {
        console.error('Error fetching logs:', error);
        reward = '0'; // Default value or handle as necessary
      }

      console.log(reward, 'REWARD');

      const decodedTransaction = {
        from: inputData.from,
        blockHash: inputData.hash,
        to: inputData.to,
        reward: web3.utils.fromWei(reward, 'ether'),
        value: web3.utils.fromWei(inputData.value, 'ether'), // Convert value from wei to ether (if applicable)
        functionName: functionAbi.name,
        decodedParams: decodedParams,
        amount: web3.utils.fromWei(decodedParams.amount, 'ether'),
        timestamp: inputData.timeStamp, // Convert timestamp to ISO format
      };

      return decodedTransaction;
    } catch (error) {
      console.error('Error decoding input data:', error);
      return null; // Ensure the function returns null in case of error
    }
  } else {
    console.error('Function not found in ABI');
    return null;
  }
}

const hexToDecimal = (hex) => {
  return BigInt(hex).toString();
};
// Function to fetch transactions from Etherscan
function formatHexAddress(hexAddress) {
  // Remove the '0x' prefix if it exists
  const addressWithoutPrefix = hexAddress.startsWith('0x')
    ? hexAddress.slice(2)
    : hexAddress;
  const formattedAddress = addressWithoutPrefix.toLowerCase().padStart(64, '0');
  return `0x${formattedAddress}`;
}

// Function to fetch logs based on parameters
async function fetchLogs(fromAddress, toAddress, apiKey, transactionHash) {
  // Pad addresses with extra zeroes and '0x' prefix if needed
  const paddedFromAddress = formatHexAddress(fromAddress);
  const paddedToAddress = formatHexAddress(toAddress);

  // Construct the API URL
  const apiUrl = `https://api.etherscan.io/api?module=logs&action=getLogs&address=0x8AFE4055Ebc86Bd2AFB3940c0095C9aca511d852&fromBlock=0&toBlock=latest&topic0=0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef&topic0_1_opr=and&topic1=${paddedFromAddress}&topic2=${paddedToAddress}&apikey=${apiKey}`;

  try {
    // Make GET request to Etherscan API
    const response = await axios.get(apiUrl);
    const results = response.data.result;

    // console.log(results, "RESPONSE");

    // Check for matching transactionHash
    if (results.length > 1) {
      for (const result of results) {
        console.log(result, 'YAHN', transactionHash);
        if (result.transactionHash === transactionHash) {
          console.log(result.data, 'RESPONSE');
          return result.data; // Return the data for the matching transaction
        }
      }
    } else if (results.length === 1) {
      return results[0].data; // Return the single result's data
    }

    throw new Error('No matching transaction found');
  } catch (error) {
    console.error('Error fetching logs:', error);
    throw error; // Throw error for handling in caller function
  }
}

export const getTransactions = async () => {
  try {
    const response = await axios.get('https://api.etherscan.io/api', {
      params: {
        module: 'account',
        action: 'txlist',
        address: address,
        startblock: 0,
        offset: 100,
        endblock: 'latest',
        sort: 'desc',
        apikey: ETHERSCAN_API_KEY,
      },
    });

    if (response.data.status === '1') {
      const transactions = response.data.result;

      // Limit the transactions to the latest 100
      const latest100Transactions = transactions.slice(0, 10);

      // Process each transaction
      const decodedTransactions = await Promise.all(
        latest100Transactions.map(async (transaction) => {
          return await decodeTransactionInput(transaction);
        })
      );

      return decodedTransactions.filter((decoded) => decoded !== null); // Filter out transactions that failed to decode
    } else {
      console.error('Error fetching transactions:', response.data.message);
      return [];
    }
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};
