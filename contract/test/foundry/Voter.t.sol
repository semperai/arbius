// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BaseTest.sol";

/**
 * @notice Isolated tests for Voter.sol, without involvement of engine contract
 * @dev Can be run with `forge test --mc VoterTest`
 */
contract VoterTest is BaseTest {

    // sample model hashes for testing
    bytes32 constant MODEL_1 = keccak256("model1");
    bytes32 constant MODEL_2 = keccak256("model2");
    bytes32 constant MODEL_3 = keccak256("model3");

    function setUp() public {
        // set time
        vm.warp((1704067200 / WEEK) * WEEK); // Thu Dec 28 2023 00:00:00 GMT+0000

        deployContracts();

        // mint and approve AIUS
        mintTestAius();
        approveTestAiusToEscrow();
    }

    function testOnlyOwner() public {
        // create gauge for MODEL_1
        voter.createGauge(MODEL_1);

        assertEq(voter.owner(), address(this));

        // whitelist
        voter.whitelist(MODEL_1);
        assertEq(voter.isWhitelisted(MODEL_1), true);
        // whitelistFail
        vm.prank(alice);
        vm.expectRevert();
        voter.whitelist(MODEL_1);

        // killGauge
        voter.killGauge(MODEL_1);
        assertEq(voter.isAlive(MODEL_1), false);
        // killGaugeFail
        vm.prank(alice);
        vm.expectRevert();
        voter.killGauge(MODEL_1);

        // reviveGauge
        voter.reviveGauge(MODEL_1);
        assertEq(voter.isAlive(MODEL_1), true);
        // reviveGaugeFail
        vm.prank(alice);
        vm.expectRevert();
        voter.reviveGauge(MODEL_1);

        // non owner cannot create whitelisted gauges
        vm.prank(alice);
        vm.expectRevert();
        voter.createGauge(MODEL_2);

        // owner can create non whitelisted gauges
        voter.createGauge(MODEL_2);
    }

    function testCreateGauge() public {
        // create gauge for MODEL_1
        voter.createGauge(MODEL_1);
        assertEq(voter.length(), 1);

        // create gauge for MODEL_2
        voter.createGauge(MODEL_2);
        assertEq(voter.length(), 2);
    }

    function testFailCreateGauge() public {
        // create gauge for MODEL_1
        voter.createGauge(MODEL_1);
        assertEq(voter.length(), 1);

        // create gauge for MODEL_1 again
        voter.createGauge(MODEL_1);
    }

    function testKillGauge() public {
        // create gauge for MODEL_1
        voter.createGauge(MODEL_1);
        assertEq(voter.isAlive(MODEL_1), true);

        voter.killGauge(MODEL_1);
        assertEq(voter.isAlive(MODEL_1), false);

        // kill already killed gauge
        vm.expectRevert(abi.encodePacked("gauge already dead"));
        voter.killGauge(MODEL_1);
    }


    function testReviveGauge() public {
        // create gauge for MODEL_1
        voter.createGauge(MODEL_1);
        assertEq(voter.isAlive(MODEL_1), true);

        voter.killGauge(MODEL_1);
        assertEq(voter.isAlive(MODEL_1), false);

        voter.reviveGauge(MODEL_1);
        assertEq(voter.isAlive(MODEL_1), true);

        // revive already revived gauge
        vm.expectRevert(abi.encodePacked("gauge already alive"));
        voter.reviveGauge(MODEL_1);

        // revive non existing gauge
        vm.expectRevert(abi.encodePacked("not a gauge"));
        voter.reviveGauge(MODEL_2);
    }

    function testWhitelist() public {
        // create gauge for MODEL_1
        voter.createGauge(MODEL_1);
        assertEq(voter.isAlive(MODEL_1), true);

        // not whitelisted yet
        assertEq(voter.isWhitelisted(MODEL_1), false);

        voter.whitelist(MODEL_1);
        assertEq(voter.isWhitelisted(MODEL_1), true);

        // whitelist already whitelisted model
        vm.expectRevert(abi.encodePacked("whitelisted"));
        voter.whitelist(MODEL_1);
    }

    function testGaugeVote() public {
        // create lock for alice
        vm.prank(alice);
        votingEscrow.create_lock(100 ether, 2 * YEAR);
        assertEq(votingEscrow.ownerOf(1), alice);

        // create lock for bob
        vm.prank(bob);
        votingEscrow.create_lock(100 ether, YEAR);
        assertEq(votingEscrow.ownerOf(2), bob);

        // create gauge for MODEL_1 and MODEL_2
        voter.createGauge(MODEL_1);
        voter.createGauge(MODEL_2);

        // vote for MODEL_1 and MODEL_2, with weights 100 and 400 respectively
        bytes32[] memory modelVote = new bytes32[](2);
        uint256[] memory weights = new uint256[](2);
        modelVote[0] = MODEL_1;
        weights[0] = 100;
        modelVote[1] = MODEL_2;
        weights[1] = 400;
        
        // alice votes for MODEL_1 and MODEL_2
        vm.prank(alice);
        voter.vote(1, modelVote, weights);

        // check weights and other values
        uint256 balance1 = votingEscrow.balanceOfNFT(1);
        assertEq(voter.totalWeight(), balance1);
        assertEq(voter.weights(MODEL_2), (balance1 * 4) / 5);
        assertEq(voter.weights(MODEL_1), balance1 / 5);
        assertEq(voter.votes(1, MODEL_2), (balance1 * 4) / 5);
        assertEq(voter.votes(1, MODEL_1), balance1 / 5);
        assertEq(voter.usedWeights(1), balance1);
        assertEq(voter.lastVoted(1), block.timestamp);

        // bob votes for MODEL_1
        modelVote = new bytes32[](1);
        weights = new uint256[](1);
        modelVote[0] = MODEL_1;
        weights[0] = 100;

        vm.prank(bob);
        voter.vote(2, modelVote, weights);

        // check weights and other values
        uint256 balance2 = votingEscrow.balanceOfNFT(2);
        assertEq(voter.totalWeight(), balance1 + balance2);
        assertEq(voter.weights(MODEL_2), (balance1 * 4) / 5);
        assertEq(voter.weights(MODEL_1), (balance1 / 5) + balance2);
        assertEq(voter.votes(2, MODEL_1), balance2);
        assertEq(voter.usedWeights(2), balance2);
        assertEq(voter.lastVoted(2), block.timestamp);
    }

    function testCannotChangeVoteOrResetInSameEpoch() public {
        // create lock for alice
        vm.prank(alice);
        votingEscrow.create_lock(100 ether, 2 * YEAR);
        assertEq(votingEscrow.ownerOf(1), alice);

        // create gauge for MODEL_1 and MODEL_2
        voter.createGauge(MODEL_1);
        voter.createGauge(MODEL_2);

        // vote for MODEL_1 and MODEL_2, with weights 100 and 400 respectively
        bytes32[] memory modelVote = new bytes32[](2);
        uint256[] memory weights = new uint256[](2);
        modelVote[0] = MODEL_1;
        weights[0] = 100;
        modelVote[1] = MODEL_2;
        weights[1] = 400;
        
        // alice votes for MODEL_1 and MODEL_2
        vm.prank(alice);
        voter.vote(1, modelVote, weights);

        // vote again
        vm.expectRevert(abi.encodePacked("only new epoch"));
        voter.vote(1, modelVote, weights);

        // reset should fail as well
        vm.expectRevert(abi.encodePacked("only new epoch"));
        voter.reset(1);
    }

    function testCanChangeVoteOrResetInNextEpoch() public {
        // create lock for alice
        vm.prank(alice);
        votingEscrow.create_lock(100 ether, 2 * YEAR);
        assertEq(votingEscrow.ownerOf(1), alice);

        // create gauge for MODEL_1 and MODEL_2
        voter.createGauge(MODEL_1);
        voter.createGauge(MODEL_2);

        // vote for MODEL_1 and MODEL_2, with weights 100 and 400 respectively
        bytes32[] memory modelVote = new bytes32[](2);
        uint256[] memory weights = new uint256[](2);
        modelVote[0] = MODEL_1;
        weights[0] = 100;
        modelVote[1] = MODEL_2;
        weights[1] = 400;
        
        // alice votes for MODEL_1 and MODEL_2
        vm.prank(alice);
        voter.vote(1, modelVote, weights);

        // warp to next epoch
        skip(1 weeks);

        // vote again
        vm.prank(alice);
        voter.vote(1, modelVote, weights);

        // warp to next epoch
        skip(1 weeks);

        // reset should work as well
        vm.prank(alice);
        voter.reset(1);
    }

    function testReset() public {
        // create lock for alice
        vm.prank(alice);
        votingEscrow.create_lock(100 ether, 2 * YEAR);
        assertEq(votingEscrow.ownerOf(1), alice);

        // create gauge for MODEL_1 and MODEL_2
        voter.createGauge(MODEL_1);
        voter.createGauge(MODEL_2);

        // vote for MODEL_1 and MODEL_2, with weights 100 and 400 respectively
        bytes32[] memory modelVote = new bytes32[](2);
        uint256[] memory weights = new uint256[](2);
        modelVote[0] = MODEL_1;
        weights[0] = 100;
        modelVote[1] = MODEL_2;
        weights[1] = 400;
        
        // alice votes for MODEL_1 and MODEL_2
        vm.prank(alice);
        voter.vote(1, modelVote, weights);

        skip(1 weeks);

        // reset
        vm.prank(alice);
        voter.reset(1);

        // check weights and other values
        assertEq(voter.totalWeight(), 0);
        assertEq(voter.weights(MODEL_2), 0);
        assertEq(voter.weights(MODEL_1), 0);
        assertEq(voter.votes(1, MODEL_2), 0);
        assertEq(voter.votes(1, MODEL_1), 0);
        assertEq(voter.usedWeights(1), 0);
    }

    function testEpochDuration(uint256 warp) public {
        // warp should be less than 100 years
        vm.assume(warp <= 3155760000);

        // call notifyRewardAmount so rewardDuration starts
        veStaking.notifyRewardAmount(0);

        // epochVoteEnd should be identical to periodFinish
        assertEq(voter.epochVoteEnd(), veStaking.periodFinish());

        // fast forward a random amount of time
        skip(warp);

        // epochVoteEnd should still be identical to periodFinish
        veStaking.notifyRewardAmount(0);
        assertEq(voter.epochVoteEnd(), veStaking.periodFinish());
    }
}