// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";
import {VeStaking} from "contracts/ve/VeStaking.sol";

/// note: run with: forge script scripts/foundry/SetStakingBalances.s.sol -vvvv (--broadcast) 
/// note: only append broadcast if ready to execute transaction. without broadcast = simulation
/// note: if script fails, resume by replacing --broadcast with --resume
contract SetStakingBalances is Script {
    // note: set this to the address of the old veStaking contract
    VeStaking internal veStaking = VeStaking(0x0000000000000000000000000000000000000000);
    // note: set this to the address of the new veStaking contract
    VeStaking internal veStakingV2 = VeStaking(0x0000000000000000000000000000000000000000);

    // token ids and balances to set
    uint256[] internal tokenIds;
    uint256[] internal balances;

    function run() public {
        // create and select fork
        // note: change to ARBITRUM_PROVIDER_URL for Arbitrum One
        string memory RPC_URL = vm.envString("ARBSEPOLIA_PROVIDER_URL");
        vm.createSelectFork(RPC_URL);

        // private key for sending transactions
        uint256 pk = vm.envUint("PK");
        console2.log("Sending transaction with address", vm.addr(pk));

        /* create arrays of token ids and balances */

        // iterate over token ids 
        // note: set the correct range for the token ids
        uint256 sumBalances;
        for (uint256 i = 0; i < 900; i++) {
            uint256 bal = veStaking.balanceOf(i);

            // if balance is 0, skip
            if (bal != 0) {
                // add token id and balance to arrays
                tokenIds.push(i);
                balances.push(bal);

                sumBalances += bal;
            }

            console2.log(i, bal);
        }

        // get total supply of veStaking
        uint256 totalSupply = veStaking.totalSupply();
        console2.log("Total supply", totalSupply);
        console2.log("Sum of balances", sumBalances);

        // if the total supply is != sum of balances, throw error
        vm.assertEq(sumBalances, totalSupply);

        /* execute transaction to set balances on new contract */

        vm.startBroadcast(pk);

        // set balances for veStakingV2
        // this happens in a single transaction to avoid frontrunning or other issues
        // note: updating balances in a single transaction should work for up to ~1500 token ids (20k gas * 1500 = 30m gas)
        // note: after 1500 tokens the arrays need to be split into multiple transactions
        veStakingV2.setMultipleBalances(tokenIds, balances);

        vm.stopBroadcast();

        // note: check logs if new total supply == old total supply
        uint256 newTotalSupply = veStakingV2.totalSupply();
        console2.log("New total supply", newTotalSupply);
    }
}