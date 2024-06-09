// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console2.sol";

import "./utils/MockERC20.sol";
import "contracts/VotingEscrow.sol";
import "contracts/VeNFTRender.sol";
import "contracts/VeStaking.sol";

contract BaseTest is Test {
    MockERC20 public AIUS;

    // time 
    uint256 public constant MONTH = 30 days;
    uint256 public constant YEAR = 12 * MONTH;

    // test addresses
    address L2Gateway = makeAddr("L2Gateway");
    address L1TokenAddress = makeAddr("L1TokenAddress");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address charlie = makeAddr("charlie");
    address dave = makeAddr("dave");

    function deployAius() public {
        // deploy and initialize AIUS
        AIUS = new MockERC20("Arbius", "AIUS");
    }

    function mintAius(address to, uint256 amount) public {
        vm.prank(L2Gateway);
        AIUS.mint(to, amount);
    }

}