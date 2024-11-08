import loadConfig from "../../components/Stake/AIUS/loadConfig";
import votingEscrow from "../../abis/votingEscrow.json";
import veStaking from "../../abis/veStaking.json";
import Web3 from "web3";
const init = async () => {
    const config = loadConfig();
    const VOTING_ESCROW_ADDRESS = config.votingEscrowAddress;
    const web3 = new Web3(window.ethereum);
    const votingEscrowContract = new web3.eth.Contract(votingEscrow.abi, VOTING_ESCROW_ADDRESS);
    return votingEscrowContract;
    
}

const getTotalEscrowBalance = async (contract, address) => {
    console.log(contract, "CONTRACT")
    
    const totalEscrowBalance = await contract.methods.balanceOf(address).call();
    return totalEscrowBalance;
}

const getTokenIDs = async ( address, totalEscrowBalance) => {
    const config = loadConfig();
    const VOTING_ESCROW_ADDRESS = config.votingEscrowAddress;
    const VESTACKING_ADDRESS = config.veStakingAddress;
    const web3 = new Web3(window.ethereum);
    const votingEscrowContract = new web3.eth.Contract(votingEscrow.abi, VOTING_ESCROW_ADDRESS);
    const veStakingContract = new web3.eth.Contract(veStaking.abi, VESTACKING_ADDRESS);
    const tokenIDs =[];
    for (let i = 0; i < totalEscrowBalance; i++) {
        const tokenID = await votingEscrowContract.methods.tokenOfOwnerByIndex(address, i).call();
        tokenIDs.push(tokenID);
    }
    const stakingData = []

    for(let i = 0; i < tokenIDs.length; i++){
        const locked = await votingEscrowContract.methods.locked(tokenIDs[i]).call();
        const locked__end = await votingEscrowContract.methods.locked__end(tokenIDs[i]).call();
        const user_point_history = await votingEscrowContract.methods.user_point_history__ts(tokenIDs[i], 1).call();
        const balanceOfNFT = await votingEscrowContract.methods.balanceOfNFT(tokenIDs[i]).call();
        const initialBalance = await veStakingContract.methods.balanceOf(tokenIDs[i]).call();
        const earned = await veStakingContract.methods.earned(tokenIDs[i]).call();
        stakingData.push({
            "tokenID": tokenIDs[i],
            "locked": locked,
            "locked__end": locked__end,
            "user_point_history__ts": user_point_history,
            "stakedOn":user_point_history,
            "balanceOfNFT": balanceOfNFT,
            "initialBalance": initialBalance,
            "earned": earned
        })
    }
    return stakingData;

}

export { getTotalEscrowBalance, getTokenIDs, init };


