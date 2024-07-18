
import axios from 'axios';
import { useEffect } from 'react';
import Web3 from 'web3';
const Pool = require('@gysr/core/abis/Pool.json'); // Import the ABI of the contract
const ETHERSCAN_API_KEY = 'YAFSITPZ9SYATJZCET8XPTNI2FWZSNIUT6';
const address = '0xF0148B59D7F31084Fb22FF969321FDfAfA600C02';

// Initialize Web3 with Infura provider (replace with your preferred provider)
const web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/your_infura_project_id'));
// useEffect(() => {
//    fetchLogs('0xA8f103eEcfb619358C35F98c9372B31c64d3f4A1','0xF1d3c4aCFc34Cf910E90FE7F6af2aA668D095F83',ETHERSCAN_API_KEY)

  
// }, [])

// Function to decode transaction input based on ABI
async function decodeTransactionInput(inputData) {
    const input = inputData.input; // Input data from transaction
    const functionName = inputData.functionName.substring(0, inputData.functionName.indexOf('(')).trim(); // Function selector (first 4 bytes)

    // Find ABI entry for the function
    const functionAbi = Pool.find(entry => entry.name === functionName && entry.type === 'function');

    if (functionAbi) {
        try {
            // Decode parameters
            const decodedParams = web3.eth.abi.decodeParameters(functionAbi.inputs, '0x' + input.slice(10));

            const decodedTransaction = {
                from: inputData.from,
                blockHash:inputData.hash,
                to: inputData.to,
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

function decimalToHex(decimalAddress) {
    // Remove '0x' prefix if present
    decimalAddress = decimalAddress.toLowerCase().replace('0x', '');

    // Convert decimal to BigNumber object
    const bigNumberAddress = new BigNumber(decimalAddress);

    // Convert BigNumber to hexadecimal string
    let hexAddress = '0x' + bigNumberAddress.toString(16).padStart(40, '0');

    return hexAddress;
}

// Function to fetch logs based on parameters
async function fetchLogs(fromAddress, toAddress, apiKey) {
    // Pad addresses with extra zeroes and '0x' prefix if needed
    const paddedFromAddress = fromAddress;
    const paddedToAddress = toAddress;
    console.log(paddedFromAddress,"PADDING")
    // Construct the API URL
    const apiUrl = `https://api.etherscan.io/api?module=logs&action=getLogs&address=0xCB37089fC6A6faFF231B96e000300a6994d7a625&fromBlock=0&toBlock=latest&topic0=0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef&topic0_1_opr=and&topic1=${paddedFromAddress}&topic2=${paddedToAddress}&apikey=${apiKey}`;

    try {
        // Make GET request to Etherscan API
        const response = await axios.get(apiUrl);
        return response.data; // Return the API response data
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
                endblock: 'latest',
                sort: 'desc',
                apikey: ETHERSCAN_API_KEY
            }
        });

        if (response.data.status === '1') {
            const transactions = response.data.result;
            

            // Process each transaction
            const decodedTransactions = await Promise.all(transactions.map(async (transaction) => {
                return await decodeTransactionInput(transaction);
            }));
            
            return decodedTransactions.filter(decoded => decoded !== null); // Filter out transactions that failed to decode
        } else {
            console.error('Error fetching transactions:', response.data.message);
            return [];
        }
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
};
