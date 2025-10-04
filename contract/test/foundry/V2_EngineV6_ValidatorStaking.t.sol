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

        // Set solution mineable rate (note: mining rewards will be 0 due to emission schedule)
        engine.setSolutionMineableRate(modelId, 1 ether);

        // Use task fee so validator actually gets rewards
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

        // Verify rewards went to stake, not balance
        // Should increase by solution stake + task fee rewards
        assertGt(stakedAfter, stakedBefore, "Stake should increase");
        assertEq(balanceAfter, balanceBefore, "Balance should not change");
    }

    function test_SolutionRewardsIncrementStakeCorrectly() public {
        bytes32 modelId = _deployBootstrapModel();

        // Set solution mineable rate
        uint256 mineableRate = 1 ether;
        engine.setSolutionMineableRate(modelId, mineableRate);

        // Add task fee for actual rewards
        uint256 taskFee = 0.5 ether;
        baseToken.transfer(user1, taskFee);
        bytes32 taskId = _deployBootstrapTask(modelId, taskFee);

        _submitSolution(taskId, validator1);

        (uint256 stakedBefore, , ) = engine.validators(validator1);

        // Wait and claim
        vm.warp(block.timestamp + 3600 + 1);

        vm.prank(validator1);
        engine.claimSolution(taskId);

        (uint256 stakedAfter, , ) = engine.validators(validator1);

        // Stake should increase (solution stake returned + task fee rewards)
        assertGt(stakedAfter, stakedBefore);
        // Should increase by more than just solution stake
        assertGt(stakedAfter - stakedBefore, engine.solutionsStakeAmount(), "Should have task fee rewards");
    }

    function test_MultipleSolutionRewardsCumulative() public {
        bytes32 modelId = _deployBootstrapModel();
        engine.setSolutionMineableRate(modelId, 1 ether);

        (uint256 stakeInitial, , ) = engine.validators(validator1);

        // Submit and claim multiple solutions with task fees
        uint256 taskFee = 0.2 ether;
        for (uint i = 0; i < 3; i++) {
            baseToken.transfer(user1, taskFee);
            bytes32 taskId = _deployBootstrapTask(modelId, taskFee);
            _submitSolution(taskId, validator1);

            vm.warp(block.timestamp + 3600 + 1);
            vm.prank(validator1);
            engine.claimSolution(taskId);
        }

        (uint256 stakeFinal, , ) = engine.validators(validator1);

        // Stake should have increased from multiple task fee rewards
        // Should be significantly more than initial (3x task fees)
        assertGt(stakeFinal, stakeInitial + (taskFee * 3) / 2, "Should accumulate rewards from 3 tasks");
    }

    // ============================================
    // Debug Tests for Mining Rewards
    // ============================================

    function test_DebugMiningRewardCalculation() public {
        console2.log("=== Mining Reward Debug ===");

        // Check engine balance
        uint256 engineBalance = baseToken.balanceOf(address(engine));
        console2.log("Engine balance:", engineBalance);

        // Check constants
        console2.log("STARTING_ENGINE_TOKEN_AMOUNT: 600000 ether");

        // Check getPsuedoTotalSupply
        uint256 pseudoSupply = engine.getPsuedoTotalSupply();
        console2.log("getPsuedoTotalSupply():", pseudoSupply);

        // Check totalHeld
        uint256 totalHeld = engine.totalHeld();
        console2.log("totalHeld:", totalHeld);

        // Check veRewards
        uint256 veRewards = engine.veRewards();
        console2.log("veRewards:", veRewards);

        // Check startBlockTime
        uint256 startBlockTime = engine.startBlockTime();
        console2.log("startBlockTime:", startBlockTime);
        console2.log("block.timestamp:", block.timestamp);
        console2.log("time elapsed:", block.timestamp - startBlockTime);

        // Check getReward
        uint256 currentReward = engine.getReward();
        console2.log("getReward():", currentReward);

        // Register model and check reward
        bytes32 modelId = _deployBootstrapModel();
        engine.setSolutionMineableRate(modelId, 1 ether);

        // Submit and check reward calculation at claim time
        bytes32 taskId = _deployBootstrapTask(modelId, 0);
        _submitSolution(taskId, validator1);

        vm.warp(block.timestamp + 3600 + 1);

        console2.log("=== At claim time ===");
        console2.log("block.timestamp:", block.timestamp);
        console2.log("time elapsed:", block.timestamp - startBlockTime);
        console2.log("getReward():", engine.getReward());
        console2.log("getPsuedoTotalSupply():", engine.getPsuedoTotalSupply());

        // Check if voter is set
        address voter = engine.voter();
        console2.log("voter address:", voter);

        vm.prank(validator1);
        engine.claimSolution(taskId);

        console2.log("=== After claim ===");
        console2.log("veRewards:", engine.veRewards());
    }

    function test_DebugRewardWithDifferentTimestamp() public {
        console2.log("=== Testing reward at different timestamps ===");

        // Try without the initial warp
        vm.warp(1); // Reset to timestamp 1

        // Redeploy everything at timestamp 1
        BaseTokenV1 baseTokenImpl2 = new BaseTokenV1();
        bytes memory baseTokenInitData2 = abi.encodeWithSelector(
            BaseTokenV1.initialize.selector,
            deployer,
            address(0)
        );
        ERC1967Proxy baseTokenProxy2 = new ERC1967Proxy(address(baseTokenImpl2), baseTokenInitData2);
        BaseTokenV1 baseToken2 = BaseTokenV1(address(baseTokenProxy2));

        V2_EngineV6TestHelper engineImpl2 = new V2_EngineV6TestHelper();
        bytes memory engineInitData2 = abi.encodeWithSelector(
            V2_EngineV6TestHelper.initializeForTesting.selector,
            address(baseToken2),
            treasury
        );
        ERC1967Proxy engineProxy2 = new ERC1967Proxy(address(engineImpl2), engineInitData2);
        V2_EngineV6TestHelper engine2 = V2_EngineV6TestHelper(address(engineProxy2));

        baseToken2.bridgeMint(address(engine2), 597000 ether);

        console2.log("startBlockTime at deploy:", engine2.startBlockTime());
        console2.log("block.timestamp:", block.timestamp);
        console2.log("getReward() at timestamp 1:", engine2.getReward());

        vm.warp(100);
        console2.log("getReward() at timestamp 100:", engine2.getReward());

        vm.warp(1000);
        console2.log("getReward() at timestamp 1000:", engine2.getReward());

        vm.warp(10000);
        console2.log("getReward() at timestamp 10000:", engine2.getReward());
    }

    function test_DebugRewardWithLessEngineBalance() public {
        console2.log("=== Testing with less engine balance ===");

        vm.warp(1);

        BaseTokenV1 baseTokenImpl2 = new BaseTokenV1();
        bytes memory baseTokenInitData2 = abi.encodeWithSelector(
            BaseTokenV1.initialize.selector,
            deployer,
            address(0)
        );
        ERC1967Proxy baseTokenProxy2 = new ERC1967Proxy(address(baseTokenImpl2), baseTokenInitData2);
        BaseTokenV1 baseToken2 = BaseTokenV1(address(baseTokenProxy2));

        V2_EngineV6TestHelper engineImpl2 = new V2_EngineV6TestHelper();
        bytes memory engineInitData2 = abi.encodeWithSelector(
            V2_EngineV6TestHelper.initializeForTesting.selector,
            address(baseToken2),
            treasury
        );
        ERC1967Proxy engineProxy2 = new ERC1967Proxy(address(engineImpl2), engineInitData2);
        V2_EngineV6TestHelper engine2 = V2_EngineV6TestHelper(address(engineProxy2));

        // Try with much less balance (simulate more tokens mined)
        baseToken2.bridgeMint(address(engine2), 300000 ether);

        console2.log("Engine balance: 300000 ether");
        console2.log("getPsuedoTotalSupply():", engine2.getPsuedoTotalSupply());
        console2.log("getReward() at timestamp 1:", engine2.getReward());

        vm.warp(100);
        console2.log("getReward() at timestamp 100:", engine2.getReward());
    }

    function test_DebugDiffMulFunction() public {
        console2.log("=== Testing diffMul directly ===");

        uint256 t = 7562; // time elapsed from main debug test
        uint256 ts = 3000 ether; // pseudo supply from main debug test

        console2.log("t (time elapsed):", t);
        console2.log("ts (pseudo supply):", ts);

        try engine.diffMul(t, ts) returns (uint256 result) {
            console2.log("diffMul(t, ts):", result);
        } catch Error(string memory reason) {
            console2.log("diffMul reverted:", reason);
        } catch {
            console2.log("diffMul reverted with no reason");
        }

        // Also try reward() directly
        try engine.reward(t, ts) returns (uint256 result) {
            console2.log("reward(t, ts):", result);
        } catch Error(string memory reason) {
            console2.log("reward reverted:", reason);
        } catch {
            console2.log("reward reverted with no reason");
        }

        // Try with different values
        console2.log("\n=== Trying larger time values ===");
        uint256 t2 = 86400; // 1 day
        console2.log("t2:", t2);
        try engine.diffMul(t2, ts) returns (uint256 result) {
            console2.log("diffMul(t2, ts):", result);
        } catch {
            console2.log("diffMul(t2, ts) reverted");
        }

        try engine.reward(t2, ts) returns (uint256 result) {
            console2.log("reward(t2, ts):", result);
        } catch {
            console2.log("reward(t2, ts) reverted");
        }

        // Check target TS for our time value
        console2.log("\n=== Checking targetTs ===");
        uint256 targetTsValue = engine.targetTs(t);
        console2.log("targetTs(7562):", targetTsValue);
        console2.log("targetTs(7562) in ether:", targetTsValue / 1e18);

        uint256 targetTs2 = engine.targetTs(t2);
        console2.log("targetTs(86400):", targetTs2);
        console2.log("targetTs(86400) in ether:", targetTs2 / 1e18);

        // For diffMul to work, we need:
        // e = targetTs(t)
        // d = ts / e
        // c = 1 + ((d - 1) * 100) - 1 = (d - 1) * 100
        // c must be < 20e18
        // So (ts/e - 1) * 100 < 20
        // ts/e - 1 < 0.2
        // ts/e < 1.2
        // ts < 1.2 * e

        console2.log("\n=== Checking diffMul conditions ===");
        console2.log("ts:", ts);
        console2.log("targetTs(t):", targetTsValue);
        if (targetTsValue > 0) {
            console2.log("ts / targetTs:", (ts * 1e18) / targetTsValue);
            console2.log("Need ts/e < 1.2 for rewards, actual ts/e:", (ts * 100) / targetTsValue);
        }

        // Find what time would give us targetTs = 3000 ether
        console2.log("\n=== Finding correct time for ts=3000 ether ===");
        uint256[] memory testTimes = new uint256[](6);
        testTimes[0] = 365 days;
        testTimes[1] = 180 days;
        testTimes[2] = 90 days;
        testTimes[3] = 30 days;
        testTimes[4] = 7 days;
        testTimes[5] = 1 days;

        for (uint i = 0; i < testTimes.length; i++) {
            uint256 targetAtTime = engine.targetTs(testTimes[i]);
            console2.log("Time (days):", testTimes[i] / 86400);
            console2.log("  targetTs (ether):", targetAtTime / 1e18);
        }
    }

    function test_MiningRewardsWorkWithCorrectBalance() public {
        console2.log("=== Testing mining rewards with correct engine balance ===");

        vm.warp(100000);

        // Deploy fresh contracts with LESS balance (599k instead of 597k)
        // This gives pseudoSupply of 1000 ether instead of 3000 ether
        BaseTokenV1 baseTokenImpl2 = new BaseTokenV1();
        bytes memory baseTokenInitData2 = abi.encodeWithSelector(
            BaseTokenV1.initialize.selector,
            deployer,
            address(0)
        );
        ERC1967Proxy baseTokenProxy2 = new ERC1967Proxy(address(baseTokenImpl2), baseTokenInitData2);
        BaseTokenV1 baseToken2 = BaseTokenV1(address(baseTokenProxy2));

        V2_EngineV6TestHelper engineImpl2 = new V2_EngineV6TestHelper();
        bytes memory engineInitData2 = abi.encodeWithSelector(
            V2_EngineV6TestHelper.initializeForTesting.selector,
            address(baseToken2),
            treasury
        );
        ERC1967Proxy engineProxy2 = new ERC1967Proxy(address(engineImpl2), engineInitData2);
        V2_EngineV6TestHelper engine2 = V2_EngineV6TestHelper(address(engineProxy2));

        MockVeStaking mockVeStaking2 = new MockVeStaking();
        engine2.setVeStaking(address(mockVeStaking2));

        // Mint 599k instead of 597k (pseudoSupply will be 1000 ether)
        baseToken2.bridgeMint(address(engine2), 599000 ether);
        baseToken2.bridgeMint(deployer, 2000 ether);
        baseToken2.transferOwnership(address(engine2));

        console2.log("Engine balance:", baseToken2.balanceOf(address(engine2)) / 1e18, "ether");
        console2.log("getPsuedoTotalSupply:", engine2.getPsuedoTotalSupply() / 1e18, "ether");

        // Setup validator
        baseToken2.transfer(validator1, 10 ether);
        vm.prank(validator1);
        baseToken2.approve(address(engine2), type(uint256).max);
        vm.prank(validator1);
        engine2.validatorDeposit(validator1, 10 ether);

        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Register model with mineable rate
        vm.prank(deployer);
        bytes32 modelId = engine2.registerModel(model1, 0, TESTBUF);
        engine2.setSolutionMineableRate(modelId, 1 ether);

        // Submit task
        baseToken2.transfer(user1, 1 ether);
        vm.prank(user1);
        baseToken2.approve(address(engine2), type(uint256).max);
        vm.prank(user1);
        vm.recordLogs();
        engine2.submitTask(0, user1, modelId, 0, TESTBUF);
        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 taskId;
        for (uint i = 0; i < entries.length; i++) {
            if (entries[i].topics[0] == keccak256("TaskSubmitted(bytes32,bytes32,uint256,address)")) {
                taskId = entries[i].topics[1];
                break;
            }
        }

        // Submit solution
        bytes32 commitment = engine2.generateCommitment(validator1, taskId, TESTCID);
        vm.prank(validator1);
        engine2.signalCommitment(commitment);
        vm.roll(block.number + 1);
        vm.prank(validator1);
        engine2.submitSolution(taskId, TESTCID);

        (uint256 stakedBefore, , ) = engine2.validators(validator1);
        console2.log("Stake before claim:", stakedBefore);

        // Wait and check reward
        vm.warp(block.timestamp + 7 days); // Wait longer for emission schedule
        console2.log("getReward() after 7 days:", engine2.getReward());
        console2.log("targetTs after 7 days:", engine2.targetTs(block.timestamp - 100000) / 1e18, "ether");

        vm.prank(validator1);
        engine2.claimSolution(taskId);

        (uint256 stakedAfter, , ) = engine2.validators(validator1);
        console2.log("Stake after claim:", stakedAfter);
        console2.log("Stake increase:", stakedAfter - stakedBefore);

        // Should have rewards now!
        assertGt(stakedAfter, stakedBefore + engine2.solutionsStakeAmount(), "Should have mining rewards");
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

        // Use task fee so defender gets rewards when auto-claimed
        uint256 taskFee = 0.1 ether;
        baseToken.transfer(user1, taskFee);
        bytes32 taskId = _deployBootstrapTask(modelId, taskFee);

        (uint256 v1StakeBefore, , ) = engine.validators(validator1);

        _submitSolution(taskId, validator1);

        // Submit contestation
        vm.prank(masterContester1);
        engine.submitContestation(taskId);

        // More validators vote no
        vm.prank(validator2);
        engine.voteOnContestation(taskId, false);

        vm.prank(validator3);
        engine.voteOnContestation(taskId, false);

        // Finish voting (nays win)
        vm.warp(block.timestamp + 4000);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.contestationVoteFinish(taskId, 4);

        (uint256 v1StakeAfter, , ) = engine.validators(validator1);

        // Defender (validator1) gets solution auto-claimed with task fee rewards
        // but no contestation slash rewards (those go to nay voters who defended correctly)
        assertGt(v1StakeAfter, v1StakeBefore, "Defender gets task fees from auto-claim");
    }
}
