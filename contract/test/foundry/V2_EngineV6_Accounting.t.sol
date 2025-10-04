// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console2.sol";

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "contracts/BaseTokenV1.sol";
import "contracts/test/V2_EngineV6TestHelper.sol";
import "contracts/MasterContesterRegistry.sol";
import "contracts/interfaces/IArbiusV6.sol";

/**
 * @title V2_EngineV6_AccountingTest
 * @notice Tests for V2_EngineV6 accounting integrity
 * @dev Ported from Hardhat test: enginev6.comprehensive.test.ts (lines 1522-1738)
 *
 * Tests cover:
 * - totalHeld tracking through operations
 * - Validator stakes through contestations
 * - Fee distribution with overrides
 * - Double-withdraw prevention
 * - End-to-end accounting verification
 */

// Minimal mock for VeStaking
contract MockVeStaking {
    function periodFinish() external pure returns (uint256) {
        return 0;
    }

    function notifyRewardAmount(uint256) external pure {
        // Do nothing
    }
}

contract V2_EngineV6_AccountingTest is Test {
    BaseTokenV1 public baseToken;
    V2_EngineV6TestHelper public engine;
    MasterContesterRegistry public masterContesterRegistry;

    address public deployer;
    address public user1;
    address public user2;
    address public validator1;
    address public validator2;
    address public validator3;
    address public masterContester1;
    address public model1;
    address public treasury;

    bytes public constant TESTCID = hex"1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8";
    bytes public constant TESTBUF = hex"746573740a";

    event ValidatorWithdraw(address indexed validator, uint256 amount);

    function setUp() public {
        deployer = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        validator1 = makeAddr("validator1");
        validator2 = makeAddr("validator2");
        validator3 = makeAddr("validator3");
        masterContester1 = makeAddr("masterContester1");
        model1 = makeAddr("model1");
        treasury = makeAddr("treasury");

        // Warp to a time > maxContestationValidatorStakeSince (86400)
        // This ensures validators added later have valid `since` timestamps
        vm.warp(100000);

        // Deploy BaseToken
        BaseTokenV1 baseTokenImpl = new BaseTokenV1();
        bytes memory baseTokenInitData = abi.encodeWithSelector(
            BaseTokenV1.initialize.selector,
            deployer,
            address(0)
        );
        ERC1967Proxy baseTokenProxy = new ERC1967Proxy(address(baseTokenImpl), baseTokenInitData);
        baseToken = BaseTokenV1(address(baseTokenProxy));

        // Deploy V6 Engine
        V2_EngineV6TestHelper engineImpl = new V2_EngineV6TestHelper();
        bytes memory engineInitData = abi.encodeWithSelector(
            V2_EngineV6TestHelper.initializeForTesting.selector,
            address(baseToken),
            treasury
        );
        ERC1967Proxy engineProxy = new ERC1967Proxy(address(engineImpl), engineInitData);
        engine = V2_EngineV6TestHelper(address(engineProxy));

        // Deploy MasterContesterRegistry
        masterContesterRegistry = new MasterContesterRegistry(address(0));
        engine.setMasterContesterRegistry(address(masterContesterRegistry));

        // Deploy VeStaking mock
        MockVeStaking mockVeStaking = new MockVeStaking();
        engine.setVeStaking(address(mockVeStaking));

        // Setup tokens
        baseToken.bridgeMint(deployer, 2000 ether);
        baseToken.transferOwnership(address(engine));

        // Setup validators
        _setupValidators();

        // Approve engine for users
        vm.prank(user1);
        baseToken.approve(address(engine), type(uint256).max);
        vm.prank(user2);
        baseToken.approve(address(engine), type(uint256).max);
    }

    function _setupValidators() internal {
        // Bridge tokens to engine for mining
        baseToken.bridgeMint(address(engine), 597000 ether);

        // Setup validators
        address[3] memory validators = [validator1, validator2, validator3];
        for (uint256 i = 0; i < validators.length; i++) {
            baseToken.transfer(validators[i], 10 ether);
            vm.prank(validators[i]);
            baseToken.approve(address(engine), type(uint256).max);
            vm.prank(validators[i]);
            engine.validatorDeposit(validators[i], 10 ether);
        }

        // Setup master contester
        baseToken.transfer(masterContester1, 10 ether);
        vm.prank(masterContester1);
        baseToken.approve(address(engine), type(uint256).max);
        vm.prank(masterContester1);
        engine.validatorDeposit(masterContester1, 10 ether);

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);
    }

    function _deployBootstrapModel(uint256 fee) internal returns (bytes32) {
        vm.prank(user1);
        return engine.registerModel(model1, fee, TESTBUF);
    }

    function _deployBootstrapTask(bytes32 modelId, address submitter, uint256 fee) internal returns (bytes32) {
        vm.prank(submitter);
        vm.recordLogs();
        engine.submitTask(0, submitter, modelId, fee, TESTBUF);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 taskId;
        for (uint i = 0; i < entries.length; i++) {
            if (entries[i].topics[0] == keccak256("TaskSubmitted(bytes32,bytes32,uint256,address)")) {
                taskId = entries[i].topics[1];
                break;
            }
        }
        return taskId;
    }

    function _submitSolution(bytes32 taskId, address validator) internal {
        bytes32 commitment = engine.generateCommitment(validator, taskId, TESTCID);
        vm.prank(validator);
        engine.signalCommitment(commitment);
        vm.roll(block.number + 1);

        vm.prank(validator);
        engine.submitSolution(taskId, TESTCID);
    }

    // ============================================
    // TotalHeld Tracking Tests
    // ============================================

    function test_TotalHeldIncreasesOnTaskSubmit() public {
        bytes32 modelId = _deployBootstrapModel(0);

        uint256 initialTotalHeld = engine.totalHeld();
        uint256 taskFee = 1 ether;

        baseToken.transfer(user1, taskFee);
        _deployBootstrapTask(modelId, user1, taskFee);

        uint256 afterTaskTotalHeld = engine.totalHeld();
        assertEq(afterTaskTotalHeld, initialTotalHeld + taskFee);
    }

    function test_TotalHeldDecreasesOnSolutionClaim() public {
        bytes32 modelId = _deployBootstrapModel(0);

        uint256 taskFee = 1 ether;
        baseToken.transfer(user1, taskFee);
        bytes32 taskId = _deployBootstrapTask(modelId, user1, taskFee);

        uint256 afterTaskTotalHeld = engine.totalHeld();

        _submitSolution(taskId, validator1);

        vm.warp(block.timestamp + 3600 + 1);
        vm.prank(validator1);
        engine.claimSolution(taskId);

        uint256 finalTotalHeld = engine.totalHeld();
        uint256 accruedFees = engine.accruedFees();

        // totalHeld should decrease by (taskFee - accruedFees)
        assertEq(finalTotalHeld, afterTaskTotalHeld - taskFee + accruedFees);
    }

    function test_TotalHeldMaintainedThroughCompleteFlow() public {
        uint256 initialTotalHeld = engine.totalHeld();

        bytes32 modelId = _deployBootstrapModel(0);

        uint256 taskFee = 1 ether;
        baseToken.transfer(user1, taskFee);
        bytes32 taskId = _deployBootstrapTask(modelId, user1, taskFee);

        uint256 afterTaskTotalHeld = engine.totalHeld();
        assertEq(afterTaskTotalHeld, initialTotalHeld + taskFee);

        _submitSolution(taskId, validator1);

        vm.warp(block.timestamp + 3600 + 1);
        vm.prank(validator1);
        engine.claimSolution(taskId);

        uint256 finalTotalHeld = engine.totalHeld();
        uint256 accruedFees = engine.accruedFees();

        // Total held should equal accrued fees (all task fees distributed or held as fees)
        assertEq(finalTotalHeld, accruedFees);
    }

    // ============================================
    // Validator Stake Tracking Through Contestations
    // ============================================

    function test_ValidatorStakeDecreasesOnSolutionSubmit() public {
        bytes32 modelId = _deployBootstrapModel(0);
        bytes32 taskId = _deployBootstrapTask(modelId, user1, 0);

        (uint256 stakeBefore, , ) = engine.validators(validator1);
        uint256 solutionStakeAmount = engine.solutionsStakeAmount();

        _submitSolution(taskId, validator1);

        (uint256 stakeAfter, , ) = engine.validators(validator1);
        assertEq(stakeAfter, stakeBefore - solutionStakeAmount);
    }

    function test_ValidatorStakeIncreasesOnSuccessfulClaim() public {
        bytes32 modelId = _deployBootstrapModel(0);
        bytes32 taskId = _deployBootstrapTask(modelId, user1, 0);

        (uint256 stakeBefore, , ) = engine.validators(validator1);
        uint256 solutionStakeAmount = engine.solutionsStakeAmount();

        _submitSolution(taskId, validator1);

        (uint256 stakeAfterSubmit, , ) = engine.validators(validator1);
        assertEq(stakeAfterSubmit, stakeBefore - solutionStakeAmount);

        vm.warp(block.timestamp + 3600 + 1);
        vm.prank(validator1);
        engine.claimSolution(taskId);

        (uint256 stakeAfterClaim, , ) = engine.validators(validator1);
        // Stake should be restored (got solution stake back)
        assertEq(stakeAfterClaim, stakeBefore);
    }

    function test_ValidatorStakesTrackedThroughContestation() public {
        masterContesterRegistry.emergencyAddMasterContester(masterContester1);

        bytes32 modelId = _deployBootstrapModel(0);
        bytes32 taskId = _deployBootstrapTask(modelId, user1, 0);

        // Track initial stakes
        (uint256 mc1StakeInitial, , ) = engine.validators(masterContester1);
        (uint256 v1StakeInitial, , ) = engine.validators(validator1);
        (uint256 v2StakeInitial, , ) = engine.validators(validator2);

        _submitSolution(taskId, validator1);

        (uint256 v1StakeAfterSolution, , ) = engine.validators(validator1);
        uint256 solutionStakeAmount = engine.solutionsStakeAmount();
        assertEq(v1StakeAfterSolution, v1StakeInitial - solutionStakeAmount);

        // Submit contestation
        vm.prank(masterContester1);
        engine.submitContestation(taskId);

        uint256 slashAmount = engine.getSlashAmount();
        (uint256 mc1StakeAfterContestation, , ) = engine.validators(masterContester1);
        (uint256 v1StakeAfterContestation, , ) = engine.validators(validator1);

        // Both should have slash amount deducted
        assertEq(mc1StakeAfterContestation, mc1StakeInitial - slashAmount);
        assertEq(v1StakeAfterContestation, v1StakeAfterSolution - slashAmount);

        // Add another voter
        vm.prank(validator2);
        engine.voteOnContestation(taskId, true);
        (uint256 v2StakeAfterVote, , ) = engine.validators(validator2);
        assertEq(v2StakeAfterVote, v2StakeInitial - slashAmount);

        // Finish voting
        vm.warp(block.timestamp + 4000);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.contestationVoteFinish(taskId, 3);

        // Check final stakes - winners should get refund + rewards
        (uint256 mc1StakeFinal, , ) = engine.validators(masterContester1);
        (uint256 v2StakeFinal, , ) = engine.validators(validator2);
        (uint256 v1StakeFinal, , ) = engine.validators(validator1);

        // Winners should have more than initial
        assertGt(mc1StakeFinal, mc1StakeInitial);
        assertGt(v2StakeFinal, v2StakeInitial);

        // Loser lost slash amount + solution stake
        assertEq(v1StakeFinal, v1StakeInitial - slashAmount - solutionStakeAmount);
    }

    // ============================================
    // Fee Distribution Accounting
    // ============================================

    function test_FeeDistributionWithOverrideAccounting() public {
        // Create model with fee
        uint256 modelFee = 0.1 ether;
        bytes32 modelId = _deployBootstrapModel(modelFee);

        // Set override to 30% to treasury
        engine.setSolutionModelFeePercentageOverride(modelId, 0.3 ether);

        // Set general fee percentage to 20%
        engine.setSolutionModelFeePercentage(0.2 ether);

        // Create task with fee
        uint256 taskFee = 0.2 ether;
        baseToken.transfer(user2, taskFee);
        bytes32 taskId = _deployBootstrapTask(modelId, user2, taskFee);

        _submitSolution(taskId, validator1);

        vm.warp(block.timestamp + 3600 + 1);

        uint256 modelOwnerBalanceBefore = baseToken.balanceOf(model1);
        uint256 treasuryFeesBefore = engine.accruedFees();
        (uint256 validatorStakeBefore, , ) = engine.validators(validator1);

        vm.prank(validator1);
        engine.claimSolution(taskId);

        uint256 modelOwnerBalanceAfter = baseToken.balanceOf(model1);
        uint256 treasuryFeesAfter = engine.accruedFees();
        (uint256 validatorStakeAfter, , ) = engine.validators(validator1);

        // Model should get 70% of model fee
        uint256 modelOwnerReceived = modelOwnerBalanceAfter - modelOwnerBalanceBefore;
        uint256 expectedModelOwnerAmount = (modelFee * 70) / 100;
        assertEq(modelOwnerReceived, expectedModelOwnerAmount);

        // Check total fees are accounted for
        uint256 totalFeePaid = taskFee;
        uint256 treasuryReceived = treasuryFeesAfter - treasuryFeesBefore;
        uint256 solutionStakeAmount = engine.solutionsStakeAmount();
        uint256 validatorReceived = validatorStakeAfter - validatorStakeBefore - solutionStakeAmount;

        // Total should match (within rounding tolerance)
        uint256 totalDistributed = modelOwnerReceived + treasuryReceived + validatorReceived;
        uint256 difference = totalDistributed > totalFeePaid ?
            totalDistributed - totalFeePaid : totalFeePaid - totalDistributed;
        assertLe(difference, 10);
    }

    // ============================================
    // Double-Withdraw Prevention
    // ============================================

    function test_PreventDoubleWithdraw() public {
        uint256 withdrawAmount = 1 ether;

        vm.prank(validator1);
        engine.initiateValidatorWithdraw(withdrawAmount);

        uint256 count = engine.pendingValidatorWithdrawRequestsCount(validator1);

        // Fast forward past unlock time
        vm.warp(block.timestamp + 7 days);
        vm.roll(block.number + 1);

        // First withdraw should work
        vm.prank(validator1);
        vm.expectEmit(true, false, false, true);
        emit ValidatorWithdraw(validator1, withdrawAmount);
        engine.validatorWithdraw(count, validator1);

        // Second withdraw of same request should fail
        vm.prank(validator1);
        vm.expectRevert();
        engine.validatorWithdraw(count, validator1);
    }

    function test_MultipleWithdrawRequests() public {
        // Create multiple withdraw requests
        vm.prank(validator1);
        engine.initiateValidatorWithdraw(1 ether);

        uint256 count1 = engine.pendingValidatorWithdrawRequestsCount(validator1);

        vm.warp(block.timestamp + 1 days);

        vm.prank(validator1);
        engine.initiateValidatorWithdraw(0.5 ether);

        uint256 count2 = engine.pendingValidatorWithdrawRequestsCount(validator1);

        assertEq(count2, count1 + 1);

        // Fast forward
        vm.warp(block.timestamp + 7 days);

        (uint256 stakeBefore, , ) = engine.validators(validator1);

        // Withdraw both
        vm.prank(validator1);
        engine.validatorWithdraw(count1, validator1);

        vm.prank(validator1);
        engine.validatorWithdraw(count2, validator1);

        (uint256 stakeAfter, , ) = engine.validators(validator1);

        // Should have withdrawn 1.5 ether total
        assertEq(stakeBefore - stakeAfter, 1.5 ether);
    }

    // ============================================
    // Complex Accounting Scenarios
    // ============================================

    function test_AccountingThroughMultipleTasksAndContestations() public {
        masterContesterRegistry.emergencyAddMasterContester(masterContester1);

        uint256 initialEngineBalance = baseToken.balanceOf(address(engine));
        uint256 initialTotalHeld = engine.totalHeld();

        // Create model with fees
        uint256 modelFee = 0.05 ether;
        uint256 taskFee = 0.1 ether;
        bytes32 modelId = _deployBootstrapModel(modelFee);

        // Submit task
        baseToken.transfer(user2, taskFee);
        bytes32 taskId = _deployBootstrapTask(modelId, user2, taskFee);

        // Check totalHeld increased by taskFee
        assertEq(engine.totalHeld(), initialTotalHeld + taskFee);

        _submitSolution(taskId, validator1);

        // Submit contestation
        vm.prank(masterContester1);
        engine.submitContestation(taskId);

        vm.prank(validator2);
        engine.voteOnContestation(taskId, false);

        vm.prank(validator3);
        engine.voteOnContestation(taskId, false);

        // Finish voting (contestation should fail - nays win)
        vm.warp(block.timestamp + 4000);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.contestationVoteFinish(taskId, 4);

        // Final accounting check
        uint256 finalTotalHeld = engine.totalHeld();

        // Verify totalHeld changed appropriately
        assertLe(finalTotalHeld, initialTotalHeld + taskFee);
    }
}
