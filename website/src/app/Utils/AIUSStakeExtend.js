import Web3 from "web3";
import new_config from '../../new_config.json';
const VOTING_ESCROW_ADDRESS = new_config.votingEscrowAddress;
import votingEscrow from '../abis/votingEscrow.json'

export const aiusStakeExtend = async (lock_duration, id) => {
    const web3 = new Web3(window.ethereum);
    const votingEscrowContract = new web3.eth.Contract(votingEscrow,VOTING_ESCROW_ADDRESS );
    
    try {
        const res = await votingEscrowContract.methods.increase_unlock_time(id,lock_duration).call();
        console.log(`Stake AIUS: ${res}`);
        return res;
       
    } catch (error) {
        console.error(error);
    }


};