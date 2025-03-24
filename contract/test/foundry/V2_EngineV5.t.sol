// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console2.sol";

import "contracts/BaseTokenV1.sol";
import "contracts/V2_EngineV5.sol";
import {getIPFSCIDMemory} from "contracts/libraries/IPFS.sol";

import "contracts/ve/VotingEscrow.sol";
import "contracts/ve/VeNFTRender.sol";
import "contracts/ve/VeStaking.sol";
import "contracts/ve/Voter.sol";

/**
 * @notice Tests for V2_EngineV5.sol
 * @dev Steps to run this test contract:
 * 1. Deploy local hardhat node with `npx hardhat node`
 * 2. Then, run hardhat setup on local node with `npx hardhat test test/enginev5.test.ts --network localhost`
 * 3. Run Foundry tests with `npm run forge-test`, or `npm run forge-test-v` for verbose output
 * 3.1 Alternatively, `forge test --fork-url http://localhost:8545 --fork-block-number 25 --mc EngineV5Test`
 */
contract EngineV5Test is Test {
    VotingEscrow public votingEscrow;
    VeStaking public veStaking;
    VeNFTRender public veNFTRender;
    Voter public voter;

    uint256 public constant YEAR = 365 days;

    bytes TESTCID =
        "0x1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8";
    bytes TESTBUF = "0x746573740a";

    // default test mnemonic used in hardhat tests
    string public constant mnemonic =
        "test test test test test test test test test test test junk";

    address deployer = vm.addr(vm.deriveKey(mnemonic, 0));
    address user1 = vm.addr(vm.deriveKey(mnemonic, 1));
    address user2 = vm.addr(vm.deriveKey(mnemonic, 2));
    address validator1 = vm.addr(vm.deriveKey(mnemonic, 3));
    address validator2 = vm.addr(vm.deriveKey(mnemonic, 4));
    address validator3 = vm.addr(vm.deriveKey(mnemonic, 5));
    address validator4 = vm.addr(vm.deriveKey(mnemonic, 6));
    address treasury = vm.addr(vm.deriveKey(mnemonic, 7));
    address modelOwner1 = vm.addr(vm.deriveKey(mnemonic, 8));
    address modelOwner2 = vm.addr(vm.deriveKey(mnemonic, 9));
    address modelOwner3 = vm.addr(vm.deriveKey(mnemonic, 10));

    // contracts
    V2_EngineV5 public engine =
        V2_EngineV5(0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9);
    BaseTokenV1 public baseToken =
        BaseTokenV1(0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0);

    // models
    bytes32 MODEL_1;
    bytes32 MODEL_2;
    bytes32 MODEL_3;

    function setUp() public {
        // initial set up is done in hardhat test file: test/enginev5.test.ts
        vm.startPrank(deployer);

        /* ve specific setup */
        veNFTRender = new VeNFTRender();
        votingEscrow = new VotingEscrow(
            address(baseToken),
            address(veNFTRender),
            address(0)
        );
        veStaking = new VeStaking(address(baseToken), address(votingEscrow));
        veStaking.setEngine(address(engine));

        // set veStaking in escrow
        votingEscrow.setVeStaking(address(veStaking));

        // deploy Voter contract
        voter = new Voter(address(votingEscrow));
        // set voter in escrow
        votingEscrow.setVoter(address(voter));

        /* v5 specific setup */
        engine.setVeStaking(address(veStaking));
        engine.setVoter(address(voter));
        
        vm.stopPrank();

        // set up models
        MODEL_1 = deployBootstrapModel(modelOwner1);
        MODEL_2 = deployBootstrapModel(modelOwner2);
        MODEL_3 = deployBootstrapModel(modelOwner3);

        // create gauges
        vm.startPrank(deployer);
        voter.createGauge(MODEL_1);
        voter.createGauge(MODEL_2);
        voter.createGauge(MODEL_3);
        vm.stopPrank();

        // set up validators
        vm.prank(validator1);
        engine.validatorDeposit(validator1, 100 ether);
        vm.prank(validator2);
        engine.validatorDeposit(validator2, 100 ether);
        vm.prank(validator3);
        engine.validatorDeposit(validator3, 100 ether);
        vm.prank(validator4);
        engine.validatorDeposit(validator4, 100 ether);

        // label test addresses and contracts
        vm.label(deployer, "deployer");
        vm.label(user1, "user1");
        vm.label(user2, "user2");
        vm.label(validator1, "validator1");
        vm.label(validator2, "validator2");
        vm.label(validator3, "validator3");
        vm.label(validator4, "validator4");
        vm.label(treasury, "treasury");
        vm.label(modelOwner1, "modelOwner1");
        vm.label(modelOwner2, "modelOwner2");
        vm.label(modelOwner3, "modelOwner3");

        vm.label(address(engine), "EngineV5");
        vm.label(address(baseToken), "BaseTokenV1");
        vm.label(address(votingEscrow), "VotingEscrow");
        vm.label(address(veStaking), "VeStaking");
        vm.label(address(veNFTRender), "VeNFTRender");
        vm.label(address(voter), "Voter");

        vm.label(address(this), "EngineV5Test");

        _createTestLocks();
        _voteForGauges();
    }

    function testRewardDistribution() public {
        // get gauge multipliers
        uint256 gaugeMultiplierModel1 = voter.getGaugeMultiplier(MODEL_1);
        uint256 gaugeMultiplierModel2 = voter.getGaugeMultiplier(MODEL_2);
        uint256 gaugeMultiplierModel3 = voter.getGaugeMultiplier(MODEL_3);
        assertEq(
            gaugeMultiplierModel1 +
                gaugeMultiplierModel2 +
                gaugeMultiplierModel3,
            1e18
        );

        // simulate usage bc the first few reward emissions have high fluctuations
        _simulateUsage();

        // get veRewards up until now
        uint256 veRewards = engine.veRewards();

        bytes32 taskid1 = deployBootstrapTask(MODEL_1, deployer, 0);
        bytes32 taskid2 = deployBootstrapTask(MODEL_2, user1, 0);
        bytes32 taskid3 = deployBootstrapTask(MODEL_3, user2, 0);

        bytes32 commitment1 = engine.generateCommitment(
            validator1,
            taskid1,
            TESTCID
        );
        bytes32 commitment2 = engine.generateCommitment(
            validator2,
            taskid2,
            TESTCID
        );
        bytes32 commitment3 = engine.generateCommitment(
            validator3,
            taskid3,
            TESTCID
        );

        vm.prank(validator1);
        engine.signalCommitment(commitment1);
        vm.prank(validator2);
        engine.signalCommitment(commitment2);
        vm.prank(validator3);
        engine.signalCommitment(commitment3);

        // skip 12s and 1 block
        skip(12);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid1, TESTCID);
        vm.prank(validator2);
        engine.submitSolution(taskid2, TESTCID);
        vm.prank(validator3);
        engine.submitSolution(taskid3, TESTCID);

        /* claim */

        // fast forward `minClaimSolutionTime`
        skip(engine.minClaimSolutionTime() + 1);
        vm.roll(block.number + 1);

        // reward * modelRate (1e18) * gaugeMultiplier / (2 * 1e18 * 1e18)
        uint256 reward = engine.getReward();
        uint256 total = (reward * 1e18 * gaugeMultiplierModel1) /
            (2 * 1e18 * 1e18);

        uint256 treasuryRewardPercentage = engine.treasuryRewardPercentage();
        uint256 taskOwnerRewardPercentage = engine.taskOwnerRewardPercentage();

        uint256 taskOwnerBalanceBefore = baseToken.balanceOf(deployer);

        uint256 validatorBalanceBefore1 = baseToken.balanceOf(validator1);
        uint256 validatorBalanceBefore2 = baseToken.balanceOf(validator2);
        uint256 validatorBalanceBefore3 = baseToken.balanceOf(validator3);

        uint256 treasuryBalanceBefore = baseToken.balanceOf(treasury);

        vm.prank(validator1);
        engine.claimSolution(taskid1);

        uint256 treasuryReward = total -
            (total * (1e18 - treasuryRewardPercentage)) /
            1e18;
        assertEq(
            baseToken.balanceOf(treasury) - treasuryBalanceBefore,
            treasuryReward
        );

        uint256 taskOwnerReward = total -
            (total * (1e18 - taskOwnerRewardPercentage)) /
            1e18;

        assertEq(
            baseToken.balanceOf(deployer) - taskOwnerBalanceBefore,
            taskOwnerReward
        );

        assertEq(
            baseToken.balanceOf(validator1) - validatorBalanceBefore1,
            total - treasuryReward - taskOwnerReward
        );

        // get new reward after first is claimed
        reward = engine.getReward();
        uint256 total2 = (reward * 1e18 * gaugeMultiplierModel2) /
            (2 * 1e18 * 1e18);

        vm.prank(validator2);
        engine.claimSolution(taskid2);

        reward = engine.getReward();
        uint256 total3 = (reward * 1e18 * gaugeMultiplierModel3) /
            (2 * 1e18 * 1e18);

        vm.prank(validator3);
        engine.claimSolution(taskid3);

        // other half of emissions should be distributed to veAIUS holders
        assertEq(engine.veRewards() - veRewards, (total + total2 + total3));

        // validator1 should have double the rewards of validator2/validator3
        assertApproxEqRel(
            (baseToken.balanceOf(validator1) - validatorBalanceBefore1) / 2,
            (baseToken.balanceOf(validator2) - validatorBalanceBefore2),
            1e15 // 0.001% tolerance
        );
        // validator2 and validator3 should have the same rewards
        assertApproxEqRel(
            baseToken.balanceOf(validator2) - validatorBalanceBefore2,
            baseToken.balanceOf(validator3) - validatorBalanceBefore3,
            1e15 // 0.001% tolerance
        );
    }

    function testRewardDistNoGauge() public {
        // create model with no gauge
        bytes32 MODEL_4 = deployBootstrapModel(deployer);

        // get veRewards up until now
        uint256 veRewards = engine.veRewards();

        bytes32 taskid = deployBootstrapTask(MODEL_4, user1, 0);

        bytes32 commitment = engine.generateCommitment(
            validator1,
            taskid,
            TESTCID
        );

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        // skip 12s and 1 block
        skip(12);
        vm.roll(block.number + 1);

        (uint256 staked, , ) = engine.validators(validator1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        (uint256 stakedAfter, , ) = engine.validators(validator1);
        // solution stake amount should be reserved
        uint256 solutionsStakeAmount = engine.solutionsStakeAmount();
        assertEq(staked - stakedAfter, solutionsStakeAmount);

        /* claim */

        // fast forward `minClaimSolutionTime`
        skip(engine.minClaimSolutionTime() + 1);
        vm.roll(block.number + 1);

        uint256 taskOwnerBalanceBefore = baseToken.balanceOf(deployer);
        uint256 validatorBalanceBefore = baseToken.balanceOf(validator1);
        uint256 treasuryBalanceBefore = baseToken.balanceOf(treasury);

        vm.prank(validator1);
        engine.claimSolution(taskid);

        assertEq(baseToken.balanceOf(treasury) - treasuryBalanceBefore, 0);
        assertEq(baseToken.balanceOf(deployer) - taskOwnerBalanceBefore, 0);
        assertEq(baseToken.balanceOf(validator1) - validatorBalanceBefore, 0);

        // no rewards should be distributed
        assertEq(engine.veRewards() - veRewards, 0);
        (uint256 stakedFinal, , ) = engine.validators(validator1);
        // solution stake amount should be released
        assertEq(stakedFinal - staked, 0);
    }

    function testFeeDistribution() public {
        // transfer some AIUS from deployer to user1 for fees
        vm.prank(deployer);
        baseToken.transfer(user1, 100e18);

        // deploy model with a fee of 1 AIUS
        bytes32 modelid = deployBootstrapFeeModel(modelOwner1);

        // get totalHeld before submitting / claiming task
        uint256 totalHeldBefore = engine.totalHeld();

        /* submit task, set fee to 2 AIUS (1 AIUS to model owner, rest as tip to treasury&validator) */
        bytes32 taskid = deployBootstrapTask(modelid, user1, 2e18);

        /* signal commitment and submit solution */
        bytes32 commitment = engine.generateCommitment(
            validator1,
            taskid,
            TESTCID
        );

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        // commitment must be in the past -> skip 12s and 1 block
        skip(12);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        /* claim rewards */

        uint256 remainingFee = 1 ether; // taskfee - modelfee

        // get treasuryFee
        uint256 solutionFeePercentage = engine.solutionFeePercentage();
        uint256 treasuryFee = remainingFee -
            ((remainingFee * (1e18 - solutionFeePercentage)) / 1e18);

        // get validatorFee
        uint256 validatorFee = remainingFee - treasuryFee;

        // get balance before claiming
        uint256 modelOwnerBalanceBefore = baseToken.balanceOf(modelOwner1);
        uint256 treasuryBalanceBefore = baseToken.balanceOf(treasury);

        // fast forward `minClaimSolutionTime` and `minClaimSolutionTime/12` blocks
        uint256 minClaimSolutionTime = engine.minClaimSolutionTime();
        skip(minClaimSolutionTime + 1);
        vm.roll(block.number + minClaimSolutionTime / 12);

        // expect transfer of `validatorFee` to validator1
        vm.expectEmit();
        emit IERC20Upgradeable.Transfer(
            address(engine),
            validator1,
            validatorFee
        );
        vm.prank(validator1);
        engine.claimSolution(taskid);

        // get balance after claiming
        uint256 modelOwnerBalanceAfter = baseToken.balanceOf(modelOwner1);
        uint256 treasuryBalanceAfter = baseToken.balanceOf(treasury);

        // modelOwner should receive 0.05 ether
        assertEq(modelOwnerBalanceAfter - modelOwnerBalanceBefore, 0 ether);
        // treasury should receive 0.95 ether
        assertEq(treasuryBalanceAfter - treasuryBalanceBefore, 1 ether);


        // get totalHeld after claiming
        uint256 totalHeldAfter = engine.totalHeld();
        assertEq(totalHeldAfter, totalHeldBefore + treasuryFee);
    }

    function testSimulateUsage() public {
        _simulateUsage();
    }

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                       HELPER FUNCS                         */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    // early txs need 0 model fees and 0 task fees so they can mine tokens
    // later tests will cover fees
    function deployBootstrapModel(
        address _addr
    ) public returns (bytes32 modelid) {
        uint256 fee = 0;

        vm.prank(_addr);
        modelid = engine.registerModel(_addr, fee, TESTBUF);

        // set model.rate so we can test reward emissions
        vm.prank(deployer);
        engine.setSolutionMineableRate(modelid, 1e18);
    }

    function deployBootstrapFeeModel(
        address _addr
    ) public returns (bytes32 modelid) {
        uint256 fee = 1e18; // 1 AIUS

        vm.prank(_addr);
        modelid = engine.registerModel(_addr, fee, TESTBUF);

        // set model.rate so we can test reward emissions
        vm.prank(deployer);
        engine.setSolutionMineableRate(modelid, 1e18);
    }

    function deployBootstrapTask(
        bytes32 modelid,
        address submitter,
        uint256 feeEth
    ) public returns (bytes32 taskid) {
        if (submitter == address(0)) {
            submitter = user1;
        }

        // if fee != 0, set approval of fee Amount
        if (feeEth != 0) {
            vm.prank(submitter);
            baseToken.approve(address(engine), feeEth);
        }

        (
            uint8 version,
            bytes32 model,
            uint256 fee,
            bytes memory input,
            bytes memory cid
        ) = _bootstrapTaskParams(modelid, feeEth);

        Task memory t = Task(
            model,
            fee,
            submitter,
            uint64(block.timestamp),
            version,
            cid
        );

        bytes32 prevhash = engine.prevhash();
        taskid = engine.hashTask(t, submitter, prevhash);

        vm.prank(submitter);
        engine.submitTask(version, submitter, model, fee, input);
    }

    function _bootstrapTaskParams(
        bytes32 modelid,
        uint256 feeEth
    )
        internal
        view
        returns (
            uint8 version,
            bytes32 model,
            uint256 fee,
            bytes memory input,
            bytes memory cid
        )
    {
        version = 0;
        model = modelid;
        fee = feeEth;
        input = TESTBUF; // normally this would be json but it doesnt matter for testing
        cid = getIPFSCIDMemory(TESTBUF);
    }

    function _createTestLocks() internal {
        // transfer some AIUS
        vm.prank(deployer);
        baseToken.transfer(user1, 100 ether);
        vm.prank(deployer);
        baseToken.transfer(user2, 100 ether);

        // approve AIUS to votingEscrow
        vm.prank(user1);
        baseToken.approve(address(votingEscrow), 100 ether);
        vm.prank(user2);
        baseToken.approve(address(votingEscrow), 100 ether);

        // create lock for user1
        vm.prank(user1);
        votingEscrow.create_lock(100 ether, 2 * YEAR);
        assertEq(votingEscrow.ownerOf(1), user1);

        // create lock for user2
        vm.prank(user2);
        votingEscrow.create_lock(100 ether, 2 * YEAR);
        assertEq(votingEscrow.ownerOf(2), user2);
    }

    function _voteForGauges() internal {
        // user1 votes for MODEL_2 and MODEL_3
        bytes32[] memory modelVote = new bytes32[](2);
        uint256[] memory weights = new uint256[](2);
        modelVote[0] = MODEL_2;
        weights[0] = 50;
        modelVote[1] = MODEL_3;
        weights[1] = 50;

        vm.prank(user1);
        voter.vote(1, modelVote, weights);

        // user2 votes for MODEL_1
        modelVote = new bytes32[](1);
        weights = new uint256[](1);
        modelVote[0] = MODEL_1;
        weights[0] = 100;

        vm.prank(user2);
        voter.vote(2, modelVote, weights);

        // MODEL_1 receives 50% of total emissions, MODEL_2 and MODEL_3 25% each
        assertEq(voter.getGaugeMultiplier(MODEL_1), 50e16);
        assertEq(voter.getGaugeMultiplier(MODEL_2), 25e16);
        assertEq(voter.getGaugeMultiplier(MODEL_3), 25e16);
    }

    function _simulateUsage() internal {
        // call notifyRewardAmount so rewardDuration starts
        vm.prank(deployer);
        veStaking.notifyRewardAmount(0);

        uint256 minClaimSolutionTime = engine.minClaimSolutionTime();
        uint256 veRewardsSum;

        // submit task and claim solution every hour for one week
        for (uint256 i = 0; i < 168; i++) {
            /* submit task */
            bytes32 taskid = deployBootstrapTask(MODEL_1, user1, 0);
            uint256 gaugeMultiplier = voter.getGaugeMultiplier(MODEL_1);

            /* signal commitment and submit solution */
            bytes32 commitment = engine.generateCommitment(
                validator1,
                taskid,
                TESTCID
            );

            vm.prank(validator1);
            engine.signalCommitment(commitment);

            // commitment must be in the past -> skip 12s and 1 block
            skip(12);
            vm.roll(block.number + 1);

            vm.prank(validator1);
            engine.submitSolution(taskid, TESTCID);

            /* claim rewards */

            // fast forward `minClaimSolutionTime` and `minClaimSolutionTime/12` blocks
            skip(minClaimSolutionTime + 1);
            vm.roll(block.number + minClaimSolutionTime / 12);

            uint256 reward = engine.getReward();
            //console2.log("reward", reward);

            if (block.timestamp > veStaking.periodFinish()) {
                // notifyRewardAmount should be called
                vm.prank(validator1);
                engine.claimSolution(taskid);

                //console2.log("notifyRewardAmount called", engine.veRewards());

                // next period finish should be 1 week from now +- 1 hour
                uint256 nextPeriodFinish = veStaking.periodFinish();
                assertEq(
                    nextPeriodFinish,
                    block.timestamp + 1 weeks - (block.timestamp % 1 weeks)
                );

                // veRewards should be distributed, set to current reward
                veRewardsSum = (reward * gaugeMultiplier) / (2 * 1e18);
            } else {
                vm.prank(validator1);
                engine.claimSolution(taskid);

                veRewardsSum += (reward * gaugeMultiplier) / (2 * 1e18);
            }

            assertEq(engine.veRewards(), veRewardsSum);

            //uint256 psuedoTotalSupply = engine.getPsuedoTotalSupply();
            //console2.log("psuedoTotalSupply", psuedoTotalSupply);
            //console2.log("veRewardsSum", veRewardsSum);

            // fast forward 1 hour
            skip(3600);
            vm.roll(block.number + 1);
        }
    }
}
