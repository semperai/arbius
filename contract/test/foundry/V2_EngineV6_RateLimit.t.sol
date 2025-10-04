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
 * @title V2_EngineV6_RateLimitTest
 * @notice Tests for rate limiting and Difficulty Adjustment Algorithm (DAA) in V2_EngineV6
 * @dev Ported from Hardhat TypeScript tests
 */
contract V2_EngineV6_RateLimitTest is Test {
    BaseTokenV1 public baseToken;
    V2_EngineV6TestHelper public engine;
    MasterContesterRegistry public masterContesterRegistry;

    address public deployer;
    address public user1;
    address public validator1;
    address public validator2;
    address public validator3;
    address public validator4;
    address public treasury;

    bytes public constant TESTCID = hex"1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8";
    bytes public constant TESTBUF = hex"746573740a";

    uint256 constant ONE_YEAR = 31536000;
    uint256 constant TWO_YEARS = 63072000;

    function setUp() public {
        deployer = address(this);
        user1 = makeAddr("user1");
        validator1 = makeAddr("validator1");
        validator2 = makeAddr("validator2");
        validator3 = makeAddr("validator3");
        validator4 = makeAddr("validator4");
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

        // Deploy V6 Engine using test helper
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

        // Setup initial token distribution
        baseToken.bridgeMint(deployer, 2000 ether);
        baseToken.transferOwnership(address(engine));

        // Approve engine for validators
        vm.prank(validator1);
        baseToken.approve(address(engine), type(uint256).max);
        vm.prank(validator2);
        baseToken.approve(address(engine), type(uint256).max);
        vm.prank(validator3);
        baseToken.approve(address(engine), type(uint256).max);
        vm.prank(validator4);
        baseToken.approve(address(engine), type(uint256).max);
    }

    // Helper functions
    function deployBootstrapValidator() internal returns (address) {
        baseToken.bridgeMint(address(engine), 599990 ether);
        baseToken.transfer(validator1, 2.4 ether);

        vm.prank(validator1);
        engine.validatorDeposit(validator1, 2.4 ether);

        return validator1;
    }

    function deployBootstrapModel() internal returns (bytes32) {
        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: 0,
            rate: 0,
            cid: TESTCID
        });

        bytes32 modelid = engine.hashModel(modelParams, user1);

        vm.prank(user1);
        engine.registerModel(modelParams.addr, modelParams.fee, TESTBUF);

        return modelid;
    }

    function deployBootstrapTask(bytes32 modelid) internal returns (bytes32) {
        vm.prank(validator1);
        vm.recordLogs();
        engine.submitTask(0, user1, modelid, 0, TESTBUF);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 taskid = entries[0].topics[1];

        return taskid;
    }

    /*//////////////////////////////////////////////////////////////
                    SOLUTION RATE LIMITING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_EnforceSolutionSubmissionRateLimit() public {
        deployBootstrapValidator();
        bytes32 modelid = deployBootstrapModel();

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Prepare two tasks
        bytes32 taskid1 = deployBootstrapTask(modelid);
        bytes32 taskid2 = deployBootstrapTask(modelid);

        // Signal commitments
        bytes32 commitment1 = engine.generateCommitment(validator1, taskid1, TESTCID);
        bytes32 commitment2 = engine.generateCommitment(validator1, taskid2, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment1);
        vm.prank(validator1);
        engine.signalCommitment(commitment2);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        // Try to submit two solutions in the same block - first should succeed, second should fail
        vm.prank(validator1);
        engine.submitSolution(taskid1, TESTCID);

        // Second should fail due to rate limiting
        vm.prank(validator1);
        vm.expectRevert();
        engine.submitSolution(taskid2, TESTCID);
    }

    function test_RateLimitResetsAfterDelay() public {
        deployBootstrapValidator();
        bytes32 modelid = deployBootstrapModel();

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Prepare two tasks
        bytes32 taskid1 = deployBootstrapTask(modelid);
        bytes32 taskid2 = deployBootstrapTask(modelid);

        // Signal commitments
        bytes32 commitment1 = engine.generateCommitment(validator1, taskid1, TESTCID);
        bytes32 commitment2 = engine.generateCommitment(validator1, taskid2, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment1);
        vm.prank(validator1);
        engine.signalCommitment(commitment2);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        // Submit first solution
        vm.prank(validator1);
        engine.submitSolution(taskid1, TESTCID);

        // Advance time by 5 seconds (rate limit window)
        vm.warp(block.timestamp + 5);
        vm.roll(block.number + 1);

        // Now second solution should work
        vm.prank(validator1);
        engine.submitSolution(taskid2, TESTCID);
    }

    /*//////////////////////////////////////////////////////////////
                DAA (DIFFICULTY ADJUSTMENT ALGORITHM) TESTS
    //////////////////////////////////////////////////////////////*/

    function test_TargetTsCalculation() public {
        // V6 uses doubled emission schedule: exp2(t/(60*60*24*365*2))
        assertEq(engine.targetTs(0), 0);

        // Test monotonically increasing in early years
        uint256 target1 = engine.targetTs(ONE_YEAR);
        uint256 target2 = engine.targetTs(TWO_YEARS);
        uint256 target4 = engine.targetTs(4 * ONE_YEAR);

        assertTrue(target1 > 0);
        assertTrue(target2 > target1);
        assertTrue(target4 > target2);

        // At very long time (~100+ years), should cap at STARTING_ENGINE_TOKEN_AMOUNT
        uint256 targetMax = engine.targetTs(4000000000);
        assertLe(targetMax, 600000 ether); // Max is STARTING_ENGINE_TOKEN_AMOUNT
    }

    function test_DifficultyMultiplierBounds() public {
        // When actual supply is well below target, difficulty multiplier is capped at 100
        assertEq(engine.diffMul(ONE_YEAR, 50000 ether), 100 ether);

        // When supply exceeds max significantly, rewards are 0
        assertEq(engine.diffMul(ONE_YEAR, 250000 ether), 0);
        assertEq(engine.diffMul(ONE_YEAR, 300000 ether), 0);
    }

    function test_DifficultyMultiplierDecreases() public {
        // Test basic properties: diffMul should decrease as supply increases
        uint256 diffLow = engine.diffMul(ONE_YEAR, 100000 ether);
        uint256 diffHigh = engine.diffMul(ONE_YEAR, 290000 ether);

        // Low supply should have higher difficulty multiplier
        assertGe(diffLow, diffHigh);

        // Both should be positive (unless supply exceeds max)
        assertTrue(diffLow > 0);
        assertGe(diffHigh, 0);
    }

    function test_RewardCalculation() public {
        // When supply is low (50k), rewards should be high
        uint256 reward50k = engine.reward(ONE_YEAR, 50000 ether);
        assertGt(reward50k, 50 ether); // Should be significant

        // When supply is moderate (100k), rewards decrease
        uint256 reward100k = engine.reward(ONE_YEAR, 100000 ether);
        assertTrue(reward100k > 0);
        assertLt(reward100k, reward50k);

        // When supply approaches target at year 2 (150k), rewards are moderate
        uint256 reward150k = engine.reward(TWO_YEARS, 150000 ether);
        assertTrue(reward150k > 0);
        assertLt(reward150k, reward100k);

        // At or above max supply, rewards should be 0
        assertEq(engine.reward(ONE_YEAR, 250000 ether), 0);
        assertEq(engine.reward(ONE_YEAR, 300000 ether), 0);
    }

    function test_RewardDecreasesWithSupply() public {
        // Reward should decrease as supply increases (at same time)
        uint256 reward140k = engine.reward(TWO_YEARS, 140000 ether);
        uint256 reward145k = engine.reward(TWO_YEARS, 145000 ether);
        uint256 reward150k = engine.reward(TWO_YEARS, 150000 ether);
        uint256 reward155k = engine.reward(TWO_YEARS, 155000 ether);

        assertGt(reward140k, reward145k);
        assertGt(reward145k, reward150k);
        assertGt(reward150k, reward155k);
    }

    function test_TargetTsAtVariousTimes() public {
        // Test target at various time points
        uint256 target6months = engine.targetTs(ONE_YEAR / 2);
        uint256 target1year = engine.targetTs(ONE_YEAR);
        uint256 target3years = engine.targetTs(3 * ONE_YEAR);
        uint256 target10years = engine.targetTs(10 * ONE_YEAR);

        // Should be monotonically increasing
        assertTrue(target6months > 0);
        assertTrue(target1year > target6months);
        assertTrue(target3years > target1year);
        assertTrue(target10years > target3years);

        // All should be below max supply
        assertLe(target6months, 600000 ether);
        assertLe(target1year, 600000 ether);
        assertLe(target3years, 600000 ether);
        assertLe(target10years, 600000 ether);
    }

    function test_DiffMulAtSmallTime() public {
        // At small time (1 year), with very low supply, diffMul should be maxed (100)
        uint256 diffLow = engine.diffMul(ONE_YEAR, 1000 ether);
        assertEq(diffLow, 100 ether);
    }

    function test_RewardAtSmallTime() public {
        // At small time with very low supply, reward should be high
        uint256 rewardLow = engine.reward(ONE_YEAR, 1000 ether);
        assertGt(rewardLow, 0);
        // Should be significant due to low supply
        assertGt(rewardLow, 10 ether);
    }

    function test_DiffMulAtMaxSupply() public {
        // When supply equals or exceeds max (600k), diffMul should be 0
        assertEq(engine.diffMul(ONE_YEAR, 600000 ether), 0);
        assertEq(engine.diffMul(ONE_YEAR, 700000 ether), 0);
    }

    function test_RewardAtHighSupply() public {
        // When supply is high, rewards should be low or zero
        uint256 target1 = engine.targetTs(ONE_YEAR);
        uint256 rewardAtTarget = engine.reward(ONE_YEAR, target1);

        // Should be positive but less than BASE_REWARD
        assertGe(rewardAtTarget, 0);
        assertLe(rewardAtTarget, 1 ether);
    }
}
