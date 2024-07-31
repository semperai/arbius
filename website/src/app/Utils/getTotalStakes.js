import Web3 from "web3";
import new_config from '../../new_config.json';
const VOTING_ESCROW_ADDRESS = new_config.votingEscrowAddress;
import votingEscrow from '../abis/votingEscrow.json'
import { getAPR } from './getAPR';
export const getTotalStakes = async () => {
    const web3 = new Web3(window.ethereum);
    const votingEscrowContract = new web3.eth.Contract(votingEscrow,VOTING_ESCROW_ADDRESS );
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
    try {
        const total = await votingEscrowContract.methods.balanceOf(account).call();
        const tokenIDS = [];
        for (let i = 0; i < total; i++) {
            const tokenID = await votingEscrowContract.methods.tokenOfOwnerByIndex(account, i).call();
            tokenIDS.push(tokenID);
        }

        const totalStakes = [];
        for(let i = 0; i < tokenIDS.length; i++) {
            let id = tokenIDS[i];
            let totalStaked = await votingEscrowContract.methods.locked(id).call().amount;
            let endDate = await votingEscrowContract.methods.locked__end(id).call();
            let stakedOn = await votingEscrowContract.methods.user_point_history__ts(id, 1).call();
            let governancePower = await votingEscrowContract.methods.balanceOfNFT(id).call();
            let apr = await getAPR();
            totalStakes.push({
                id: id,
                totalStaked: totalStaked,
                endDate: endDate,
                stakedOn: stakedOn,
                governancePower: governancePower,
                apr: apr
            });
        }
        console.log(`Total Stakes: ${totalStakes}`);
        return totalStakes;
    } catch (error) {
        console.error(error);
    }


};