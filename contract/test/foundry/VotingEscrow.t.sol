// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import './BaseTest.sol';

contract VotingEscrowTest is BaseTest {
    VotingEscrow escrow;

    function setUp() public {
        deployAius();
        mintAius(alice, 1000 ether);
        mintAius(address(this), 1000 ether);

        VeNFTRender veNFTRender = new VeNFTRender();
        escrow = new VotingEscrow(address(AIUS), address(veNFTRender));
    }

    function testCreateLock() public {
        vm.prank(alice);
        AIUS.approve(address(escrow), 1000 ether);
        uint256 lockDuration = YEAR;

        // Balance should be zero before and 1 after creating the lock
        assertEq(escrow.balanceOf(address(alice)), 0);

        vm.prank(alice);
        escrow.create_lock(1000 ether, lockDuration);
        assertEq(escrow.ownerOf(1), alice);
        assertEq(escrow.balanceOf(alice), 1);
    }

    function testCreateLockOutsideAllowedZones() public {
        AIUS.approve(address(escrow), 1000 ether);
        uint256 oneWeek = 7 * 24 * 3600;
        uint256 fourYears = 4 * 365 * 24 * 3600;
        vm.expectRevert(abi.encodePacked('Voting lock can be 4 years max'));
        escrow.create_lock(1000 ether, fourYears + oneWeek);
    }

    function testWithdraw() public {
        AIUS.approve(address(escrow), 1000 ether);
        uint256 lockDuration = 7 * 24 * 3600; // 1 week
        escrow.create_lock(1000 ether, lockDuration);

        // Try withdraw early
        uint256 tokenId = 1;
        vm.expectRevert(abi.encodePacked("The lock didn't expire"));
        escrow.withdraw(tokenId);
        // Now try withdraw after the time has expired
        vm.warp(block.timestamp + lockDuration);
        vm.roll(block.number + 1); // mine the next block
        escrow.withdraw(tokenId);

        assertEq(AIUS.balanceOf(address(this)), 1000 ether);
        // Check that the NFT is burnt
        assertEq(escrow.balanceOfNFT(tokenId), 0);
        assertEq(escrow.ownerOf(tokenId), address(0));
    }

    function testCheckTokenURICalls() public {
        // tokenURI should not work for non-existent token ids
        vm.expectRevert(abi.encodePacked("Query for nonexistent token"));
        escrow.tokenURI(999);

        // Create a lock and check that the tokenURI works
        AIUS.approve(address(escrow), 1000 ether);
        uint256 lockDuration = YEAR;
        escrow.create_lock(1000 ether, lockDuration);

        uint256 tokenId = 1;

        // Just check that this doesn't revert
        escrow.tokenURI(tokenId);

        // Now try withdraw after the time has expired
        vm.warp(block.timestamp + lockDuration);
        vm.roll(block.number + 1); // mine the next block

        // Withdraw, which destroys the NFT
        escrow.withdraw(tokenId);

        // tokenURI should not work for this anymore as the NFT is burnt
        vm.expectRevert(abi.encodePacked("Query for nonexistent token"));
        escrow.tokenURI(tokenId);
    }

    function testConfirmSupportsInterfaceWorksWithAssertedInterfaces() public {
        // Check that it supports all the asserted interfaces.
        bytes4 ERC165_INTERFACE_ID = 0x01ffc9a7;
        bytes4 ERC721_INTERFACE_ID = 0x80ac58cd;
        bytes4 ERC721_METADATA_INTERFACE_ID = 0x5b5e139f;

        assertTrue(escrow.supportsInterface(ERC165_INTERFACE_ID));
        assertTrue(escrow.supportsInterface(ERC721_INTERFACE_ID));
        assertTrue(escrow.supportsInterface(ERC721_METADATA_INTERFACE_ID));
    }

    function testCheckSupportsInterfaceHandlesUnsupportedInterfacesCorrectly() public {
        bytes4 ERC721_FAKE = 0x780e9d61;
        assertFalse(escrow.supportsInterface(ERC721_FAKE));
    }
}
