import Web3 from "web3";
import new_config from '../../new_config.json';
const VOTING_ESCROW_ADDRESS = new_config.votingEscrowAddress;
import votingEscrow from '../abis/votingEscrow.json'
export const stakeAIUS = async (value, lock_duration) => {
        const web3 = new Web3(window.ethereum);
        const votingEscrowContract = new web3.eth.Contract(votingEscrow,VOTING_ESCROW_ADDRESS );
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];
        try {
            const res = await votingEscrowContract.methods.create_lock(value, lock_duration, account).call();
            console.log(`Stake AIUS: ${res}`);
            return res;
        } catch (error) {
            console.error(error);
        }

};