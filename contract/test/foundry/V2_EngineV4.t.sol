// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console2.sol";

import "contracts/BaseTokenV1.sol";
import "contracts/V2_EngineV4.sol";
import {getIPFSCIDMemory} from "contracts/libraries/IPFS.sol";

import "contracts/VotingEscrow.sol";
import "contracts/VeNFTRender.sol";
import "contracts/VeStaking.sol";

/**
 * @notice Steps to test EngineV4:
 * 1. Deploy local hardhat node with `npx hardhat node`
 * 2. Then, run hardhat setup on local node with `npx hardhat test test/enginev4.test.ts --network localhost`
 * 3. Run Foundry tests with `npm run forge-test`, or `npm run forge-test-v` for verbose output
 * 3.1 Alternatively, `forge test --fork-url http://localhost:8545 --fork-block-number 18 --mc EngineV4Test`
 */
contract EngineV4Test is Test {
    VotingEscrow public votingEscrow;
    VeStaking public veStaking;
    VeNFTRender public veNFTRender;

    bytes TESTCID = "0x1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8";
    bytes TESTBUF = "0x746573740a";

    // default test mnemonic used in hardhat tests
    string public constant mnemonic = "test test test test test test test test test test test junk";

    address deployer = vm.addr(vm.deriveKey(mnemonic, 0));
    address user1 = vm.addr(vm.deriveKey(mnemonic, 1));
    address user2 = vm.addr(vm.deriveKey(mnemonic, 2));
    address validator1 = vm.addr(vm.deriveKey(mnemonic, 3));
    address validator2 = vm.addr(vm.deriveKey(mnemonic, 4));
    address validator3 = vm.addr(vm.deriveKey(mnemonic, 5));
    address validator4 = vm.addr(vm.deriveKey(mnemonic, 6));
    address treasury = vm.addr(vm.deriveKey(mnemonic, 7));
    address modelOwner = vm.addr(vm.deriveKey(mnemonic, 8));
    address newowner = vm.addr(vm.deriveKey(mnemonic, 9));

    // contracts
    V2_EngineV4 public engine = V2_EngineV4(0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9);
    BaseTokenV1 public baseToken = BaseTokenV1(0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0);

    function setUp() public {
        // set up is done in hardhat test file: test/enginev4.test.ts

        /* ve specific setup */
        veNFTRender = new VeNFTRender();
        votingEscrow = new VotingEscrow(address(baseToken), address(veNFTRender), address(0));
        veStaking = new VeStaking(address(baseToken), address(votingEscrow));

        // set veStaking in escrow
        votingEscrow.setVeStaking(address(veStaking));

        /* v4 specific setup */
        vm.prank(deployer);
        engine.setVeStaking(address(veStaking));
    }

    // early txs need 0 model fees and 0 task fees so they can mine tokens
    // later tests will cover fees
    function deployBootstrapModel() public returns (bytes32 modelid) {
        address addr = user1;
        uint256 fee = 0;

        vm.prank(addr);
        modelid = engine.registerModel(addr, fee, TESTBUF);

        // set model.rate so we can test reward emissions
        vm.prank(deployer);
        engine.setSolutionMineableRate(modelid, 1e18);
    }

    function deployBootstrapFeeModel() public returns (bytes32 modelid) {
        address addr = modelOwner;
        uint256 fee = 1 ether;

        vm.prank(addr);
        modelid = engine.registerModel(addr, fee, TESTBUF);

        // set model.rate so we can test reward emissions
        vm.prank(deployer);
        engine.setSolutionMineableRate(modelid, 1e18);
    }

    function bootstrapTaskParams(bytes32 modelid, uint256 feeEth)
        public
        view
        returns (uint8 version, address owner, bytes32 model, uint256 fee, bytes memory input, bytes memory cid)
    {
        version = 0;
        owner = user1;
        model = modelid;
        fee = feeEth;
        input = TESTBUF; // normally this would be json but it doesnt matter for testing
        cid = getIPFSCIDMemory(TESTBUF);
    }

    function deployBootstrapValidator() public returns (address) {
        vm.prank(deployer);
        baseToken.bridgeMint(address(engine), 599990 ether);

        vm.prank(deployer);
        baseToken.transfer(validator1, 10 ether);

        vm.prank(validator1);
        engine.validatorDeposit(validator1, 10 ether);

        return validator1;
    }

    function deployBootstrapEngineSlashingNotReached() public {
        vm.prank(deployer);
        baseToken.bridgeMint(address(engine), 597000);
    }

    function deployBootstrapEngineSlashingReached() public {
        vm.prank(deployer);
        baseToken.bridgeMint(address(engine), 597000);
    }

    function deployBootstrapTask(bytes32 modelid, address submitter, uint256 feeEth) public returns (bytes32 taskid) {
        // if fee != 0, set approval of fee Amount
        if (feeEth != 0) {
            vm.prank(submitter);
            baseToken.approve(address(engine), feeEth);
        }

        (uint8 version, address owner, bytes32 model, uint256 fee, bytes memory input, bytes memory cid) =
            bootstrapTaskParams(modelid, feeEth);

        Task memory t = Task(model, fee, owner, uint64(block.timestamp), version, cid);

        if (submitter == address(0)) {
            submitter = user1;
        }

        bytes32 prevhash = engine.prevhash();
        taskid = engine.hashTask(t, submitter, prevhash);

        vm.prank(submitter);
        engine.submitTask(version, owner, model, fee, input);
    }

    function testSetPaused() public {
        vm.prank(deployer);
        engine.setPaused(true);
    }

    function testSubmitUncontestedSolution() public {
        deployBootstrapValidator();

        bytes32 modelid = deployBootstrapModel();
        bytes32 taskid = deployBootstrapTask(modelid, user1, 0);

        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        // skip 12s and 1 block
        skip(12);
        vm.roll(block.number + 1);

        (uint256 staked,,) = engine.validators(validator1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        (uint256 stakedAfter,,) = engine.validators(validator1);

        // solution stake amount should be reserved
        uint256 solutionsStakeAmount = engine.solutionsStakeAmount();
        assertEq(staked - stakedAfter, solutionsStakeAmount);

        // check solution val and cid
        (address sval,,, bytes memory scid) = engine.solutions(taskid);
        assertEq(sval, validator1);
        assertEq(scid, TESTCID);

        uint256 sStakeAmount = engine.solutionsStake(taskid);
        assertEq(sStakeAmount, solutionsStakeAmount);
    }

    function testClaimUncontestedSolution() public {
        deployBootstrapValidator();

        bytes32 modelid = deployBootstrapModel();
        bytes32 taskid = deployBootstrapTask(modelid, user1, 0);

        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        // skip 12s and 1 block
        skip(12);
        vm.roll(block.number + 1);

        (uint256 staked,,) = engine.validators(validator1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        (uint256 stakedAfter,,) = engine.validators(validator1);

        // solution stake amount should be reserved
        uint256 solutionsStakeAmount = engine.solutionsStakeAmount();
        assertEq(staked - stakedAfter, solutionsStakeAmount);

        // check solution val and cid
        (address sval,,, bytes memory scid) = engine.solutions(taskid);
        assertEq(sval, validator1);
        assertEq(scid, TESTCID);

        uint256 sStakeAmount = engine.solutionsStake(taskid);
        assertEq(sStakeAmount, solutionsStakeAmount);

        /* claim */

        // fast forward `minClaimSolutionTime`
        skip(engine.minClaimSolutionTime() + 1);
        vm.roll(block.number + 1);

        uint256 reward = engine.getReward();
        // console2.log("reward", reward);

        vm.prank(validator1);
        engine.claimSolution(taskid);

        (uint256 stakedFinal,,) = engine.validators(validator1);

        // solution stake amount should be released
        assertEq(stakedFinal - staked, 0);

        // veRewards should be reward * modelRate (1e18) / 2e18 = reward / 2
        assertEq(engine.veRewards(), reward / 2);
    }

    function testNotifyRewardAmount() public {
        // call notifyRewardAmount so rewardDuration starts
        veStaking.notifyRewardAmount(0);

        deployBootstrapValidator();

        bytes32 modelid = deployBootstrapModel();

        uint256 veRewardsSum;
        uint256 minClaimSolutionTime = engine.minClaimSolutionTime();
        // submit task and claim solution every hour until first rewardDuration passed and notifyRewardAmount is called
        for (uint256 i = 0; i < 168; i++) {
            /* submit task */
            bytes32 taskid = deployBootstrapTask(modelid, user1, 0);

            /* signal commitment and submit solution */
            bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

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
                vm.expectEmit();
                emit VeStaking.RewardAdded(veRewardsSum);
                vm.prank(validator1);
                engine.claimSolution(taskid);

                //console2.log("block.timestamp + 1 week", block.timestamp + 1 weeks);
                //console2.log("block.timestamp % 1 week", block.timestamp % 1 weeks);
                //console2.log("block.timestamp", block.timestamp);

                // next period finish should be 1 week from now +- 1 hour
                uint256 nextPeriodFinish = veStaking.periodFinish();
                assertEq(nextPeriodFinish, block.timestamp + 1 weeks - block.timestamp % 1 weeks);

                break;
            }

            vm.prank(validator1);
            engine.claimSolution(taskid);

            veRewardsSum += reward / 2;
            // veRewards should be equal to veRewardsSum
            assertEq(engine.veRewards(), veRewardsSum);

            // fast forward 1 hour
            skip(3600);
            vm.roll(block.number + 1);
        }
    }

    function testFeeDistribution() public {
        // transfer some AIUS from deployer to user1 for fees
        vm.prank(deployer);
        baseToken.transfer(user1, 100 ether);

        deployBootstrapValidator();

        // deploy model with a fee of 1 AIUS
        bytes32 modelid = deployBootstrapFeeModel();

        // get totalHeld before submitting / claiming task
        uint256 totalHeldBefore = engine.totalHeld();

        /* submit task, set fee to 2 AIUS (1 AIUS to model owner, rest as tip to treasury&validator) */
        bytes32 taskid = deployBootstrapTask(modelid, user1, 2 ether);

        /* signal commitment and submit solution */
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

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
        uint256 treasuryFee = remainingFee - ((remainingFee * (1e18 - solutionFeePercentage)) / 1e18);

        // get validatorFee
        uint256 validatorFee = remainingFee - treasuryFee;

        // get balance before claiming
        uint256 modelOwnerBalanceBefore = baseToken.balanceOf(modelOwner);

        // fast forward `minClaimSolutionTime` and `minClaimSolutionTime/12` blocks
        uint256 minClaimSolutionTime = engine.minClaimSolutionTime();
        skip(minClaimSolutionTime + 1);
        vm.roll(block.number + minClaimSolutionTime / 12);

        // expect transfer of `validatorFee` to validator1
        vm.expectEmit();
        emit IERC20Upgradeable.Transfer(address(engine), validator1, validatorFee);
        vm.prank(validator1);
        engine.claimSolution(taskid);

        // get balance after claiming
        uint256 modelOwnerBalanceAfter = baseToken.balanceOf(modelOwner);

        // modelOwner should receive 1 ether
        assertEq(modelOwnerBalanceAfter - modelOwnerBalanceBefore, 1 ether);

        // get totalHeld after claiming
        uint256 totalHeldAfter = engine.totalHeld();
        assertEq(totalHeldAfter, totalHeldBefore + treasuryFee);
    }

    function testRewardDistribution() public {
        deployBootstrapValidator();

        bytes32 modelid = deployBootstrapModel();
        bytes32 taskid = deployBootstrapTask(modelid, user1, 0);

        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        // skip 12s and 1 block
        skip(12);
        vm.roll(block.number + 1);

        (uint256 staked,,) = engine.validators(validator1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        /* claim */

        // fast forward `minClaimSolutionTime`
        skip(engine.minClaimSolutionTime() + 1);
        vm.roll(block.number + 1);

        uint256 reward = engine.getReward();
        // reward * modelRate (1e18) / 2e18 = reward / 2
        uint256 total = reward / 2;

        // get treasuryRewardPercentage
        uint256 treasuryRewardPercentage = engine.treasuryRewardPercentage();
        // get task owner reward percentage
        uint256 taskOwnerRewardPercentage = engine.taskOwnerRewardPercentage();

        // get task owner balance before
        uint256 taskOwnerBalanceBefore = baseToken.balanceOf(user1);
        // get validator balance before
        uint256 validatorBalanceBefore = baseToken.balanceOf(validator1);
        // get treasury balance before
        uint256 treasuryBalanceBefore = baseToken.balanceOf(treasury);

        vm.prank(validator1);
        engine.claimSolution(taskid);

        uint256 treasuryReward = total - (total * (1e18 - treasuryRewardPercentage)) / 1e18;
        assertEq(baseToken.balanceOf(treasury) - treasuryBalanceBefore, treasuryReward);

        uint256 taskOwnerReward = total - (total * (1e18 - taskOwnerRewardPercentage)) / 1e18;
        assertEq(baseToken.balanceOf(user1) - taskOwnerBalanceBefore, taskOwnerReward);

        assertEq(baseToken.balanceOf(validator1) - validatorBalanceBefore, total - treasuryReward - taskOwnerReward);

        // veRewards should be reward * modelRate (1e18) / 2e18 = reward / 2
        assertEq(engine.veRewards(), reward / 2);
    }
}
