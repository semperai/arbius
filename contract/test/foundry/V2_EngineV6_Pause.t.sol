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
 * @title V2_EngineV6_PauseTest
 * @notice Tests for pause functionality in V2_EngineV6
 * @dev Tests pauser role, pause/unpause mechanics, and paused state enforcement
 */
contract V2_EngineV6_PauseTest is Test {
    BaseTokenV1 public baseToken;
    V2_EngineV6TestHelper public engine;
    MasterContesterRegistry public masterContesterRegistry;

    address public deployer;
    address public user1;
    address public user2;
    address public validator1;
    address public treasury;
    address public pauser;

    bytes public constant TESTCID = hex"1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8";
    bytes public constant TESTBUF = hex"746573740a";

    function setUp() public {
        deployer = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        validator1 = makeAddr("validator1");
        treasury = makeAddr("treasury");
        pauser = makeAddr("pauser");

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

        // Set pauser
        engine.transferPauser(pauser);

        // Approve engine for users and validators
        vm.prank(user1);
        baseToken.approve(address(engine), type(uint256).max);
        vm.prank(validator1);
        baseToken.approve(address(engine), type(uint256).max);
    }

    // Helper to register a model
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

    // Helper to deploy a validator
    function deployBootstrapValidator() internal returns (address) {
        baseToken.bridgeMint(address(engine), 599990 ether);
        baseToken.transfer(validator1, 2.4 ether);

        vm.prank(validator1);
        engine.validatorDeposit(validator1, 2.4 ether);

        return validator1;
    }

    /*//////////////////////////////////////////////////////////////
                        PAUSER ROLE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_InitialPauserSetCorrectly() public {
        // After setUp, pauser should be the designated pauser address
        assertEq(engine.pauser(), pauser);
    }

    function test_TransferPauser() public {
        address newPauser = makeAddr("newPauser");
        engine.transferPauser(newPauser);
        assertEq(engine.pauser(), newPauser);
    }

    function test_RevertWhen_NonOwnerTransfersPauser() public {
        vm.prank(user1);
        vm.expectRevert();
        engine.transferPauser(user1);
    }

    /*//////////////////////////////////////////////////////////////
                        PAUSE/UNPAUSE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_PauseEngine() public {
        vm.prank(pauser);
        engine.setPaused(true);
        assertTrue(engine.paused());
    }

    function test_UnpauseEngine() public {
        vm.prank(pauser);
        engine.setPaused(true);
        assertTrue(engine.paused());

        vm.prank(pauser);
        engine.setPaused(false);
        assertFalse(engine.paused());
    }

    function test_RevertWhen_NonPauserPauses() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("NotPauser()"));
        engine.setPaused(true);
    }

    function test_RevertWhen_NonPauserUnpauses() public {
        vm.prank(pauser);
        engine.setPaused(true);

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("NotPauser()"));
        engine.setPaused(false);
    }

    function test_EmitPausedChangedEvent() public {
        vm.expectEmit(true, true, true, true);
        emit IArbiusV6.PausedChanged(true);

        vm.prank(pauser);
        engine.setPaused(true);
    }

    /*//////////////////////////////////////////////////////////////
                    PAUSED STATE ENFORCEMENT
    //////////////////////////////////////////////////////////////*/

    function test_RevertWhen_SubmitTaskWhilePaused() public {
        bytes32 modelid = deployBootstrapModel();

        vm.prank(pauser);
        engine.setPaused(true);

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("Paused()"));
        engine.submitTask(0, user1, modelid, 0, TESTBUF);
    }

    function test_RevertWhen_SignalCommitmentWhilePaused() public {
        bytes32 modelid = deployBootstrapModel();
        deployBootstrapValidator();

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        vm.prank(user1);
        vm.recordLogs();
        engine.submitTask(0, user1, modelid, 0, TESTBUF);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 taskid = entries[0].topics[1];

        bytes32 commitment = keccak256("solution");

        vm.prank(pauser);
        engine.setPaused(true);

        vm.prank(validator1);
        vm.expectRevert(abi.encodeWithSignature("Paused()"));
        engine.signalCommitment(commitment);
    }

    function test_RevertWhen_SubmitSolutionWhilePaused() public {
        bytes32 modelid = deployBootstrapModel();
        deployBootstrapValidator();

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        vm.prank(user1);
        vm.recordLogs();
        engine.submitTask(0, user1, modelid, 0, TESTBUF);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 taskid = entries[0].topics[1];

        bytes32 commitment = keccak256(abi.encodePacked(taskid, TESTBUF));

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 2);

        vm.prank(pauser);
        engine.setPaused(true);

        vm.prank(validator1);
        vm.expectRevert(abi.encodeWithSignature("Paused()"));
        engine.submitSolution(taskid, TESTBUF);
    }

    function test_RevertWhen_ClaimSolutionWhilePaused() public {
        bytes32 modelid = deployBootstrapModel();
        deployBootstrapValidator();

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        vm.prank(user1);
        vm.recordLogs();
        engine.submitTask(0, user1, modelid, 0, TESTBUF);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 taskid = entries[0].topics[1];

        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        vm.warp(block.timestamp + engine.minClaimSolutionTime() + 1);

        vm.prank(pauser);
        engine.setPaused(true);

        vm.prank(validator1);
        vm.expectRevert(abi.encodeWithSignature("Paused()"));
        engine.claimSolution(taskid);
    }

    function test_RevertWhen_RegisterModelWhilePaused() public {
        vm.prank(pauser);
        engine.setPaused(true);

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("Paused()"));
        engine.registerModel(user1, 0, TESTBUF);
    }

    function test_RevertWhen_ValidatorDepositWhilePaused() public {
        baseToken.transfer(validator1, 10 ether);

        vm.prank(pauser);
        engine.setPaused(true);

        vm.prank(validator1);
        vm.expectRevert(abi.encodeWithSignature("Paused()"));
        engine.validatorDeposit(validator1, 10 ether);
    }

    /*//////////////////////////////////////////////////////////////
                    ALLOWED OPERATIONS WHILE PAUSED
    //////////////////////////////////////////////////////////////*/

    function test_CanTransferPauserWhilePaused() public {
        vm.prank(pauser);
        engine.setPaused(true);

        address newPauser = makeAddr("newPauser");
        engine.transferPauser(newPauser);
        assertEq(engine.pauser(), newPauser);
    }

    function test_CanTransferOwnershipWhilePaused() public {
        vm.prank(pauser);
        engine.setPaused(true);

        address newOwner = makeAddr("newOwner");
        engine.transferOwnership(newOwner);
        assertEq(engine.owner(), newOwner);
    }

    /*//////////////////////////////////////////////////////////////
                    RESUME OPERATIONS AFTER UNPAUSE
    //////////////////////////////////////////////////////////////*/

    function test_CanSubmitTaskAfterUnpause() public {
        bytes32 modelid = deployBootstrapModel();

        vm.prank(pauser);
        engine.setPaused(true);

        vm.prank(pauser);
        engine.setPaused(false);

        vm.prank(user1);
        vm.recordLogs();
        engine.submitTask(0, user1, modelid, 0, TESTBUF);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        assertTrue(entries.length > 0);
    }

    function test_CanSubmitSolutionAfterUnpause() public {
        bytes32 modelid = deployBootstrapModel();
        deployBootstrapValidator();

        // Pause and unpause
        vm.prank(pauser);
        engine.setPaused(true);
        vm.prank(pauser);
        engine.setPaused(false);

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Submit task
        vm.prank(user1);
        vm.recordLogs();
        engine.submitTask(0, user1, modelid, 0, TESTBUF);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 taskid = entries[0].topics[1];

        // Signal commitment
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);
        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        // Submit solution - should work after unpause
        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        // Verify solution was submitted
        (address submittedValidator,,,) = engine.solutions(taskid);
        assertEq(submittedValidator, validator1);
    }
}
