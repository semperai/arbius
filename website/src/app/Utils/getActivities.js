
import axios from 'axios';
import Web3 from 'web3';
const Pool = require('@gysr/core/abis/Pool.json'); // Import the ABI of the contract
const ETHERSCAN_API_KEY = 'YAFSITPZ9SYATJZCET8XPTNI2FWZSNIUT6';
const address = '0xF0148B59D7F31084Fb22FF969321FDfAfA600C02';

// Initialize Web3 with Infura provider (replace with your preferred provider)
const web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/your_infura_project_id'));

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
            console.log('Transactions:', transactions);

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
