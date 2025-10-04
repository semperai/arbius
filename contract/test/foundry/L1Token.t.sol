// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "contracts/L1Token.sol";

contract L1TokenTest is Test {
    L1Token public token;
    address public customGateway;
    address public router;
    address public owner;
    address public user1;

    uint256 constant INITIAL_SUPPLY = 1000000;

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        customGateway = makeAddr("customGateway");
        router = makeAddr("router");

        token = new L1Token(customGateway, router, INITIAL_SUPPLY);
    }

    function test_InitialSupply() public {
        assertEq(token.totalSupply(), INITIAL_SUPPLY * 10 ** token.decimals());
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY * 10 ** token.decimals());
    }

    function test_TokenMetadata() public {
        assertEq(token.name(), "Arbius");
        assertEq(token.symbol(), "AIUS");
        assertEq(token.decimals(), 18);
    }

    function test_Transfer() public {
        uint256 amount = 100 * 10 ** token.decimals();
        token.transfer(user1, amount);

        assertEq(token.balanceOf(user1), amount);
        assertEq(token.balanceOf(owner), (INITIAL_SUPPLY * 10 ** token.decimals()) - amount);
    }

    function test_TransferFrom() public {
        uint256 amount = 100 * 10 ** token.decimals();
        token.approve(user1, amount);

        vm.prank(user1);
        token.transferFrom(owner, user1, amount);

        assertEq(token.balanceOf(user1), amount);
    }

    function test_BalanceOf() public {
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY * 10 ** token.decimals());
        assertEq(token.balanceOf(user1), 0);
    }

    function test_IsArbitrumEnabled_RevertsWhenNotInRegistration() public {
        vm.expectRevert("NOT_EXPECTED_CALL");
        token.isArbitrumEnabled();
    }

    function test_RegisterTokenOnL2_OnlyOwner() public {
        address l2TokenAddress = makeAddr("l2Token");

        vm.prank(user1);
        vm.expectRevert();
        token.registerTokenOnL2(
            l2TokenAddress,
            100000,
            100000,
            200000,
            200000,
            1 gwei,
            0.01 ether,
            0.01 ether,
            owner
        );
    }

    function test_RegisterTokenOnL2_CallsGateway() public {
        address l2TokenAddress = makeAddr("l2Token");

        // Mock the gateway calls
        vm.mockCall(
            customGateway,
            abi.encodeWithSelector(
                IL1CustomGateway.registerTokenToL2.selector
            ),
            abi.encode(uint256(1))
        );

        vm.mockCall(
            router,
            abi.encodeWithSelector(
                IL2GatewayRouter.setGateway.selector
            ),
            abi.encode(uint256(1))
        );

        // This should not revert
        token.registerTokenOnL2{value: 0.02 ether}(
            l2TokenAddress,
            100000,
            100000,
            200000,
            200000,
            1 gwei,
            0.01 ether,
            0.01 ether,
            owner
        );
    }

    function test_Ownership() public {
        assertEq(token.owner(), owner);

        address newOwner = makeAddr("newOwner");
        token.transferOwnership(newOwner);

        assertEq(token.owner(), newOwner);
    }

    receive() external payable {}
}
