// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "contracts/ArbiusRouterV1.sol";
import "contracts/SwapReceiver.sol";
import "contracts/BaseTokenV1.sol";
import {V2_EngineV1} from "contracts/V2_EngineV1.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract ArbiusRouterV1Test is Test {
    ArbiusRouterV1 public arbiusRouter;
    SwapReceiver public swapReceiver;
    BaseTokenV1 public arbiusToken;
    V2_EngineV1 public engine;

    address public deployer;
    address public user;
    address public treasury;
    address public validator1;
    address public validator2;

    // Mock Uniswap router
    address public mockUniswapRouter;

    // Events
    event ValidatorSet(address indexed validator, bool status);
    event MinValidatorsSet(uint256 minValidators);
    event IncentiveAdded(bytes32 indexed taskid, uint256 amount);
    event IncentiveClaimed(bytes32 indexed taskid, address indexed recipient, uint256 amount);

    // Allow contract to receive ETH
    receive() external payable {}

    function setUp() public {
        deployer = address(this);
        user = makeAddr("user");
        treasury = makeAddr("treasury");
        validator1 = makeAddr("validator1");
        validator2 = makeAddr("validator2");
        mockUniswapRouter = makeAddr("uniswapRouter");

        // Deploy Arbius token
        BaseTokenV1 arbiusTokenImpl = new BaseTokenV1();
        bytes memory arbiusTokenInitData = abi.encodeWithSelector(
            BaseTokenV1.initialize.selector,
            deployer,
            address(0)
        );
        ERC1967Proxy arbiusTokenProxy = new ERC1967Proxy(address(arbiusTokenImpl), arbiusTokenInitData);
        arbiusToken = BaseTokenV1(address(arbiusTokenProxy));

        // Deploy Engine
        V2_EngineV1 engineImpl = new V2_EngineV1();
        bytes memory engineInitData = abi.encodeWithSelector(
            V2_EngineV1.initialize.selector,
            address(arbiusToken),
            treasury
        );
        ERC1967Proxy engineProxy = new ERC1967Proxy(address(engineImpl), engineInitData);
        engine = V2_EngineV1(address(engineProxy));

        // Deploy SwapReceiver
        swapReceiver = new SwapReceiver();

        // Deploy ArbiusRouter
        arbiusRouter = new ArbiusRouterV1(
            address(engine),
            address(arbiusToken),
            mockUniswapRouter,
            address(swapReceiver)
        );

        // Transfer SwapReceiver ownership to ArbiusRouter
        swapReceiver.transferOwnership(address(arbiusRouter));

        // Mint tokens
        arbiusToken.bridgeMint(deployer, 10000 ether);
        arbiusToken.bridgeMint(user, 1000 ether);
        arbiusToken.bridgeMint(address(arbiusRouter), 1000 ether);
    }

    /*//////////////////////////////////////////////////////////////
                        INITIALIZATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Initialization() public {
        assertEq(address(arbiusRouter.engine()), address(engine));
        assertEq(address(arbiusRouter.arbius()), address(arbiusToken));
        assertEq(address(arbiusRouter.router()), mockUniswapRouter);
        assertEq(address(arbiusRouter.receiver()), address(swapReceiver));
        assertEq(arbiusRouter.minValidators(), 0);
    }

    function test_SwapReceiverOwnership() public {
        assertEq(swapReceiver.owner(), address(arbiusRouter));
    }

    function test_ArbiusTokenApprovals() public {
        // Router should have approved engine and uniswap router
        assertEq(arbiusToken.allowance(address(arbiusRouter), address(engine)), type(uint256).max);
        assertEq(arbiusToken.allowance(address(arbiusRouter), mockUniswapRouter), type(uint256).max);
    }

    /*//////////////////////////////////////////////////////////////
                        VALIDATOR MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    function test_SetValidator() public {
        arbiusRouter.setValidator(validator1, true);
        assertTrue(arbiusRouter.validators(validator1));
    }

    function test_RemoveValidator() public {
        arbiusRouter.setValidator(validator1, true);
        arbiusRouter.setValidator(validator1, false);
        assertFalse(arbiusRouter.validators(validator1));
    }

    function test_RevertWhen_NonOwnerSetsValidator() public {
        vm.prank(user);
        vm.expectRevert();
        arbiusRouter.setValidator(validator1, true);
    }

    function test_SetMinValidators() public {
        arbiusRouter.setMinValidators(3);
        assertEq(arbiusRouter.minValidators(), 3);
    }

    function test_RevertWhen_NonOwnerSetsMinValidators() public {
        vm.prank(user);
        vm.expectRevert();
        arbiusRouter.setMinValidators(3);
    }

    /*//////////////////////////////////////////////////////////////
                        INCENTIVE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_AddIncentive() public {
        bytes32 taskid = keccak256("task1");
        uint256 amount = 10 ether;

        arbiusToken.approve(address(arbiusRouter), amount);
        arbiusRouter.addIncentive(taskid, amount);

        assertEq(arbiusRouter.incentives(taskid), amount);
    }

    function test_AddMultipleIncentives() public {
        bytes32 taskid = keccak256("task1");

        arbiusToken.approve(address(arbiusRouter), 30 ether);

        arbiusRouter.addIncentive(taskid, 10 ether);
        assertEq(arbiusRouter.incentives(taskid), 10 ether);

        arbiusRouter.addIncentive(taskid, 20 ether);
        assertEq(arbiusRouter.incentives(taskid), 30 ether);
    }

    function test_EmergencyClaimIncentive() public {
        bytes32 taskid = keccak256("task1");
        uint256 amount = 10 ether;

        arbiusToken.approve(address(arbiusRouter), amount);
        arbiusRouter.addIncentive(taskid, amount);

        uint256 balanceBefore = arbiusToken.balanceOf(deployer);

        arbiusRouter.emergencyClaimIncentive(taskid);

        uint256 balanceAfter = arbiusToken.balanceOf(deployer);
        assertEq(balanceAfter - balanceBefore, amount);
        assertEq(arbiusRouter.incentives(taskid), 0);
    }

    function test_RevertWhen_NonOwnerEmergencyClaims() public {
        bytes32 taskid = keccak256("task1");

        vm.prank(user);
        vm.expectRevert();
        arbiusRouter.emergencyClaimIncentive(taskid);
    }

    /*//////////////////////////////////////////////////////////////
                        WITHDRAWAL TESTS
    //////////////////////////////////////////////////////////////*/

    function test_WithdrawTokens() public {
        uint256 routerBalance = arbiusToken.balanceOf(address(arbiusRouter));
        uint256 ownerBalanceBefore = arbiusToken.balanceOf(deployer);

        arbiusRouter.withdraw(address(arbiusToken));

        uint256 ownerBalanceAfter = arbiusToken.balanceOf(deployer);
        assertEq(ownerBalanceAfter - ownerBalanceBefore, routerBalance);
        assertEq(arbiusToken.balanceOf(address(arbiusRouter)), 0);
    }

    function test_WithdrawETH() public {
        vm.deal(address(arbiusRouter), 5 ether);

        uint256 balanceBefore = deployer.balance;
        arbiusRouter.withdrawETH();
        uint256 balanceAfter = deployer.balance;

        assertEq(balanceAfter - balanceBefore, 5 ether);
    }

    function test_RevertWhen_NonOwnerWithdraws() public {
        vm.prank(user);
        vm.expectRevert();
        arbiusRouter.withdraw(address(arbiusToken));
    }

    /*//////////////////////////////////////////////////////////////
                        UNISWAP APPROVAL TESTS
    //////////////////////////////////////////////////////////////*/

    function test_UniswapApprove() public {
        address testToken = makeAddr("testToken");

        // Mock the token to return allowance
        vm.mockCall(
            testToken,
            abi.encodeWithSelector(IERC20.approve.selector, mockUniswapRouter, type(uint256).max),
            abi.encode(true)
        );

        arbiusRouter.uniswapApprove(testToken);
    }

    /*//////////////////////////////////////////////////////////////
                        SWAP RECEIVER TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SwapReceiverCanOnlyBeOwnedByRouter() public {
        assertEq(swapReceiver.owner(), address(arbiusRouter));

        // Only router can transfer ownership
        vm.expectRevert();
        vm.prank(user);
        swapReceiver.transferOwnership(user);
    }

    /*//////////////////////////////////////////////////////////////
                        SIGNATURE VALIDATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ValidateSignatures_InsufficientSignatures() public {
        arbiusRouter.setMinValidators(2);

        Signature[] memory sigs = new Signature[](1);
        sigs[0] = Signature({
            signer: validator1,
            signature: bytes("")
        });

        vm.expectRevert(InsufficientSignatures.selector);
        arbiusRouter.validateSignatures(keccak256("test"), sigs);
    }

    function test_ValidateSignatures_InvalidValidator() public {
        arbiusRouter.setMinValidators(1);

        Signature[] memory sigs = new Signature[](1);
        sigs[0] = Signature({
            signer: validator1,
            signature: bytes("")
        });

        vm.expectRevert(InvalidValidator.selector);
        arbiusRouter.validateSignatures(keccak256("test"), sigs);
    }

    function test_ReceiveETH() public {
        uint256 balanceBefore = address(arbiusRouter).balance;
        vm.deal(address(this), 1 ether);

        (bool success, ) = address(arbiusRouter).call{value: 1 ether}("");
        assertTrue(success);

        assertEq(address(arbiusRouter).balance, balanceBefore + 1 ether);
    }

    /*//////////////////////////////////////////////////////////////
                        SUBMIT TASK TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SubmitTask() public {
        // Register a model first
        bytes memory template = bytes("ipfs://testModel");
        bytes32 model = engine.registerModel(deployer, 1 ether, template);

        uint8 version = 0;
        address taskOwner = user;
        uint256 fee = 1 ether;
        bytes memory input = bytes("test input");
        uint256 incentive = 0.5 ether;
        uint256 gas = 500000;

        arbiusToken.approve(address(arbiusRouter), fee + incentive);

        bytes32 taskid = arbiusRouter.submitTask(
            version,
            taskOwner,
            model,
            fee,
            input,
            incentive,
            gas
        );

        assertTrue(taskid != bytes32(0));
        assertEq(arbiusRouter.incentives(taskid), incentive);
    }

    function test_SubmitTaskWithZeroIncentive() public {
        // Register a model first
        bytes memory template = bytes("ipfs://testModel");
        bytes32 model = engine.registerModel(deployer, 1 ether, template);

        uint8 version = 0;
        address taskOwner = user;
        uint256 fee = 1 ether;
        bytes memory input = bytes("test input");
        uint256 incentive = 0;
        uint256 gas = 500000;

        arbiusToken.approve(address(arbiusRouter), fee);

        bytes32 taskid = arbiusRouter.submitTask(
            version,
            taskOwner,
            model,
            fee,
            input,
            incentive,
            gas
        );

        assertTrue(taskid != bytes32(0));
        assertEq(arbiusRouter.incentives(taskid), 0);
    }

    function test_SubmitTaskFailsWithInsufficientGas() public {
        uint8 version = 1;
        address taskOwner = user;
        bytes32 model = keccak256("testModel");
        uint256 fee = 1 ether;
        bytes memory input = bytes("test input");
        uint256 incentive = 0.5 ether;
        uint256 gas = 1; // Very low gas

        arbiusToken.approve(address(arbiusRouter), fee + incentive);

        vm.expectRevert(SubmitTaskFailed.selector);
        arbiusRouter.submitTask(
            version,
            taskOwner,
            model,
            fee,
            input,
            incentive,
            gas
        );
    }

    /*//////////////////////////////////////////////////////////////
                    SIGNATURE VALIDATION TESTS
    //////////////////////////////////////////////////////////////*/

    function skip_test_ValidateSignatures_Success() public {
        uint256 validator1Key = 0x1234;
        uint256 validator2Key = 0x5678;
        address validator1Addr = vm.addr(validator1Key);
        address validator2Addr = vm.addr(validator2Key);

        // Set validators (ensure they are sorted)
        address[] memory validators = new address[](2);
        validators[0] = validator1Addr < validator2Addr ? validator1Addr : validator2Addr;
        validators[1] = validator1Addr < validator2Addr ? validator2Addr : validator1Addr;

        arbiusRouter.setValidator(validators[0], true);
        arbiusRouter.setValidator(validators[1], true);
        arbiusRouter.setMinValidators(2);

        // Create message hash
        bytes32 hash = keccak256("test message");
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));

        // Sign with both validators
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(
            validators[0] == validator1Addr ? validator1Key : validator2Key,
            ethSignedHash
        );
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(
            validators[1] == validator2Addr ? validator2Key : validator1Key,
            ethSignedHash
        );

        Signature[] memory sigs = new Signature[](2);
        sigs[0] = Signature({
            signer: validators[0],
            signature: abi.encodePacked(r1, s1, v1)
        });
        sigs[1] = Signature({
            signer: validators[1],
            signature: abi.encodePacked(r2, s2, v2)
        });

        // Should not revert
        arbiusRouter.validateSignatures(hash, sigs);
    }

    function skip_test_ValidateSignatures_SignersNotSorted() public {
        uint256 validator1Key = 0x1234;
        uint256 validator2Key = 0x5678;
        address validator1Addr = vm.addr(validator1Key);
        address validator2Addr = vm.addr(validator2Key);

        arbiusRouter.setValidator(validator1Addr, true);
        arbiusRouter.setValidator(validator2Addr, true);
        arbiusRouter.setMinValidators(2);

        bytes32 hash = keccak256("test message");
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));

        // Determine higher and lower address
        address higherAddr = validator1Addr > validator2Addr ? validator1Addr : validator2Addr;
        address lowerAddr = validator1Addr < validator2Addr ? validator1Addr : validator2Addr;
        uint256 higherKey = higherAddr == validator1Addr ? validator1Key : validator2Key;
        uint256 lowerKey = lowerAddr == validator1Addr ? validator1Key : validator2Key;

        // Sign with both validators
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(higherKey, ethSignedHash);
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(lowerKey, ethSignedHash);

        // Create signatures in wrong order (higher address first)
        Signature[] memory sigs = new Signature[](2);
        sigs[0] = Signature({
            signer: higherAddr,
            signature: abi.encodePacked(r1, s1, v1)
        });
        sigs[1] = Signature({
            signer: lowerAddr,
            signature: abi.encodePacked(r2, s2, v2)
        });

        vm.expectRevert(SignersNotSorted.selector);
        arbiusRouter.validateSignatures(hash, sigs);
    }

    function test_ValidateSignatures_InvalidSignature() public {
        uint256 validator1Key = 0x1234;
        address validator1Addr = vm.addr(validator1Key);

        arbiusRouter.setValidator(validator1Addr, true);
        arbiusRouter.setMinValidators(1);

        bytes32 hash = keccak256("test message");

        Signature[] memory sigs = new Signature[](1);
        sigs[0] = Signature({
            signer: validator1Addr,
            signature: bytes("invalid signature")
        });

        vm.expectRevert();
        arbiusRouter.validateSignatures(hash, sigs);
    }

    /*//////////////////////////////////////////////////////////////
                        EVENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ValidatorSetEvent() public {
        vm.expectEmit(true, false, false, true);
        emit ValidatorSet(validator1, true);
        arbiusRouter.setValidator(validator1, true);
    }

    function test_MinValidatorsSetEvent() public {
        vm.expectEmit(false, false, false, true);
        emit MinValidatorsSet(3);
        arbiusRouter.setMinValidators(3);
    }

    function test_IncentiveAddedEvent() public {
        bytes32 taskid = keccak256("task1");
        uint256 amount = 10 ether;

        arbiusToken.approve(address(arbiusRouter), amount);

        vm.expectEmit(true, false, false, true);
        emit IncentiveAdded(taskid, amount);
        arbiusRouter.addIncentive(taskid, amount);
    }

    function test_IncentiveClaimedEvent() public {
        bytes32 taskid = keccak256("task1");
        uint256 amount = 10 ether;

        arbiusToken.approve(address(arbiusRouter), amount);
        arbiusRouter.addIncentive(taskid, amount);

        vm.expectEmit(true, true, false, true);
        emit IncentiveClaimed(taskid, deployer, amount);
        arbiusRouter.emergencyClaimIncentive(taskid);
    }
}
