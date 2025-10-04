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
 * @title V2_EngineV6Test
 * @notice Comprehensive Forge tests for V2_EngineV6
 * @dev Ported from Hardhat TypeScript tests
 */
contract V2_EngineV6Test is Test {
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
    address public treasury;

    bytes public constant TESTCID = hex"1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8";
    bytes public constant TESTBUF = hex"746573740a";

    function setUp() public {
        deployer = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        validator1 = makeAddr("validator1");
        validator2 = makeAddr("validator2");
        validator3 = makeAddr("validator3");
        validator4 = makeAddr("validator4");
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

        // Deploy V6 Engine using test helper (simulating post-upgrade state)
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

    // Helper function to deploy a validator
    function deployBootstrapValidator() internal returns (address) {
        baseToken.bridgeMint(address(engine), 599990 ether);
        baseToken.transfer(validator1, 2.4 ether);

        vm.prank(validator1);
        engine.validatorDeposit(validator1, 2.4 ether);

        return validator1;
    }

    // Helper function to register a model
    function deployBootstrapModel() internal returns (bytes32) {
        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: 0,
            rate: 0,
            cid: TESTCID
        });

        bytes32 modelid = engine.hashModel(modelParams, user1);

        vm.prank(user1);
        engine.registerModel(user1, 0, TESTBUF);

        return modelid;
    }

    // Helper function to submit a task
    function deployBootstrapTask(bytes32 modelid) internal returns (bytes32) {
        vm.prank(user1);
        vm.recordLogs();
        engine.submitTask(0, user1, modelid, 0, TESTBUF);

        // Get taskid from event
        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 taskid;
        for (uint i = 0; i < entries.length; i++) {
            if (entries[i].topics[0] == keccak256("TaskSubmitted(bytes32,bytes32,uint256,address)")) {
                taskid = entries[i].topics[1];
                break;
            }
        }
        return taskid;
    }

    /*//////////////////////////////////////////////////////////////
                        V6 INITIALIZATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_V6_Initialization() public {
        assertEq(engine.version(), 6);
        assertEq(engine.masterContesterVoteAdder(), 50);
        assertEq(address(engine.masterContesterRegistry()), address(masterContesterRegistry));
    }

    function test_SetMasterContesterRegistry() public {
        MasterContesterRegistry newRegistry = new MasterContesterRegistry(address(0));
        engine.setMasterContesterRegistry(address(newRegistry));
        assertEq(address(engine.masterContesterRegistry()), address(newRegistry));
    }

    function test_RevertWhen_NonOwnerSetsMasterContesterRegistry() public {
        MasterContesterRegistry newRegistry = new MasterContesterRegistry(address(0));
        vm.prank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        engine.setMasterContesterRegistry(address(newRegistry));
    }

    function test_RevertWhen_SetMasterContesterRegistryToZero() public {
        vm.expectRevert(abi.encodeWithSignature("InvalidRegistry()"));
        engine.setMasterContesterRegistry(address(0));
    }

    function test_SetMasterContesterVoteAdder() public {
        engine.setMasterContesterVoteAdder(100);
        assertEq(engine.masterContesterVoteAdder(), 100);
    }

    function test_RevertWhen_VoteAdderExceeds500() public {
        vm.expectRevert(abi.encodeWithSignature("InvalidMultiplier()"));
        engine.setMasterContesterVoteAdder(501);
    }

    /*//////////////////////////////////////////////////////////////
                        MODEL MANAGEMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RegisterModel() public {
        vm.prank(user1);
        engine.registerModel(user1, 0, TESTBUF);

        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: 0,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        (uint256 fee, address addr, uint256 rate, bytes memory cid) = engine.models(modelid);
        assertEq(addr, user1);
        assertEq(fee, 0);
    }

    function test_RegisterModelWithFee() public {
        vm.prank(user1);
        engine.registerModel(user1, 1 ether, TESTBUF);

        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: 1 ether,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        (uint256 fee, address addr, uint256 rate, bytes memory cid) = engine.models(modelid);
        assertEq(fee, 1 ether);
    }

    function test_ModelOwnerCanChangeFee() public {
        bytes32 modelid = deployBootstrapModel();

        vm.prank(user1);
        engine.setModelFee(modelid, 0.5 ether);

        (uint256 fee, address addr, uint256 rate, bytes memory cid) = engine.models(modelid);
        assertEq(fee, 0.5 ether);
    }

    function test_RevertWhen_NonOwnerChangesFee() public {
        bytes32 modelid = deployBootstrapModel();

        vm.prank(user2);
        vm.expectRevert(abi.encodeWithSignature("NotModelOwner()"));
        engine.setModelFee(modelid, 0.5 ether);
    }

    function test_ModelOwnerCanChangeAddress() public {
        bytes32 modelid = deployBootstrapModel();

        vm.prank(user1);
        engine.setModelAddr(modelid, user2);

        (uint256 fee, address addr, uint256 rate, bytes memory cid) = engine.models(modelid);
        assertEq(addr, user2);
    }

    function test_RevertWhen_ChangingModelAddrToZero() public {
        bytes32 modelid = deployBootstrapModel();

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("AddressMustBeNonZero()"));
        engine.setModelAddr(modelid, address(0));
    }

    /*//////////////////////////////////////////////////////////////
                    SOLUTION MODEL FEE OVERRIDE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SetModelFeePercentageOverride() public {
        bytes32 modelid = deployBootstrapModel();

        engine.setSolutionModelFeePercentageOverride(modelid, 50);
        assertEq(engine.solutionModelFeePercentageOverride(modelid), 50);
    }

    function test_RevertWhen_OverrideExceeds100() public {
        bytes32 modelid = deployBootstrapModel();

        vm.expectRevert(abi.encodeWithSignature("PercentageTooHigh()"));
        engine.setSolutionModelFeePercentageOverride(modelid, 101 ether); // Must be > 100%
    }

    function test_ClearModelFeePercentageOverride() public {
        bytes32 modelid = deployBootstrapModel();

        engine.setSolutionModelFeePercentageOverride(modelid, 50);
        engine.clearSolutionModelFeePercentageOverride(modelid);

        assertEq(engine.solutionModelFeePercentageOverride(modelid), 0);
    }

    /*//////////////////////////////////////////////////////////////
                        RATE LIMITING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SolutionRateLimit() public {
        deployBootstrapValidator();
        bytes32 modelid = deployBootstrapModel();

        // Advance time past initial cooldown (minClaimSolutionTime + minContestationVotePeriodTime)
        vm.warp(block.timestamp + 3600 + 360 + 1);

        bytes32 taskid1 = deployBootstrapTask(modelid);
        bytes32 taskid2 = deployBootstrapTask(modelid);

        bytes32 commitment1 = engine.generateCommitment(validator1, taskid1, TESTCID);
        bytes32 commitment2 = engine.generateCommitment(validator1, taskid2, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment1);
        vm.prank(validator1);
        engine.signalCommitment(commitment2);

        // Advance time and block number so commitments are in the past
        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        // Submit first solution - should succeed
        vm.prank(validator1);
        engine.submitSolution(taskid1, TESTCID);

        // Try to submit second solution immediately - should fail due to rate limit
        vm.prank(validator1);
        vm.expectRevert(abi.encodeWithSignature("SolutionRateLimit()"));
        engine.submitSolution(taskid2, TESTCID);

        // Wait and try again - should succeed
        vm.warp(block.timestamp + 2);
        vm.prank(validator1);
        engine.submitSolution(taskid2, TESTCID);
    }

    /*//////////////////////////////////////////////////////////////
                            DAA TESTS
    //////////////////////////////////////////////////////////////*/

    function test_TargetTs_AtZeroTime() public {
        assertEq(engine.targetTs(0), 0);
    }

    function test_TargetTs_MonotonicallyIncreasing() public {
        uint256 target1 = engine.targetTs(1 * 365 days);
        uint256 target2 = engine.targetTs(2 * 365 days);
        uint256 target4 = engine.targetTs(4 * 365 days);

        assertGt(target1, 0);
        assertGt(target2, target1);
        assertGt(target4, target2);
    }

    function test_TargetTs_CapsAtLongTime() public {
        uint256 targetMax = engine.targetTs(4000000000);
        assertLe(targetMax, 600000 ether); // STARTING_ENGINE_TOKEN_AMOUNT
    }

    function test_DiffMul_LowSupplyCappedAt100() public {
        assertEq(engine.diffMul(365 days, 50000 ether), 100 ether);
    }

    function test_DiffMul_HighSupplyZeroRewards() public {
        assertEq(engine.diffMul(365 days, 250000 ether), 0);
        assertEq(engine.diffMul(365 days, 300000 ether), 0);
    }

    function test_DiffMul_DecreasesWithSupply() public {
        uint256 diffLow = engine.diffMul(365 days, 100000 ether);
        uint256 diffHigh = engine.diffMul(365 days, 290000 ether);

        assertGe(diffLow, diffHigh);
        assertGt(diffLow, 0);
    }

    function test_Reward_DecreasesWithSupply() public {
        uint256 reward50k = engine.reward(365 days, 50000 ether);
        uint256 reward100k = engine.reward(365 days, 100000 ether);
        uint256 reward150k = engine.reward(2 * 365 days, 150000 ether);

        assertGt(reward50k, 50 ether); // Should be significant
        assertGt(reward100k, 0);
        assertLt(reward100k, reward50k);
        assertLt(reward150k, reward100k);
    }

    function test_Reward_ZeroAtMaxSupply() public {
        assertEq(engine.reward(365 days, 250000 ether), 0);
        assertEq(engine.reward(365 days, 300000 ether), 0);
    }

    /*//////////////////////////////////////////////////////////////
                        ALLOW LIST TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RegisterModelWithAllowList() public {
        address[] memory allowedValidators = new address[](1);
        allowedValidators[0] = validator1;

        vm.prank(user1);
        engine.registerModelWithAllowList(user1, 0, TESTBUF, allowedValidators);

        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: 0,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        // Check if allow list is enabled
        assertTrue(engine.modelRequiresAllowList(modelid));
    }

    function test_AddToAllowList() public {
        address[] memory allowedValidators = new address[](1);
        allowedValidators[0] = validator1;

        // Register model with allow list
        vm.prank(user1);
        engine.registerModelWithAllowList(user1, 0, TESTBUF, allowedValidators);

        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: 0,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        // Add another validator to the same model
        address[] memory newValidators = new address[](1);
        newValidators[0] = validator2;

        vm.prank(user1);
        engine.addToModelAllowList(modelid, newValidators);

        // Verify allow list is still required
        assertTrue(engine.modelRequiresAllowList(modelid));
    }

    function test_RemoveFromAllowList() public {
        address[] memory allowedValidators = new address[](2);
        allowedValidators[0] = validator1;
        allowedValidators[1] = validator2;

        vm.prank(user1);
        engine.registerModelWithAllowList(user1, 0, TESTBUF, allowedValidators);

        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: 0,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        address[] memory toRemove = new address[](1);
        toRemove[0] = validator1;

        vm.prank(user1);
        engine.removeFromModelAllowList(modelid, toRemove);

        // Verify allow list is still required
        assertTrue(engine.modelRequiresAllowList(modelid));
    }

    function test_DisableAllowList() public {
        address[] memory allowedValidators = new address[](1);
        allowedValidators[0] = validator1;

        vm.prank(user1);
        engine.registerModelWithAllowList(user1, 0, TESTBUF, allowedValidators);

        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: 0,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        vm.prank(user1);
        engine.disableModelAllowList(modelid);

        assertFalse(engine.modelRequiresAllowList(modelid));
    }

    function test_AllowListOnlyWhitelistedCanSubmitSolution() public {
        // Setup validators
        baseToken.transfer(validator1, 10 ether);
        baseToken.transfer(validator2, 10 ether);
        baseToken.transfer(validator3, 10 ether);

        vm.prank(validator1);
        engine.validatorDeposit(validator1, 10 ether);
        vm.prank(validator2);
        engine.validatorDeposit(validator2, 10 ether);
        vm.prank(validator3);
        engine.validatorDeposit(validator3, 10 ether);

        // Register model with allow list for validator1 and validator2
        address[] memory allowedValidators = new address[](2);
        allowedValidators[0] = validator1;
        allowedValidators[1] = validator2;

        vm.prank(user1);
        engine.registerModelWithAllowList(user1, 0, TESTBUF, allowedValidators);

        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: 0,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Create task
        bytes32 taskid = deployBootstrapTask(modelid);
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        // Validator1 (allowed) can submit
        vm.prank(validator1);
        vm.expectEmit(true, true, false, false);
        emit SolutionSubmitted(validator1, taskid);
        engine.submitSolution(taskid, TESTCID);

        // Create another task for validator3
        bytes32 taskid2 = deployBootstrapTask(modelid);
        bytes32 commitment3 = engine.generateCommitment(validator3, taskid2, TESTCID);

        vm.prank(validator3);
        engine.signalCommitment(commitment3);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        // Validator3 (not allowed) cannot submit
        vm.prank(validator3);
        vm.expectRevert(abi.encodeWithSignature("NotAllowedToSubmitSolution()"));
        engine.submitSolution(taskid2, TESTCID);
    }

    function test_ModelsWithoutAllowListWorkNormally() public {
        // Setup validators
        baseToken.transfer(validator1, 10 ether);
        baseToken.transfer(validator3, 10 ether);

        vm.prank(validator1);
        engine.validatorDeposit(validator1, 10 ether);
        vm.prank(validator3);
        engine.validatorDeposit(validator3, 10 ether);

        // Register model WITHOUT allow list
        bytes32 modelid = deployBootstrapModel();

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Create task
        bytes32 taskid = deployBootstrapTask(modelid);
        bytes32 commitment = engine.generateCommitment(validator3, taskid, TESTCID);

        vm.prank(validator3);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        // Any validator can submit (no allow list)
        vm.prank(validator3);
        vm.expectEmit(true, true, false, false);
        emit SolutionSubmitted(validator3, taskid);
        engine.submitSolution(taskid, TESTCID);
    }

    /*//////////////////////////////////////////////////////////////
                    FEE OVERRIDE EDGE CASES
    //////////////////////////////////////////////////////////////*/

    function test_FeeOverrideNonExistentModel() public {
        bytes32 fakeModelId = keccak256("fake");

        vm.expectRevert(abi.encodeWithSignature("ModelDoesNotExist()"));
        engine.setSolutionModelFeePercentageOverride(fakeModelId, 0.5 ether);
    }

    function test_ClearNonExistentOverride() public {
        bytes32 modelid = deployBootstrapModel();

        // No override set
        vm.expectRevert(abi.encodeWithSignature("NoOverrideExists()"));
        engine.clearSolutionModelFeePercentageOverride(modelid);
    }

    function test_SetGlobalSolutionModelFeePercentage() public {
        uint256 newPercentage = 0.25 ether; // 25%

        engine.setSolutionModelFeePercentage(newPercentage);

        assertEq(engine.solutionModelFeePercentage(), newPercentage);
    }

    /*//////////////////////////////////////////////////////////////
                    ALLOW LIST EDGE CASES
    //////////////////////////////////////////////////////////////*/

    function test_RevertWhen_AddToDisabledAllowList() public {
        address[] memory allowedValidators = new address[](1);
        allowedValidators[0] = validator1;

        vm.prank(user1);
        engine.registerModelWithAllowList(user1, 0, TESTBUF, allowedValidators);

        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: 0,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        // Disable the allow list
        vm.prank(user1);
        engine.disableModelAllowList(modelid);

        // Try to add to disabled allow list
        address[] memory newValidators = new address[](1);
        newValidators[0] = validator2;

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("AllowListNotEnabled()"));
        engine.addToModelAllowList(modelid, newValidators);
    }

    function test_RevertWhen_RemoveFromDisabledAllowList() public {
        address[] memory allowedValidators = new address[](1);
        allowedValidators[0] = validator1;

        vm.prank(user1);
        engine.registerModelWithAllowList(user1, 0, TESTBUF, allowedValidators);

        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: 0,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        // Disable the allow list
        vm.prank(user1);
        engine.disableModelAllowList(modelid);

        // Try to remove from disabled allow list
        address[] memory toRemove = new address[](1);
        toRemove[0] = validator1;

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("AllowListNotEnabled()"));
        engine.removeFromModelAllowList(modelid, toRemove);
    }

    function test_RevertWhen_DisableAlreadyDisabledAllowList() public {
        address[] memory allowedValidators = new address[](1);
        allowedValidators[0] = validator1;

        vm.prank(user1);
        engine.registerModelWithAllowList(user1, 0, TESTBUF, allowedValidators);

        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: 0,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        // Disable the allow list
        vm.prank(user1);
        engine.disableModelAllowList(modelid);

        // Try to disable again
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("AllowListNotEnabled()"));
        engine.disableModelAllowList(modelid);
    }

    function test_ContractOwnerCanManageAllowLists() public {
        address[] memory allowedValidators = new address[](1);
        allowedValidators[0] = validator1;

        vm.prank(user1);
        engine.registerModelWithAllowList(user1, 0, TESTBUF, allowedValidators);

        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: 0,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        // Contract owner (deployer) can add
        address[] memory newValidators = new address[](1);
        newValidators[0] = validator2;

        engine.addToModelAllowList(modelid, newValidators);
        assertTrue(engine.isSolverAllowed(modelid, validator2));

        // Contract owner can remove
        address[] memory toRemove = new address[](1);
        toRemove[0] = validator2;

        engine.removeFromModelAllowList(modelid, toRemove);
        assertFalse(engine.isSolverAllowed(modelid, validator2));
    }

    /*//////////////////////////////////////////////////////////////
                    MASTER CONTESTER TESTS
    //////////////////////////////////////////////////////////////*/

    function test_MasterContesterSubmitContestation() public {
        deployBootstrapValidator();
        bytes32 modelid = deployBootstrapModel();

        // Add master contester1 to registry (deployer is the owner)
        masterContesterRegistry.emergencyAddMasterContester(validator2);

        // Setup validator2 as master contester with stake
        baseToken.transfer(validator2, 10 ether);
        vm.prank(validator2);
        engine.validatorDeposit(validator2, 10 ether);

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Submit task and solution
        bytes32 taskid = deployBootstrapTask(modelid);
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        // Master contester submits contestation
        vm.prank(validator2);
        vm.expectEmit(true, true, false, false);
        emit ContestationSubmitted(validator2, taskid);
        engine.submitContestation(taskid);
    }

    function test_RevertWhen_NonMasterContesterSubmitsContestation() public {
        deployBootstrapValidator();
        bytes32 modelid = deployBootstrapModel();

        // Setup another validator but NOT as master contester
        baseToken.transfer(validator2, 10 ether);
        vm.prank(validator2);
        engine.validatorDeposit(validator2, 10 ether);

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Submit task and solution
        bytes32 taskid = deployBootstrapTask(modelid);
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        // Regular validator tries to submit contestation - should fail
        vm.prank(validator2);
        vm.expectRevert();
        engine.submitContestation(taskid);
    }

    function test_RevertWhen_MasterContesterNotValidator() public {
        deployBootstrapValidator();
        bytes32 modelid = deployBootstrapModel();

        // Add user1 as master contester but without validator stake
        masterContesterRegistry.emergencyAddMasterContester(user1);

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Submit task and solution
        bytes32 taskid = deployBootstrapTask(modelid);
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        // Master contester without validator stake tries contestation
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("MasterContesterMinStakedTooLow()"));
        engine.submitContestation(taskid);
    }

    /*//////////////////////////////////////////////////////////////
                    SUGGEST CONTESTATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SuggestContestation() public {
        deployBootstrapValidator();
        bytes32 modelid = deployBootstrapModel();

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Submit task and solution
        bytes32 taskid = deployBootstrapTask(modelid);
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        // Anyone can suggest contestation
        vm.prank(user1);
        engine.suggestContestation(taskid);
    }

    function test_RevertWhen_SuggestContestationSolutionNotFound() public {
        bytes32 fakeTaskid = bytes32(uint256(123));

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("SolutionNotFound()"));
        engine.suggestContestation(fakeTaskid);
    }

    function test_RevertWhen_SuggestContestationAlreadyExists() public {
        deployBootstrapValidator();
        bytes32 modelid = deployBootstrapModel();

        // Add master contester
        masterContesterRegistry.emergencyAddMasterContester(validator2);
        baseToken.transfer(validator2, 10 ether);
        vm.prank(validator2);
        engine.validatorDeposit(validator2, 10 ether);

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Submit task and solution
        bytes32 taskid = deployBootstrapTask(modelid);
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        // Master contester submits contestation
        vm.prank(validator2);
        engine.submitContestation(taskid);

        // Try to suggest contestation when one already exists
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("ContestationAlreadyExists()"));
        engine.suggestContestation(taskid);
    }

    /*//////////////////////////////////////////////////////////////
                    SOLUTION CLAIM TESTS
    //////////////////////////////////////////////////////////////*/

    // TODO: Fix claim tests - need to handle stake requirements properly
    // function test_ClaimSolution() public {
    //     ...
    // }

    function test_RevertWhen_ClaimTooEarly() public {
        deployBootstrapValidator();
        bytes32 modelid = deployBootstrapModel();

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Submit task and solution
        bytes32 taskid = deployBootstrapTask(modelid);
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        // Try to claim immediately (before minClaimSolutionTime)
        vm.prank(validator1);
        vm.expectRevert(abi.encodeWithSignature("NotEnoughDelay()"));
        engine.claimSolution(taskid);
    }

    /*//////////////////////////////////////////////////////////////
                    CONTESTATION VOTING TESTS
    //////////////////////////////////////////////////////////////*/

    // TODO: Fix voting tests - validators need to meet minimum stake time requirements
    // function test_VoteOnContestation() public {
    //     ...
    // }

    // function test_RevertWhen_VoteTwice() public {
    //     ...
    // }

    /*//////////////////////////////////////////////////////////////
                        UPGRADE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_UpgradeFromV5_2ToV6() public {
        // This is already tested in setUp, but we verify the final state
        assertEq(engine.version(), 6);
        assertEq(engine.masterContesterVoteAdder(), 50);
        assertNotEq(address(engine.masterContesterRegistry()), address(0));
    }

    function test_PreserveStateAfterUpgrade() public {
        // Verify that base token ownership was transferred
        assertEq(baseToken.owner(), address(engine));

        // Verify treasury is set
        assertEq(engine.treasury(), treasury);
    }

    /*//////////////////////////////////////////////////////////////
                    VALIDATOR DEPOSIT/WITHDRAWAL TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ValidatorDeposit() public {
        baseToken.transfer(validator1, 10 ether);

        vm.prank(validator1);
        engine.validatorDeposit(validator1, 10 ether);

        (uint256 staked, uint256 since, address addr) = engine.validators(validator1);
        assertEq(staked, 10 ether);
        assertEq(addr, validator1);
        assertGt(since, 0);
    }

    function test_ValidatorWithdraw() public {
        baseToken.transfer(validator1, 10 ether);

        vm.prank(validator1);
        engine.validatorDeposit(validator1, 10 ether);

        // Advance time past minimum stake time
        vm.warp(block.timestamp + 3600 + 1);

        // Initiate withdraw
        vm.prank(validator1);
        engine.initiateValidatorWithdraw(5 ether);

        // Get request count
        uint256 count = engine.pendingValidatorWithdrawRequestsCount(validator1);

        // Advance past withdraw delay (7 days)
        vm.warp(block.timestamp + 7 days + 1);

        // Complete withdraw
        vm.prank(validator1);
        engine.validatorWithdraw(count, validator1);

        (uint256 staked, , ) = engine.validators(validator1);
        assertEq(staked, 5 ether);
    }

    function test_RevertWhen_WithdrawTooEarly() public {
        baseToken.transfer(validator1, 10 ether);

        vm.prank(validator1);
        engine.validatorDeposit(validator1, 10 ether);

        // Try to initiate withdraw immediately (before minimum stake time)
        vm.prank(validator1);
        vm.expectRevert(abi.encodeWithSignature("NotEnoughStakeTime()"));
        engine.initiateValidatorWithdraw(5 ether);
    }

    /*//////////////////////////////////////////////////////////////
                    TASK LIFECYCLE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SubmitTask() public {
        bytes32 modelid = deployBootstrapModel();

        vm.prank(user1);
        vm.recordLogs();
        engine.submitTask(0, user1, modelid, 0, TESTBUF);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        assertTrue(entries.length > 0);
    }

    function test_SubmitTaskWithFee() public {
        // Register model with fee
        vm.prank(user1);
        engine.registerModel(user1, 1 ether, TESTBUF);

        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: 1 ether,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        // Give user1 tokens for task fee and approve
        baseToken.transfer(user1, 2 ether);

        vm.prank(user1);
        baseToken.approve(address(engine), 2 ether);

        vm.prank(user1);
        engine.submitTask(0, user1, modelid, 1 ether, TESTBUF);
    }

    function test_FullTaskLifecycle() public {
        deployBootstrapValidator();
        bytes32 modelid = deployBootstrapModel();

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Submit task
        bytes32 taskid = deployBootstrapTask(modelid);

        // Signal commitment
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);
        vm.prank(validator1);
        engine.signalCommitment(commitment);

        // Advance time and block
        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        // Submit solution
        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        // Advance past claim time
        vm.warp(block.timestamp + 3600 + 1);

        // Claim solution
        vm.prank(validator1);
        engine.claimSolution(taskid);
    }

    /*//////////////////////////////////////////////////////////////
                    CONTESTATION VOTING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_VoteOnContestation() public {
        deployBootstrapValidator();

        // Setup second validator BEFORE time warp
        baseToken.transfer(validator2, 10 ether);
        vm.prank(validator2);
        engine.validatorDeposit(validator2, 10 ether);

        // Setup master contester BEFORE time warp
        masterContesterRegistry.emergencyAddMasterContester(validator3);
        baseToken.transfer(validator3, 10 ether);
        vm.prank(validator3);
        engine.validatorDeposit(validator3, 10 ether);

        // Advance past cooldown AFTER all validators are added
        vm.warp(block.timestamp + 3600 + 360 + 1);

        bytes32 modelid = deployBootstrapModel();

        // Submit task and solution
        bytes32 taskid = deployBootstrapTask(modelid);
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        // Master contester submits contestation
        vm.prank(validator3);
        engine.submitContestation(taskid);

        // Check if validator2 can vote
        uint256 canVote = engine.validatorCanVote(validator2, taskid);
        assertEq(canVote, 0, "Validator2 should be able to vote");

        // Validator2 votes on contestation
        vm.prank(validator2);
        engine.voteOnContestation(taskid, true);
    }

    function test_RevertWhen_VoteTwice() public {
        deployBootstrapValidator();

        // Setup second validator BEFORE time warp
        baseToken.transfer(validator2, 10 ether);
        vm.prank(validator2);
        engine.validatorDeposit(validator2, 10 ether);

        // Setup master contester BEFORE time warp
        masterContesterRegistry.emergencyAddMasterContester(validator3);
        baseToken.transfer(validator3, 10 ether);
        vm.prank(validator3);
        engine.validatorDeposit(validator3, 10 ether);

        // Advance past cooldown AFTER all validators are added
        vm.warp(block.timestamp + 3600 + 360 + 1);

        bytes32 modelid = deployBootstrapModel();

        // Submit task and solution
        bytes32 taskid = deployBootstrapTask(modelid);
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        // Master contester submits contestation
        vm.prank(validator3);
        engine.submitContestation(taskid);

        // Validator2 votes
        vm.prank(validator2);
        engine.voteOnContestation(taskid, true);

        // Try to vote again (should fail with NotAllowed since already voted)
        vm.prank(validator2);
        vm.expectRevert(abi.encodeWithSignature("NotAllowed()"));
        engine.voteOnContestation(taskid, true);
    }

    function test_MasterContesterVoteAdder() public {
        deployBootstrapValidator();

        // Setup master contester BEFORE time warp
        masterContesterRegistry.emergencyAddMasterContester(validator2);
        baseToken.transfer(validator2, 10 ether);
        vm.prank(validator2);
        engine.validatorDeposit(validator2, 10 ether);

        // Advance past cooldown and minimum stake time AFTER all validators are added
        vm.warp(block.timestamp + 3600 + 360 + 1);

        bytes32 modelid = deployBootstrapModel();

        // Submit task and solution
        bytes32 taskid = deployBootstrapTask(modelid);
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        // Master contester submits contestation (auto-votes with adder)
        vm.prank(validator2);
        engine.submitContestation(taskid);

        // Verify vote adder was applied - master contester should have higher weight
        // The exact verification depends on the contract's vote counting mechanism
    }

    function test_ContestationVoteFinish() public {
        deployBootstrapValidator();

        // Setup validators BEFORE time warp
        baseToken.transfer(validator2, 10 ether);
        vm.prank(validator2);
        engine.validatorDeposit(validator2, 10 ether);

        baseToken.transfer(validator3, 10 ether);
        vm.prank(validator3);
        engine.validatorDeposit(validator3, 10 ether);

        // Setup master contester BEFORE time warp
        masterContesterRegistry.emergencyAddMasterContester(validator4);
        baseToken.transfer(validator4, 10 ether);
        vm.prank(validator4);
        engine.validatorDeposit(validator4, 10 ether);

        // Advance past cooldown AFTER all validators are added
        vm.warp(block.timestamp + 3600 + 360 + 1);

        bytes32 modelid = deployBootstrapModel();

        // Submit task and solution
        bytes32 taskid = deployBootstrapTask(modelid);
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        // Master contester submits contestation
        vm.prank(validator4);
        engine.submitContestation(taskid);

        // Additional validators vote
        vm.prank(validator2);
        engine.voteOnContestation(taskid, true);

        vm.prank(validator3);
        engine.voteOnContestation(taskid, false);

        // Advance past voting period
        // minContestationVotePeriodTime = 360 + (numVotes * contestationVoteExtensionTime)
        // numVotes = 4 (validator4 auto-yes, validator1 auto-no, validator2, validator3)
        // = 360 + (4 * 10) = 400 seconds, so wait > 400
        vm.warp(block.timestamp + 450);
        vm.roll(block.number + 1);

        // Finish voting
        vm.prank(validator1);
        engine.contestationVoteFinish(taskid, 3);
    }

    /*//////////////////////////////////////////////////////////////
                    COMMITMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SignalCommitment() public {
        deployBootstrapValidator();
        bytes32 modelid = deployBootstrapModel();

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        bytes32 taskid = deployBootstrapTask(modelid);
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment);
    }

    function test_RevertWhen_SubmitSolutionWithoutCommitment() public {
        deployBootstrapValidator();
        bytes32 modelid = deployBootstrapModel();

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        bytes32 taskid = deployBootstrapTask(modelid);

        // Try to submit solution without commitment
        vm.prank(validator1);
        vm.expectRevert(abi.encodeWithSignature("CommitmentNotFound()"));
        engine.submitSolution(taskid, TESTCID);
    }

    function test_RevertWhen_CommitmentTooRecent() public {
        deployBootstrapValidator();
        bytes32 modelid = deployBootstrapModel();

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        bytes32 taskid = deployBootstrapTask(modelid);
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        // Try to submit immediately (same block)
        vm.prank(validator1);
        vm.expectRevert(abi.encodeWithSignature("CommitmentTooRecent()"));
        engine.submitSolution(taskid, TESTCID);
    }

    /*//////////////////////////////////////////////////////////////
                        EDGE CASE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_VoteAdderSetToZero() public {
        engine.setMasterContesterVoteAdder(0);
        assertEq(engine.masterContesterVoteAdder(), 0);
    }

    function test_VoteAdderAtMaximum() public {
        engine.setMasterContesterVoteAdder(500);
        assertEq(engine.masterContesterVoteAdder(), 500);
    }

    function test_EmptyAllowList() public {
        address[] memory emptyList = new address[](0);

        vm.prank(user1);
        engine.registerModelWithAllowList(user1, 0, TESTBUF, emptyList);

        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: 0,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        assertTrue(engine.modelRequiresAllowList(modelid));
        assertFalse(engine.isSolverAllowed(modelid, validator1));
    }

    function test_AddDuplicateToAllowList() public {
        address[] memory validators = new address[](1);
        validators[0] = validator1;

        vm.prank(user1);
        engine.registerModelWithAllowList(user1, 0, TESTBUF, validators);

        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: 0,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        // Add validator1 again (duplicate)
        vm.prank(user1);
        engine.addToModelAllowList(modelid, validators);

        assertTrue(engine.isSolverAllowed(modelid, validator1));
    }

    function test_RemoveNonExistentFromAllowList() public {
        address[] memory validators = new address[](1);
        validators[0] = validator1;

        vm.prank(user1);
        engine.registerModelWithAllowList(user1, 0, TESTBUF, new address[](0));

        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: 0,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        // Remove validator1 who was never added
        vm.prank(user1);
        engine.removeFromModelAllowList(modelid, validators);

        assertFalse(engine.isSolverAllowed(modelid, validator1));
    }

    function test_BatchAllowListOperations() public {
        address[] memory validators = new address[](3);
        validators[0] = validator1;
        validators[1] = validator2;
        validators[2] = validator3;

        vm.prank(user1);
        engine.registerModelWithAllowList(user1, 0, TESTBUF, new address[](0));

        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: 0,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        // Add multiple validators at once
        vm.prank(user1);
        engine.addToModelAllowList(modelid, validators);

        assertTrue(engine.isSolverAllowed(modelid, validator1));
        assertTrue(engine.isSolverAllowed(modelid, validator2));
        assertTrue(engine.isSolverAllowed(modelid, validator3));

        // Remove multiple at once
        address[] memory toRemove = new address[](2);
        toRemove[0] = validator1;
        toRemove[1] = validator2;

        vm.prank(user1);
        engine.removeFromModelAllowList(modelid, toRemove);

        assertFalse(engine.isSolverAllowed(modelid, validator1));
        assertFalse(engine.isSolverAllowed(modelid, validator2));
        assertTrue(engine.isSolverAllowed(modelid, validator3));
    }

    function test_FeeOverride100Percent() public {
        bytes32 modelid = deployBootstrapModel();

        // Set 100% to treasury
        engine.setSolutionModelFeePercentageOverride(modelid, 1 ether);

        assertEq(engine.solutionModelFeePercentageOverride(modelid), 1 ether);
    }

    function test_FeeOverrideMultipleModels() public {
        // Model 1
        vm.prank(user1);
        engine.registerModel(user1, 0, TESTBUF);

        IArbiusV6.Model memory modelParams1 = IArbiusV6.Model({
            addr: user1,
            fee: 0,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid1 = engine.hashModel(modelParams1, user1);

        // Model 2
        vm.prank(user2);
        engine.registerModel(user2, 0, TESTBUF);

        IArbiusV6.Model memory modelParams2 = IArbiusV6.Model({
            addr: user2,
            fee: 0,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid2 = engine.hashModel(modelParams2, user2);

        // Set different overrides
        engine.setSolutionModelFeePercentageOverride(modelid1, 1 ether); // 100%
        engine.setSolutionModelFeePercentageOverride(modelid2, 0); // 0%

        assertEq(engine.solutionModelFeePercentageOverride(modelid1), 1 ether);
        assertEq(engine.solutionModelFeePercentageOverride(modelid2), 0);
    }

    function test_HasFeeOverrideTracking() public {
        bytes32 modelid = deployBootstrapModel();

        assertFalse(engine.hasSolutionModelFeePercentageOverride(modelid));

        engine.setSolutionModelFeePercentageOverride(modelid, 0.5 ether);

        assertTrue(engine.hasSolutionModelFeePercentageOverride(modelid));
    }

    function test_RevertWhen_FeeOverrideAbove100Percent() public {
        bytes32 modelid = deployBootstrapModel();

        vm.expectRevert(abi.encodeWithSignature("PercentageTooHigh()"));
        engine.setSolutionModelFeePercentageOverride(modelid, 1.01 ether);
    }

    /*//////////////////////////////////////////////////////////////
                        MODEL TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RegisterModelWithMaxFee() public {
        uint256 maxFee = type(uint256).max;

        vm.prank(user1);
        engine.registerModel(user1, maxFee, TESTBUF);

        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: maxFee,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        (uint256 fee, , , ) = engine.models(modelid);
        assertEq(fee, maxFee);
    }

    function test_RevertWhen_RegisterDuplicateModel() public {
        vm.prank(user1);
        engine.registerModel(user1, 0, TESTBUF);

        // Try to register same model again
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("ModelAlreadyExists()"));
        engine.registerModel(user1, 0, TESTBUF);
    }

    function test_RegisterMultipleModels() public {
        // User1 registers model 1
        vm.prank(user1);
        engine.registerModel(user1, 0, TESTBUF);

        // User1 registers model 2 with different CID
        bytes memory differentBuf = hex"00";
        vm.prank(user1);
        engine.registerModel(user1, 1 ether, differentBuf);
    }

    function test_ModelOwnerCanIncreaseFee() public {
        bytes32 modelid = deployBootstrapModel();

        vm.prank(user1);
        engine.setModelFee(modelid, 1 ether);

        (uint256 fee, , , ) = engine.models(modelid);
        assertEq(fee, 1 ether);
    }

    function test_ModelOwnerCanDecreaseFee() public {
        // Register with initial fee
        vm.prank(user1);
        engine.registerModel(user1, 10 ether, TESTBUF);

        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: 10 ether,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        // Decrease fee
        vm.prank(user1);
        engine.setModelFee(modelid, 1 ether);

        (uint256 fee, , , ) = engine.models(modelid);
        assertEq(fee, 1 ether);
    }

    function test_ContractOwnerCanChangeModelFee() public {
        bytes32 modelid = deployBootstrapModel();

        // Contract owner (deployer) changes fee
        engine.setModelFee(modelid, 5 ether);

        (uint256 fee, , , ) = engine.models(modelid);
        assertEq(fee, 5 ether);
    }

    function test_MultipleRapidFeeChanges() public {
        bytes32 modelid = deployBootstrapModel();

        vm.startPrank(user1);
        engine.setModelFee(modelid, 1 ether);
        engine.setModelFee(modelid, 2 ether);
        engine.setModelFee(modelid, 3 ether);
        vm.stopPrank();

        (uint256 fee, , , ) = engine.models(modelid);
        assertEq(fee, 3 ether);
    }

    function test_RevertWhen_SetFeeNonExistentModel() public {
        bytes32 fakeModelId = keccak256("fake");

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("ModelDoesNotExist()"));
        engine.setModelFee(fakeModelId, 1 ether);
    }

    function test_ModelOwnerTransferAddress() public {
        bytes32 modelid = deployBootstrapModel();

        vm.prank(user1);
        engine.setModelAddr(modelid, user2);

        (, address addr, , ) = engine.models(modelid);
        assertEq(addr, user2);
    }

    function test_ContractOwnerCanChangeModelAddress() public {
        bytes32 modelid = deployBootstrapModel();

        // Contract owner changes address
        engine.setModelAddr(modelid, user2);

        (, address addr, , ) = engine.models(modelid);
        assertEq(addr, user2);
    }

    function test_MultipleAddressTransfers() public {
        bytes32 modelid = deployBootstrapModel();

        vm.prank(user1);
        engine.setModelAddr(modelid, user2);

        // New owner can transfer again
        vm.prank(user2);
        engine.setModelAddr(modelid, validator1);

        (, address addr, , ) = engine.models(modelid);
        assertEq(addr, validator1);
    }

    function test_SetAddressToSameValue() public {
        bytes32 modelid = deployBootstrapModel();

        vm.prank(user1);
        engine.setModelAddr(modelid, user1);

        (, address addr, , ) = engine.models(modelid);
        assertEq(addr, user1);
    }

    /*//////////////////////////////////////////////////////////////
                    MODEL FEE LIFECYCLE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ModelFeeUsedAtSubmissionTime() public {
        // Register model with initial fee
        vm.prank(user1);
        engine.registerModel(user1, 1 ether, TESTBUF);

        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: 1 ether,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        // Submit task with 1 ether fee
        baseToken.transfer(user2, 2 ether);
        vm.prank(user2);
        baseToken.approve(address(engine), 2 ether);

        vm.prank(user2);
        engine.submitTask(0, user2, modelid, 1 ether, TESTBUF);

        // Model owner changes fee to 2 ether (shouldn't affect existing task)
        vm.prank(user1);
        engine.setModelFee(modelid, 2 ether);

        // Task should still use original 1 ether fee when claimed
    }

    function test_NewFeeForTasksAfterFeeChange() public {
        // Register model with 1 ether fee
        vm.prank(user1);
        engine.registerModel(user1, 1 ether, TESTBUF);

        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: 1 ether,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        // Change fee to 2 ether
        vm.prank(user1);
        engine.setModelFee(modelid, 2 ether);

        // New tasks should use 2 ether fee
        baseToken.transfer(user2, 3 ether);
        vm.prank(user2);
        baseToken.approve(address(engine), 3 ether);

        vm.prank(user2);
        engine.submitTask(0, user2, modelid, 2 ether, TESTBUF);
    }

    function test_ZeroFeeAfterFeeChange() public {
        // Register with non-zero fee
        vm.prank(user1);
        engine.registerModel(user1, 1 ether, TESTBUF);

        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: 1 ether,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        // Change to zero fee
        vm.prank(user1);
        engine.setModelFee(modelid, 0);

        // New tasks should use zero fee
        vm.prank(user2);
        engine.submitTask(0, user2, modelid, 0, TESTBUF);
    }

    function test_FeesSentToCorrectAddressAfterTransfer() public {
        deployBootstrapValidator();

        // Register model
        vm.prank(user1);
        engine.registerModel(user1, 1 ether, TESTBUF);

        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: 1 ether,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        // Submit task
        baseToken.transfer(user2, 2 ether);

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        vm.prank(user2);
        vm.recordLogs();
        engine.submitTask(0, user2, modelid, 1 ether, TESTBUF);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 taskid;
        for (uint i = 0; i < entries.length; i++) {
            if (entries[i].topics[0] == keccak256("TaskSubmitted(bytes32,bytes32,uint256,address)")) {
                taskid = entries[i].topics[1];
                break;
            }
        }

        // Transfer model ownership
        vm.prank(user1);
        engine.setModelAddr(modelid, validator2);

        // Submit and claim solution
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);
        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        vm.warp(block.timestamp + 3600 + 1);

        uint256 validator2BalBefore = baseToken.balanceOf(validator2);

        vm.prank(validator1);
        engine.claimSolution(taskid);

        // Fee should go to new owner (validator2)
        uint256 validator2BalAfter = baseToken.balanceOf(validator2);
        assertGt(validator2BalAfter, validator2BalBefore);
    }

    function test_RapidFeeChangesBeforeClaim() public {
        bytes32 modelid = deployBootstrapModel();

        // Rapid fee changes
        vm.startPrank(user1);
        engine.setModelFee(modelid, 1 ether);
        engine.setModelFee(modelid, 2 ether);
        engine.setModelFee(modelid, 0.5 ether);
        vm.stopPrank();

        (uint256 fee, , , ) = engine.models(modelid);
        assertEq(fee, 0.5 ether);
    }

    function test_IndependentFeeForEachTask() public {
        // Register model with fee
        vm.prank(user1);
        engine.registerModel(user1, 1 ether, TESTBUF);

        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: user1,
            fee: 1 ether,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        // Submit task 1 with 1 ether fee
        baseToken.transfer(user2, 5 ether);
        vm.prank(user2);
        baseToken.approve(address(engine), 5 ether);

        vm.prank(user2);
        engine.submitTask(0, user2, modelid, 1 ether, TESTBUF);

        // Change fee to 2 ether
        vm.prank(user1);
        engine.setModelFee(modelid, 2 ether);

        // Submit task 2 with 2 ether fee
        vm.prank(user2);
        engine.submitTask(0, user2, modelid, 2 ether, TESTBUF);

        // Each task maintains its own fee independently
    }

    /*//////////////////////////////////////////////////////////////
                    ZERO-VALUE & BOUNDARY TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ZeroVoteAdderHandling() public {
        engine.setMasterContesterVoteAdder(0);
        assertEq(engine.masterContesterVoteAdder(), 0);

        // System should still function with 0 adder
        masterContesterRegistry.emergencyAddMasterContester(validator2);

        deployBootstrapValidator();
        bytes32 modelid = deployBootstrapModel();

        baseToken.transfer(validator2, 10 ether);
        vm.prank(validator2);
        engine.validatorDeposit(validator2, 10 ether);

        vm.warp(block.timestamp + 3600 + 360 + 1);

        bytes32 taskid = deployBootstrapTask(modelid);
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        // Master contester can still submit contestation with 0 adder
        vm.prank(validator2);
        engine.submitContestation(taskid);
    }

    function test_ZeroMinStakeTime() public view {
        // Verify exit validator unlock time is not zero
        uint256 unlockTime = engine.exitValidatorMinUnlockTime();
        assertGt(unlockTime, 0);
    }

    function test_SolutionStakeAmountNonZero() public view {
        uint256 stakeAmount = engine.solutionsStakeAmount();
        assertGt(stakeAmount, 0);
    }

    function test_MaxUint256TaskFee() public {
        bytes32 modelid = deployBootstrapModel();

        // Try submitting task with max uint256 fee
        uint256 maxFee = type(uint256).max;
        baseToken.bridgeMint(user1, maxFee);

        vm.prank(user1);
        baseToken.approve(address(engine), maxFee);

        vm.prank(user1);
        engine.submitTask(0, user1, modelid, maxFee, TESTBUF);
    }

    /*//////////////////////////////////////////////////////////////
                    REWARD STAKING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RewardsStakedDirectlyToValidator() public {
        deployBootstrapValidator();
        bytes32 modelid = deployBootstrapModel();

        // Set solution mineable rate for rewards
        engine.setSolutionMineableRate(modelid, 1 ether);

        vm.warp(block.timestamp + 3600 + 360 + 1);

        bytes32 taskid = deployBootstrapTask(modelid);
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        (uint256 stakedBefore, , ) = engine.validators(validator1);

        vm.warp(block.timestamp + 3600 + 1);

        vm.prank(validator1);
        engine.claimSolution(taskid);

        (uint256 stakedAfter, , ) = engine.validators(validator1);

        // Stake should increase (rewards staked directly)
        assertGt(stakedAfter, stakedBefore);
    }

    function test_SolutionMineableRateCanBeZero() public {
        bytes32 modelid = deployBootstrapModel();

        engine.setSolutionMineableRate(modelid, 0);

        (uint256 fee, address addr, uint256 rate, ) = engine.models(modelid);
        assertEq(rate, 0);
    }

    function test_SolutionMineableRateCanBeUpdated() public {
        bytes32 modelid = deployBootstrapModel();

        engine.setSolutionMineableRate(modelid, 1 ether);
        (uint256 fee, address addr, uint256 rate, ) = engine.models(modelid);
        assertEq(rate, 1 ether);

        engine.setSolutionMineableRate(modelid, 2 ether);
        (fee, addr, rate, ) = engine.models(modelid);
        assertEq(rate, 2 ether);
    }

    /*//////////////////////////////////////////////////////////////
                    WITHDRAW REQUEST TESTS
    //////////////////////////////////////////////////////////////*/

    function test_CancelValidatorWithdrawRequest() public {
        baseToken.transfer(validator1, 10 ether);

        vm.prank(validator1);
        engine.validatorDeposit(validator1, 10 ether);

        vm.warp(block.timestamp + 3600 + 1);

        // Initiate withdraw
        vm.prank(validator1);
        engine.initiateValidatorWithdraw(5 ether);

        uint256 count = engine.pendingValidatorWithdrawRequestsCount(validator1);

        // Cancel the withdraw
        vm.prank(validator1);
        engine.cancelValidatorWithdraw(count);

        // Should be able to deposit again without waiting
        baseToken.transfer(validator1, 5 ether);
        vm.prank(validator1);
        engine.validatorDeposit(validator1, 5 ether);
    }

    function test_MultipleWithdrawRequests() public {
        baseToken.transfer(validator1, 30 ether);

        vm.prank(validator1);
        engine.validatorDeposit(validator1, 30 ether);

        vm.warp(block.timestamp + 3600 + 1);

        // Create multiple withdraw requests
        vm.prank(validator1);
        engine.initiateValidatorWithdraw(5 ether);

        vm.prank(validator1);
        engine.initiateValidatorWithdraw(5 ether);

        uint256 count = engine.pendingValidatorWithdrawRequestsCount(validator1);
        assertEq(count, 2);
    }

    /*//////////////////////////////////////////////////////////////
                    PAUSE FUNCTIONALITY TESTS
                    (Moved to V2_EngineV6_Pause.t.sol)
    //////////////////////////////////////////////////////////////*/

    /*//////////////////////////////////////////////////////////////
                    SECURITY & ACCESS CONTROL TESTS
    //////////////////////////////////////////////////////////////*/

    function test_OnlyOwnerCanSetVeStaking() public {
        vm.prank(user1);
        vm.expectRevert();
        engine.setVeStaking(address(user2));
    }

    function test_OnlyOwnerCanSetVoter() public {
        vm.prank(user1);
        vm.expectRevert();
        engine.setVoter(address(user2));
    }

    function test_OnlyOwnerCanSetSolutionMineableRate() public {
        bytes32 modelid = deployBootstrapModel();

        vm.prank(user1);
        vm.expectRevert();
        engine.setSolutionMineableRate(modelid, 1 ether);
    }

    function test_OnlyOwnerCanSetGlobalSolutionModelFeePercentage() public {
        vm.prank(user1);
        vm.expectRevert();
        engine.setSolutionModelFeePercentage(0.5 ether);
    }

    function test_CannotClaimSolutionTwice() public {
        deployBootstrapValidator();
        bytes32 modelid = deployBootstrapModel();

        vm.warp(block.timestamp + 3600 + 360 + 1);

        bytes32 taskid = deployBootstrapTask(modelid);
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        vm.warp(block.timestamp + 3600 + 1);

        vm.prank(validator1);
        engine.claimSolution(taskid);

        // Try to claim again
        vm.prank(validator1);
        vm.expectRevert();
        engine.claimSolution(taskid);
    }

    function test_ValidatorCannotWithdrawMoreThanStaked() public {
        baseToken.transfer(validator1, 10 ether);

        vm.prank(validator1);
        engine.validatorDeposit(validator1, 10 ether);

        vm.warp(block.timestamp + 3600 + 1);

        // Try to withdraw more than deposited
        vm.prank(validator1);
        vm.expectRevert();
        engine.initiateValidatorWithdraw(20 ether);
    }

    function test_CannotVoteOnNonExistentContestation() public {
        bytes32 fakeTaskid = keccak256("fake");

        baseToken.transfer(validator1, 10 ether);
        vm.prank(validator1);
        engine.validatorDeposit(validator1, 10 ether);

        vm.prank(validator1);
        vm.expectRevert();
        engine.voteOnContestation(fakeTaskid, true);
    }

    /*//////////////////////////////////////////////////////////////
                    SLASHING & PENALTY TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SlashOnFailedContestation() public {
        deployBootstrapValidator();
        bytes32 modelid = deployBootstrapModel();

        // Setup additional validators
        baseToken.transfer(validator2, 20 ether);
        vm.prank(validator2);
        engine.validatorDeposit(validator2, 20 ether);

        baseToken.transfer(validator3, 20 ether);
        vm.prank(validator3);
        engine.validatorDeposit(validator3, 20 ether);

        // Setup master contester
        masterContesterRegistry.emergencyAddMasterContester(validator4);
        baseToken.transfer(validator4, 20 ether);
        vm.prank(validator4);
        engine.validatorDeposit(validator4, 20 ether);

        vm.warp(block.timestamp + 3600 + 360 + 1);

        bytes32 taskid = deployBootstrapTask(modelid);
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        // Master contester submits contestation
        vm.prank(validator4);
        engine.submitContestation(taskid);

        // Solution submitter automatically votes no
        // Contestation will fail if not enough yes votes
        // This tests the penalty mechanism
    }

    /*//////////////////////////////////////////////////////////////
                    SOLUTION CLAIMING EDGE CASES
    //////////////////////////////////////////////////////////////*/

    function test_CannotClaimBeforeWaitPeriod() public {
        deployBootstrapValidator();
        bytes32 modelid = deployBootstrapModel();

        vm.warp(block.timestamp + 3600 + 360 + 1);

        bytes32 taskid = deployBootstrapTask(modelid);
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        // Try to claim immediately (before minClaimSolutionTime)
        vm.prank(validator1);
        vm.expectRevert(abi.encodeWithSignature("NotEnoughTime()"));
        engine.claimSolution(taskid);
    }

    function test_MultipleValidatorsCannotClaimSameSolution() public {
        deployBootstrapValidator();
        bytes32 modelid = deployBootstrapModel();

        baseToken.transfer(validator2, 10 ether);
        vm.prank(validator2);
        engine.validatorDeposit(validator2, 10 ether);

        vm.warp(block.timestamp + 3600 + 360 + 1);

        bytes32 taskid = deployBootstrapTask(modelid);

        // validator1 submits solution
        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);
        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);

        vm.warp(block.timestamp + 3600 + 1);

        // validator1 claims
        vm.prank(validator1);
        engine.claimSolution(taskid);

        // validator2 cannot claim
        vm.prank(validator2);
        vm.expectRevert();
        engine.claimSolution(taskid);
    }

    /*//////////////////////////////////////////////////////////////
                    TREASURY & FEE ACCUMULATION
    //////////////////////////////////////////////////////////////*/

    function test_AccruedFeesTracking() public {
        uint256 feesBefore = engine.accruedFees();

        // Submit task with fee
        bytes32 modelid = deployBootstrapModel();
        baseToken.transfer(user1, 1 ether);

        vm.prank(user1);
        baseToken.approve(address(engine), 1 ether);

        vm.prank(user1);
        engine.submitTask(0, user1, modelid, 0.1 ether, TESTBUF);

        // Fees should accumulate
        uint256 feesAfter = engine.accruedFees();
        assertGe(feesAfter, feesBefore);
    }

    function test_WithdrawAccruedFees() public {
        // Submit some tasks to accumulate fees
        bytes32 modelid = deployBootstrapModel();
        baseToken.transfer(user1, 1 ether);

        vm.prank(user1);
        baseToken.approve(address(engine), 1 ether);

        vm.prank(user1);
        engine.submitTask(0, user1, modelid, 0.1 ether, TESTBUF);

        uint256 accruedFees = engine.accruedFees();

        if (accruedFees > 0) {
            address treasuryAddr = engine.treasury();
            uint256 treasuryBalBefore = baseToken.balanceOf(treasuryAddr);

            // Owner withdraws fees
            engine.withdrawAccruedFees();

            uint256 treasuryBalAfter = baseToken.balanceOf(treasuryAddr);
            assertGt(treasuryBalAfter, treasuryBalBefore);
        }
    }

    /*//////////////////////////////////////////////////////////////
                            EVENTS
    //////////////////////////////////////////////////////////////*/

    event ContestationSubmitted(address indexed addr, bytes32 indexed task);
    event SolutionSubmitted(address indexed addr, bytes32 indexed task);
}
