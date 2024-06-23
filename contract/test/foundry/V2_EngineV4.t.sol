// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import './BaseTest.sol';

/// @notice Tests are invoked with `npm forge-test` command
contract EngineV4Test is BaseTest {

    function setUp() public {
        // set up is done in hardhat test file: test/enginev4.test.ts
        
        // set time
        //vm.warp((1704067200  / WEEK) * WEEK); // Thu Dec 28 2023 00:00:00 GMT+0000        
    }

      // todo: rewards over 7 years, ve APY, task submitting etc

}
