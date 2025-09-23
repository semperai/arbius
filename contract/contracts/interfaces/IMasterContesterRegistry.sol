// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title IMasterContesterRegistry
/// @notice Interface for the Master Contester Registry contract
interface IMasterContesterRegistry {
    /* ========== CUSTOM ERRORS ========== */
    
    error NotTokenOwner();
    error AlreadyVotedThisEpoch();
    error NoVotingPower();
    error EpochNotEnded();
    error AlreadyMasterContester();
    error NotMasterContester();

    /* ========== VIEW FUNCTIONS ========== */

    /// @notice Check if an address is a current master contester
    /// @param addr Address to check
    /// @return Whether the address is a master contester
    function isMasterContester(address addr) external view returns (bool);
    
    /// @notice Get all current master contesters
    /// @return Array of master contester addresses
    function getMasterContesters() external view returns (address[] memory);
    
    /// @notice Get the number of master contesters to elect
    /// @return The master contester count
    function masterContesterCount() external view returns (uint256);
    
    /// @notice Get the current epoch number
    /// @return The current epoch
    function currentEpoch() external view returns (uint256);
    
    /// @notice Check if we're in a new epoch
    /// @return Whether we're in a new epoch that needs finalization
    function isNewEpoch() external view returns (bool);
    
    /// @notice Get time until next epoch
    /// @return Seconds until next epoch
    function timeUntilNextEpoch() external view returns (uint256);
    
    /// @notice Get current top candidates sorted by votes
    /// @return addresses Array of top candidate addresses
    /// @return votes Array of corresponding vote counts
    function getTopCandidates() external view returns (address[] memory addresses, uint256[] memory votes);
    
    /// @notice Get votes cast by a voter in an epoch
    /// @param epoch The epoch number
    /// @param voter The voter address
    /// @return Array of candidates voted for
    function getVotesCast(uint256 epoch, address voter) external view returns (address[] memory);
    
    /// @notice Check if a voter has voted in a specific epoch
    /// @param epoch The epoch number
    /// @param voter The voter address
    /// @return Whether the voter has cast a vote in the specified epoch
    function hasVoted(uint256 epoch, address voter) external view returns (bool);
    
    /// @notice Get the votes received by a candidate in the current voting period
    /// @param candidate The candidate address
    /// @return The number of votes received
    function candidateVotes(address candidate) external view returns (uint256);
    
    /// @notice Get the last epoch a voter participated in
    /// @param voter The voter address
    /// @return The epoch number
    function lastVoteEpoch(address voter) external view returns (uint256);
    
    /// @notice Get the voting weight used in a voter's last vote
    /// @param voter The voter address
    /// @return The voting weight
    function lastVoteWeight(address voter) external view returns (uint256);

    /* ========== MUTATIVE FUNCTIONS ========== */
    
    /// @notice Vote for master contester candidates
    /// @param candidates Array of candidate addresses to vote for
    /// @param tokenId veNFT token ID to vote with
    function vote(address[] calldata candidates, uint256 tokenId) external;
    
    /// @notice Vote with multiple veNFTs
    /// @param candidates Array of candidate addresses to vote for
    /// @param tokenIds Array of veNFT token IDs to vote with
    function voteMultiple(address[] calldata candidates, uint256[] calldata tokenIds) external;
    
    /// @notice Manually trigger epoch finalization if needed
    function finalizeEpoch() external;

    /* ========== EVENTS ========== */
    
    event VoteCast(address indexed voter, address indexed candidate, uint256 weight, uint256 epoch);
    event VoteUndone(address indexed voter, address indexed candidate, uint256 weight, uint256 epoch);
    event EpochFinalized(uint256 indexed epoch, address[] elected);
    event MasterContesterCountChanged(uint256 oldCount, uint256 newCount);
    event EmergencyMasterContesterAdded(address indexed contester);
    event EmergencyMasterContesterRemoved(address indexed contester);
}
