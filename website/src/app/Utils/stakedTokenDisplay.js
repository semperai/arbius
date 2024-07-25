import Web3 from "web3";
import { abi as stakingAbi } from './Staking.json'; // Import the ABI of the staking contract

const stakingAddress = '0x811a2389Ae2eFaaEAEC2f5FCa71e7DAc7533e755';

export const updateStakedTokensDisplay = async () => {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];

    const stakingContract = new web3.eth.Contract(stakingAbi, stakingAddress);

    try {
        const stakedBalance = await stakingContract.methods.balanceOf(account).call();
        document.getElementById('staked-tokens').innerText = `Staked Tokens: ${stakedBalance}`;
    } catch (error) {
        console.error("Failed to fetch staked tokens", error);
        alert("Failed to fetch staked tokens");
    }
};
