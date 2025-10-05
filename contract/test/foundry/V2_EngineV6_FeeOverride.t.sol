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
 * @title V2_EngineV6_FeeOverrideTest
 * @notice Tests for V2_EngineV6 solution model fee percentage override functionality
 * @dev Ported from Hardhat test: enginev6.comprehensive.test.ts (lines 752-1046)
 *
 * Tests cover:
 * - Setting/clearing fee percentage overrides per model
 * - Override validation (0-100%)
 * - Fee distribution with overrides
 * - Edge cases (0%, 100%, model with no fee)
 * - Integration with model fee changes
 */

// Minimal mock for VeStaking to avoid revert on periodFinish call
contract MockVeStaking {
    function periodFinish() external pure returns (uint256) {
        return 0;
    }

    function notifyRewardAmount(uint256) external pure {
        // Do nothing
    }
}

contract V2_EngineV6_FeeOverrideTest is Test {
    BaseTokenV1 public baseToken;
    V2_EngineV6TestHelper public engine;
    MasterContesterRegistry public masterContesterRegistry;

    address public deployer;
    address public user1;
    address public user2;
    address public validator1;
    address public validator2;
    address public model1;
    address public treasury;

    bytes public constant TESTCID = hex"1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8";
    bytes public constant TESTBUF = hex"746573740a";

    event SolutionModelFeePercentageOverrideCleared(bytes32 indexed model);
    event SolutionClaimed(address indexed validator, bytes32 indexed task);

    function setUp() public {
        deployer = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        validator1 = makeAddr("validator1");
        validator2 = makeAddr("validator2");
        model1 = makeAddr("model1");
        treasury = makeAddr("treasury");

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

        // Deploy minimal VeStaking mock to avoid revert on periodFinish call
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
        address[2] memory validators = [validator1, validator2];
        for (uint256 i = 0; i < validators.length; i++) {
            baseToken.transfer(validators[i], 10 ether);
            vm.prank(validators[i]);
            baseToken.approve(address(engine), type(uint256).max);
            vm.prank(validators[i]);
            engine.validatorDeposit(validators[i], 10 ether);
        }

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
        engine.submitTask(
            0, // version
            submitter,
            modelId,
            fee,
            TESTBUF
        );

        // Get taskid from event
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

    function _submitAndClaimSolution(bytes32 taskId, address validator) internal {
        bytes32 commitment = engine.generateCommitment(validator, taskId, TESTCID);
        vm.prank(validator);
        engine.signalCommitment(commitment);
        vm.roll(block.number + 1);

        vm.prank(validator);
        engine.submitSolution(taskId, TESTCID);

        // Wait past claim time
        vm.warp(block.timestamp + 3600 + 1);

        vm.prank(validator);
        engine.claimSolution(taskId);
    }

    // ============================================
    // Fee Override Setter Tests
    // ============================================

    function test_SetModelFeePercentageOverride() public {
        bytes32 modelId = _deployBootstrapModel(0);

        engine.setSolutionModelFeePercentageOverride(modelId, 0.5 ether); // 50%

        assertEq(engine.solutionModelFeePercentageOverride(modelId), 0.5 ether);
        assertTrue(engine.hasSolutionModelFeePercentageOverride(modelId));
    }

    function test_RevertWhenSettingOverrideForNonExistentModel() public {
        bytes32 fakeModelId = keccak256("fake");

        vm.expectRevert("ModelDoesNotExist()");
        engine.setSolutionModelFeePercentageOverride(fakeModelId, 0.5 ether);
    }

    function test_RevertWhenPercentageExceeds100() public {
        bytes32 modelId = _deployBootstrapModel(0);

        vm.expectRevert("PercentageTooHigh()");
        engine.setSolutionModelFeePercentageOverride(modelId, 1.1 ether); // 110%
    }

    function test_ClearModelFeePercentageOverride() public {
        bytes32 modelId = _deployBootstrapModel(0);

        // Set override
        engine.setSolutionModelFeePercentageOverride(modelId, 0.5 ether);
        assertTrue(engine.hasSolutionModelFeePercentageOverride(modelId));

        // Clear override
        vm.expectEmit(true, false, false, false);
        emit SolutionModelFeePercentageOverrideCleared(modelId);
        engine.clearSolutionModelFeePercentageOverride(modelId);

        assertFalse(engine.hasSolutionModelFeePercentageOverride(modelId));
        assertEq(engine.solutionModelFeePercentageOverride(modelId), 0);
    }

    function test_RevertWhenClearingNonExistentOverride() public {
        bytes32 modelId = _deployBootstrapModel(0);

        // No override set
        vm.expectRevert("NoOverrideExists()");
        engine.clearSolutionModelFeePercentageOverride(modelId);
    }

    // ============================================
    // Fee Distribution with Override Tests
    // ============================================

    function test_FeeDistributionWithOverride() public {
        // Create model with fee
        uint256 modelFee = 0.1 ether;
        bytes32 modelId = _deployBootstrapModel(modelFee);

        // Set override to 30% to treasury (70% to model owner)
        engine.setSolutionModelFeePercentageOverride(modelId, 0.3 ether);

        // Set general solution model fee percentage to 20% (should be ignored due to override)
        engine.setSolutionModelFeePercentage(0.2 ether);

        // Create task with fee
        uint256 taskFee = 0.2 ether;
        baseToken.transfer(user2, taskFee);
        bytes32 taskId = _deployBootstrapTask(modelId, user2, taskFee);

        // Track balances before
        uint256 modelOwnerBalanceBefore = baseToken.balanceOf(model1);
        uint256 treasuryFeesBefore = engine.accruedFees();
        (uint256 validatorStakeBefore, , ) = engine.validators(validator1);

        // Submit and claim solution
        _submitAndClaimSolution(taskId, validator1);

        // Check balances after
        uint256 modelOwnerBalanceAfter = baseToken.balanceOf(model1);
        uint256 treasuryFeesAfter = engine.accruedFees();
        (uint256 validatorStakeAfter, , ) = engine.validators(validator1);

        // Model owner should get 70% of model fee (0.1 * 0.7 = 0.07)
        uint256 modelOwnerReceived = modelOwnerBalanceAfter - modelOwnerBalanceBefore;
        uint256 expectedModelOwnerAmount = (modelFee * 70) / 100;
        assertEq(modelOwnerReceived, expectedModelOwnerAmount);

        // Treasury should get 30% of model fee + remaining task fee
        uint256 treasuryReceived = treasuryFeesAfter - treasuryFeesBefore;
        assertGt(treasuryReceived, 0);

        // Validator stake should increase (got solution stake back + task fee - model fee)
        assertGt(validatorStakeAfter, validatorStakeBefore);
    }

    function test_OverrideAppliesCorrectlyWhenModelFeeChanges() public {
        // Create model with initial fee
        uint256 initialFee = 0.1 ether;
        bytes32 modelId = _deployBootstrapModel(initialFee);

        // Set override to 30%
        engine.setSolutionModelFeePercentageOverride(modelId, 0.3 ether);

        // Change model fee
        uint256 newFee = 0.2 ether;
        vm.prank(model1);
        engine.setModelFee(modelId, newFee);

        // Create task with new fee
        baseToken.transfer(user2, newFee);
        bytes32 taskId = _deployBootstrapTask(modelId, user2, newFee);

        uint256 modelOwnerBalanceBefore = baseToken.balanceOf(model1);

        // Submit and claim solution
        _submitAndClaimSolution(taskId, validator1);

        uint256 modelOwnerBalanceAfter = baseToken.balanceOf(model1);

        // Model owner should receive 70% of NEW fee (override still applies)
        uint256 modelOwnerReceived = modelOwnerBalanceAfter - modelOwnerBalanceBefore;
        uint256 expectedAmount = (newFee * 70) / 100;
        assertEq(modelOwnerReceived, expectedAmount);
    }

    // ============================================
    // Edge Cases
    // ============================================

    function test_ZeroPercentOverride_AllFeesToModelOwner() public {
        uint256 modelFee = 0.1 ether;
        bytes32 modelId = _deployBootstrapModel(modelFee);

        // Set override to 0% (all to model owner)
        engine.setSolutionModelFeePercentageOverride(modelId, 0);

        baseToken.transfer(user2, modelFee);
        bytes32 taskId = _deployBootstrapTask(modelId, user2, modelFee);

        uint256 modelOwnerBalanceBefore = baseToken.balanceOf(model1);

        _submitAndClaimSolution(taskId, validator1);

        uint256 modelOwnerBalanceAfter = baseToken.balanceOf(model1);

        // Model owner should receive ALL of the model fee (0% to treasury)
        assertEq(modelOwnerBalanceAfter - modelOwnerBalanceBefore, modelFee);
    }

    function test_HundredPercentOverride_AllFeesToTreasury() public {
        uint256 modelFee = 0.1 ether;
        bytes32 modelId = _deployBootstrapModel(modelFee);

        // Set override to 100% (all to treasury)
        engine.setSolutionModelFeePercentageOverride(modelId, 1 ether);

        baseToken.transfer(user2, modelFee);
        bytes32 taskId = _deployBootstrapTask(modelId, user2, modelFee);

        uint256 modelOwnerBalanceBefore = baseToken.balanceOf(model1);
        uint256 treasuryFeesBefore = engine.accruedFees();

        _submitAndClaimSolution(taskId, validator1);

        uint256 modelOwnerBalanceAfter = baseToken.balanceOf(model1);
        uint256 treasuryFeesAfter = engine.accruedFees();

        // Model owner should receive nothing
        assertEq(modelOwnerBalanceAfter, modelOwnerBalanceBefore);

        // Treasury should have increased by at least the model fee
        assertGe(treasuryFeesAfter - treasuryFeesBefore, modelFee);
    }

    function test_OverrideOnModelWithNoFee() public {
        // Create model with 0 fee
        bytes32 modelId = _deployBootstrapModel(0);

        // Set override (should have no effect since fee is 0)
        engine.setSolutionModelFeePercentageOverride(modelId, 0.5 ether);

        bytes32 taskId = _deployBootstrapTask(modelId, user2, 0);

        // Should complete without issues even with override on 0 fee
        _submitAndClaimSolution(taskId, validator1);

        // Verify solution was claimed
        ( , , bool claimed, ) = engine.solutions(taskId);
        assertTrue(claimed);
    }

    function test_OverridePersistsAfterModelFeeSetToZero() public {
        uint256 initialFee = 0.1 ether;
        bytes32 modelId = _deployBootstrapModel(initialFee);

        // Set override
        engine.setSolutionModelFeePercentageOverride(modelId, 0.5 ether);

        // Change model fee to 0
        vm.prank(model1);
        engine.setModelFee(modelId, 0);

        // Override should still exist
        assertTrue(engine.hasSolutionModelFeePercentageOverride(modelId));
        assertEq(engine.solutionModelFeePercentageOverride(modelId), 0.5 ether);

        // But it won't have any effect since fee is now 0
        bytes32 taskId = _deployBootstrapTask(modelId, user2, 0);
        _submitAndClaimSolution(taskId, validator1);
    }

    function test_MultipleModelsWithDifferentOverrides() public {
        // Create two models
        vm.prank(user1);
        bytes32 modelId1 = engine.registerModel(model1, 0.1 ether, TESTBUF);

        address model2 = makeAddr("model2");
        vm.prank(user1);
        bytes32 modelId2 = engine.registerModel(model2, 0.1 ether, TESTBUF);

        // Set different overrides
        engine.setSolutionModelFeePercentageOverride(modelId1, 0.3 ether); // 30% to treasury
        engine.setSolutionModelFeePercentageOverride(modelId2, 0.7 ether); // 70% to treasury

        // Create tasks for both
        baseToken.transfer(user2, 0.2 ether);
        bytes32 taskId1 = _deployBootstrapTask(modelId1, user2, 0.1 ether);
        bytes32 taskId2 = _deployBootstrapTask(modelId2, user2, 0.1 ether);

        uint256 model1BalanceBefore = baseToken.balanceOf(model1);
        uint256 model2BalanceBefore = baseToken.balanceOf(model2);

        // Claim both
        _submitAndClaimSolution(taskId1, validator1);
        _submitAndClaimSolution(taskId2, validator1);

        uint256 model1BalanceAfter = baseToken.balanceOf(model1);
        uint256 model2BalanceAfter = baseToken.balanceOf(model2);

        // Model1 should get 70% of fee
        assertEq(model1BalanceAfter - model1BalanceBefore, 0.07 ether);

        // Model2 should get 30% of fee
        assertEq(model2BalanceAfter - model2BalanceBefore, 0.03 ether);
    }

    function test_ClearOverrideReturnToGlobalDefault() public {
        uint256 modelFee = 0.1 ether;
        bytes32 modelId = _deployBootstrapModel(modelFee);

        // Set global default to 20%
        engine.setSolutionModelFeePercentage(0.2 ether);

        // Set override to 50%
        engine.setSolutionModelFeePercentageOverride(modelId, 0.5 ether);

        // Clear override
        engine.clearSolutionModelFeePercentageOverride(modelId);

        // Create task and claim
        baseToken.transfer(user2, modelFee);
        bytes32 taskId = _deployBootstrapTask(modelId, user2, modelFee);

        uint256 modelOwnerBalanceBefore = baseToken.balanceOf(model1);
        _submitAndClaimSolution(taskId, validator1);
        uint256 modelOwnerBalanceAfter = baseToken.balanceOf(model1);

        // Should now use global default (20% to treasury, 80% to model)
        uint256 modelOwnerReceived = modelOwnerBalanceAfter - modelOwnerBalanceBefore;
        uint256 expectedAmount = (modelFee * 80) / 100;
        assertEq(modelOwnerReceived, expectedAmount);
    }
}
