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
 * @title V2_EngineV6_AllowListTest
 * @notice Tests for V2_EngineV6 model allow list functionality
 * @dev Ported from Hardhat test: enginev6.comprehensive.test.ts
 *
 * Tests cover:
 * - Model registration with allow lists
 * - Allow list management (add/remove addresses)
 * - Disabling allow lists
 * - Solution submission restrictions
 * - Edge cases (empty lists, unauthorized access)
 */
contract V2_EngineV6_AllowListTest is Test {
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
    address public model1;
    address public treasury;

    bytes public constant TESTCID = hex"1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8";
    bytes public constant TESTBUF = hex"746573740a";

    event ModelRegistered(bytes32 indexed id, address indexed creator);
    event ModelAllowListUpdated(bytes32 indexed model, address indexed solver, bool allowed);
    event ModelAllowListRequirementChanged(bytes32 indexed model, bool requiresAllowList);
    event SolutionSubmitted(
        bytes32 indexed task,
        bytes32 indexed model,
        uint256 fee,
        address indexed validator,
        uint256 blocktime,
        bytes cid
    );

    function setUp() public {
        deployer = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        validator1 = makeAddr("validator1");
        validator2 = makeAddr("validator2");
        validator3 = makeAddr("validator3");
        validator4 = makeAddr("validator4");
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

        // Setup validators with stake
        address[4] memory validators = [validator1, validator2, validator3, validator4];
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

    // ============================================
    // Model Allow List Registration Tests
    // ============================================

    function test_RegisterModelWithAllowList() public {
        address[] memory allowList = new address[](2);
        allowList[0] = validator1;
        allowList[1] = validator2;

        vm.prank(user1);
        bytes32 modelId = engine.registerModelWithAllowList(
            model1,
            0,
            TESTBUF,
            allowList
        );

        // Verify allow list is set
        assertTrue(engine.modelRequiresAllowList(modelId));
        assertTrue(engine.isSolverAllowed(modelId, validator1));
        assertTrue(engine.isSolverAllowed(modelId, validator2));
        assertFalse(engine.isSolverAllowed(modelId, validator3));
    }

    function test_OnlyAllowedValidatorsCanSubmitSolutions() public {
        address[] memory allowList = new address[](2);
        allowList[0] = validator1;
        allowList[1] = validator2;

        vm.prank(user1);
        bytes32 modelId = engine.registerModelWithAllowList(
            model1,
            0,
            TESTBUF,
            allowList
        );

        bytes32 taskId = _deployBootstrapTask(modelId, user1);

        // Validator1 (allowed) can submit
        bytes32 commitment1 = engine.generateCommitment(validator1, taskId, TESTCID);
        vm.prank(validator1);
        engine.signalCommitment(commitment1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskId, TESTCID);

        // Deploy another task for validator3 test
        bytes32 taskId2 = _deployBootstrapTask(modelId, user1);

        // Validator3 (not allowed) cannot submit
        bytes32 commitment3 = engine.generateCommitment(validator3, taskId2, TESTCID);
        vm.prank(validator3);
        engine.signalCommitment(commitment3);
        vm.roll(block.number + 1);

        vm.prank(validator3);
        vm.expectRevert("NotAllowedToSubmitSolution()");
        engine.submitSolution(taskId2, TESTCID);
    }

    function test_ModelsWithoutAllowListWorkNormally() public {
        // Register model without allow list
        vm.prank(user1);
        bytes32 modelId = engine.registerModel(model1, 0, TESTBUF);

        assertFalse(engine.modelRequiresAllowList(modelId));

        bytes32 taskId = _deployBootstrapTask(modelId, user1);

        // Any validator can submit
        bytes32 commitment = engine.generateCommitment(validator3, taskId, TESTCID);
        vm.prank(validator3);
        engine.signalCommitment(commitment);
        vm.roll(block.number + 1);

        vm.prank(validator3);
        engine.submitSolution(taskId, TESTCID);
    }

    // ============================================
    // Allow List Management Tests
    // ============================================

    function test_ModelOwnerCanAddToAllowList() public {
        // Create model with initial allow list
        address[] memory initialAllowList = new address[](1);
        initialAllowList[0] = validator1;

        vm.prank(user1);
        bytes32 modelId = engine.registerModelWithAllowList(
            model1,
            0,
            TESTBUF,
            initialAllowList
        );

        // Initially only validator1 is allowed
        assertTrue(engine.isSolverAllowed(modelId, validator1));
        assertFalse(engine.isSolverAllowed(modelId, validator2));
        assertFalse(engine.isSolverAllowed(modelId, validator3));

        // Model owner adds validator2 and validator3
        address[] memory toAdd = new address[](2);
        toAdd[0] = validator2;
        toAdd[1] = validator3;

        vm.prank(model1);
        vm.expectEmit(true, true, false, true);
        emit ModelAllowListUpdated(modelId, validator2, true);
        vm.expectEmit(true, true, false, true);
        emit ModelAllowListUpdated(modelId, validator3, true);
        engine.addToModelAllowList(modelId, toAdd);

        // Now all three should be allowed
        assertTrue(engine.isSolverAllowed(modelId, validator1));
        assertTrue(engine.isSolverAllowed(modelId, validator2));
        assertTrue(engine.isSolverAllowed(modelId, validator3));
    }

    function test_ModelOwnerCanRemoveFromAllowList() public {
        // Create model with allow list
        address[] memory initialAllowList = new address[](3);
        initialAllowList[0] = validator1;
        initialAllowList[1] = validator2;
        initialAllowList[2] = validator3;

        vm.prank(user1);
        bytes32 modelId = engine.registerModelWithAllowList(
            model1,
            0,
            TESTBUF,
            initialAllowList
        );

        // Verify all are added
        assertTrue(engine.isSolverAllowed(modelId, validator1));
        assertTrue(engine.isSolverAllowed(modelId, validator2));
        assertTrue(engine.isSolverAllowed(modelId, validator3));

        // Remove validator2
        address[] memory toRemove = new address[](1);
        toRemove[0] = validator2;

        vm.prank(model1);
        vm.expectEmit(true, true, false, true);
        emit ModelAllowListUpdated(modelId, validator2, false);
        engine.removeFromModelAllowList(modelId, toRemove);

        // Check states
        assertTrue(engine.isSolverAllowed(modelId, validator1));
        assertFalse(engine.isSolverAllowed(modelId, validator2));
        assertTrue(engine.isSolverAllowed(modelId, validator3));
    }

    function test_CanDisableAllowListRequirement() public {
        address[] memory allowList = new address[](1);
        allowList[0] = validator1;

        vm.prank(user1);
        bytes32 modelId = engine.registerModelWithAllowList(
            model1,
            0,
            TESTBUF,
            allowList
        );

        // Initially requires allow list
        assertTrue(engine.modelRequiresAllowList(modelId));

        // Only validator1 can submit
        bytes32 taskId1 = _deployBootstrapTask(modelId, user1);
        bytes32 commitment2 = engine.generateCommitment(validator2, taskId1, TESTCID);
        vm.prank(validator2);
        engine.signalCommitment(commitment2);
        vm.roll(block.number + 1);

        vm.prank(validator2);
        vm.expectRevert("NotAllowedToSubmitSolution()");
        engine.submitSolution(taskId1, TESTCID);

        // Disable allow list requirement
        vm.prank(model1);
        vm.expectEmit(true, false, false, true);
        emit ModelAllowListRequirementChanged(modelId, false);
        engine.disableModelAllowList(modelId);

        assertFalse(engine.modelRequiresAllowList(modelId));

        // Now any validator can submit
        bytes32 taskId2 = _deployBootstrapTask(modelId, user1);
        bytes32 commitment3 = engine.generateCommitment(validator2, taskId2, TESTCID);
        vm.prank(validator2);
        engine.signalCommitment(commitment3);
        vm.roll(block.number + 1);

        vm.prank(validator2);
        engine.submitSolution(taskId2, TESTCID);
    }

    function test_ContractOwnerCanManageAllowLists() public {
        address[] memory allowList = new address[](1);
        allowList[0] = validator1;

        vm.prank(user1);
        bytes32 modelId = engine.registerModelWithAllowList(
            model1,
            0,
            TESTBUF,
            allowList
        );

        // Contract owner (deployer) can add
        address[] memory toAdd = new address[](1);
        toAdd[0] = validator4;

        vm.expectEmit(true, true, false, true);
        emit ModelAllowListUpdated(modelId, validator4, true);
        engine.addToModelAllowList(modelId, toAdd);

        assertTrue(engine.isSolverAllowed(modelId, validator4));

        // Contract owner can remove
        address[] memory toRemove = new address[](1);
        toRemove[0] = validator4;

        vm.expectEmit(true, true, false, true);
        emit ModelAllowListUpdated(modelId, validator4, false);
        engine.removeFromModelAllowList(modelId, toRemove);

        assertFalse(engine.isSolverAllowed(modelId, validator4));
    }

    // ============================================
    // Edge Cases and Error Conditions
    // ============================================

    function test_EmptyAllowListPreventsAllSubmissions() public {
        address[] memory allowList = new address[](1);
        allowList[0] = validator1;

        vm.prank(user1);
        bytes32 modelId = engine.registerModelWithAllowList(
            model1,
            0,
            TESTBUF,
            allowList
        );

        // Remove all addresses from allow list
        address[] memory toRemove = new address[](1);
        toRemove[0] = validator1;

        vm.prank(model1);
        engine.removeFromModelAllowList(modelId, toRemove);

        // No one is allowed
        assertFalse(engine.isSolverAllowed(modelId, validator1));
        assertFalse(engine.isSolverAllowed(modelId, validator2));

        // Try to submit solution
        bytes32 taskId = _deployBootstrapTask(modelId, user1);
        bytes32 commitment = engine.generateCommitment(validator1, taskId, TESTCID);
        vm.prank(validator1);
        engine.signalCommitment(commitment);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        vm.expectRevert("NotAllowedToSubmitSolution()");
        engine.submitSolution(taskId, TESTCID);
    }

    function test_RevertWhenAddingToDisabledAllowList() public {
        address[] memory allowList = new address[](1);
        allowList[0] = validator1;

        vm.prank(user1);
        bytes32 modelId = engine.registerModelWithAllowList(
            model1,
            0,
            TESTBUF,
            allowList
        );

        // Disable the allow list
        vm.prank(model1);
        engine.disableModelAllowList(modelId);

        // Try to add to disabled allow list
        address[] memory toAdd = new address[](1);
        toAdd[0] = validator4;

        vm.prank(model1);
        vm.expectRevert("AllowListNotEnabled()");
        engine.addToModelAllowList(modelId, toAdd);
    }

    function test_RevertWhenRemovingFromDisabledAllowList() public {
        address[] memory allowList = new address[](1);
        allowList[0] = validator1;

        vm.prank(user1);
        bytes32 modelId = engine.registerModelWithAllowList(
            model1,
            0,
            TESTBUF,
            allowList
        );

        // Disable the allow list
        vm.prank(model1);
        engine.disableModelAllowList(modelId);

        // Try to remove from disabled allow list
        address[] memory toRemove = new address[](1);
        toRemove[0] = validator1;

        vm.prank(model1);
        vm.expectRevert("AllowListNotEnabled()");
        engine.removeFromModelAllowList(modelId, toRemove);
    }

    function test_RevertWhenDisablingAlreadyDisabledAllowList() public {
        address[] memory allowList = new address[](1);
        allowList[0] = validator1;

        vm.prank(user1);
        bytes32 modelId = engine.registerModelWithAllowList(
            model1,
            0,
            TESTBUF,
            allowList
        );

        // Disable the allow list
        vm.prank(model1);
        engine.disableModelAllowList(modelId);

        // Try to disable again
        vm.prank(model1);
        vm.expectRevert("AllowListNotEnabled()");
        engine.disableModelAllowList(modelId);
    }

    function test_RegisterModelWithEmptyAllowList() public {
        address[] memory emptyAllowList = new address[](0);

        vm.prank(user1);
        bytes32 modelId = engine.registerModelWithAllowList(
            model1,
            0,
            TESTBUF,
            emptyAllowList
        );

        // Model should require allow list but have no allowed validators
        assertTrue(engine.modelRequiresAllowList(modelId));
        assertFalse(engine.isSolverAllowed(modelId, validator1));

        // No one can submit
        bytes32 taskId = _deployBootstrapTask(modelId, user1);
        bytes32 commitment = engine.generateCommitment(validator1, taskId, TESTCID);
        vm.prank(validator1);
        engine.signalCommitment(commitment);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        vm.expectRevert("NotAllowedToSubmitSolution()");
        engine.submitSolution(taskId, TESTCID);
    }
}
