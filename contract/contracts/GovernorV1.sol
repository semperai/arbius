// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/compatibility/GovernorCompatibilityBravo.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

import {VeGovernorVotes, IVotes} from "./governance/VeGovernorVotes.sol";
import {VeGovernorVotesQuorumFraction} from "./governance/VeGovernorVotesQuorumFraction.sol";

import {getIPFSCIDMemory} from "./libraries/IPFS.sol";

contract GovernorV1 is
    Governor,
    GovernorCompatibilityBravo,
    GovernorSettings,
    VeGovernorVotes,
    VeGovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    // proposal ids stored here to allow us to enumerate them
    uint256[] public proposalsCreated;

    // proposal id -> h(description)
    mapping(uint256 => bytes32) public descriptionHashes;

    // proposal id -> ipfs hash
    mapping(uint256 => bytes) public descriptionCids;

    /// @notice The name of this contract
    /// @param _token The address of the VotingEscrow contract (veAIUS token)
    /// @param _timelock The address of the timelock
    constructor(
        IVotes _token,
        TimelockController _timelock
    )
        Governor("Governor")
        GovernorCompatibilityBravo()
        GovernorSettings(
            86400, // initialVotingDelay = 1 day
            86400 * 3, // initialVotingPeriod = 3 days
            1e18  // initialProposalThreshold = 1 veAIUS
        )
        VeGovernorVotes(_token)
        VeGovernorVotesQuorumFraction(4)
        GovernorTimelockControl(_timelock)
    {}

    /// @notice How long to delay an election
    /// @dev delay in blocks
    /// @return The delay in blocks
    function votingDelay()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    /// @notice How long to hold an election open
    /// @dev period in blocks
    /// @return The voting period
    function votingPeriod()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    /// @notice What percentage of the total supply must vote for a proposal to pass
    /// @return The quorum percentage
    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    /// @notice How many proposals created
    /// @return The number of proposals created
    function proposalsCreatedLength() public view returns (uint256) {
        return proposalsCreated.length;
    }

    // The functions below are overrides required by Solidity.

    function state(
        uint256 proposalId
    )
        public
        view
        override(Governor, IGovernor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    // we store all proposals to make on-chain lookup easier
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    )
        public
        override(Governor, GovernorCompatibilityBravo, IGovernor)
        returns (uint256)
    {
        uint256 proposalId = super.propose(
            targets,
            values,
            calldatas,
            description
        );
        proposalsCreated.push(proposalId);

        // dumb workaround to allow easy lookup
        descriptionHashes[proposalId] = keccak256(bytes(description));

        descriptionCids[proposalId] = getIPFSCIDMemory(bytes(description));

        return proposalId;
    }

    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        public
        override(Governor, IGovernor, GovernorCompatibilityBravo)
        returns (uint256)
    {
        return super.cancel(targets, values, calldatas, descriptionHash);
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(Governor, IERC165, GovernorTimelockControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
