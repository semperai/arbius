// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "contracts/SwapReceiver.sol";
import "contracts/BaseTokenV1.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract SwapReceiverTest is Test {
    SwapReceiver public swapReceiver;
    BaseTokenV1 public token;

    address public owner;
    address public user;
    address public newOwner;

    // Events
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // Allow contract to receive ETH
    receive() external payable {}

    function setUp() public {
        owner = address(this);
        user = makeAddr("user");
        newOwner = makeAddr("newOwner");

        // Deploy SwapReceiver
        swapReceiver = new SwapReceiver();

        // Deploy a test token
        BaseTokenV1 tokenImpl = new BaseTokenV1();
        bytes memory tokenInitData = abi.encodeWithSelector(
            BaseTokenV1.initialize.selector,
            owner,
            address(0)
        );
        ERC1967Proxy tokenProxy = new ERC1967Proxy(address(tokenImpl), tokenInitData);
        token = BaseTokenV1(address(tokenProxy));

        // Mint some tokens to the SwapReceiver
        token.bridgeMint(address(swapReceiver), 1000 ether);

        // Send some ETH to the SwapReceiver
        vm.deal(address(swapReceiver), 10 ether);
    }

    /*//////////////////////////////////////////////////////////////
                        INITIALIZATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Initialization() public {
        assertEq(swapReceiver.owner(), owner);
    }

    function test_DeploymentWithOwner() public {
        SwapReceiver newReceiver = new SwapReceiver();
        assertEq(newReceiver.owner(), address(this));
    }

    /*//////////////////////////////////////////////////////////////
                        OWNERSHIP TESTS
    //////////////////////////////////////////////////////////////*/

    function test_TransferOwnership() public {
        swapReceiver.transferOwnership(newOwner);
        assertEq(swapReceiver.owner(), newOwner);
    }

    function test_TransferOwnershipEvent() public {
        vm.expectEmit(true, true, false, false);
        emit OwnershipTransferred(owner, newOwner);
        swapReceiver.transferOwnership(newOwner);
    }

    function test_RevertWhen_NonOwnerTransfersOwnership() public {
        vm.prank(user);
        vm.expectRevert();
        swapReceiver.transferOwnership(user);
    }

    function test_RenounceOwnership() public {
        swapReceiver.renounceOwnership();
        assertEq(swapReceiver.owner(), address(0));
    }

    function test_RevertWhen_NonOwnerRenouncesOwnership() public {
        vm.prank(user);
        vm.expectRevert();
        swapReceiver.renounceOwnership();
    }

    /*//////////////////////////////////////////////////////////////
                        RECOVER TOKEN TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RecoverTokens() public {
        uint256 amount = 500 ether;
        uint256 ownerBalanceBefore = token.balanceOf(owner);
        uint256 receiverBalanceBefore = token.balanceOf(address(swapReceiver));

        swapReceiver.recover(address(token), amount);

        uint256 ownerBalanceAfter = token.balanceOf(owner);
        uint256 receiverBalanceAfter = token.balanceOf(address(swapReceiver));

        assertEq(ownerBalanceAfter - ownerBalanceBefore, amount);
        assertEq(receiverBalanceBefore - receiverBalanceAfter, amount);
    }

    function test_RecoverAllTokens() public {
        uint256 receiverBalance = token.balanceOf(address(swapReceiver));
        uint256 ownerBalanceBefore = token.balanceOf(owner);

        swapReceiver.recover(address(token), receiverBalance);

        uint256 ownerBalanceAfter = token.balanceOf(owner);

        assertEq(ownerBalanceAfter - ownerBalanceBefore, receiverBalance);
        assertEq(token.balanceOf(address(swapReceiver)), 0);
    }

    function test_RecoverTokensMultipleTimes() public {
        uint256 amount1 = 300 ether;
        uint256 amount2 = 200 ether;

        swapReceiver.recover(address(token), amount1);
        swapReceiver.recover(address(token), amount2);

        assertEq(token.balanceOf(address(swapReceiver)), 500 ether);
    }

    function test_RecoverFromNonOwnerSendsToOwner() public {
        uint256 ownerBalanceBefore = token.balanceOf(owner);

        vm.prank(user);
        swapReceiver.recover(address(token), 100 ether);

        // Tokens should still go to owner, not user
        assertEq(token.balanceOf(owner) - ownerBalanceBefore, 100 ether);
        assertEq(token.balanceOf(user), 0);
    }

    function test_RecoverAfterOwnershipTransfer() public {
        swapReceiver.transferOwnership(newOwner);

        vm.prank(newOwner);
        swapReceiver.recover(address(token), 100 ether);

        assertEq(token.balanceOf(newOwner), 100 ether);
    }

    /*//////////////////////////////////////////////////////////////
                        RECOVER ETH TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RecoverETH() public {
        uint256 amount = 5 ether;
        uint256 ownerBalanceBefore = owner.balance;
        uint256 receiverBalanceBefore = address(swapReceiver).balance;

        swapReceiver.recoverETH(amount);

        uint256 ownerBalanceAfter = owner.balance;
        uint256 receiverBalanceAfter = address(swapReceiver).balance;

        assertEq(ownerBalanceAfter - ownerBalanceBefore, amount);
        assertEq(receiverBalanceBefore - receiverBalanceAfter, amount);
    }

    function test_RecoverAllETH() public {
        uint256 receiverBalance = address(swapReceiver).balance;
        uint256 ownerBalanceBefore = owner.balance;

        swapReceiver.recoverETH(receiverBalance);

        uint256 ownerBalanceAfter = owner.balance;

        assertEq(ownerBalanceAfter - ownerBalanceBefore, receiverBalance);
        assertEq(address(swapReceiver).balance, 0);
    }

    function test_RecoverETHMultipleTimes() public {
        uint256 amount1 = 3 ether;
        uint256 amount2 = 2 ether;

        swapReceiver.recoverETH(amount1);
        swapReceiver.recoverETH(amount2);

        assertEq(address(swapReceiver).balance, 5 ether);
    }

    function test_RecoverETHFromNonOwnerSendsToOwner() public {
        uint256 ownerBalanceBefore = owner.balance;

        vm.prank(user);
        swapReceiver.recoverETH(1 ether);

        // ETH should still go to owner, not user
        assertEq(owner.balance - ownerBalanceBefore, 1 ether);
        assertEq(user.balance, 0);
    }

    function test_RecoverETHAfterOwnershipTransfer() public {
        swapReceiver.transferOwnership(newOwner);

        vm.prank(newOwner);
        uint256 newOwnerBalanceBefore = newOwner.balance;
        swapReceiver.recoverETH(1 ether);

        assertEq(newOwner.balance - newOwnerBalanceBefore, 1 ether);
    }

    function test_RecoverETHWithZeroBalance() public {
        swapReceiver.recoverETH(address(swapReceiver).balance);

        // Should not revert even with zero balance
        swapReceiver.recoverETH(0);
        assertEq(address(swapReceiver).balance, 0);
    }

    /*//////////////////////////////////////////////////////////////
                        RECEIVE ETH TESTS (Note: SwapReceiver has no receive/fallback)
    //////////////////////////////////////////////////////////////*/

    function test_CannotReceiveETHDirectly() public {
        (bool success, ) = address(swapReceiver).call{value: 1 ether}("");
        assertFalse(success);
    }

    /*//////////////////////////////////////////////////////////////
                        EDGE CASE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RecoverTokensWithZeroAmount() public {
        uint256 ownerBalanceBefore = token.balanceOf(owner);

        swapReceiver.recover(address(token), 0);

        assertEq(token.balanceOf(owner), ownerBalanceBefore);
    }

    function test_RecoverBothTokensAndETH() public {
        uint256 tokenAmount = 100 ether;
        uint256 ethAmount = 1 ether;

        uint256 ownerTokenBalanceBefore = token.balanceOf(owner);
        uint256 ownerETHBalanceBefore = owner.balance;

        swapReceiver.recover(address(token), tokenAmount);
        swapReceiver.recoverETH(ethAmount);

        assertEq(token.balanceOf(owner) - ownerTokenBalanceBefore, tokenAmount);
        assertEq(owner.balance - ownerETHBalanceBefore, ethAmount);
    }
}
