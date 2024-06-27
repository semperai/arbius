// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BaseTest.sol";

contract VeStakingTest is BaseTest {
    function setUp() public {
        // set time
        vm.warp((1704067200 / WEEK) * WEEK); // Thu Dec 28 2023 00:00:00 GMT+0000

        deployContracts();

        // mint and approve AIUS
        mintTestAius();
        approveTestAiusToEscrow();
    }

    function testConstructorAndSettings() public {
        assertEq(veStaking.owner(), address(this), "owner != this");
        assertEq(address(veStaking.rewardsToken()), address(AIUS), "rewardsToken != AIUS");
        assertEq(address(veStaking.votingEscrow()), address(votingEscrow), "votingEscrow != votingEscrow");
        assertEq(veStaking.rewardsDuration(), 1 weeks, "rewardsDuration != 1 weeks");
    }

    function testOnlyOwner() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodePacked("Ownable: caller is not the owner"));
        veStaking.setRewardsDuration(2 weeks);

        vm.prank(alice);
        vm.expectRevert(abi.encodePacked("Ownable: caller is not the owner"));
        veStaking.recoverERC20(address(mockToken), 10 ether);
    }

    function testOnlyVotingEscrow() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodePacked("Caller is not VotingEscrow contract"));
        veStaking._stake(1, 100 ether);

        vm.prank(alice);
        vm.expectRevert(abi.encodePacked("Caller is not VotingEscrow contract"));
        veStaking._withdraw(100 ether);

        vm.prank(alice);
        vm.expectRevert(abi.encodePacked("Caller is not VotingEscrow contract"));
        veStaking._updateBalance(1, 100 ether);
    }

    function testRevertNotifyRewardAmount() public {
        // transfering exact reward should work
        AIUS.transfer(address(veStaking), 1e18);
        veStaking.notifyRewardAmount(1e18);

        // transfering too much reward should work
        AIUS.transfer(address(veStaking), 10e18);
        veStaking.notifyRewardAmount(9e18);

        // transfering too little reward should revert
        AIUS.transfer(address(veStaking), 0.99e18);
        vm.expectRevert(abi.encodePacked("Provided reward too high"));
        veStaking.notifyRewardAmount(2e18);
    }

    function testLastTimeRewardApplicable() public {
        // add rewards to veStaking
        AIUS.transfer(address(veStaking), 7 ether);
        veStaking.notifyRewardAmount(7 ether);

        assertEq(veStaking.lastTimeRewardApplicable(), block.timestamp, "!lastTimeRewardApplicable");

        skip(8 days);

        assertEq(veStaking.lastTimeRewardApplicable(), veStaking.periodFinish(), "!lastTimeRewardApplicable");
    }

    function testRewardPerToken() public {
        // add rewards to veStaking
        AIUS.transfer(address(veStaking), 7 ether);
        veStaking.notifyRewardAmount(7 ether);

        votingEscrow.create_lock(100 ether, MAX_LOCK_TIME);

        // rewardPerToken should increase over time
        skip(1);
        uint256 rewardPerToken = veStaking.rewardPerToken();
        assertGt(rewardPerToken, 0, "!rewardPerToken");

        skip(1 days);
        uint256 newRewardPerToken = veStaking.rewardPerToken();
        assertGt(newRewardPerToken, rewardPerToken, "!rewardPerToken");

        skip(7 days);
        uint256 finalRewardPerToken = veStaking.rewardPerToken();
        assertGt(finalRewardPerToken, newRewardPerToken, "!rewardPerToken");

        // get veStaking balance 
        uint256 veStakingBalance = veStaking.balanceOf(1);

        // finalRewardPerToken should be (7e18 * 1e18) / veStakingBalance, with 1e18 = multiplier needed for division
        // 0.001% error allowed, this should be relatively accurate
        assertApproxEqRel(finalRewardPerToken, (7e36) / veStakingBalance, 1e13, "!rewardPerToken");
    }

    function testEarned() public {
        // add rewards to veStaking
        AIUS.transfer(address(veStaking), 7 ether);
        veStaking.notifyRewardAmount(7 ether);

        votingEscrow.create_lock(100 ether, MAX_LOCK_TIME);

        skip(1 days);

        // 0.1% error allowed due to rounding
        assertApproxEqRel(veStaking.earned(1), 1 ether, 1e15, "!earned");

        skip(6 days);

        // 0.1% error allowed due to rounding
        assertApproxEqRel(veStaking.earned(1), 7 ether, 1e15, "!earned");
    }

    function testGetReward() public {
        votingEscrow.create_lock(100 ether, MAX_LOCK_TIME);

        skip(7 days);
        veStaking.getReward(1);

        // rewards should be transferred out after rewardsDuration has passed (except some rounding error)
        assertApproxEqAbs(AIUS.balanceOf(address(veStaking)), 0, 1e6, "!balanceOf(veStaking)");
    }

    function testRewardRateShouldIncrease() public {
        AIUS.transfer(address(veStaking), 10 ether);
        veStaking.notifyRewardAmount(10 ether);
        uint256 initialRewardRate = veStaking.rewardRate();

        skip(1 days);

        AIUS.transfer(address(veStaking), 10 ether);
        veStaking.notifyRewardAmount(10 ether);
        assertGt(veStaking.rewardRate(), initialRewardRate, "!rewardRate");
    }

    function testGetRewardForDuration() public {
        // add rewards to veStaking
        AIUS.transfer(address(veStaking), 7 ether);
        veStaking.notifyRewardAmount(7 ether);

        // 0.1% error allowed due to rounding
        assertApproxEqRel(veStaking.getRewardForDuration(), 7 ether, 1e15, "!getRewardForDuration");
    }

    function testStake() public {
        vm.prank(alice);
        votingEscrow.create_lock(100 ether, 2 weeks);

        uint256 escrowBalance = votingEscrow.balanceOfNFT(1);
        uint256 stakingBalance = veStaking.balanceOf(1);

        assertEq(escrowBalance, stakingBalance, "escrowBalance != stakingBalance");
    }

    function testIncreaseStake() public {
        vm.prank(alice);
        votingEscrow.create_lock(100 ether, YEAR);

        uint256 escrowBalance = votingEscrow.balanceOfNFT(1);
        uint256 stakingBalance = veStaking.balanceOf(1);

        assertEq(escrowBalance, stakingBalance, "escrowBalance != stakingBalance");

        // fast forward
        skip(4 weeks);
        // get balance of NFT
        escrowBalance = votingEscrow.balanceOfNFT(1);

        // alice decides to increase her locked amount
        vm.prank(alice);
        votingEscrow.increase_amount(1, 50 ether);

        uint256 newEscrowBalance = votingEscrow.balanceOfNFT(1); // get balance of NFT after increase
        uint256 diff = newEscrowBalance - escrowBalance; // get difference
        uint256 newStakingBalance = veStaking.balanceOf(1); // get new staking balance

        // staking balance should have increased by `diff`
        assertEq(newStakingBalance, stakingBalance + diff, "!stakingBalance");
    }

    function testIncreaseLockDuration() public {
        vm.prank(alice);
        votingEscrow.create_lock(100 ether, YEAR);

        uint256 escrowBalance = votingEscrow.balanceOfNFT(1);
        uint256 stakingBalance = veStaking.balanceOf(1);

        assertEq(escrowBalance, stakingBalance, "escrowBalance != stakingBalance");

        // fast forward
        skip(4 weeks);
        // get balance of NFT
        escrowBalance = votingEscrow.balanceOfNFT(1);

        // alice decides to increase her locked amount
        vm.prank(alice);
        votingEscrow.increase_unlock_time(1, MAX_LOCK_TIME);

        uint256 newEscrowBalance = votingEscrow.balanceOfNFT(1); // get balance of NFT after increase
        uint256 newStakingBalance = veStaking.balanceOf(1); // get new staking balance

        // staking balance should be updated
        assertEq(newEscrowBalance, newStakingBalance, "newEscrowBalance != newStakingBalance");
    }

    function testIncreaseLockDurationLong() public {
        // alice locks for max lock duration
        vm.prank(alice);
        votingEscrow.create_lock(100 ether, MAX_LOCK_TIME);

        uint256 escrowBalance = votingEscrow.balanceOfNFT(1);
        uint256 stakingBalance = veStaking.balanceOf(1);

        assertEq(escrowBalance, stakingBalance, "escrowBalance != stakingBalance");

        // fast forward to almost her unlock time
        skip(MAX_LOCK_TIME - 1 weeks);
        // get balance of NFT
        escrowBalance = votingEscrow.balanceOfNFT(1);

        // alice decides to increase her lock duration again to the max amount
        vm.prank(alice);
        votingEscrow.increase_unlock_time(1, MAX_LOCK_TIME);

        uint256 newEscrowBalance = votingEscrow.balanceOfNFT(1); // get balance of NFT after increase
        uint256 newStakingBalance = veStaking.balanceOf(1); // get new staking balance

        // staking balance should be updated
        assertEq(newEscrowBalance, newStakingBalance, "newEscrowBalance != newStakingBalance");
    }

    function testIncreaseLockDurationShort() public {
        // alice locks for max lock duration
        vm.prank(alice);
        votingEscrow.create_lock(100 ether, MAX_LOCK_TIME);

        uint256 escrowBalance = votingEscrow.balanceOfNFT(1);
        uint256 stakingBalance = veStaking.balanceOf(1);

        assertEq(escrowBalance, stakingBalance, "escrowBalance != stakingBalance");

        // fast forward to almost her unlock time
        skip(MAX_LOCK_TIME - 1 weeks);
        // get balance of NFT
        escrowBalance = votingEscrow.balanceOfNFT(1);

        // alice decides to increase her lock duration for 2 weeks
        vm.prank(alice);
        votingEscrow.increase_unlock_time(1, 2 weeks);

        uint256 newEscrowBalance = votingEscrow.balanceOfNFT(1); // get balance of NFT after increase
        uint256 newStakingBalance = veStaking.balanceOf(1); // get new staking balance

        // staking balance should be updated
        assertEq(newEscrowBalance, newStakingBalance, "newEscrowBalance != newStakingBalance");
    }

    function testBalanceWhenMerging() public {
        // alice locks for max lock duration
        vm.prank(alice);
        votingEscrow.create_lock(100 ether, MAX_LOCK_TIME);

        // get balances
        uint256 escrowBalance = votingEscrow.balanceOfNFT(1);
        uint256 stakingBalance = veStaking.balanceOf(1);

        // fast forward
        skip(4 weeks);

        // alice creates another, shorter lock
        vm.prank(alice);
        votingEscrow.create_lock(100 ether, YEAR);

        // get balances
        uint256 escrowBalance2 = votingEscrow.balanceOfNFT(2);
        uint256 stakingBalance2 = veStaking.balanceOf(2);

        // balances should be equal
        assertEq(escrowBalance, stakingBalance, "escrowBalance != stakingBalance");
        assertEq(escrowBalance2, stakingBalance2, "escrowBalance2 != stakingBalance2");

        // fast forward
        skip(4 weeks);

        // get balance of lock #2 before merge
        uint256 escrowBalanceBeforeMerge = votingEscrow.balanceOfNFT(2);

        // alice decides to merge lock #1 into lock #2
        vm.prank(alice);
        votingEscrow.merge(1, 2);

        // get balance of lock #2 after merge
        uint256 escrowBalanceAfterMerge = votingEscrow.balanceOfNFT(2);
        uint256 diff = escrowBalanceAfterMerge - escrowBalanceBeforeMerge;

        // rewards for lock #1 should be claimed
        assertEq(veStaking.rewards(1), 0, "rewards(1) != 0");
        // balance of lock #1 should be 0
        assertEq(veStaking.balanceOf(1), 0, "balanceOf(1) != 0");

        // staking balance should be updated by `diff`
        assertEq(veStaking.balanceOf(2), stakingBalance2 + diff, "!balanceOf(2)");
    }

    function testBalanceWhenMergingShort() public {
        // alice locks for max lock duration
        vm.prank(alice);
        votingEscrow.create_lock(100 ether, MAX_LOCK_TIME);

        // get balances
        uint256 escrowBalance = votingEscrow.balanceOfNFT(1);
        uint256 stakingBalance = veStaking.balanceOf(1);

        // fast forward
        skip(4 weeks);

        // alice creates another, very short lock
        vm.prank(alice);
        votingEscrow.create_lock(100 ether, 2 weeks);

        // get balances
        uint256 escrowBalance2 = votingEscrow.balanceOfNFT(2);
        uint256 stakingBalance2 = veStaking.balanceOf(2);

        // balances should be equal
        assertEq(escrowBalance, stakingBalance, "escrowBalance != stakingBalance");
        assertEq(escrowBalance2, stakingBalance2, "escrowBalance2 != stakingBalance2");

        // fast forward
        skip(1 weeks);

        // get balance of lock #2 before merge
        uint256 escrowBalanceBeforeMerge = votingEscrow.balanceOfNFT(2);

        // alice decides to merge lock #1 into lock #2
        vm.prank(alice);
        votingEscrow.merge(1, 2);

        // get balance of lock #2 after merge
        uint256 escrowBalanceAfterMerge = votingEscrow.balanceOfNFT(2);
        uint256 diff = escrowBalanceAfterMerge - escrowBalanceBeforeMerge;

        // rewards for lock #1 should be claimed
        assertEq(veStaking.rewards(1), 0, "rewards(1) != 0");
        // balance of lock #1 should be 0
        assertEq(veStaking.balanceOf(1), 0, "balanceOf(1) != 0");

        // staking balance should be updated by `diff`
        assertEq(veStaking.balanceOf(2), stakingBalance2 + diff, "!balanceOf(2)");
    }

    function testBalanceWhenMergingEdgeCase() public {
        // alice locks for max lock duration
        vm.prank(alice);
        votingEscrow.create_lock(100 ether, MAX_LOCK_TIME);

        // get balances
        uint256 escrowBalance = votingEscrow.balanceOfNFT(1);
        uint256 stakingBalance = veStaking.balanceOf(1);

        // fast forward
        skip(MAX_LOCK_TIME - 3 weeks);

        // alice creates another lock for max lock duration
        vm.prank(alice);
        votingEscrow.create_lock(100 ether, MAX_LOCK_TIME);

        // get balances
        uint256 escrowBalance2 = votingEscrow.balanceOfNFT(2);
        uint256 stakingBalance2 = veStaking.balanceOf(2);

        // balances should be equal
        assertEq(escrowBalance, stakingBalance, "escrowBalance != stakingBalance");
        assertEq(escrowBalance2, stakingBalance2, "escrowBalance2 != stakingBalance2");

        // fast forward
        skip(1 weeks);

        // get balance of lock #2 before merge
        uint256 escrowBalanceBeforeMerge = votingEscrow.balanceOfNFT(2);

        // alice decides to merge lock #1 into lock #2
        vm.prank(alice);
        votingEscrow.merge(1, 2);

        // get balance of lock #2 after merge
        uint256 escrowBalanceAfterMerge = votingEscrow.balanceOfNFT(2);
        uint256 diff = escrowBalanceAfterMerge - escrowBalanceBeforeMerge;

        // rewards for lock #1 should be claimed
        assertEq(veStaking.rewards(1), 0, "rewards(1) != 0");
        // balance of lock #1 should be 0
        assertEq(veStaking.balanceOf(1), 0, "balanceOf(1) != 0");

        // staking balance should be updated by `diff`
        assertEq(veStaking.balanceOf(2), stakingBalance2 + diff, "!balanceOf(2)");
    }
}
