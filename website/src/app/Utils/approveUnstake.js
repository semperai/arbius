import Web3 from 'web3';
import APPROVE_UNSTAKE from '../src/app/abis/approveUnstake.json'
// Assuming you have the ABI and address of the UNI-V2 token contract

const APPROVE_UNSTAKE_ADDRESS = '0xbEa98c05eEAe2f3bC8c3565Db7551Eb738c8CCAb';

export const approveUnstake = async (amt) => {
    if (window.ethereum) {
        // Initialize web3
        const web3 = new Web3(window.ethereum);
        try {
            // Request account access if needed
            await window.ethereum.enable();

            // Get the user's accounts
            const accounts = await web3.eth.getAccounts();
            const account = accounts[0];
            console.log(account,"ACCOUNT")

            // Create the contract instance
            const uniV2Contract = new web3.eth.Contract(APPROVE_UNSTAKE, APPROVE_UNSTAKE_ADDRESS);

            // Set the amount to approve (use max uint256 value for unlimited approval)
            const amount =  Web3.utils.toWei(amt, 'ether');;

            // Call the approve function
            

            alert('unstake approved successfully!');
        } catch (error) {
            console.error('Approval failed', error);
            alert('Approval failed');
        }
    } else {
        alert('Please install MetaMask!');
    }
};
