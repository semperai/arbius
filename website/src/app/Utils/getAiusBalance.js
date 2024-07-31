import Web3 from "web3";
// import { abi as stakingAbi } from './Staking.json'; // Import the ABI of the staking contract
import config from '../../sepolia_config.json';
// import Pool from '../src/app/abis/pool.json'
const BASETOKEN_ADDRESS_V1 = config.v2_baseTokenAddress;
import baseTokenV1 from '../abis/baseTokenV1.json'
import { useAccount, useContractRead } from "wagmi";

export const walletBalance = async () => {
        const {account, isConnected} = useAccount();
        if(!isConnected)
            return 
        try {
            const {
                data,isError,isLoading
            } = useContractRead({
                address:BASETOKEN_ADDRESS_V1,
                abi:baseTokenV1,
                functionName:'balanceOf',
                args:[
                    account
                ]
            })

            
            return {data, isError,isLoading};
            
        } catch (error) {
            console.error(error);
            return {
                data:null,
                isError:true,
                isLoading:false
            }
        }

};