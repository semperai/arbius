import Web3 from "web3";
// import { abi as stakingAbi } from './Staking.json'; // Import the ABI of the staking contract
import new_config from '../../new_config.json';
// import Pool from '../src/app/abis/pool.json'
const VE_STAKING_ADDRESS = new_config.veStakingAddress;
const VOTING_ESCROW_ADDRESS = new_config.votingEscrowAddress;
import votingEscrow from '../abis/votingEscrow.json'
import veStaking from '../abis/veStaking.json'
export const getVeAIUSBalance = async () => {
        const web3 = new Web3(window.ethereum);
        const veStakingContract = new web3.eth.Contract(veStaking,VE_STAKING_ADDRESS );
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

            const totalveAIUS = 0;
            for (let i = 0; i < tokenIDS.length; i++) {
                const veAIUS = await veStakingContract.methods.balanceOf(tokenIDS[i]).call();
                totalveAIUS += veAIUS;
            }
            console.log(`veAIUS: ${totalveAIUS}`);
            return totalveAIUS;
        } catch (error) {
            console.error(error);
        }

};