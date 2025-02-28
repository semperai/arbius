// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BaseTest.sol";
import "./handler/Handler.sol";

/**
 * @notice Isolated tests for VotingEscrow.sol, without involvement of engine contract
 * @dev Can be run with `forge test --mc VotingEscrowTest`
 */
contract VotingEscrowTest is BaseTest {
    Handler handler;

    function setUp() public {
        // set time
        vm.warp((1704067200 / WEEK) * WEEK); // Thu Dec 28 2023 00:00:00 GMT+0000

        deployContracts();

        // mint and approve AIUS
        mintTestAius();
        approveTestAiusToEscrow();

        // deploy handler contract for invariant tests
        handler = new Handler(votingEscrow, AIUS);
        // set the handler contract as the target for our test
        targetContract(address(handler));
    }

    function testOnlyOwner() public {
        // should be correct owner
        assertEq(votingEscrow.owner(), address(this));

        // setArtProxy
        votingEscrow.setArtProxy(address(1));
        assertEq(votingEscrow.artProxy(), address(1));
        // setArtProxyFail
        vm.prank(alice);
        vm.expectRevert();
        votingEscrow.setArtProxy(address(0));

        // setVeStaking
        votingEscrow.setVeStaking(address(1));
        assertEq(votingEscrow.veStaking(), address(1));
        // setVeStakingFail
        vm.prank(alice);
        vm.expectRevert();
        votingEscrow.setVeStaking(address(0));

        // setVoter
        votingEscrow.setVoter(address(1));
        assertEq(votingEscrow.voter(), address(1));
        // setVoterFail
        vm.prank(alice);
        vm.expectRevert();
        votingEscrow.setVoter(address(0));
    }

    function testFuzz_CreateLock(uint256 amount) public {
        // bind amount to be between 0.0001 AIUS and 1000 AIUS
        amount = bound(amount, 0.0001 ether, 1000 ether);

        // Balance should be zero before and 1 after creating the lock
        assertEq(votingEscrow.balanceOf(address(alice)), 0);

        vm.prank(alice);
        votingEscrow.create_lock(amount, 2 * YEAR);
        assertEq(votingEscrow.ownerOf(1), alice);
        assertEq(votingEscrow.balanceOf(alice), 1);

        // error of 1% due to rounding down to the nearest week
        assertApproxEqRel(votingEscrow.balanceOfNFT(1), amount, 1e16);

        assertEq(AIUS.balanceOf(address(votingEscrow)), amount);
    }

    function testCreateLockWithZeroAmount() public {
        vm.expectRevert();
        votingEscrow.create_lock(0, 2 weeks);
    }

    function testCreateTwoLocks() public {
        vm.prank(alice);
        votingEscrow.create_lock(1000 ether, YEAR);

        skip(1 weeks);
        vm.roll(block.number + 1);

        vm.prank(bob);
        votingEscrow.create_lock(1000 ether, 2 * YEAR);

        assertEq(votingEscrow.balanceOf(address(alice)), 1);
        assertEq(votingEscrow.balanceOf(address(bob)), 1);

        // bob should have double the balance of alice
        assertApproxEqAbs(
            votingEscrow.balanceOfNFT(1) * 2,
            votingEscrow.balanceOfNFT(2),
            20 ether // time lock is rounded down to the nearest week
        );
    }

    function testTotalSupplyDecreasing() public {
        votingEscrow.create_lock(1000 ether, MAX_LOCK_TIME);

        uint256 initialTotalSupply = votingEscrow.totalSupply();

        skip(YEAR);

        uint256 newTotalSupply = votingEscrow.totalSupply();

        assertTrue(
            newTotalSupply < initialTotalSupply,
            "Total supply should decrease over time"
        );

        skip(YEAR);

        newTotalSupply = votingEscrow.totalSupply();

        assertEq(newTotalSupply, 0, "!totalSupply");
    }

    function testTotalSupplyAt() public {
        // create a few locks to set initial total supply
        votingEscrow.create_lock(100 ether, YEAR); // veNFT id 1
        vm.prank(alice);
        votingEscrow.create_lock(200 ether, 2 * YEAR); // veNFT id 2
        vm.prank(bob);
        votingEscrow.create_lock(50 ether, 6 * MONTH); // veNFT id 3

        uint256 firstTotalSupply = votingEscrow.balanceOfNFT(1) +
            votingEscrow.balanceOfNFT(2) +
            votingEscrow.balanceOfNFT(3);
        // for some weird reason we have to hardcode timestamps here, optimizer is probably fucking something up
        uint256 firstTimestamp = 1703721600;
        assertEq(votingEscrow.totalSupplyAtT(firstTimestamp), firstTotalSupply);

        // fast forward 1 year
        skip(YEAR);

        vm.prank(charlie);
        votingEscrow.create_lock(100 ether, MAX_LOCK_TIME); // veNFT id 4

        // only alice' and charlies locks are still active
        uint256 secondTotalSupply = votingEscrow.balanceOfNFT(2) +
            votingEscrow.balanceOfNFT(4);
        uint256 secondTimestamp = 1735257600;
        assertEq(
            votingEscrow.totalSupplyAtT(secondTimestamp),
            secondTotalSupply
        );

        // fast forward 1 year
        skip(YEAR);

        // only charlies lock is still active
        uint256 thirdTotalSupply = votingEscrow.balanceOfNFT(4);
        uint256 thirdTimestamp = 1766793600;
        assertEq(votingEscrow.totalSupplyAtT(thirdTimestamp), thirdTotalSupply);

        // fast forward 4 years
        skip(4 * YEAR);

        // all locks are expired
        uint256 fourthTimestamp = 1892937600;
        assertEq(votingEscrow.totalSupply(), 0);

        // querying total supply from the past should work
        assertEq(votingEscrow.totalSupplyAtT(firstTimestamp), firstTotalSupply);
        assertEq(
            votingEscrow.totalSupplyAtT(secondTimestamp),
            secondTotalSupply
        );
        assertEq(votingEscrow.totalSupplyAtT(thirdTimestamp), thirdTotalSupply);
        assertEq(votingEscrow.totalSupplyAtT(fourthTimestamp), 0);
    }

    function testDepositedSupply() public {
        votingEscrow.create_lock(1000 ether, YEAR);
        assertEq(votingEscrow.supply(), 1000 ether, "!depositedSupply");

        // fast forward 1 year
        skip(YEAR);

        // withdraw
        votingEscrow.withdraw(1);
        assertEq(votingEscrow.supply(), 0, "!depositedSupply");

        // alice deposits
        vm.prank(alice);
        votingEscrow.create_lock(900 ether, 2 * YEAR);

        // alice increases lock amount
        vm.prank(alice);
        votingEscrow.increase_amount(2, 100 ether);
        assertEq(votingEscrow.supply(), 1000 ether, "!depositedSupply");

        // sanity check
        assertEq(votingEscrow.supply(), AIUS.balanceOf(address(votingEscrow)));
    }

    function testIncreaseLockAmount() public {
        votingEscrow.create_lock(100 ether, 2 * YEAR);

        uint256 bal = votingEscrow.balanceOfNFT(1);

        assertApproxEqAbs(
            bal,
            100 ether,
            1 ether // time lock is rounded down to the nearest week
        );

        // fast forward 52 weeks
        skip(52 weeks);

        uint256 newBal = votingEscrow.balanceOfNFT(1);
        // balance is now roughly half of initial balance
        assertApproxEqAbs(
            newBal,
            50 ether,
            1 ether // time lock is rounded down to the nearest week
        );

        // increase lock amount
        votingEscrow.increase_amount(1, 50 ether);

        uint256 finalBal = votingEscrow.balanceOfNFT(1);

        // balance is now roughly 75 AIUS, since lock time didnt change
        // it's as if we created the initial lock with 150 AIUS, instead of 100 AIUS
        assertApproxEqAbs(
            finalBal,
            75 ether,
            1 ether // time lock is rounded down to the nearest week
        );
    }

    function testIncreaseUnlockTime() public {
        // create lock for 1 year
        votingEscrow.create_lock(1000 ether, YEAR);

        uint256 initialBal = votingEscrow.balanceOfNFT(1);
        assertApproxEqAbs(
            initialBal,
            500 ether,
            10 ether // time lock is rounded down to the nearest week)
        );

        // fast forward 26 weeks
        skip(26 weeks);

        // balance is now roughly half of initial balance
        uint256 bal = votingEscrow.balanceOfNFT(1);
        votingEscrow.balanceOfNFT(1);
        assertApproxEqAbs(
            bal * 2,
            initialBal,
            10 ether // time lock is rounded down to the nearest week)
        );

        // call increase_unlock_time
        // this is like creating a new lock with unlock time 1 year from now
        votingEscrow.increase_unlock_time(1, YEAR + 1 weeks);

        // balance is now identical to initial balance, since lock time is identical
        uint256 newBal = votingEscrow.balanceOfNFT(1);
        assertApproxEqAbs(
            newBal,
            initialBal,
            10 ether // time lock is rounded down to the nearest week)
        );

        // increase unlock time to 2 years from now
        votingEscrow.increase_unlock_time(1, MAX_LOCK_TIME);

        // balance is now double the initial balance
        uint256 finalBal = votingEscrow.balanceOfNFT(1);
        assertApproxEqAbs(
            finalBal,
            initialBal * 2,
            10 ether // time lock is rounded down to the nearest week)
        );
    }

    function testIncreaseUnlockTimeRevert() public {
        votingEscrow.create_lock(1000 ether, YEAR);

        uint256 initialBal = votingEscrow.balanceOfNFT(1);
        assertApproxEqAbs(
            initialBal,
            500 ether,
            10 ether // time lock is rounded down to the nearest week)
        );

        // try to set unlock time to next month, should revert
        vm.expectRevert(abi.encodePacked("Can only increase lock duration"));
        votingEscrow.increase_unlock_time(1, 1 * MONTH);

        // fast forward 50 weeks
        skip(50 weeks);

        // now it works since new end time is greater than initial end time
        // veAIUS balance is ~1/12 of initial balance, since lock time is only 1 month instead of 12
        votingEscrow.increase_unlock_time(1, 1 * MONTH);
        uint256 newBal = votingEscrow.balanceOfNFT(1);
        assertApproxEqAbs(
            newBal,
            initialBal / 12,
            10 ether // time lock is rounded down to the nearest week)
        );
    }

    function testCreateLockOutsideAllowedZones() public {
        vm.expectRevert(abi.encodePacked("Voting lock can be 2 years max"));
        votingEscrow.create_lock(1000 ether, MAX_LOCK_TIME + 1 weeks);

        vm.expectRevert(
            abi.encodePacked("Can only lock until time in the future")
        );
        votingEscrow.create_lock(1000 ether, 2 days);
    }

    function testWithdraw() public {
        uint256 balanceBefore = AIUS.balanceOf(address(this));

        uint256 lockDuration = 1 weeks;
        votingEscrow.create_lock(1000 ether, lockDuration);

        // Try withdraw early
        uint256 tokenId = 1;
        vm.expectRevert(abi.encodePacked("The lock didn't expire"));
        votingEscrow.withdraw(tokenId);

        // Now try withdraw after the time has expired
        skip(lockDuration);
        votingEscrow.withdraw(tokenId);

        // check balances
        assertEq(AIUS.balanceOf(address(this)), balanceBefore);
        assertEq(votingEscrow.balanceOfNFT(tokenId), 0);

        // Check that the NFT is burnt
        assertEq(votingEscrow.ownerOf(tokenId), address(0));
    }

    function invariant_alwaysWithdrawable() public {
        uint256 deposit = handler.ghost_depositSum();
        uint256 withdraw = handler.ghost_withdrawSum();

        // AIUS balance in the contract should be always equal to the sum of all deposits - withdrawals
        assertEq(AIUS.balanceOf(address(votingEscrow)), deposit - withdraw);
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

    function testConfirmSupportsInterfaceWorksWithAssertedInterfaces() public view {
        // Check that it supports all the asserted interfaces.
        bytes4 ERC165_INTERFACE_ID = 0x01ffc9a7;
        bytes4 ERC721_INTERFACE_ID = 0x80ac58cd;
        bytes4 ERC721_METADATA_INTERFACE_ID = 0x5b5e139f;

        assertTrue(votingEscrow.supportsInterface(ERC165_INTERFACE_ID));
        assertTrue(votingEscrow.supportsInterface(ERC721_INTERFACE_ID));
        assertTrue(
            votingEscrow.supportsInterface(ERC721_METADATA_INTERFACE_ID)
        );
    }

    function testCheckSupportsInterfaceHandlesUnsupportedInterfacesCorrectly()
        public view
    {
        bytes4 ERC721_FAKE = 0x780e9d61;
        assertFalse(votingEscrow.supportsInterface(ERC721_FAKE));
    }

    // todo: add tests for voted, e.g. no withdraw possible when active vote etc.
}
