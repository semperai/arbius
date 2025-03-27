// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "forge-std/console2.sol";

import "./utils/MockERC20.sol";

import {StakingRewards} from "contracts/StakingRewards.sol";

contract StakingRewardsTest is Test {
    // lpToken (LP token)
    MockERC20 public lpToken;
    // rewardsToken
    MockERC20 public AIUS;

    StakingRewards public stakingRewards;

    // test addresses
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address charlie = makeAddr("charlie");
    address dave = makeAddr("dave");

    function setUp() public {
        AIUS = new MockERC20("Arbius", "AIUS");

        lpToken = new MockERC20("UNI-V2", "ERC-20: Uniswap V2");
        stakingRewards = new StakingRewards(address(AIUS), address(lpToken));

        // mint and approve lpToken
        lpToken.mint(address(this), 1000 ether);
        lpToken.approve(address(stakingRewards), 1000 ether);

        // mint AIUS
        AIUS.mint(address(this), 1000 ether);
    }

    /* settings and restricted functions */
    function testConstructorAndSettings() public {
        assertEq(stakingRewards.owner(), address(this), "owner != this");
        assertEq(address(stakingRewards.rewardsToken()), address(AIUS), "rewardsToken != AIUS");
        assertEq(address(stakingRewards.stakingToken()), address(lpToken), "lpToken != lpToken");
        assertEq(stakingRewards.rewardsDuration(), 1 weeks, "rewardsDuration != 1 weeks");
    }

    function testOnlyOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        stakingRewards.setRewardsDuration(2 weeks);

        vm.prank(alice);
        vm.expectRevert();
        stakingRewards.recoverERC20(address(AIUS), 10 ether);
    }

    function testRecoverERC20() public {
        lpToken.transfer(address(stakingRewards), 100 ether);
        AIUS.transfer(address(stakingRewards), 100 ether);

        // should revert, cannot withdraw lpToken
        vm.expectRevert(abi.encodePacked("Cannot withdraw the staking token"));
        stakingRewards.recoverERC20(address(lpToken), 100 ether);

        // should work, AIUS is withdrawable by owner
        uint256 balanceBefore = AIUS.balanceOf(address(this));
        stakingRewards.recoverERC20(address(AIUS), 100 ether);
        assertEq(AIUS.balanceOf(address(this)), balanceBefore + 100 ether, "!balanceOf(this)");
    }

    function testSetRewardsDuration() public {
        // call notifyRewardAmount to start rewardsDuration
        stakingRewards.notifyRewardAmount(0);
        assertEq(stakingRewards.rewardsDuration(), 1 weeks, "!rewardsDuration");

        uint256 initialPeriodFinish = stakingRewards.periodFinish();
        assertEq(initialPeriodFinish, block.timestamp + 1 weeks, "!periodFinish");

        // fast forward to end of rewards period
        vm.warp(initialPeriodFinish + 1);

        // set rewardsDuration to 2 weeks
        stakingRewards.setRewardsDuration(2 weeks);

        // rewardsDuration should be updated
        assertEq(stakingRewards.rewardsDuration(), 2 weeks, "!rewardsDuration");

        // call notifyRewardAmount to start new rewards period
        stakingRewards.notifyRewardAmount(0);

        // periodFinish should be updated to `initialPeriodFinish + 2 weeks`
        assertEq(stakingRewards.periodFinish(), initialPeriodFinish + 2 weeks + 1, "!periodFinish");
    }

    function testSetRewardsDurationBeforePeriodFinish() public {
        // call notifyRewardAmount to start rewardsDuration
        stakingRewards.notifyRewardAmount(0);
        assertEq(stakingRewards.rewardsDuration(), 1 weeks, "!rewardsDuration");

        uint256 initialPeriodFinish = stakingRewards.periodFinish();
        assertEq(initialPeriodFinish, block.timestamp + 1 weeks, "!periodFinish");

        // should fail, previous rewards period must be complete before changing the duration
        vm.expectRevert();
        stakingRewards.setRewardsDuration(2 weeks);
    }

    /* reward logic */

    function testLastTimeRewardApplicable() public {
        // call notifyRewardAmount so rewardDuration starts
        stakingRewards.notifyRewardAmount(0);

        assertEq(stakingRewards.lastTimeRewardApplicable(), block.timestamp, "!lastTimeRewardApplicable");

        skip(8 days);

        assertEq(stakingRewards.lastTimeRewardApplicable(), stakingRewards.periodFinish(), "!lastTimeRewardApplicable");
    }

    function testPeriodFinish() public {
        // call notifyRewardAmount so rewardDuration starts
        stakingRewards.notifyRewardAmount(0);

        uint256 initialPeriodFinish = stakingRewards.periodFinish();
        assertEq(initialPeriodFinish, block.timestamp + 1 weeks);

        skip(3 days);

        // call notifyRewardAmount again
        stakingRewards.notifyRewardAmount(0);

        // periodFinish should have been updated to 7 days in the future
        assertEq(stakingRewards.periodFinish(), block.timestamp + 1 weeks);
    }

    function testFuzz_NotifyRewardAmount(uint256 reward) public {
        // bind reward to be between 1 and 499 AIUS
        reward = bound(reward, 1 ether, 499 ether);

        // transfering exact reward should work
        AIUS.transfer(address(stakingRewards), reward);
        stakingRewards.notifyRewardAmount(reward);

        // transfering too much reward should work
        AIUS.transfer(address(stakingRewards), reward);
        stakingRewards.notifyRewardAmount(reward - 0.001 ether);
    }

    function testFuzz_RevertNotifyRewardAmount(uint256 reward) public {
        // bind reward to be between 1 and 1000 AIUS
        reward = bound(reward, 1 ether, 1000 ether);

        // transfering too little reward should revert
        AIUS.transfer(address(stakingRewards), reward - 0.001 ether);
        vm.expectRevert("Provided reward too high");
        stakingRewards.notifyRewardAmount(reward);
    }

    function testRewardPerToken() public {
        // call notifyRewardAmount so rewardDuration starts
        stakingRewards.notifyRewardAmount(0);

        // rewardPerToken should be 0 before any staking
        assertEq(stakingRewards.rewardPerToken(), 0, "!rewardPerToken");

        // stake 100 AIUS
        stakingRewards.stake(100 ether);
        // send rewards to stakingRewards
        AIUS.transfer(address(stakingRewards), 10 ether);
        stakingRewards.notifyRewardAmount(10 ether);

        // fast forward 3 days
        skip(3 days);

        // rewardPerToken should be > 0
        assertGt(stakingRewards.rewardPerToken(), 0, "!rewardPerToken");
    }

    function testRewardsTokenBalanceShouldRollOver() public {
        // stake 100 AIUS
        stakingRewards.stake(100 ether);
        // send rewards to stakingRewards
        AIUS.transfer(address(stakingRewards), 10 ether);
        stakingRewards.notifyRewardAmount(10 ether);

        // fast forward 7 days
        skip(7 days);

        uint256 earnedFirst = stakingRewards.earned(address(this));

        // send rewards to stakingRewards
        AIUS.transfer(address(stakingRewards), 10 ether);
        stakingRewards.notifyRewardAmount(10 ether);

        skip(7 days);

        uint256 earnedSecond = stakingRewards.earned(address(this));

        assertEq(earnedFirst + earnedFirst, earnedSecond, "!earned");
    }

    function testGetReward() public {
        // send rewards to stakingRewards
        AIUS.transfer(address(stakingRewards), 10 ether);
        stakingRewards.notifyRewardAmount(10 ether);

        stakingRewards.stake(100 ether);

        skip(7 days);
        stakingRewards.getReward();

        // rewards should be transferred out after rewardsDuration has passed (except some rounding error)
        assertApproxEqAbs(AIUS.balanceOf(address(stakingRewards)), 0, 1e6, "!balanceOf(stakingRewards)");
    }

    function testRewardRateShouldIncreaseBeforeDurationEnds() public {
        stakingRewards.notifyRewardAmount(0);
        assertEq(stakingRewards.rewardRate(), 0, "!rewardRate");

        // send rewards to stakingRewards
        AIUS.transfer(address(stakingRewards), 10 ether);
        stakingRewards.notifyRewardAmount(10 ether);
        uint256 initialRewardRate = stakingRewards.rewardRate();
        assertEq(initialRewardRate, 10 ether / stakingRewards.rewardsDuration(), "!rewardRate");

        skip(3 days);

        // send more rewards to stakingRewards
        AIUS.transfer(address(stakingRewards), 10 ether);
        stakingRewards.notifyRewardAmount(10 ether);

        // rewardRate should have increased
        assertGt(stakingRewards.rewardRate(), initialRewardRate, "!rewardRate");
    }

    function testGetRewardForDuration() public {
        // send rewards to stakingRewards (1 AIUS per day)
        AIUS.transfer(address(stakingRewards), 7 ether);
        stakingRewards.notifyRewardAmount(7 ether);

        // getRewardForDuration should return the reward rate * rewardsDuration (7 AIUS)
        // 0.1% error allowed due to rounding
        assertApproxEqRel(stakingRewards.getRewardForDuration(), 7 ether, 1e15, "!getRewardForDuration");

        // fast forward 3 days
        skip(3 days);

        // send rewards to stakingRewards
        AIUS.transfer(address(stakingRewards), 10 ether);
        stakingRewards.notifyRewardAmount(10 ether);

        // getRewardForDuration should return remaining reward from before (4 AIUS) + new reward (10 AIUS)
        // 0.1% error allowed due to rounding
        assertApproxEqRel(stakingRewards.getRewardForDuration(), 14 ether, 1e15, "!getRewardForDuration");

        // fast forward 7 days
        skip(7 days);

        // getRewardForDuration should return 0 after rewardsDuration has passed
        stakingRewards.notifyRewardAmount(0);
        assertEq(stakingRewards.getRewardForDuration(), 0, "!getRewardForDuration");
    }

    /* user related tests */

    function testFuzz_Stake(uint256 amount) public {
        // bind amount to be between 1 and 1000 AIUS
        amount = bound(amount, 1 ether, 1000 ether);

        // stake should work
        stakingRewards.stake(amount);

        assertEq(lpToken.balanceOf(address(stakingRewards)), amount, "!balanceOf(stakingRewards)");
        assertEq(stakingRewards.totalSupply(), amount, "!totalSupply");
        assertEq(stakingRewards.balanceOf(address(this)), amount, "!balanceOf(this)");
    }

    function testFuzz_Withdraw(uint256 amount) public {
        // bind amount to be between 1 and 1000 AIUS
        amount = bound(amount, 1 ether, 1000 ether);

        // balance before staking
        uint256 balanceBefore = lpToken.balanceOf(address(this));

        // stake should work
        stakingRewards.stake(amount);

        assertEq(lpToken.balanceOf(address(stakingRewards)), amount, "!balanceOf(stakingRewards)");
        assertEq(stakingRewards.totalSupply(), amount, "!totalSupply");
        assertEq(stakingRewards.balanceOf(address(this)), amount, "!balanceOf(this)");

        // withdraw should work
        stakingRewards.withdraw(amount);

        assertEq(lpToken.balanceOf(address(stakingRewards)), 0, "!balanceOf(stakingRewards)");
        assertEq(stakingRewards.totalSupply(), 0, "!totalSupply");
        assertEq(stakingRewards.balanceOf(address(this)), 0, "!balanceOf(this)");

        // balance after withdrawing should be the same as before
        assertEq(lpToken.balanceOf(address(this)), balanceBefore, "!balanceOf(this)");
    }

    function testFuzz_Exit(uint256 amount) public {
        // bind amount to be between 1 and 1000 AIUS
        amount = bound(amount, 1 ether, 1000 ether);

        // balance before staking
        uint256 balanceBefore = lpToken.balanceOf(address(this));

        // stake should work
        stakingRewards.stake(amount);

        assertEq(lpToken.balanceOf(address(stakingRewards)), amount, "!balanceOf(stakingRewards)");
        assertEq(stakingRewards.totalSupply(), amount, "!totalSupply");
        assertEq(stakingRewards.balanceOf(address(this)), amount, "!balanceOf(this)");

        // withdraw should work
        stakingRewards.exit();

        assertEq(lpToken.balanceOf(address(stakingRewards)), 0, "!balanceOf(stakingRewards)");
        assertEq(stakingRewards.totalSupply(), 0, "!totalSupply");
        assertEq(stakingRewards.balanceOf(address(this)), 0, "!balanceOf(this)");

        // balance after withdrawing should be the same as before
        assertEq(lpToken.balanceOf(address(this)), balanceBefore, "!balanceOf(this)");
    }
}
