// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BaseTest.sol";

/**
 * @notice Isolated tests for VotingEscrow.sol, without involvement of engine contract
 * @dev Can be run with `forge test --mc VotingEscrowTest`
 */
contract VotingEscrowTest is BaseTest {
    function setUp() public {
        // set time
        vm.warp((1704067200 / WEEK) * WEEK); // Thu Dec 28 2023 00:00:00 GMT+0000

        deployContracts();

        // mint and approve AIUS
        mintTestAius();
        approveTestAiusToEscrow();
    }

    function testCreateLock() public {
        // Balance should be zero before and 1 after creating the lock
        assertEq(votingEscrow.balanceOf(address(alice)), 0);

        vm.prank(alice);
        votingEscrow.create_lock(1000 ether, YEAR);
        assertEq(votingEscrow.ownerOf(1), alice);
        assertEq(votingEscrow.balanceOf(alice), 1);
    }

    function testCreateTwoLocks() public {
        vm.prank(alice);
        votingEscrow.create_lock(1000 ether, YEAR);

        skip(1 weeks);
        vm.roll(block.number + 1);

        vm.prank(bob);
        votingEscrow.create_lock(1000 ether, 104 weeks);

        assertEq(votingEscrow.balanceOf(address(alice)), 1);
        assertEq(votingEscrow.balanceOf(address(bob)), 1);
    }

    function testTotalSupplyDecreasing() public {
        votingEscrow.create_lock(1000 ether, MAX_LOCK_TIME);

        uint256 initialTotalSupply = votingEscrow.totalSupply();

        skip(YEAR);

        uint256 newTotalSupply = votingEscrow.totalSupply();

        assertTrue(newTotalSupply < initialTotalSupply, "Total supply should decrease over time");

        // supply is decreasing per second
        // todo: check why underflow error
        //votingEscrow.totalSupplyAtT(block.timestamp-1);
    }

    function testIncreaseLockAmount() public {
        votingEscrow.create_lock(100 ether, 2 * YEAR);

        uint256 bal = votingEscrow.balanceOfNFT(1);
        skip(52 weeks);
        bal = votingEscrow.balanceOfNFT(1);

        votingEscrow.increase_amount(1, 50 ether);

        votingEscrow.balanceOfNFT(1);
    }

    function testIncreaseUnlockTime() public {
        // create lock for 1 year (31104000 seconds, Sunday Dec 27)
        // unlock time is at 30844800 seconds (Thursday Dec 24), since locks are rounded down to the nearest week)
        votingEscrow.create_lock(1000 ether, YEAR);

        uint256 bal = votingEscrow.balanceOfNFT(1);
        skip(26 weeks);
        vm.roll(block.number + 1); // mine the next block
        // balance is now roughly half of initial balance
        votingEscrow.balanceOfNFT(1);

        // increase unlock time to 1 year from now
        votingEscrow.increase_unlock_time(1, YEAR);

        votingEscrow.increase_unlock_time(1, YEAR + 1 weeks);
        votingEscrow.increase_unlock_time(1, YEAR + 3 weeks);

        // balance is now identical to initial balance, since lock time is identical
        votingEscrow.balanceOfNFT(1);

        // increase unlock time to 2 years from now
        votingEscrow.increase_unlock_time(1, MAX_LOCK_TIME);

        // balance is now double the initial balance
        votingEscrow.balanceOfNFT(1);

        console.log(votingEscrow.epoch());
    }

    function testIncreaseUnlockTimeRevert() public {
        votingEscrow.create_lock(1000 ether, YEAR);
        votingEscrow.balanceOfNFT(1);

        // try to set unlock time to next month
        vm.expectRevert(abi.encodePacked("Can only increase lock duration"));
        votingEscrow.increase_unlock_time(1, 1 * MONTH);

        // fast forward 50 weeks
        skip(50 weeks);

        // now it works, but veAIUS balance is ~1/12 of initial balance, since lock time is only 1 month
        votingEscrow.increase_unlock_time(1, 1 * MONTH);
        votingEscrow.balanceOfNFT(1);
    }

    function testCreateLockOutsideAllowedZones() public {
        vm.expectRevert(abi.encodePacked("Voting lock can be 2 years max"));
        votingEscrow.create_lock(1000 ether, MAX_LOCK_TIME + MONTH);

        vm.expectRevert(abi.encodePacked("Can only lock until time in the future"));
        votingEscrow.create_lock(1000 ether, 2 days);
    }

    function testWithdraw() public {
        uint256 lockDuration = 1 weeks;
        votingEscrow.create_lock(1000 ether, lockDuration);

        // Try withdraw early
        uint256 tokenId = 1;
        vm.expectRevert(abi.encodePacked("The lock didn't expire"));
        votingEscrow.withdraw(tokenId);
        // Now try withdraw after the time has expired
        skip(lockDuration);
        vm.roll(block.number + 1); // mine the next block
        votingEscrow.withdraw(tokenId);

        assertEq(AIUS.balanceOf(address(this)), 1000 ether);
        // Check that the NFT is burnt
        assertEq(votingEscrow.balanceOfNFT(tokenId), 0);
        assertEq(votingEscrow.ownerOf(tokenId), address(0));
    }

    function testCheckTokenURICalls() public {
        // tokenURI should not work for non-existent token ids
        vm.expectRevert(abi.encodePacked("Query for nonexistent token"));
        votingEscrow.tokenURI(999);

        // Create a lock and check that the tokenURI works
        uint256 lockDuration = YEAR;
        votingEscrow.create_lock(1000 ether, lockDuration);

        uint256 tokenId = 1;

        // Just check that this doesn't revert
        votingEscrow.tokenURI(tokenId);

        // Now try withdraw after the time has expired
        skip(lockDuration);
        vm.roll(block.number + 1); // mine the next block

        // Withdraw, which destroys the NFT
        votingEscrow.withdraw(tokenId);

        // tokenURI should not work for this anymore as the NFT is burnt
        vm.expectRevert(abi.encodePacked("Query for nonexistent token"));
        votingEscrow.tokenURI(tokenId);
    }

    function testConfirmSupportsInterfaceWorksWithAssertedInterfaces() public {
        // Check that it supports all the asserted interfaces.
        bytes4 ERC165_INTERFACE_ID = 0x01ffc9a7;
        bytes4 ERC721_INTERFACE_ID = 0x80ac58cd;
        bytes4 ERC721_METADATA_INTERFACE_ID = 0x5b5e139f;

        assertTrue(votingEscrow.supportsInterface(ERC165_INTERFACE_ID));
        assertTrue(votingEscrow.supportsInterface(ERC721_INTERFACE_ID));
        assertTrue(votingEscrow.supportsInterface(ERC721_METADATA_INTERFACE_ID));
    }

    function testCheckSupportsInterfaceHandlesUnsupportedInterfacesCorrectly() public {
        bytes4 ERC721_FAKE = 0x780e9d61;
        assertFalse(votingEscrow.supportsInterface(ERC721_FAKE));
    }
}
