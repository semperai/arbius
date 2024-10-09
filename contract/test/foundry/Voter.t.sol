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

        // check weights
        uint256 balance = votingEscrow.balanceOfNFT(1);
        assertEq(voter.totalWeight(), balance);
        assertEq(voter.weights(MODEL_2), (balance * 4) / 5);
        assertEq(voter.weights(MODEL_1), balance / 5);
    }
}
