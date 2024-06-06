// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import './BaseTest.sol';

contract VeStakingTest is BaseTest {
    VeStaking veStaking;
    VotingEscrow escrow;

    function setUp() public {
        deployAius();
        mintAius(alice, 1000 ether);
        mintAius(address(this), 1000 ether);

        VeNFTRender veNFTRender = new VeNFTRender();
        escrow = new VotingEscrow(address(AIUS), address(veNFTRender));
        veStaking = new VeStaking(address(this), address(AIUS), address(escrow));
    }

    function testSetPaused() public {
        // alice cant pause
        vm.prank(alice);
        vm.expectRevert(abi.encodePacked("Ownable: caller is not the owner"));
        veStaking.setPaused(true);
        assertEq(veStaking.paused(), false);

        // owner can pause
        veStaking.setPaused(true);
        assertEq(veStaking.paused(), true);
    }
}
