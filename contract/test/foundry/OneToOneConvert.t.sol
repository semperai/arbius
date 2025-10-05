// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "contracts/BaseTokenV1.sol";
import "contracts/OneToOneConvert.sol";

/**
 * @title OneToOneConvertTest
 * @notice Tests for OneToOneConvert token swap functionality
 * @dev Ported from Hardhat TypeScript tests
 */
contract OneToOneConvertTest is Test {
    BaseTokenV1 public tokenA;
    BaseTokenV1 public tokenB;
    OneToOneConvert public oneToOne;

    address public deployer;
    address public user1;
    address public constant BURN_ADDRESS = address(0x1);

    function setUp() public {
        deployer = address(this);
        user1 = makeAddr("user1");

        // Deploy tokenA
        BaseTokenV1 tokenAImpl = new BaseTokenV1();
        bytes memory tokenAInitData = abi.encodeWithSelector(
            BaseTokenV1.initialize.selector,
            deployer,
            address(0)
        );
        ERC1967Proxy tokenAProxy = new ERC1967Proxy(address(tokenAImpl), tokenAInitData);
        tokenA = BaseTokenV1(address(tokenAProxy));

        // Deploy tokenB
        BaseTokenV1 tokenBImpl = new BaseTokenV1();
        bytes memory tokenBInitData = abi.encodeWithSelector(
            BaseTokenV1.initialize.selector,
            deployer,
            address(0)
        );
        ERC1967Proxy tokenBProxy = new ERC1967Proxy(address(tokenBImpl), tokenBInitData);
        tokenB = BaseTokenV1(address(tokenBProxy));

        // Deploy OneToOneConvert
        oneToOne = new OneToOneConvert(address(tokenA), address(tokenB));
    }

    /*//////////////////////////////////////////////////////////////
                        INITIALIZATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Initialization() public {
        assertEq(address(oneToOne.tokenA()), address(tokenA));
        assertEq(address(oneToOne.tokenB()), address(tokenB));
    }

    /*//////////////////////////////////////////////////////////////
                        SWAP FUNCTIONALITY TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SwapTokens() public {
        // Mint tokens
        tokenA.bridgeMint(deployer, 100 ether);
        tokenB.bridgeMint(address(oneToOne), 150 ether);

        // Approve oneToOne to spend tokenA
        tokenA.approve(address(oneToOne), 100 ether);

        // Expect Swap event
        vm.expectEmit(true, true, false, false);
        emit OneToOneConvert.Swap(deployer, 100 ether);

        // Perform swap
        oneToOne.swap(100 ether);

        // Verify balances
        assertEq(tokenA.balanceOf(deployer), 0);
        assertEq(tokenA.balanceOf(BURN_ADDRESS), 100 ether);
        assertEq(tokenB.balanceOf(deployer), 100 ether);
        assertEq(tokenB.balanceOf(address(oneToOne)), 50 ether);
    }

    function test_SwapMultipleTimes() public {
        // Mint tokens
        tokenA.bridgeMint(deployer, 100 ether);
        tokenB.bridgeMint(address(oneToOne), 150 ether);

        // Approve oneToOne to spend tokenA
        tokenA.approve(address(oneToOne), 100 ether);

        // First swap
        oneToOne.swap(50 ether);
        assertEq(tokenA.balanceOf(deployer), 50 ether);
        assertEq(tokenB.balanceOf(deployer), 50 ether);

        // Second swap
        oneToOne.swap(30 ether);
        assertEq(tokenA.balanceOf(deployer), 20 ether);
        assertEq(tokenB.balanceOf(deployer), 80 ether);
        assertEq(tokenA.balanceOf(BURN_ADDRESS), 80 ether);
    }

    function test_SwapFromDifferentUser() public {
        // Mint tokens to user1
        tokenA.bridgeMint(user1, 50 ether);
        tokenB.bridgeMint(address(oneToOne), 100 ether);

        // user1 approves and swaps
        vm.startPrank(user1);
        tokenA.approve(address(oneToOne), 50 ether);
        oneToOne.swap(50 ether);
        vm.stopPrank();

        // Verify user1 balances
        assertEq(tokenA.balanceOf(user1), 0);
        assertEq(tokenB.balanceOf(user1), 50 ether);
        assertEq(tokenA.balanceOf(BURN_ADDRESS), 50 ether);
    }

    /*//////////////////////////////////////////////////////////////
                        ERROR CONDITION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RevertWhen_SwapWithoutEnoughTokenA() public {
        // Mint insufficient tokenA
        tokenA.bridgeMint(deployer, 100 ether);
        tokenB.bridgeMint(address(oneToOne), 150 ether);

        // Approve more than balance
        tokenA.approve(address(oneToOne), 150 ether);

        // Attempt to swap more than balance
        vm.expectRevert("ERC20: transfer amount exceeds balance");
        oneToOne.swap(150 ether);

        // Verify no state change
        assertEq(tokenA.balanceOf(deployer), 100 ether);
        assertEq(tokenA.balanceOf(BURN_ADDRESS), 0);
        assertEq(tokenB.balanceOf(deployer), 0);
        assertEq(tokenB.balanceOf(address(oneToOne)), 150 ether);
    }

    function test_RevertWhen_SwapWithoutEnoughTokenBInContract() public {
        // Mint tokenA but insufficient tokenB in contract
        tokenA.bridgeMint(deployer, 100 ether);
        tokenB.bridgeMint(address(oneToOne), 50 ether);

        // Approve tokenA
        tokenA.approve(address(oneToOne), 100 ether);

        // Attempt to swap more than contract has
        vm.expectRevert("ERC20: transfer amount exceeds balance");
        oneToOne.swap(100 ether);

        // Verify no state change
        assertEq(tokenA.balanceOf(deployer), 100 ether);
        assertEq(tokenA.balanceOf(BURN_ADDRESS), 0);
        assertEq(tokenB.balanceOf(deployer), 0);
        assertEq(tokenB.balanceOf(address(oneToOne)), 50 ether);
    }

    function test_RevertWhen_SwapWithoutApproval() public {
        // Mint tokens
        tokenA.bridgeMint(deployer, 100 ether);
        tokenB.bridgeMint(address(oneToOne), 150 ether);

        // Don't approve - attempt to swap
        vm.expectRevert("ERC20: insufficient allowance");
        oneToOne.swap(100 ether);
    }

    function test_RevertWhen_SwapZeroAmount() public {
        // Mint tokens
        tokenA.bridgeMint(deployer, 100 ether);
        tokenB.bridgeMint(address(oneToOne), 150 ether);

        tokenA.approve(address(oneToOne), 100 ether);

        // Swap zero should succeed but do nothing
        oneToOne.swap(0);

        // Balances unchanged
        assertEq(tokenA.balanceOf(deployer), 100 ether);
        assertEq(tokenB.balanceOf(deployer), 0);
    }

    /*//////////////////////////////////////////////////////////////
                        EDGE CASE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SwapExactContractBalance() public {
        // Mint exactly what contract has
        tokenA.bridgeMint(deployer, 100 ether);
        tokenB.bridgeMint(address(oneToOne), 100 ether);

        tokenA.approve(address(oneToOne), 100 ether);

        // Swap all
        oneToOne.swap(100 ether);

        // Contract should have 0 tokenB left
        assertEq(tokenB.balanceOf(address(oneToOne)), 0);
        assertEq(tokenB.balanceOf(deployer), 100 ether);
        assertEq(tokenA.balanceOf(BURN_ADDRESS), 100 ether);
    }

    function test_SwapWithPartialApproval() public {
        // Mint tokens
        tokenA.bridgeMint(deployer, 100 ether);
        tokenB.bridgeMint(address(oneToOne), 150 ether);

        // Approve only partial amount
        tokenA.approve(address(oneToOne), 50 ether);

        // Should succeed for approved amount
        oneToOne.swap(50 ether);
        assertEq(tokenB.balanceOf(deployer), 50 ether);

        // Should fail for more than approved
        vm.expectRevert("ERC20: insufficient allowance");
        oneToOne.swap(51 ether);
    }

    /*//////////////////////////////////////////////////////////////
                        FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_SwapAnyAmount(uint256 amount) public {
        // Bound amount to reasonable range
        amount = bound(amount, 1, 1000000 ether);

        // Mint sufficient tokens
        tokenA.bridgeMint(deployer, amount);
        tokenB.bridgeMint(address(oneToOne), amount);

        // Approve and swap
        tokenA.approve(address(oneToOne), amount);
        oneToOne.swap(amount);

        // Verify
        assertEq(tokenA.balanceOf(deployer), 0);
        assertEq(tokenB.balanceOf(deployer), amount);
        assertEq(tokenA.balanceOf(BURN_ADDRESS), amount);
    }
}
