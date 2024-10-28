import Web3 from 'web3';
import UNIV2_ABI from '../../../src/app/abis/approveUNIV2.json'
// Assuming you have the ABI and address of the UNI-V2 token contract

const UNIV2_ADDRESS = '0xCB37089fC6A6faFF231B96e000300a6994d7a625';
// The address of the contract you want to approve UNI-V2 for
// check this for replacement 
const GYSR_STAKING_CONTRACT_ADDRESS = '0x2f8152bbA263Cb1bCF73b0Cb1E6CB4cA40b9F6d7'


export const approveUNIV2 = async (amt) => {
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
            const uniV2Contract = new web3.eth.Contract(UNIV2_ABI, UNIV2_ADDRESS);
            console.log(uniV2Contract)
            // Set the amount to approve (use max uint256 value for unlimited approval)
            const amount =  Web3.utils.toWei(amt, 'ether');;
            const result = await uniV2Contract.methods.approve(GYSR_STAKING_CONTRACT_ADDRESS, amount).send({ from:account  });

            // Call the approve function
            alert('UNI-V2 approved successfully!');
            return true;

            
        } catch (error) {
            console.error('Approval failed', error);
            alert('Approval failed');
        }
    } else {
        alert('Please install MetaMask!');
    }
};
