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
 * @title V2_EngineV6_MasterContesterTest
 * @notice Tests for V2_EngineV6 Master Contester functionality
 * @dev Ported from Hardhat test: enginev6.comprehensive.test.ts
 *
 * Tests cover:
 * - Master contester vote adder mechanism
 * - Multiple master contesters voting
 * - Master contester vs master contester scenarios
 * - Suggest contestation (non-master contesters)
 * - Edge cases and stake requirements
 * - Division by zero prevention
 */
contract V2_EngineV6_MasterContesterTest is Test {
    BaseTokenV1 public baseToken;
    V2_EngineV6TestHelper public engine;
    MasterContesterRegistry public masterContesterRegistry;

    address public deployer;
    address public user1;
    address public user2;
    address public validator1;
    address public validator2;
    address public validator3;
    address public validator4;
    address public masterContester1;
    address public masterContester2;
    address public model1;
    address public treasury;

    bytes public constant TESTCID = hex"1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8";
    bytes public constant TESTBUF = hex"746573740a";

    event ContestationSubmitted(address indexed validator, bytes32 indexed taskid);
    event ContestationSuggested(address indexed suggestor, bytes32 indexed taskid);
    event ContestationVote(address indexed validator, bytes32 indexed taskid, bool yea);
    event ContestationVoteFinish(
        bytes32 indexed taskid,
        uint256 start_idx,
        uint256 end_idx,
        bool rewarded
    );
    event MasterContesterVoteAdderSet(uint32 amount);

    function setUp() public {
        deployer = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        validator1 = makeAddr("validator1");
        validator2 = makeAddr("validator2");
        validator3 = makeAddr("validator3");
        validator4 = makeAddr("validator4");
        masterContester1 = makeAddr("masterContester1");
        masterContester2 = makeAddr("masterContester2");
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

        // Setup regular validators
        address[4] memory validators = [validator1, validator2, validator3, validator4];
        for (uint256 i = 0; i < validators.length; i++) {
            baseToken.transfer(validators[i], 10 ether);
            vm.prank(validators[i]);
            baseToken.approve(address(engine), type(uint256).max);
            vm.prank(validators[i]);
            engine.validatorDeposit(validators[i], 10 ether);
        }

        // Setup master contesters as validators too
        address[2] memory masterContesters = [masterContester1, masterContester2];
        for (uint256 i = 0; i < masterContesters.length; i++) {
            baseToken.transfer(masterContesters[i], 10 ether);
            vm.prank(masterContesters[i]);
            baseToken.approve(address(engine), type(uint256).max);
            vm.prank(masterContesters[i]);
            engine.validatorDeposit(masterContesters[i], 10 ether);
        }

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);
    }

    function _deployBootstrapModel() internal returns (bytes32) {
        vm.prank(user1);
        return engine.registerModel(model1, 0, TESTBUF);
    }

    function _deployBootstrapTask(bytes32 modelId, address submitter) internal returns (bytes32) {
        vm.prank(submitter);
        vm.recordLogs();
        engine.submitTask(
            0, // version
            submitter,
            modelId,
            0, // fee
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

    function _submitSolution(bytes32 taskId, address validator) internal {
        bytes32 commitment = engine.generateCommitment(validator, taskId, TESTCID);
        vm.prank(validator);
        engine.signalCommitment(commitment);
        vm.roll(block.number + 1);
        vm.prank(validator);
        engine.submitSolution(taskId, TESTCID);
    }

    // ============================================
    // Master Contester Vote Adder Tests
    // ============================================

    function test_MasterContesterVoteAdderInitialization() public {
        assertEq(engine.masterContesterVoteAdder(), 50);
    }

    function test_SetMasterContesterVoteAdder() public {
        vm.expectEmit(true, false, false, true);
        emit MasterContesterVoteAdderSet(75);
        engine.setMasterContesterVoteAdder(75);

        assertEq(engine.masterContesterVoteAdder(), 75);
    }

    function test_RevertWhenVoteAdderExceeds500() public {
        vm.expectRevert("InvalidMultiplier()");
        engine.setMasterContesterVoteAdder(501);
    }

    function test_MasterContesterCanSubmitContestation() public {
        masterContesterRegistry.emergencyAddMasterContester(masterContester1);

        bytes32 modelId = _deployBootstrapModel();
        bytes32 taskId = _deployBootstrapTask(modelId, user1);
        _submitSolution(taskId, validator1);

        // Master contester submits contestation
        vm.prank(masterContester1);
        vm.expectEmit(true, true, false, false);
        emit ContestationSubmitted(masterContester1, taskId);
        engine.submitContestation(taskId);
    }

    function test_RevertWhenNonMasterContesterTriesToContest() public {
        bytes32 modelId = _deployBootstrapModel();
        bytes32 taskId = _deployBootstrapTask(modelId, user1);
        _submitSolution(taskId, validator1);

        // Regular validator tries to submit contestation
        vm.prank(validator2);
        vm.expectRevert(); // Will revert with onlyMasterContester modifier
        engine.submitContestation(taskId);
    }

    function test_RevertWhenMasterContesterNotValidator() public {
        masterContesterRegistry.emergencyAddMasterContester(user1);

        bytes32 modelId = _deployBootstrapModel();
        bytes32 taskId = _deployBootstrapTask(modelId, user1);
        _submitSolution(taskId, validator1);

        // Master contester without validator stake tries contestation
        vm.prank(user1);
        vm.expectRevert("MasterContesterMinStakedTooLow()");
        engine.submitContestation(taskId);
    }

    function test_MasterContesterVoteAdderAppliedInContestation() public {
        masterContesterRegistry.emergencyAddMasterContester(masterContester1);

        bytes32 modelId = _deployBootstrapModel();
        bytes32 taskId = _deployBootstrapTask(modelId, user1);
        _submitSolution(taskId, validator1);

        // Master contester submits contestation (auto-votes yes)
        vm.prank(masterContester1);
        engine.submitContestation(taskId);

        // Add another yes voter to test adder effect
        vm.prank(validator2);
        engine.voteOnContestation(taskId, true);

        // Fast forward and finish voting
        vm.warp(block.timestamp + 4000);
        vm.roll(block.number + 1);

        // With vote adder of 50, master contester + validator2 get 52 effective votes (2 + 50)
        // vs 1 nay vote from solution submitter
        vm.prank(validator1);
        vm.expectEmit(true, false, false, false);
        emit ContestationVoteFinish(taskId, 0, 3, true);
        engine.contestationVoteFinish(taskId, 3);

        // Verify contestation succeeded due to vote adder
        uint256 lastLossTime = engine.lastContestationLossTime(validator1);
        assertGt(lastLossTime, 0);
    }

    // ============================================
    // Suggest Contestation Tests
    // ============================================

    function test_AnyoneCanSuggestContestation() public {
        bytes32 modelId = _deployBootstrapModel();
        bytes32 taskId = _deployBootstrapTask(modelId, user1);
        _submitSolution(taskId, validator1);

        // Anyone can suggest contestation
        vm.prank(user1);
        vm.expectEmit(true, true, false, false);
        emit ContestationSuggested(user1, taskId);
        engine.suggestContestation(taskId);
    }

    function test_RevertSuggestContestationWhenSolutionNotFound() public {
        bytes32 fakeTaskId = keccak256("fake");

        vm.prank(user1);
        vm.expectRevert("SolutionNotFound()");
        engine.suggestContestation(fakeTaskId);
    }

    function test_RevertSuggestContestationWhenContestationExists() public {
        masterContesterRegistry.emergencyAddMasterContester(masterContester1);

        bytes32 modelId = _deployBootstrapModel();
        bytes32 taskId = _deployBootstrapTask(modelId, user1);
        _submitSolution(taskId, validator1);

        // Submit actual contestation
        vm.prank(masterContester1);
        engine.submitContestation(taskId);

        // Try to suggest after contestation exists
        vm.prank(user1);
        vm.expectRevert("ContestationAlreadyExists()");
        engine.suggestContestation(taskId);
    }

    // ============================================
    // Multiple Master Contesters Tests
    // ============================================

    function test_MultipleMasterContestersVotingOnSameContestation() public {
        masterContesterRegistry.emergencyAddMasterContester(masterContester1);
        masterContesterRegistry.emergencyAddMasterContester(masterContester2);

        bytes32 modelId = _deployBootstrapModel();
        bytes32 taskId = _deployBootstrapTask(modelId, user1);
        _submitSolution(taskId, validator1);

        // First master contester submits contestation
        vm.prank(masterContester1);
        engine.submitContestation(taskId);

        // Second master contester votes yes
        vm.prank(masterContester2);
        engine.voteOnContestation(taskId, true);

        // Regular validators vote
        vm.prank(validator2);
        engine.voteOnContestation(taskId, false);
        vm.prank(validator3);
        engine.voteOnContestation(taskId, false);

        // Fast forward and finish voting
        vm.warp(block.timestamp + 4000);
        vm.roll(block.number + 1);

        // With 2 master contesters voting yes (2 actual + 50 adder = 52)
        // vs 3 nay votes (validator1 auto-vote, validator2, validator3)
        // Yes should win: 52 > 3
        vm.prank(validator1);
        engine.contestationVoteFinish(taskId, 5);

        // Verify contestation succeeded
        uint256 lastLossTime = engine.lastContestationLossTime(validator1);
        assertGt(lastLossTime, 0);
    }

    function test_MasterContesterVsMasterContesterVoting() public {
        masterContesterRegistry.emergencyAddMasterContester(masterContester1);
        masterContesterRegistry.emergencyAddMasterContester(masterContester2);

        bytes32 modelId = _deployBootstrapModel();
        bytes32 taskId = _deployBootstrapTask(modelId, user1);

        // Master contester1 submits solution
        _submitSolution(taskId, masterContester1);

        // Master contester2 submits contestation
        vm.prank(masterContester2);
        engine.submitContestation(taskId);

        // Regular validators vote on both sides
        vm.prank(validator1);
        engine.voteOnContestation(taskId, true);
        vm.prank(validator2);
        engine.voteOnContestation(taskId, false);

        // Fast forward and finish voting
        vm.warp(block.timestamp + 4000);
        vm.roll(block.number + 1);

        // masterContester2 + validator1 voting yes: 2 actual + 50 adder = 52
        // masterContester1 (auto-vote) + validator2 voting no: 2 actual
        // Yes should win: 52 > 2
        vm.prank(validator1);
        engine.contestationVoteFinish(taskId, 4);

        // Verify contestation succeeded
        uint256 lastLossTime = engine.lastContestationLossTime(masterContester1);
        assertGt(lastLossTime, 0);
    }

    function test_OnlyMasterContesterVotesNoAdditionalVoters() public {
        masterContesterRegistry.emergencyAddMasterContester(masterContester1);

        bytes32 modelId = _deployBootstrapModel();
        bytes32 taskId = _deployBootstrapTask(modelId, user1);
        _submitSolution(taskId, validator1);

        // Master contester submits contestation (auto-votes yes)
        vm.prank(masterContester1);
        engine.submitContestation(taskId);

        // No other votes - just the auto-votes
        // Fast forward and finish voting
        vm.warp(block.timestamp + 4000);
        vm.roll(block.number + 1);

        // masterContester1 voting yes: 1 actual + 50 adder = 51
        // validator1 (auto-vote) voting no: 1 actual
        // Yes should win: 51 > 1
        vm.prank(validator1);
        engine.contestationVoteFinish(taskId, 2);

        // Verify contestation succeeded
        uint256 lastLossTime = engine.lastContestationLossTime(validator1);
        assertGt(lastLossTime, 0);
    }

    // ============================================
    // Edge Cases and Division by Zero Prevention
    // ============================================

    function test_ZeroVoteAdderBehavior() public {
        // Set adder to 0
        engine.setMasterContesterVoteAdder(0);

        masterContesterRegistry.emergencyAddMasterContester(masterContester1);

        bytes32 modelId = _deployBootstrapModel();
        bytes32 taskId = _deployBootstrapTask(modelId, user1);
        _submitSolution(taskId, validator1);

        // Master contester submits contestation
        vm.prank(masterContester1);
        engine.submitContestation(taskId);

        // Add regular voters to ensure fair voting
        vm.prank(validator2);
        engine.voteOnContestation(taskId, true);
        vm.prank(validator3);
        engine.voteOnContestation(taskId, false);

        // Fast forward and finish voting
        vm.warp(block.timestamp + 4000);
        vm.roll(block.number + 1);

        // With 0 adder: 2 yes votes vs 2 no votes = tie (nay wins on tie)
        vm.prank(validator1);
        engine.contestationVoteFinish(taskId, 4);

        // Verify contestation failed (tie goes to defendant)
        uint256 lastLossTime = engine.lastContestationLossTime(validator1);
        assertEq(lastLossTime, 0);
    }

    function test_NoDivisionByZeroWhenMasterContesterOnlyYesVoter() public {
        masterContesterRegistry.emergencyAddMasterContester(masterContester1);

        bytes32 modelId = _deployBootstrapModel();
        bytes32 taskId = _deployBootstrapTask(modelId, user1);
        _submitSolution(taskId, validator1);

        // Master contester submits contestation (auto-votes yes)
        vm.prank(masterContester1);
        engine.submitContestation(taskId);

        // No other yes votes - THIS SHOULD NOT CAUSE DIVISION BY ZERO
        // Fast forward and finish voting
        vm.warp(block.timestamp + 4000);
        vm.roll(block.number + 1);

        // This should NOT revert with division by zero
        vm.prank(validator1);
        vm.expectEmit(true, false, false, false);
        emit ContestationVoteFinish(taskId, 0, 2, true);
        engine.contestationVoteFinish(taskId, 2);
    }

    function test_HandleZeroActualYeaVotersButHighVoteCount() public {
        // Set very high adder
        engine.setMasterContesterVoteAdder(100);

        masterContesterRegistry.emergencyAddMasterContester(masterContester1);

        bytes32 modelId = _deployBootstrapModel();
        bytes32 taskId = _deployBootstrapTask(modelId, user1);
        _submitSolution(taskId, validator1);

        // Master contester submits contestation
        vm.prank(masterContester1);
        engine.submitContestation(taskId);

        // Fast forward and finish
        vm.warp(block.timestamp + 4000);
        vm.roll(block.number + 1);

        // Should handle this edge case without reverting
        vm.prank(validator1);
        engine.contestationVoteFinish(taskId, 2);
    }

    function test_HandleDivisionWithActualNayVotersEqualsOne() public {
        masterContesterRegistry.emergencyAddMasterContester(validator2);

        bytes32 modelId = _deployBootstrapModel();
        bytes32 taskId = _deployBootstrapTask(modelId, user1);
        _submitSolution(taskId, validator1);

        // Regular validator (now master) submits contestation
        vm.prank(validator2);
        engine.submitContestation(taskId);

        // Fast forward - contestation should process correctly
        vm.warp(block.timestamp + 4000);
        vm.roll(block.number + 1);

        // Should not have division by zero with actualNayVoters = 1
        vm.prank(validator1);
        engine.contestationVoteFinish(taskId, 2);
    }

    // ============================================
    // Master Contester Stake Requirements
    // ============================================

    function test_MasterContesterWithExactlyMinimumStake() public {
        masterContesterRegistry.emergencyAddMasterContester(masterContester1);

        // Reduce master contester stake to exactly minimum
        uint256 minStake = engine.getValidatorMinimum();
        (uint256 currentStake, , ) = engine.validators(masterContester1);
        uint256 withdrawAmount = currentStake - minStake;

        if (withdrawAmount > 0) {
            vm.prank(masterContester1);
            engine.initiateValidatorWithdraw(withdrawAmount);
            vm.warp(block.timestamp + 7 days);
            vm.roll(block.number + 1);
            uint256 count = engine.pendingValidatorWithdrawRequestsCount(masterContester1);
            vm.prank(masterContester1);
            engine.validatorWithdraw(count, masterContester1);
        }

        // Should still be able to contest with exactly minimum
        bytes32 modelId = _deployBootstrapModel();
        bytes32 taskId = _deployBootstrapTask(modelId, user1);
        _submitSolution(taskId, validator1);

        vm.prank(masterContester1);
        vm.expectEmit(true, true, false, false);
        emit ContestationSubmitted(masterContester1, taskId);
        engine.submitContestation(taskId);
    }

    function test_IntegrationMasterContesterWithSuggestContestation() public {
        masterContesterRegistry.emergencyAddMasterContester(masterContester1);

        bytes32 modelId = _deployBootstrapModel();
        bytes32 taskId = _deployBootstrapTask(modelId, user1);
        _submitSolution(taskId, validator1);

        // Non-master contester suggests contestation
        vm.prank(user1);
        vm.expectEmit(true, true, false, false);
        emit ContestationSuggested(user1, taskId);
        engine.suggestContestation(taskId);

        // Master contester submits actual contestation
        vm.prank(masterContester1);
        vm.expectEmit(true, true, false, false);
        emit ContestationSubmitted(masterContester1, taskId);
        engine.submitContestation(taskId);

        // Other validators vote
        vm.prank(validator2);
        engine.voteOnContestation(taskId, true);
        vm.prank(validator3);
        engine.voteOnContestation(taskId, false);

        // With vote adder, master contester should help win
        vm.warp(block.timestamp + 4000);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.contestationVoteFinish(taskId, 4);

        // Verify contestation succeeded
        uint256 lastLossTime = engine.lastContestationLossTime(validator1);
        assertGt(lastLossTime, 0);
    }
}
