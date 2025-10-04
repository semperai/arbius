// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "contracts/TestnetToken.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract TestnetTokenTest is Test {
    TestnetToken public token;
    TestnetToken public implementation;

    address public deployer;
    address public user1;
    address public user2;
    address public minter;

    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);

    function setUp() public {
        deployer = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        minter = makeAddr("minter");

        // Deploy implementation
        implementation = new TestnetToken();

        // Deploy proxy
        bytes memory initData = abi.encodeWithSelector(
            TestnetToken.initialize.selector
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        token = TestnetToken(address(proxy));
    }

    /*//////////////////////////////////////////////////////////////
                        INITIALIZATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Initialization() public {
        assertEq(token.name(), "TArbius");
        assertEq(token.symbol(), "TAIUS");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), 0);
        assertEq(token.owner(), deployer);
    }

    function test_CannotInitializeTwice() public {
        vm.expectRevert();
        token.initialize();
    }

    function test_ImplementationIsDisabled() public {
        vm.expectRevert();
        implementation.initialize();
    }

    /*//////////////////////////////////////////////////////////////
                        MINTING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Mint() public {
        uint256 amount = 1000 ether;

        token.mint(user1, amount);

        assertEq(token.balanceOf(user1), amount);
        assertEq(token.totalSupply(), amount);
    }

    function test_MintMultipleTimes() public {
        token.mint(user1, 500 ether);
        token.mint(user1, 300 ether);

        assertEq(token.balanceOf(user1), 800 ether);
        assertEq(token.totalSupply(), 800 ether);
    }

    function test_MintToMultipleAddresses() public {
        token.mint(user1, 500 ether);
        token.mint(user2, 300 ether);

        assertEq(token.balanceOf(user1), 500 ether);
        assertEq(token.balanceOf(user2), 300 ether);
        assertEq(token.totalSupply(), 800 ether);
    }

    function test_MintEmitsTransferEvent() public {
        vm.expectEmit(true, true, false, true);
        emit Transfer(address(0), user1, 1000 ether);
        token.mint(user1, 1000 ether);
    }

    function test_MintByNonOwner() public {
        vm.prank(user1);
        token.mint(user1, 1000 ether);

        assertEq(token.balanceOf(user1), 1000 ether);
    }

    function test_MintZeroAmount() public {
        token.mint(user1, 0);

        assertEq(token.balanceOf(user1), 0);
        assertEq(token.totalSupply(), 0);
    }

    /*//////////////////////////////////////////////////////////////
                        TRANSFER TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Transfer() public {
        token.mint(user1, 1000 ether);

        vm.prank(user1);
        token.transfer(user2, 500 ether);

        assertEq(token.balanceOf(user1), 500 ether);
        assertEq(token.balanceOf(user2), 500 ether);
    }

    function test_TransferEmitsEvent() public {
        token.mint(user1, 1000 ether);

        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit Transfer(user1, user2, 500 ether);
        token.transfer(user2, 500 ether);
    }

    function test_RevertWhen_TransferExceedsBalance() public {
        token.mint(user1, 100 ether);

        vm.prank(user1);
        vm.expectRevert();
        token.transfer(user2, 200 ether);
    }

    /*//////////////////////////////////////////////////////////////
                        APPROVAL AND TRANSFERFROM TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Approve() public {
        vm.prank(user1);
        token.approve(user2, 1000 ether);

        assertEq(token.allowance(user1, user2), 1000 ether);
    }

    function test_ApproveEmitsEvent() public {
        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit Approval(user1, user2, 1000 ether);
        token.approve(user2, 1000 ether);
    }

    function test_TransferFrom() public {
        token.mint(user1, 1000 ether);

        vm.prank(user1);
        token.approve(user2, 500 ether);

        vm.prank(user2);
        token.transferFrom(user1, user2, 500 ether);

        assertEq(token.balanceOf(user1), 500 ether);
        assertEq(token.balanceOf(user2), 500 ether);
        assertEq(token.allowance(user1, user2), 0);
    }

    function test_RevertWhen_TransferFromExceedsAllowance() public {
        token.mint(user1, 1000 ether);

        vm.prank(user1);
        token.approve(user2, 100 ether);

        vm.prank(user2);
        vm.expectRevert();
        token.transferFrom(user1, user2, 200 ether);
    }

    /*//////////////////////////////////////////////////////////////
                        PERMIT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Permit() public {
        uint256 ownerPrivateKey = 0x1234;
        address owner = vm.addr(ownerPrivateKey);
        address spender = user2;
        uint256 value = 1000 ether;
        uint256 nonce = token.nonces(owner);
        uint256 deadline = block.timestamp + 1 days;

        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                owner,
                spender,
                value,
                nonce,
                deadline
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                token.DOMAIN_SEPARATOR(),
                structHash
            )
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, digest);

        token.permit(owner, spender, value, deadline, v, r, s);

        assertEq(token.allowance(owner, spender), value);
        assertEq(token.nonces(owner), nonce + 1);
    }

    function test_RevertWhen_PermitExpired() public {
        uint256 ownerPrivateKey = 0x1234;
        address owner = vm.addr(ownerPrivateKey);
        address spender = user2;
        uint256 value = 1000 ether;
        uint256 nonce = token.nonces(owner);
        uint256 deadline = block.timestamp - 1; // Expired

        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                owner,
                spender,
                value,
                nonce,
                deadline
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                token.DOMAIN_SEPARATOR(),
                structHash
            )
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, digest);

        vm.expectRevert();
        token.permit(owner, spender, value, deadline, v, r, s);
    }

    /*//////////////////////////////////////////////////////////////
                        VOTING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Delegate() public {
        token.mint(user1, 1000 ether);

        vm.prank(user1);
        token.delegate(user2);

        assertEq(token.delegates(user1), user2);
        assertEq(token.getVotes(user2), 1000 ether);
    }

    function test_DelegateEmitsEvent() public {
        token.mint(user1, 1000 ether);

        vm.prank(user1);
        vm.expectEmit(true, true, true, false);
        emit DelegateChanged(user1, address(0), user2);
        token.delegate(user2);
    }

    function test_SelfDelegate() public {
        token.mint(user1, 1000 ether);

        vm.prank(user1);
        token.delegate(user1);

        assertEq(token.delegates(user1), user1);
        assertEq(token.getVotes(user1), 1000 ether);
    }

    function test_ChangeDelegation() public {
        token.mint(user1, 1000 ether);

        vm.prank(user1);
        token.delegate(user2);

        assertEq(token.getVotes(user2), 1000 ether);

        vm.prank(user1);
        token.delegate(deployer);

        assertEq(token.getVotes(user2), 0);
        assertEq(token.getVotes(deployer), 1000 ether);
    }

    function test_VotesAfterTransfer() public {
        token.mint(user1, 1000 ether);

        vm.prank(user1);
        token.delegate(user1);

        assertEq(token.getVotes(user1), 1000 ether);

        vm.prank(user1);
        token.transfer(user2, 500 ether);

        assertEq(token.getVotes(user1), 500 ether);
    }

    function test_DelegateBySig() public {
        uint256 delegatorPrivateKey = 0x1234;
        address delegator = vm.addr(delegatorPrivateKey);
        address delegatee = user2;
        uint256 nonce = token.nonces(delegator);
        uint256 expiry = block.timestamp + 1 days;

        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Delegation(address delegatee,uint256 nonce,uint256 expiry)"),
                delegatee,
                nonce,
                expiry
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                token.DOMAIN_SEPARATOR(),
                structHash
            )
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(delegatorPrivateKey, digest);

        token.mint(delegator, 1000 ether);

        token.delegateBySig(delegatee, nonce, expiry, v, r, s);

        assertEq(token.delegates(delegator), delegatee);
        assertEq(token.getVotes(delegatee), 1000 ether);
    }

    /*//////////////////////////////////////////////////////////////
                        OWNERSHIP TESTS
    //////////////////////////////////////////////////////////////*/

    function test_TransferOwnership() public {
        token.transferOwnership(user1);

        assertEq(token.owner(), user1);
    }

    function test_RevertWhen_NonOwnerTransfersOwnership() public {
        vm.prank(user1);
        vm.expectRevert();
        token.transferOwnership(user1);
    }

    function test_RenounceOwnership() public {
        token.renounceOwnership();

        assertEq(token.owner(), address(0));
    }

    /*//////////////////////////////////////////////////////////////
                        PAST VOTES TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GetPastVotes() public {
        token.mint(user1, 1000 ether);

        vm.prank(user1);
        token.delegate(user1);

        vm.roll(block.number + 1);

        assertEq(token.getPastVotes(user1, block.number - 1), 1000 ether);
    }

    function test_GetPastTotalSupply() public {
        token.mint(user1, 1000 ether);

        vm.roll(block.number + 1);

        assertEq(token.getPastTotalSupply(block.number - 1), 1000 ether);
    }
}
