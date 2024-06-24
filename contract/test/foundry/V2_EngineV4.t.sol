// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import './BaseTest.sol';

import "contracts/V2_EngineV4.sol";
import "contracts/BaseTokenV1.sol";

/**
* @notice Steps to test EngineV4:
* 1. Deploy local hardhat node with `npx hardhat node`
* 2. Then, run hardhat setup on local node with `npx hardhat test test/enginev4.test.ts --network localhost`
* 3. Run Foundry tests with `npm run forge-test`, or `npm run forge-test-v` for verbose output
*/
contract EngineV4Test is BaseTest {

    // default test mnemonic used in hardhat tests
    string constant public mnemonic = "test test test test test test test test test test test junk";

    address deployer = vm.addr(vm.deriveKey(mnemonic, 0));
    address user1 = vm.addr(vm.deriveKey(mnemonic, 1));
    address user2 = vm.addr(vm.deriveKey(mnemonic, 2));
    address validator1 = vm.addr(vm.deriveKey(mnemonic, 3));
    address validator2 = vm.addr(vm.deriveKey(mnemonic, 4));
    address validator3 = vm.addr(vm.deriveKey(mnemonic, 5));
    address validator4 = vm.addr(vm.deriveKey(mnemonic, 6));
    address treasury = vm.addr(vm.deriveKey(mnemonic, 7));
    address model1 = vm.addr(vm.deriveKey(mnemonic, 8));
    address newowner = vm.addr(vm.deriveKey(mnemonic, 9));

    // contracts
    V2_EngineV4 public engine = V2_EngineV4(0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9);
    BaseTokenV1 public baseToken = BaseTokenV1(0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0); 

    function setUp() public {
        // set up is done in hardhat test file: test/enginev4.test.ts
        
        // todo: implement this in hardhat 
        // vm.warp((1704067200  / WEEK) * WEEK); // Thu Dec 28 2023 00:00:00 GMT+0000        
    }

    function testSetPaused() public {
        vm.prank(deployer);
        engine.setPaused(true);
    }
    
    // todo: rewards over 7 years, ve APY, task submitting etc

}
