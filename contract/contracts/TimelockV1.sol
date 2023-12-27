// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/governance/TimelockController.sol";

contract TimelockV1 is TimelockController {
    /// @notice Timelock constructor
    /// @param minDelay Minimum delay for timelock
    /// @param proposers Array of proposers
    /// @param executors Array of executors
    /// @param admin Address of admin
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {}
}
