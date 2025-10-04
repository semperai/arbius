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
 * @title V2_EngineV6_ValidatorStakingTest
 * @notice Tests for V2_EngineV6 direct validator staking for rewards
 * @dev Ported from Hardhat test: enginev6.comprehensive.test.ts (lines 1136-1210)
 *
 * V6 Change: Rewards go directly to validator stake instead of balance
 *
 * Tests cover:
 * - Solution rewards staked directly to validators
 * - Contestation rewards staked to winners
 * - Verify balance unchanged, stake increased
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

contract V2_EngineV6_ValidatorStakingTest is Test {
    BaseTokenV1 public baseToken;
    V2_EngineV6TestHelper public engine;
    MasterContesterRegistry public masterContesterRegistry;

    address public deployer;
    address public user1;
    address public validator1;
    address public validator2;
    address public validator3;
    address public masterContester1;
    address public model1;
    address public treasury;

    bytes public constant TESTCID = hex"1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8";
    bytes public constant TESTBUF = hex"746573740a";

    function setUp() public {
        deployer = address(this);
        user1 = makeAddr("user1");
        validator1 = makeAddr("validator1");
        validator2 = makeAddr("validator2");
        validator3 = makeAddr("validator3");
        masterContester1 = makeAddr("masterContester1");
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

    function _deployBootstrapModel() internal returns (bytes32) {
        vm.prank(user1);
        return engine.registerModel(model1, 0, TESTBUF);
    }

    function _deployBootstrapTask(bytes32 modelId, uint256 fee) internal returns (bytes32) {
        vm.prank(user1);
        vm.recordLogs();
        engine.submitTask(0, user1, modelId, fee, TESTBUF);

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
    // Direct Validator Staking for Solution Rewards
    // ============================================

    function test_SolutionRewardsStakedDirectly() public {
        bytes32 modelId = _deployBootstrapModel();

        // Set solution mineable rate for rewards
        engine.setSolutionMineableRate(modelId, 1 ether);

        bytes32 taskId = _deployBootstrapTask(modelId, 0);

        _submitSolution(taskId, validator1);

        (uint256 stakedBefore, , ) = engine.validators(validator1);
        uint256 balanceBefore = baseToken.balanceOf(validator1);

        // Wait and claim
        vm.warp(block.timestamp + 3600 + 1);

        vm.prank(validator1);
        engine.claimSolution(taskId);

        (uint256 stakedAfter, , ) = engine.validators(validator1);
        uint256 balanceAfter = baseToken.balanceOf(validator1);

        // Verify rewards went to stake, not balance
        assertGt(stakedAfter, stakedBefore, "Stake should increase");
        assertEq(balanceAfter, balanceBefore, "Balance should not change");
    }

    function test_SolutionRewardsIncrementStakeCorrectly() public {
        bytes32 modelId = _deployBootstrapModel();

        // Set solution mineable rate
        uint256 mineableRate = 1 ether;
        engine.setSolutionMineableRate(modelId, mineableRate);

        bytes32 taskId = _deployBootstrapTask(modelId, 0);

        _submitSolution(taskId, validator1);

        (uint256 stakedBefore, , ) = engine.validators(validator1);

        // Wait and claim
        vm.warp(block.timestamp + 3600 + 1);

        vm.prank(validator1);
        engine.claimSolution(taskId);

        (uint256 stakedAfter, , ) = engine.validators(validator1);

        // Stake should increase by at least some reward amount
        // (exact amount depends on treasury percentage and other factors)
        assertGt(stakedAfter, stakedBefore);
    }

    function test_MultipleSolutionRewardsCumulative() public {
        bytes32 modelId = _deployBootstrapModel();
        engine.setSolutionMineableRate(modelId, 1 ether);

        (uint256 stakeInitial, , ) = engine.validators(validator1);

        // Submit and claim multiple solutions
        for (uint i = 0; i < 3; i++) {
            bytes32 taskId = _deployBootstrapTask(modelId, 0);
            _submitSolution(taskId, validator1);

            vm.warp(block.timestamp + 3600 + 1);
            vm.prank(validator1);
            engine.claimSolution(taskId);
        }

        (uint256 stakeFinal, , ) = engine.validators(validator1);

        // Stake should have increased from multiple rewards
        assertGt(stakeFinal, stakeInitial);
    }

    // ============================================
    // Contestation Rewards Staked Directly
    // ============================================

    function test_ContestationRewardsStakedToWinners() public {
        masterContesterRegistry.emergencyAddMasterContester(masterContester1);

        bytes32 modelId = _deployBootstrapModel();
        bytes32 taskId = _deployBootstrapTask(modelId, 0);

        _submitSolution(taskId, validator1);

        // Submit contestation and vote
        vm.prank(masterContester1);
        engine.submitContestation(taskId);

        vm.prank(validator2);
        engine.voteOnContestation(taskId, true);

        (uint256 mc1StakeBefore, , ) = engine.validators(masterContester1);
        (uint256 v2StakeBefore, , ) = engine.validators(validator2);
        uint256 mc1BalanceBefore = baseToken.balanceOf(masterContester1);
        uint256 v2BalanceBefore = baseToken.balanceOf(validator2);

        // Finish voting
        vm.warp(block.timestamp + 4000);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.contestationVoteFinish(taskId, 3);

        (uint256 mc1StakeAfter, , ) = engine.validators(masterContester1);
        (uint256 v2StakeAfter, , ) = engine.validators(validator2);
        uint256 mc1BalanceAfter = baseToken.balanceOf(masterContester1);
        uint256 v2BalanceAfter = baseToken.balanceOf(validator2);

        // Verify rewards went to stake, not balance
        assertGt(mc1StakeAfter, mc1StakeBefore, "MC1 stake should increase");
        assertGt(v2StakeAfter, v2StakeBefore, "V2 stake should increase");
        assertEq(mc1BalanceAfter, mc1BalanceBefore, "MC1 balance should not change");
        assertEq(v2BalanceAfter, v2BalanceBefore, "V2 balance should not change");
    }

    function test_ContestationWinnersShareRewardsInStake() public {
        masterContesterRegistry.emergencyAddMasterContester(masterContester1);

        bytes32 modelId = _deployBootstrapModel();
        bytes32 taskId = _deployBootstrapTask(modelId, 0);

        _submitSolution(taskId, validator1);

        // Submit contestation
        vm.prank(masterContester1);
        engine.submitContestation(taskId);

        // Multiple validators vote yes
        vm.prank(validator2);
        engine.voteOnContestation(taskId, true);

        vm.prank(validator3);
        engine.voteOnContestation(taskId, true);

        (uint256 mc1StakeBefore, , ) = engine.validators(masterContester1);
        (uint256 v2StakeBefore, , ) = engine.validators(validator2);
        (uint256 v3StakeBefore, , ) = engine.validators(validator3);

        // Finish voting
        vm.warp(block.timestamp + 4000);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.contestationVoteFinish(taskId, 4);

        (uint256 mc1StakeAfter, , ) = engine.validators(masterContester1);
        (uint256 v2StakeAfter, , ) = engine.validators(validator2);
        (uint256 v3StakeAfter, , ) = engine.validators(validator3);

        // All winners should have increased stake
        assertGt(mc1StakeAfter, mc1StakeBefore, "MC1 should get rewards");
        assertGt(v2StakeAfter, v2StakeBefore, "V2 should get rewards");
        assertGt(v3StakeAfter, v3StakeBefore, "V3 should get rewards");
    }

    // ============================================
    // Edge Cases
    // ============================================

    function test_ZeroRewardsDoNotAffectStake() public {
        bytes32 modelId = _deployBootstrapModel();

        // No mineable rate set (0 rewards)
        bytes32 taskId = _deployBootstrapTask(modelId, 0);

        _submitSolution(taskId, validator1);

        (uint256 stakedBefore, , ) = engine.validators(validator1);
        uint256 solutionStakeAmount = engine.solutionsStakeAmount();

        // Wait and claim
        vm.warp(block.timestamp + 3600 + 1);

        vm.prank(validator1);
        engine.claimSolution(taskId);

        (uint256 stakedAfter, , ) = engine.validators(validator1);

        // Stake should only increase by solution stake returned (no rewards)
        assertEq(stakedAfter, stakedBefore + solutionStakeAmount);
    }

    function test_StakeIncreasesWithTaskFees() public {
        bytes32 modelId = _deployBootstrapModel();

        uint256 taskFee = 0.1 ether;
        baseToken.transfer(user1, taskFee);
        bytes32 taskId = _deployBootstrapTask(modelId, taskFee);

        _submitSolution(taskId, validator1);

        (uint256 stakedBefore, , ) = engine.validators(validator1);
        uint256 balanceBefore = baseToken.balanceOf(validator1);

        // Wait and claim
        vm.warp(block.timestamp + 3600 + 1);

        vm.prank(validator1);
        engine.claimSolution(taskId);

        (uint256 stakedAfter, , ) = engine.validators(validator1);
        uint256 balanceAfter = baseToken.balanceOf(validator1);

        // Validator should receive task fee in stake (minus any model fees)
        assertGt(stakedAfter, stakedBefore);
        assertEq(balanceAfter, balanceBefore);
    }

    function test_FailedContestationDoesNotRewardDefender() public {
        masterContesterRegistry.emergencyAddMasterContester(masterContester1);

        bytes32 modelId = _deployBootstrapModel();
        bytes32 taskId = _deployBootstrapTask(modelId, 0);

        _submitSolution(taskId, validator1);

        // Submit contestation
        vm.prank(masterContester1);
        engine.submitContestation(taskId);

        // More validators vote no
        vm.prank(validator2);
        engine.voteOnContestation(taskId, false);

        vm.prank(validator3);
        engine.voteOnContestation(taskId, false);

        (uint256 v1StakeBefore, , ) = engine.validators(validator1);

        // Finish voting (nays win)
        vm.warp(block.timestamp + 4000);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.contestationVoteFinish(taskId, 4);

        (uint256 v1StakeAfter, , ) = engine.validators(validator1);

        // Defender (validator1) gets solution auto-claimed but no contestation rewards
        // Stake should increase from solution claim
        assertGt(v1StakeAfter, v1StakeBefore);
    }
}
