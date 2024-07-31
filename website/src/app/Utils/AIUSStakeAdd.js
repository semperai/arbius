import Web3 from "web3";
import new_config from '../../new_config.json';
const VOTING_ESCROW_ADDRESS = new_config.votingEscrowAddress;
import votingEscrow from '../abis/votingEscrow.json'
import {useAccount, useContractRead} from 'wagmi'
export const aiusStakeADD = async (value, id) => {
    const {address, isConnected} = useAccount();
    if(!isConnected)
        return;

    const web3 = new Web3(window.ethereum);
    const votingEscrowContract = new web3.eth.Contract(votingEscrow,VOTING_ESCROW_ADDRESS );
    
    try {
        const res = await votingEscrowContract.methods.increase_amount(id,value).send({from:address});
        console.log(`Stake AIUS: ${res}`);
        return res;
       
    } catch (error) {
        console.error(error);
    }


};