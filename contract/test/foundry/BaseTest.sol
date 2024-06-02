// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console2.sol";

import "./utils/MockERC20.sol";
import "contracts/VotingEscrow.sol";
import "contracts/VeNFTRender.sol";

contract BaseTest is Test {
    MockERC20 public AIUS;

    // time 
    uint256 public constant WEEK = 7 * 24 * 3600;
    uint256 public constant YEAR = 365 * 24 * 3600;

    // test addresses
    address L2Gateway = makeAddr("L2Gateway");
    address L1TokenAddress = makeAddr("L1TokenAddress");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function deployAius() public {
        // deploy and initialize AIUS
        AIUS = new MockERC20("Arbius", "AIUS");
    }

    function mintAius(address to, uint256 amount) public {
        vm.prank(L2Gateway);
        AIUS.mint(to, amount);
    }

}