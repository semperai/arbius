import Web3 from "web3";
// import { abi as stakingAbi } from './Staking.json'; // Import the ABI of the staking contract
import new_config from '../../new_config.json';
// import Pool from '../src/app/abis/pool.json'
const VE_STAKING_ADDRESS = new_config.veStakingAddress;
import veStaking from '../abis/veStaking.json'
export const getAPR = async () => {
        const web3 = new Web3(window.ethereum);
        const veStakingContract = new web3.eth.Contract(veStaking,VE_STAKING_ADDRESS );
        try {
            const rewardRate = await veStakingContract.methods.rewardRate().call();
            const totalSupply = await veStakingContract.methods.totalSupply().call();
            const rewardPerveAiusPerSecond = rewardRate/totalSupply;
            const apr = rewardPerveAiusPerSecond * 365 * 24 * 60 * 60*100;
            console.log(`APR: ${apr}`);
            return apr;

        
        } catch (error) {
            console.error(error);
        }

};