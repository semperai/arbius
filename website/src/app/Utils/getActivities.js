const axios = require('axios');
import Web3 from 'web3';
const Pool = require('@gysr/core/abis/Pool.json'); // Import the ABI of the contract
const ETHERSCAN_API_KEY = 'YAFSITPZ9SYATJZCET8XPTNI2FWZSNIUT6';
const address = '0xF0148B59D7F31084Fb22FF969321FDfAfA600C02';

// Initialize Web3 with Infura provider (replace with your preferred provider)
const web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/your_infura_project_id'));

// Function to decode transaction input based on ABI
function decodeTransactionInput(inputData) {
    // console.log(inputData)
    const input = inputData.input; // Input data from transaction
    const functionName  = inputData.functionName.substring(0, inputData.functionName.indexOf('(')).trim();; // Function selector (first 4 bytes)
    
    // Find ABI entry for the function
    const functionAbi = Pool.find(entry => entry.name === functionName && entry.type === 'function');

    if (functionAbi) {
        try {
            // Decode parameters
            const decodedParams = web3.eth.abi.decodeParameters(functionAbi.inputs, '0x' + input.slice(10));
            const transferEvents = fetchTransferEvents(inputData.from, inputData.to);
            const decodedTransaction = {
                from: inputData.from,
                to: inputData.to,
                value: web3.utils.fromWei(inputData.value, 'ether'), // Convert value from wei to ether (if applicable)
                functionName: functionAbi.name,
                decodedParams: decodedParams,
                amount:web3.utils.fromWei(decodedParams.amount, 'ether'),
                timestamp: inputData.timeStamp // Convert timestamp to ISO format
            };

            return decodedTransaction;
        } catch (error) {
            console.error('Error decoding input data:', error);
        }
    } else {
        console.error('Function not found in ABI');
    }
}
async function fetchTransferEvents(fromAddress, toAddress) {
    try {
        const response = await axios.get('https://api.etherscan.io/api', {
            params: {
                module: 'logs',
                action: 'getLogs',
                fromBlock: 0,
                toBlock: 'latest',
                address: address, // Replace with your contract address
                topic0: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer event topic
                topic1: fromAddress.toLowerCase().replace('0x', ''),
                topic2: toAddress.toLowerCase().replace('0x', ''),
                apikey: ETHERSCAN_API_KEY
            }
        });

        if (response.data.status === '1') {
            return response.data.result;
        } else {
            console.error('Error fetching transfer events:', response.data.message);
            return [];
        }
    } catch (error) {
        console.error('Error fetching transfer events:', error);
        return [];
    }
}

// Function to fetch transactions from Etherscan
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
            // console.log('Transactions:', transactions);

            // Process each transaction
            const decodedTransactions = transactions.map(transaction => {
                return decodeTransactionInput(transaction);
            }).filter(decoded => decoded !== null); // Filter out transactions that failed to decode

           return decodedTransactions
        } else {
            console.error('Error fetching transactions:', response.data.message);
        }
    } catch (error) {
        console.error('Error fetching transactions:', error);
    }
};
