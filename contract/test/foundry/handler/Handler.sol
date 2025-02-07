// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console2.sol";

import "../utils/MockERC20.sol";
import "contracts/ve/VotingEscrow.sol";

contract Handler is Test {
    MockERC20 public AIUS;
    VotingEscrow public votingEscrow;

    uint256 lockDuration = 1 weeks;

    uint256 public ghost_depositSum;
    uint256 public ghost_withdrawSum;

    constructor(VotingEscrow _votingEscrow, MockERC20 _AIUS) {
        votingEscrow = _votingEscrow;
        AIUS = _AIUS;
    }

    function deposit(uint256 amount) public {
        // skip if the caller is the votingEscrow contract
        if (msg.sender == address(votingEscrow)) {
            return;
        }

        // limit deposit to 100 AIUS
        amount = bound(amount, 0, 100e18);
        deal(address(AIUS), msg.sender, amount);

        vm.prank(msg.sender);
        AIUS.approve(address(votingEscrow), amount);

        vm.prank(msg.sender);
        votingEscrow.create_lock(amount, lockDuration);

        // fast forward lockDuration so that the lock expires
        skip(lockDuration);

        ghost_depositSum += amount;
    }

    function increaseUnlockTime(uint256 second) public {
        // limit increase to 1 year
        second = bound(second, 0, 60 * 60 * 24 * 365);

        // skip if the user has no NFT
        uint256 id = votingEscrow.tokenOfOwnerByIndex(msg.sender, 0);
        if (id == 0) {
            return;
        }

        (, uint256 end) = votingEscrow.locked(id);
        uint256 newEnd = end + second;

        vm.prank(msg.sender);
        votingEscrow.increase_unlock_time(id, newEnd);
    }

    function increaseAmount(uint256 amount) public {
        // skip if the caller is the votingEscrow contract
        if (msg.sender == address(votingEscrow)) {
            return;
        }

        // limit deposit to 100 AIUS
        amount = bound(amount, 0, 100e18);
        deal(address(AIUS), msg.sender, amount);

        // skip if the user has no NFT
        uint256 id = votingEscrow.tokenOfOwnerByIndex(msg.sender, 0);
        if (id == 0) {
            return;
        }

        vm.prank(msg.sender);
        votingEscrow.increase_amount(id, amount);

        ghost_depositSum += amount;
    }

    function withdraw() public {
        uint256 id = votingEscrow.tokenOfOwnerByIndex(msg.sender, 0);

        // skip if the user has no NFT
        if (id == 0) {
            return;
        }

        (int128 amount, ) = votingEscrow.locked(id);

        vm.prank(msg.sender);
        votingEscrow.withdraw(id);

        // Check that the NFT is burnt
        assertEq(votingEscrow.ownerOf(id), address(0));

        ghost_withdrawSum += uint256(int256(amount));
    }
}
