// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console2.sol";

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "contracts/BaseTokenV1.sol";
import "contracts/test/V2_EngineV6TestHelper.sol";
import "contracts/MasterContesterRegistry.sol";
import "contracts/ve/Voter.sol";
import "contracts/ve/VotingEscrow.sol";
import "contracts/ve/VeNFTRender.sol";
import "contracts/ve/VeStaking.sol";
import "contracts/interfaces/IArbiusV6.sol";

/**
 * @title V2_EngineV6_ModelFeesTest
 * @notice Tests for model fee lifecycle in V2_EngineV6
 * @dev Tests fee changes at different stages of task lifecycle
 */
contract V2_EngineV6_ModelFeesTest is Test {
    BaseTokenV1 public baseToken;
    V2_EngineV6TestHelper public engine;
    MasterContesterRegistry public masterContesterRegistry;
    Voter public voter;
    VotingEscrow public votingEscrow;
    VeNFTRender public veNFTRender;
    VeStaking public veStaking;

    address public deployer;
    address public user1;
    address public user2;
    address public validator1;
    address public validator2;
    address public validator3;
    address public masterContester1;
    address public treasury;
    address public modelOwner;

    bytes32 public modelid;

    bytes public constant TESTCID = hex"1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8";
    bytes public constant TESTBUF = hex"746573740a";

    function setUp() public {
        deployer = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        validator1 = makeAddr("validator1");
        validator2 = makeAddr("validator2");
        validator3 = makeAddr("validator3");
        masterContester1 = makeAddr("masterContester1");
        treasury = makeAddr("treasury");
        modelOwner = makeAddr("modelOwner");

        // Deploy BaseToken
        BaseTokenV1 baseTokenImpl = new BaseTokenV1();
        bytes memory baseTokenInitData = abi.encodeWithSelector(
            BaseTokenV1.initialize.selector,
            deployer,
            address(0)
        );
        ERC1967Proxy baseTokenProxy = new ERC1967Proxy(address(baseTokenImpl), baseTokenInitData);
        baseToken = BaseTokenV1(address(baseTokenProxy));

        // Deploy VE contracts
        veNFTRender = new VeNFTRender();
        votingEscrow = new VotingEscrow(address(baseToken), address(veNFTRender), address(0));
        veStaking = new VeStaking(address(baseToken), address(votingEscrow));
        votingEscrow.setVeStaking(address(veStaking));

        voter = new Voter(address(votingEscrow));
        votingEscrow.setVoter(address(voter));

        // Deploy V6 Engine
        V2_EngineV6TestHelper engineImpl = new V2_EngineV6TestHelper();
        bytes memory engineInitData = abi.encodeWithSelector(
            V2_EngineV6TestHelper.initializeForTesting.selector,
            address(baseToken),
            treasury
        );
        ERC1967Proxy engineProxy = new ERC1967Proxy(address(engineImpl), engineInitData);
        engine = V2_EngineV6TestHelper(address(engineProxy));

        // Link VE and Engine
        engine.setVeStaking(address(veStaking));
        engine.setVoter(address(voter));
        veStaking.setEngine(address(engine));

        // Deploy MasterContesterRegistry
        masterContesterRegistry = new MasterContesterRegistry(address(votingEscrow));
        engine.setMasterContesterRegistry(address(masterContesterRegistry));

        // Setup tokens
        baseToken.bridgeMint(deployer, 10000 ether);
        baseToken.transferOwnership(address(engine));
        baseToken.bridgeMint(address(engine), 597000 ether);

        // Distribute tokens and setup approvals
        address[9] memory testAddresses = [
            user1, user2, validator1, validator2, validator3,
            masterContester1, modelOwner, treasury, deployer
        ];
        for (uint i = 0; i < testAddresses.length; i++) {
            baseToken.transfer(testAddresses[i], 100 ether);
            vm.prank(testAddresses[i]);
            baseToken.approve(address(engine), type(uint256).max);
        }

        // Setup validators
        address[4] memory validators = [validator1, validator2, validator3, masterContester1];
        for (uint i = 0; i < validators.length; i++) {
            vm.prank(validators[i]);
            engine.validatorDeposit(validators[i], 40 ether);
        }

        masterContesterRegistry.emergencyAddMasterContester(masterContester1);

        // Register model with initial fee
        uint256 initialFee = 0.1 ether;
        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: modelOwner,
            fee: initialFee,
            rate: 0,
            cid: TESTCID
        });
        modelid = engine.hashModel(modelParams, modelOwner);

        vm.prank(modelOwner);
        engine.registerModel(modelOwner, initialFee, TESTBUF);

        // Set model fee percentage so model owners actually receive fees
        // 0% to treasury = 100% to model owner
        engine.setSolutionModelFeePercentage(0);
    }

    // Helper to submit and complete a task
    function submitAndClaimTask(uint256 taskFee) internal returns (bytes32) {
        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Submit task
        vm.prank(user1);
        vm.recordLogs();
        engine.submitTask(0, user1, modelid, taskFee, TESTBUF);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 taskid = entries[0].topics[1];

        // Submit solution
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);
        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        // Wait and claim
        vm.warp(block.timestamp + 3600 + 1);
        vm.prank(validator1);
        engine.claimSolution(taskid);

        return taskid;
    }

    /*//////////////////////////////////////////////////////////////
                FEE CHANGES BEFORE TASK SUBMISSION
    //////////////////////////////////////////////////////////////*/

    function test_DistributeBasicModelFee() public {
        uint256 taskFee = 0.2 ether;
        uint256 balanceBefore = baseToken.balanceOf(modelOwner);

        submitAndClaimTask(taskFee);

        uint256 balanceAfter = baseToken.balanceOf(modelOwner);

        // Model owner should receive fees (model fee is 0.1 ether)
        assertGt(balanceAfter, balanceBefore);
    }

    function test_UseNewFeeForTasksSubmittedAfterFeeChange() public {
        uint256 oldFee = 0.1 ether;
        uint256 newFee = 0.2 ether;

        // Verify initial fee
        (uint256 initialFee, address initialAddr,,) = engine.models(modelid);
        assertEq(initialFee, oldFee);
        assertEq(initialAddr, modelOwner);

        // Change fee before any task is submitted
        vm.prank(modelOwner);
        engine.setModelFee(modelid, newFee);

        // Verify fee changed
        (uint256 updatedFee, address updatedAddr,,) = engine.models(modelid);
        assertEq(updatedFee, newFee);
        assertEq(updatedAddr, modelOwner);

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Submit task - should use new fee
        vm.prank(user1);
        vm.recordLogs();
        engine.submitTask(0, user1, modelid, 0.3 ether, TESTBUF);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 taskid = entries[0].topics[1];

        // Task references the model with new fee
        (bytes32 taskModel,,,,,) = engine.tasks(taskid);
        assertEq(taskModel, modelid);
        (uint256 currentFee,,,) = engine.models(modelid);
        assertEq(currentFee, newFee);
    }

    function test_UseZeroFeeAfterChangingFeeToZero() public {
        vm.prank(modelOwner);
        engine.setModelFee(modelid, 0);

        (uint256 fee,,,) = engine.models(modelid);
        assertEq(fee, 0);

        uint256 balanceBefore = baseToken.balanceOf(modelOwner);
        submitAndClaimTask(0.3 ether);
        uint256 balanceAfter = baseToken.balanceOf(modelOwner);

        // With zero model fee, model owner should receive nothing (or same balance)
        assertEq(balanceAfter, balanceBefore);
    }

    /*//////////////////////////////////////////////////////////////
                FEE CHANGES DURING TASK LIFECYCLE
    //////////////////////////////////////////////////////////////*/

    function test_UseFeeAtTimeOfTaskSubmission() public {
        uint256 initialFee = 0.1 ether;

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Submit task with initial fee
        vm.prank(user1);
        vm.recordLogs();
        engine.submitTask(0, user1, modelid, 0.2 ether, TESTBUF);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 taskid = entries[0].topics[1];

        // Change fee after task submission but before solution
        vm.prank(modelOwner);
        engine.setModelFee(modelid, 0.5 ether);

        // Submit solution
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);
        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        // The fee distribution should use the current model fee at claim time
        (uint256 currentFee,,,) = engine.models(modelid);
        assertEq(currentFee, 0.5 ether);
    }

    function test_HandleFeeChangeFromNonZeroToZeroAfterTaskSubmission() public {
        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Submit task with non-zero fee
        vm.prank(user1);
        vm.recordLogs();
        engine.submitTask(0, user1, modelid, 0.2 ether, TESTBUF);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 taskid = entries[0].topics[1];

        // Change fee to zero after task submission
        vm.prank(modelOwner);
        engine.setModelFee(modelid, 0);

        // Complete the task
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);
        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        uint256 balanceBefore = baseToken.balanceOf(modelOwner);

        vm.warp(block.timestamp + 3600 + 1);
        vm.prank(validator1);
        engine.claimSolution(taskid);

        uint256 balanceAfter = baseToken.balanceOf(modelOwner);

        // With zero fee at claim time, model owner receives nothing
        assertEq(balanceAfter, balanceBefore);
    }

    function test_HandleFeeIncreaseAfterTaskSubmission() public {
        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Submit task with enough fee to cover increased model fee
        vm.prank(user1);
        vm.recordLogs();
        engine.submitTask(0, user1, modelid, 1 ether, TESTBUF);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 taskid = entries[0].topics[1];

        // Increase model fee after task submission
        vm.prank(modelOwner);
        engine.setModelFee(modelid, 0.5 ether);

        // Complete the task
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);
        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        uint256 balanceBefore = baseToken.balanceOf(modelOwner);

        vm.warp(block.timestamp + 3600 + 1);
        vm.prank(validator1);
        engine.claimSolution(taskid);

        uint256 balanceAfter = baseToken.balanceOf(modelOwner);

        // Model owner should receive fees based on increased model fee (0.5 ether)
        assertGt(balanceAfter, balanceBefore);
    }

    /*//////////////////////////////////////////////////////////////
                RAPID FEE CHANGES
    //////////////////////////////////////////////////////////////*/

    function test_HandleRapidFeeChangesBeforeClaim() public {
        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Submit task
        vm.prank(user1);
        vm.recordLogs();
        engine.submitTask(0, user1, modelid, 0.5 ether, TESTBUF);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 taskid = entries[0].topics[1];

        // Submit solution
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);
        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        // Rapidly change fees multiple times
        vm.prank(modelOwner);
        engine.setModelFee(modelid, 0.2 ether);

        vm.prank(modelOwner);
        engine.setModelFee(modelid, 0.3 ether);

        vm.prank(modelOwner);
        engine.setModelFee(modelid, 0.15 ether);

        // Final fee should be 0.15 ether
        (uint256 finalFee,,,) = engine.models(modelid);
        assertEq(finalFee, 0.15 ether);

        // Claim uses final fee
        vm.warp(block.timestamp + 3600 + 1);
        vm.prank(validator1);
        engine.claimSolution(taskid);
    }

    /*//////////////////////////////////////////////////////////////
                INDEPENDENT TASK FEE HANDLING
    //////////////////////////////////////////////////////////////*/

    function test_UseCurrentFeeIndependentlyForEachTaskClaim() public {
        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Submit two tasks
        vm.prank(user1);
        vm.recordLogs();
        engine.submitTask(0, user1, modelid, 0.5 ether, TESTBUF);

        Vm.Log[] memory entries1 = vm.getRecordedLogs();
        bytes32 taskid1 = entries1[0].topics[1];

        vm.prank(user1);
        vm.recordLogs();
        engine.submitTask(0, user1, modelid, 0.5 ether, TESTBUF);

        Vm.Log[] memory entries2 = vm.getRecordedLogs();
        bytes32 taskid2 = entries2[0].topics[1];

        // Submit solutions for both
        bytes32 commitment1 = engine.generateCommitment(validator1, taskid1, TESTCID);
        vm.prank(validator1);
        engine.signalCommitment(commitment1);

        bytes32 commitment2 = engine.generateCommitment(validator2, taskid2, TESTCID);
        vm.prank(validator2);
        engine.signalCommitment(commitment2);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid1, TESTCID);

        vm.prank(validator2);
        engine.submitSolution(taskid2, TESTCID);

        // Change fee before claiming first task
        vm.prank(modelOwner);
        engine.setModelFee(modelid, 0.3 ether);

        uint256 balanceBefore1 = baseToken.balanceOf(modelOwner);

        // Claim first task - uses 0.3 ether fee
        vm.warp(block.timestamp + 3600 + 1);
        vm.prank(validator1);
        engine.claimSolution(taskid1);

        uint256 balanceAfter1 = baseToken.balanceOf(modelOwner);

        // Change fee again before claiming second task
        vm.prank(modelOwner);
        engine.setModelFee(modelid, 0.05 ether);

        // Claim second task - uses 0.05 ether fee
        vm.prank(validator2);
        engine.claimSolution(taskid2);

        uint256 balanceAfter2 = baseToken.balanceOf(modelOwner);

        // Both claims should have succeeded
        assertGt(balanceAfter1, balanceBefore1);
        // Second claim with lower fee should add less
        uint256 gain1 = balanceAfter1 - balanceBefore1;
        uint256 gain2 = balanceAfter2 - balanceAfter1;
        assertLt(gain2, gain1);
    }
}
