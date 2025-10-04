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
}
