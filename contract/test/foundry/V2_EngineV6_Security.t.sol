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
 * @title V2_EngineV6_SecurityTest
 * @notice Focused security tests for V2_EngineV6
 * @dev Tests access control, master contester functionality, allow lists, and reward staking
 */
contract V2_EngineV6_SecurityTest is Test {
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
    address public model1;

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
        model1 = makeAddr("model1");

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

        // Setup approvals for all test addresses
        address[8] memory testAddresses = [
            user1, user2, validator1, validator2, validator3,
            masterContester1, model1, deployer
        ];
        for (uint i = 0; i < testAddresses.length; i++) {
            vm.prank(testAddresses[i]);
            baseToken.approve(address(engine), type(uint256).max);
        }

        // Bridge tokens to enable mining
        baseToken.bridgeMint(address(engine), 597000 ether);
    }

    /*//////////////////////////////////////////////////////////////
                    V6 CORE FEATURES VERIFICATION
    //////////////////////////////////////////////////////////////*/

    function test_V6Initialization() public {
        assertEq(engine.version(), 6);
        assertEq(engine.masterContesterVoteAdder(), 50);
        assertEq(address(engine.masterContesterRegistry()), address(masterContesterRegistry));
    }

    /*//////////////////////////////////////////////////////////////
                    MASTER CONTESTER FUNCTIONALITY
    //////////////////////////////////////////////////////////////*/

    function test_MasterContesterContestationWithVoteAdder() public {
        // Setup validators
        for (uint i = 0; i < 3; i++) {
            address v = i == 0 ? validator1 : (i == 1 ? validator2 : masterContester1);
            baseToken.transfer(v, 10 ether);
            vm.prank(v);
            engine.validatorDeposit(v, 10 ether);
        }

        // Make masterContester1 a master contester
        masterContesterRegistry.emergencyAddMasterContester(masterContester1);

        // Register model
        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: model1,
            fee: 0,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        vm.prank(user1);
        engine.registerModel(model1, 0, TESTBUF);

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Submit task
        vm.prank(user1);
        vm.recordLogs();
        engine.submitTask(0, user1, modelid, 0, TESTBUF);

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

        // Master contester submits contestation
        vm.expectEmit(true, true, false, false);
        emit IArbiusV6.ContestationSubmitted(masterContester1, taskid);

        vm.prank(masterContester1);
        engine.submitContestation(taskid);

        // Check that master contester auto-voted yes
        address yeaVoter = engine.contestationVoteYeas(taskid, 0);
        assertEq(yeaVoter, masterContester1);
    }

    function test_EnforceMasterContesterRequirementForContestation() public {
        // Setup validators (no master contesters)
        for (uint i = 0; i < 2; i++) {
            address v = i == 0 ? validator1 : validator2;
            baseToken.transfer(v, 10 ether);
            vm.prank(v);
            engine.validatorDeposit(v, 10 ether);
        }

        // Register model
        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: model1,
            fee: 0,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        vm.prank(user1);
        engine.registerModel(model1, 0, TESTBUF);

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Submit task and solution
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

        // Regular validator cannot submit contestation
        vm.prank(validator2);
        vm.expectRevert();
        engine.submitContestation(taskid);
    }

    function test_AnyoneCanSuggestContestation() public {
        // Setup validator
        baseToken.transfer(validator1, 10 ether);
        vm.prank(validator1);
        engine.validatorDeposit(validator1, 10 ether);

        // Register model
        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: model1,
            fee: 0,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        vm.prank(user1);
        engine.registerModel(model1, 0, TESTBUF);

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Submit task and solution
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

        // Anyone can suggest contestation
        vm.expectEmit(true, true, false, false);
        emit IArbiusV6.ContestationSuggested(user2, taskid);

        vm.prank(user2);
        engine.suggestContestation(taskid);
    }

    /*//////////////////////////////////////////////////////////////
                    MODEL ALLOW LIST FUNCTIONALITY
    //////////////////////////////////////////////////////////////*/

    function test_ModelWithAllowList() public {
        // Setup validators
        baseToken.transfer(validator1, 10 ether);
        vm.prank(validator1);
        engine.validatorDeposit(validator1, 10 ether);

        baseToken.transfer(validator2, 10 ether);
        vm.prank(validator2);
        engine.validatorDeposit(validator2, 10 ether);

        // Register model with allow list (only validator1 allowed)
        bytes memory uniqueBuf = hex"616c6c6f776c6973740a"; // "allowlist\n"

        address[] memory allowList = new address[](1);
        allowList[0] = validator1;

        vm.prank(user1);
        engine.registerModelWithAllowList(model1, 0, uniqueBuf, allowList);

        bytes memory cid = engine.generateIPFSCID(uniqueBuf);
        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: model1,
            fee: 0,
            rate: 0,
            cid: cid
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        // Check allow list is required
        assertTrue(engine.modelRequiresAllowList(modelid));
        assertTrue(engine.isSolverAllowed(modelid, validator1));
        assertFalse(engine.isSolverAllowed(modelid, validator2));

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Submit task
        vm.prank(user2);
        vm.recordLogs();
        engine.submitTask(0, user2, modelid, 0, uniqueBuf);

        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 taskid = entries[0].topics[1];

        // Validator1 (allowed) can submit solution
        bytes32 commitment = engine.generateCommitment(validator1, taskid, cid);
        vm.prank(validator1);
        engine.signalCommitment(commitment);

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.expectEmit(true, true, false, false);
        emit IArbiusV6.SolutionSubmitted(validator1, taskid);

        vm.prank(validator1);
        engine.submitSolution(taskid, cid);
    }

    function test_ManageAllowListWithModelCreatedWithAllowList() public {
        // Register model with empty allow list
        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: model1,
            fee: 0,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        address[] memory emptyList = new address[](0);
        vm.prank(user1);
        engine.registerModelWithAllowList(model1, 0, TESTBUF, emptyList);

        // Initially requires allow list but no one is on it
        assertTrue(engine.modelRequiresAllowList(modelid));
        assertFalse(engine.isSolverAllowed(modelid, validator1));

        // Add validator1 to allow list (called by model owner, model1)
        address[] memory toAdd = new address[](1);
        toAdd[0] = validator1;

        vm.expectEmit(true, true, true, false);
        emit IArbiusV6.ModelAllowListUpdated(modelid, validator1, true);

        vm.prank(model1);
        engine.addToModelAllowList(modelid, toAdd);

        assertTrue(engine.isSolverAllowed(modelid, validator1));

        // Remove validator1 from allow list (called by model owner)
        address[] memory toRemove = new address[](1);
        toRemove[0] = validator1;

        vm.expectEmit(true, true, true, false);
        emit IArbiusV6.ModelAllowListUpdated(modelid, validator1, false);

        vm.prank(model1);
        engine.removeFromModelAllowList(modelid, toRemove);

        assertFalse(engine.isSolverAllowed(modelid, validator1));
    }

    /*//////////////////////////////////////////////////////////////
                    REWARD STAKING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_StakeRewardsDirectlyToValidator() public {
        // Setup validator
        baseToken.transfer(validator1, 10 ether);
        vm.prank(validator1);
        engine.validatorDeposit(validator1, 10 ether);

        // Register model
        IArbiusV6.Model memory modelParams = IArbiusV6.Model({
            addr: model1,
            fee: 0,
            rate: 0,
            cid: TESTCID
        });
        bytes32 modelid = engine.hashModel(modelParams, user1);

        vm.prank(user1);
        engine.registerModel(model1, 0, TESTBUF);

        // Set mineable rate for rewards
        engine.setSolutionMineableRate(modelid, 1 ether);

        // Create gauge for rewards
        voter.createGauge(modelid);

        // Advance past cooldown
        vm.warp(block.timestamp + 3600 + 360 + 1);

        // Submit task and solution
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

        // Get stake before claiming
        (uint256 stakeBefore,,) = engine.validators(validator1);
        uint256 balanceBefore = baseToken.balanceOf(validator1);

        // Wait and claim
        vm.warp(block.timestamp + 3600 + 1);

        vm.prank(validator1);
        engine.claimSolution(taskid);

        (uint256 stakeAfter,,) = engine.validators(validator1);
        uint256 balanceAfter = baseToken.balanceOf(validator1);

        // Rewards should be staked, not transferred
        assertGt(stakeAfter, stakeBefore);
        assertEq(balanceAfter, balanceBefore);
    }
}
