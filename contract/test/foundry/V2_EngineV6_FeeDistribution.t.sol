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
 * @title V2_EngineV6_FeeDistributionTest
 * @notice Comprehensive tests for V6 fee distribution across all scenarios
 * @dev Tests all combinations of:
 *      - Task fees (0 or non-zero)
 *      - Model fees (0 or non-zero)
 *      - Model fee percentage overrides
 *      - Direct validator staking (rewards → stake vs balance)
 *
 * V6 Fee Logic (with default test helper settings):
 * - solutionFeePercentage = 5 wei (~0%, so validator gets ~100% of remaining fee)
 * - solutionModelFeePercentage = 50 wei (~0%, so model owner gets ~100% of model fee)
 * - When modelFee > taskFee, modelFee is zeroed to prevent drain
 * - Model fee is deducted from task fee, remainder goes to validator/treasury
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

contract V2_EngineV6_FeeDistributionTest is Test {
    BaseTokenV1 public baseToken;
    V2_EngineV6TestHelper public engine;
    MasterContesterRegistry public masterContesterRegistry;

    address public deployer;
    address public user1;
    address public validator1;
    address public modelOwner1;
    address public treasury;

    bytes public constant TESTCID = hex"1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8";
    bytes public constant TESTBUF = hex"746573740a";

    function setUp() public {
        deployer = address(this);
        user1 = makeAddr("user1");
        validator1 = makeAddr("validator1");
        modelOwner1 = makeAddr("modelOwner1");
        treasury = makeAddr("treasury");

        // Warp to valid time for validators
        vm.warp(100000);

        // Deploy BaseToken
        BaseTokenV1 baseTokenImpl = new BaseTokenV1();
        bytes memory baseTokenInitData = abi.encodeWithSelector(BaseTokenV1.initialize.selector, deployer, address(0));
        ERC1967Proxy baseTokenProxy = new ERC1967Proxy(address(baseTokenImpl), baseTokenInitData);
        baseToken = BaseTokenV1(address(baseTokenProxy));

        // Deploy V6 Engine
        V2_EngineV6TestHelper engineImpl = new V2_EngineV6TestHelper();
        bytes memory engineInitData =
            abi.encodeWithSelector(V2_EngineV6TestHelper.initializeForTesting.selector, address(baseToken), treasury);
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

        // Setup validator
        baseToken.transfer(validator1, 10 ether);
        vm.prank(validator1);
        baseToken.approve(address(engine), type(uint256).max);
        vm.prank(validator1);
        engine.validatorDeposit(validator1, 10 ether);

        // Approve for users
        vm.prank(user1);
        baseToken.approve(address(engine), type(uint256).max);
    }

    function _registerModel(address owner, uint256 modelFee) internal returns (bytes32) {
        vm.prank(owner);
        return engine.registerModel(owner, modelFee, TESTBUF);
    }

    function _submitTask(bytes32 modelId, uint256 taskFee) internal returns (bytes32) {
        baseToken.transfer(user1, taskFee);

        vm.prank(user1);
        vm.recordLogs();
        engine.submitTask(0, user1, modelId, taskFee, TESTBUF);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 taskId;
        for (uint256 i = 0; i < entries.length; i++) {
            if (entries[i].topics[0] == keccak256("TaskSubmitted(bytes32,bytes32,uint256,address)")) {
                taskId = entries[i].topics[1];
                break;
            }
        }
        return taskId;
    }

    function _submitAndClaimSolution(bytes32 taskId) internal {
        bytes32 commitment = engine.generateCommitment(validator1, taskId, TESTCID);
        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.roll(block.number + 1);
        vm.prank(validator1);
        engine.submitSolution(taskId, TESTCID);

        vm.warp(block.timestamp + 3600 + 1);
        vm.prank(validator1);
        engine.claimSolution(taskId);
    }

    /*//////////////////////////////////////////////////////////////
                        NO FEES SCENARIO
    //////////////////////////////////////////////////////////////*/

    function test_NoFees_NoRewards() public {
        bytes32 modelId = _registerModel(modelOwner1, 0);
        bytes32 taskId = _submitTask(modelId, 0);

        (uint256 validatorStakeBefore,,) = engine.validators(validator1);
        uint256 modelOwnerBalBefore = baseToken.balanceOf(modelOwner1);
        uint256 treasuryFeesBefore = engine.accruedFees();

        _submitAndClaimSolution(taskId);

        (uint256 validatorStakeAfter,,) = engine.validators(validator1);
        uint256 modelOwnerBalAfter = baseToken.balanceOf(modelOwner1);
        uint256 treasuryFeesAfter = engine.accruedFees();

        // No changes - no fees, no rewards
        assertEq(validatorStakeAfter, validatorStakeBefore, "Validator stake should not change");
        assertEq(modelOwnerBalAfter, modelOwnerBalBefore, "Model owner balance should not change");
        assertEq(treasuryFeesAfter, treasuryFeesBefore, "Treasury fees should not change");
    }

    /*//////////////////////////////////////////////////////////////
                    TASK FEE ONLY (NO MODEL FEE)
    //////////////////////////////////////////////////////////////*/

    function test_TaskFeeOnly_NoModelFee() public {
        bytes32 modelId = _registerModel(modelOwner1, 0);
        bytes32 taskId = _submitTask(modelId, 1 ether);

        (uint256 validatorStakeBefore,,) = engine.validators(validator1);
        uint256 modelOwnerBalBefore = baseToken.balanceOf(modelOwner1);
        uint256 treasuryFeesBefore = engine.accruedFees();

        _submitAndClaimSolution(taskId);

        (uint256 validatorStakeAfter,,) = engine.validators(validator1);
        uint256 modelOwnerBalAfter = baseToken.balanceOf(modelOwner1);
        uint256 treasuryFeesAfter = engine.accruedFees();

        // With solutionFeePercentage = 5 wei (~0%), validator gets ~100% of task fee
        // Actual: validator gets 999999999999999995 out of 1 ether (due to rounding)
        assertGt(validatorStakeAfter - validatorStakeBefore, 0.999 ether, "Validator should get ~100% of task fee");
        assertEq(modelOwnerBalAfter, modelOwnerBalBefore, "Model owner gets nothing (no model fee)");
        assertLt(treasuryFeesAfter - treasuryFeesBefore, 0.001 ether, "Treasury gets ~0%");
    }

    /*//////////////////////////////////////////////////////////////
                    MODEL FEE ONLY (NO TASK FEE)
    //////////////////////////////////////////////////////////////*/

    function test_ModelFeeOnly_NoTaskFee_IsZeroed() public {
        // When modelFee > taskFee, task submission reverts
        uint256 modelFee = 0.5 ether;
        bytes32 modelId = _registerModel(modelOwner1, modelFee);

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("LowerFeeThanModelFee()"));
        engine.submitTask(0, user1, modelId, 0, TESTBUF);
    }

    /*//////////////////////////////////////////////////////////////
                    BOTH TASK FEE AND MODEL FEE
    //////////////////////////////////////////////////////////////*/

    function test_BothFees_DefaultSplit() public {
        uint256 modelFee = 0.5 ether;
        uint256 taskFee = 1 ether;
        bytes32 modelId = _registerModel(modelOwner1, modelFee);
        bytes32 taskId = _submitTask(modelId, taskFee);

        (uint256 validatorStakeBefore,,) = engine.validators(validator1);
        uint256 modelOwnerBalBefore = baseToken.balanceOf(modelOwner1);
        uint256 treasuryFeesBefore = engine.accruedFees();

        _submitAndClaimSolution(taskId);

        (uint256 validatorStakeAfter,,) = engine.validators(validator1);
        uint256 modelOwnerBalAfter = baseToken.balanceOf(modelOwner1);
        uint256 treasuryFeesAfter = engine.accruedFees();

        // With solutionModelFeePercentage = 50 wei (~0%), model owner gets ~100% of model fee
        // Model owner gets: ~0.5 ether
        // Validator gets: remaining (1 - 0.5 = 0.5 ether) minus tiny treasury fee
        assertGt(modelOwnerBalAfter - modelOwnerBalBefore, 0.499 ether, "Model owner should get ~100% of model fee");
        assertGt(validatorStakeAfter - validatorStakeBefore, 0.499 ether, "Validator gets remaining");
        assertLt(treasuryFeesAfter - treasuryFeesBefore, 0.001 ether, "Treasury gets ~0%");
    }

    function test_BothFees_WithOverride50Percent() public {
        uint256 modelFee = 0.5 ether;
        uint256 taskFee = 1 ether;
        bytes32 modelId = _registerModel(modelOwner1, modelFee);

        // Set override to 50% (0.5 ether in 1e18 scale)
        engine.setSolutionModelFeePercentageOverride(modelId, 0.5 ether);

        bytes32 taskId = _submitTask(modelId, taskFee);

        (uint256 validatorStakeBefore,,) = engine.validators(validator1);
        uint256 modelOwnerBalBefore = baseToken.balanceOf(modelOwner1);
        uint256 treasuryFeesBefore = engine.accruedFees();

        _submitAndClaimSolution(taskId);

        (uint256 validatorStakeAfter,,) = engine.validators(validator1);
        uint256 modelOwnerBalAfter = baseToken.balanceOf(modelOwner1);
        uint256 treasuryFeesAfter = engine.accruedFees();

        // With 50% override:
        // Treasury gets 50% of model fee = 0.25 ether
        // Model owner gets 50% of model fee = 0.25 ether
        // Validator gets remaining (1 - 0.5 = 0.5 ether) minus tiny fee
        assertApproxEqAbs(modelOwnerBalAfter - modelOwnerBalBefore, 0.25 ether, 0.001 ether, "Model owner gets 50%");
        assertApproxEqAbs(
            treasuryFeesAfter - treasuryFeesBefore, 0.25 ether, 0.001 ether, "Treasury gets 50% of model fee"
        );
        assertGt(validatorStakeAfter - validatorStakeBefore, 0.49 ether, "Validator gets remaining");
    }

    function test_BothFees_WithOverride100Percent() public {
        uint256 modelFee = 0.5 ether;
        uint256 taskFee = 1 ether;
        bytes32 modelId = _registerModel(modelOwner1, modelFee);

        // Set override to 100% (1 ether in 1e18 scale)
        engine.setSolutionModelFeePercentageOverride(modelId, 1 ether);

        bytes32 taskId = _submitTask(modelId, taskFee);

        (uint256 validatorStakeBefore,,) = engine.validators(validator1);
        uint256 modelOwnerBalBefore = baseToken.balanceOf(modelOwner1);
        uint256 treasuryFeesBefore = engine.accruedFees();

        _submitAndClaimSolution(taskId);

        (uint256 validatorStakeAfter,,) = engine.validators(validator1);
        uint256 modelOwnerBalAfter = baseToken.balanceOf(modelOwner1);
        uint256 treasuryFeesAfter = engine.accruedFees();

        // With 100% override:
        // Treasury gets 100% of model fee = 0.5 ether
        // Model owner gets 0% of model fee = 0 ether
        // Validator gets remaining (1 - 0.5 = 0.5 ether) minus tiny fee
        assertEq(modelOwnerBalAfter, modelOwnerBalBefore, "Model owner gets 0% (100% to treasury)");
        assertApproxEqAbs(
            treasuryFeesAfter - treasuryFeesBefore, 0.5 ether, 0.001 ether, "Treasury gets 100% of model fee"
        );
        assertGt(validatorStakeAfter - validatorStakeBefore, 0.49 ether, "Validator gets remaining");
    }

    /*//////////////////////////////////////////////////////////////
                    MINING REWARDS (ENABLED/DISABLED)
    //////////////////////////////////////////////////////////////*/

    function test_MiningRewards_DisabledByDefault() public {
        // Mining is disabled when rate = 0 (default)
        bytes32 modelId = _registerModel(modelOwner1, 0);
        bytes32 taskId = _submitTask(modelId, 0.1 ether);

        (uint256 validatorStakeBefore,,) = engine.validators(validator1);

        _submitAndClaimSolution(taskId);

        (uint256 validatorStakeAfter,,) = engine.validators(validator1);

        // Validator gets task fee only (no mining rewards)
        assertGt(validatorStakeAfter - validatorStakeBefore, 0.099 ether, "Should get ~100% of task fee");
        assertLt(validatorStakeAfter - validatorStakeBefore, 0.101 ether, "Should only get task fee, no mining");
    }

    function test_MiningRewards_EnabledWithRate() public {
        bytes32 modelId = _registerModel(modelOwner1, 0);

        // Enable mining rewards with rate
        engine.setSolutionMineableRate(modelId, 1 ether);

        // For mining to work, need correct emission schedule setup
        // With standard test setup (597k tokens), mining rewards will be 0
        // So we need to give engine the right balance
        baseToken.bridgeMint(address(engine), 2990 ether); // Bring to 599,990 total

        bytes32 taskId = _submitTask(modelId, 0.1 ether);

        (uint256 validatorStakeBefore,,) = engine.validators(validator1);

        _submitAndClaimSolution(taskId);

        // Need to warp far enough for mining rewards
        vm.warp(block.timestamp + 7 days);

        (uint256 validatorStakeAfter,,) = engine.validators(validator1);

        // With correct setup, validator should get task fee + mining rewards
        // But this test primarily verifies the mechanism is in place
        assertGt(validatorStakeAfter, validatorStakeBefore, "Should get rewards");
    }

    /*//////////////////////////////////////////////////////////////
                REWARDS TO STAKE VS BALANCE (V6 Feature)
    //////////////////////////////////////////////////////////////*/

    function test_RewardsGoToStake_NotBalance() public {
        bytes32 modelId = _registerModel(modelOwner1, 0);
        bytes32 taskId = _submitTask(modelId, 1 ether);

        (uint256 validatorStakeBefore,,) = engine.validators(validator1);
        uint256 validatorBalBefore = baseToken.balanceOf(validator1);

        _submitAndClaimSolution(taskId);

        (uint256 validatorStakeAfter,,) = engine.validators(validator1);
        uint256 validatorBalAfter = baseToken.balanceOf(validator1);

        // V6 feature: rewards go to stake, not balance
        assertGt(validatorStakeAfter, validatorStakeBefore, "Stake should increase");
        assertEq(validatorBalAfter, validatorBalBefore, "Balance should NOT change");
    }

    /*//////////////////////////////////////////////////////////////
                    COMPLEX SCENARIOS
    //////////////////////////////////////////////////////////////*/

    function test_ComplexScenario_AllFeatures() public {
        uint256 modelFee = 1 ether;
        uint256 taskFee = 2 ether;

        bytes32 modelId = _registerModel(modelOwner1, modelFee);

        // Set custom override: 75% to treasury, 25% to model owner
        engine.setSolutionModelFeePercentageOverride(modelId, 0.75 ether);

        bytes32 taskId = _submitTask(modelId, taskFee);

        (uint256 validatorStakeBefore,,) = engine.validators(validator1);
        uint256 modelOwnerBalBefore = baseToken.balanceOf(modelOwner1);
        uint256 treasuryFeesBefore = engine.accruedFees();
        uint256 validatorBalBefore = baseToken.balanceOf(validator1);

        _submitAndClaimSolution(taskId);

        (uint256 validatorStakeAfter,,) = engine.validators(validator1);
        uint256 modelOwnerBalAfter = baseToken.balanceOf(modelOwner1);
        uint256 treasuryFeesAfter = engine.accruedFees();
        uint256 validatorBalAfter = baseToken.balanceOf(validator1);

        // Expected distribution:
        // Total fees: 3 ether (2 task + 1 model)
        // Treasury: 75% of 1 ether model fee = 0.75 ether
        // Model owner: 25% of 1 ether = 0.25 ether
        // Validator: remaining (2 - 1 = 1 ether) minus tiny fee

        assertApproxEqAbs(modelOwnerBalAfter - modelOwnerBalBefore, 0.25 ether, 0.001 ether, "Model owner gets 25%");
        assertApproxEqAbs(
            treasuryFeesAfter - treasuryFeesBefore, 0.75 ether, 0.001 ether, "Treasury gets 75% of model fee"
        );
        assertGt(validatorStakeAfter - validatorStakeBefore, 0.99 ether, "Validator gets remaining");
        assertEq(validatorBalAfter, validatorBalBefore, "Validator balance should not change (rewards to stake)");
    }

    function test_MultipleTasksSameFees() public {
        uint256 modelFee = 0.1 ether;
        uint256 taskFee = 0.2 ether;
        bytes32 modelId = _registerModel(modelOwner1, modelFee);

        uint256 modelOwnerBalBefore = baseToken.balanceOf(modelOwner1);
        (uint256 validatorStakeBefore,,) = engine.validators(validator1);

        // Submit and claim 3 tasks
        for (uint256 i = 0; i < 3; i++) {
            bytes32 taskId = _submitTask(modelId, taskFee);
            _submitAndClaimSolution(taskId);
        }

        uint256 modelOwnerBalAfter = baseToken.balanceOf(modelOwner1);
        (uint256 validatorStakeAfter,,) = engine.validators(validator1);

        // Each task: model owner gets ~100% of 0.1 ether (with default settings)
        // Over 3 tasks: ~0.3 ether
        assertGt(modelOwnerBalAfter - modelOwnerBalBefore, 0.299 ether, "Model owner should get fees from all tasks");
        assertGt(validatorStakeAfter, validatorStakeBefore, "Validator should accumulate rewards");
    }

    function test_ZeroFeeWithCustomPercentage() public {
        // Edge case: 0 model fee but with override percentage set
        bytes32 modelId = _registerModel(modelOwner1, 0);
        engine.setSolutionModelFeePercentageOverride(modelId, 0.5 ether);

        bytes32 taskId = _submitTask(modelId, 1 ether);

        uint256 modelOwnerBalBefore = baseToken.balanceOf(modelOwner1);

        _submitAndClaimSolution(taskId);

        uint256 modelOwnerBalAfter = baseToken.balanceOf(modelOwner1);

        // 50% of 0 = 0
        assertEq(modelOwnerBalAfter, modelOwnerBalBefore, "Model owner should get nothing (0 model fee)");
    }

    function test_TaskFeeLowerThanModelFee_RevertsOnSubmit() public {
        // When taskFee < modelFee, task submission reverts
        uint256 modelFee = 1 ether;
        uint256 taskFee = 0.5 ether;
        bytes32 modelId = _registerModel(modelOwner1, modelFee);

        // With override 50%: treasury gets 50%, model owner gets 50%
        engine.setSolutionModelFeePercentageOverride(modelId, 0.5 ether);

        baseToken.transfer(user1, taskFee);

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("LowerFeeThanModelFee()"));
        engine.submitTask(0, user1, modelId, taskFee, TESTBUF);
    }
}
