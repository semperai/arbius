// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IVotingEscrow} from "contracts/interfaces/IVotingEscrow.sol";
import {IMasterContesterRegistry} from "contracts/interfaces/IMasterContesterRegistry.sol";

/// @title MasterContesterRegistry
/// @notice Registry for managing elected Master Contesters with optimized sorting
/// @dev Uses a min-heap to maintain top N candidates efficiently during voting
contract MasterContesterRegistry is IMasterContesterRegistry, Ownable {
    address public immutable votingEscrow; // veAIUS token for voting

    uint256 public constant EPOCH_DURATION = 1 weeks; // voting epoch duration
    uint256 public masterContesterCount = 3; // default to 3 master contesters
    uint256 public currentEpoch; // current election epoch
    uint256 public epochStartTime; // start time of current epoch

    // Current active master contesters
    address[] public masterContesters;

    mapping(address => uint256) public candidateVotes; // votes received in current epoch

    // Min-heap to track top N candidates efficiently
    struct HeapNode {
        address candidate;
        uint256 votes;
    }
    HeapNode[] public topCandidatesHeap; // Min-heap of top candidates
    mapping(address => uint256) public heapIndex; // candidate => index in heap + 1 (0 means not in heap)

    // Voting records
    mapping(uint256 => mapping(address => address[])) public votesCast; // epoch => voter => candidates voted for

    // Track the last voting epoch and vote weight for each voter
    mapping(address => uint256) public lastVoteEpoch; // voter => last epoch they voted in
    mapping(address => uint256) public lastVoteWeight; // voter => weight used in last vote

    /* ========== CONSTRUCTOR ========== */

    constructor(address _votingEscrow) Ownable() {
        votingEscrow = _votingEscrow;
        epochStartTime = block.timestamp;
        currentEpoch = 1;
    }

    /* ========== MODIFIERS ========== */

    modifier onlyNewEpoch() {
        if (block.timestamp >= epochStartTime + EPOCH_DURATION) {
            _finalizeEpoch();
        }
        _;
    }

    /* ========== VIEW FUNCTIONS ========== */

    /// @notice Get all current master contesters
    /// @return Array of master contester addresses
    function getMasterContesters() external view returns (address[] memory) {
        return masterContesters;
    }

    /// @notice Get current top candidates sorted by votes
    /// @return addresses Array of top candidate addresses
    /// @return votes Array of corresponding vote counts
    function getTopCandidates() external view returns (address[] memory addresses, uint256[] memory votes) {
        uint256 heapSize = topCandidatesHeap.length;

        // Create temporary arrays to sort the heap data
        HeapNode[] memory sorted = new HeapNode[](heapSize);
        for (uint256 i = 0; i < heapSize; i++) {
            sorted[i] = topCandidatesHeap[i];
        }

        // Sort in descending order (highest votes first)
        for (uint256 i = 0; i < heapSize; i++) {
            for (uint256 j = i + 1; j < heapSize; j++) {
                if (sorted[j].votes > sorted[i].votes) {
                    HeapNode memory temp = sorted[i];
                    sorted[i] = sorted[j];
                    sorted[j] = temp;
                }
            }
        }

        addresses = new address[](heapSize);
        votes = new uint256[](heapSize);
        for (uint256 i = 0; i < heapSize; i++) {
            addresses[i] = sorted[i].candidate;
            votes[i] = sorted[i].votes;
        }
    }

    /// @notice Get votes cast by a voter in an epoch
    /// @param epoch The epoch number
    /// @param voter The voter address
    /// @return Array of candidates voted for
    function getVotesCast(uint256 epoch, address voter) external view returns (address[] memory) {
        return votesCast[epoch][voter];
    }

    /// @notice Check if we're in a new epoch
    /// @return Whether we're in a new epoch that needs finalization
    function isNewEpoch() public view returns (bool) {
        return block.timestamp >= epochStartTime + EPOCH_DURATION;
    }

    /// @notice Check if a candidate is a master contester
    /// @param candidate Address to check
    /// @return Whether the candidate is a master contester
    function isMasterContester(address candidate) public view returns (bool) {
        for (uint256 i = 0; i < masterContesters.length; i++) {
            if (masterContesters[i] == candidate) {
                return true;
            }
        }

        return false;
    }

    /// @notice Check if a voter has voted in a specific epoch
    /// @param epoch The epoch number
    /// @param voter The voter address
    /// @return Whether the voter has cast a vote in the specified epoch
    function hasVoted(uint256 epoch, address voter) public view returns (bool) {
        return votesCast[epoch][voter].length > 0;
    }

    /// @notice Get time until next epoch
    /// @return Seconds until next epoch
    function timeUntilNextEpoch() external view returns (uint256) {
        if (isNewEpoch()) return 0;
        return (epochStartTime + EPOCH_DURATION) - block.timestamp;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /// @notice Vote for master contester candidates
    /// @param _candidates Array of candidate addresses to vote for
    /// @param tokenId veNFT token ID to vote with
    function vote(address[] calldata _candidates, uint256 tokenId) public onlyNewEpoch {
        if (IVotingEscrow(votingEscrow).ownerOf(tokenId) != msg.sender) {
            revert NotTokenOwner();
        }
        if (hasVoted(currentEpoch, msg.sender)) {
            revert AlreadyVotedThisEpoch();
        }

        uint256 voteWeight = IVotingEscrow(votingEscrow).balanceOfNFT(tokenId);
        if (voteWeight == 0) {
            revert NoVotingPower();
        }

        if (lastVoteEpoch[msg.sender] > 0 && lastVoteEpoch[msg.sender] < currentEpoch) {
            _undoPreviousVotes(msg.sender);
        }

        // Record votes
        votesCast[currentEpoch][msg.sender] = _candidates;
        lastVoteEpoch[msg.sender] = currentEpoch;
        lastVoteWeight[msg.sender] = voteWeight;

        // Distribute vote weight equally among candidates
        uint256 weightPerCandidate = voteWeight / _candidates.length;

        for (uint256 i = 0; i < _candidates.length; i++) {
            // Update vote count
            candidateVotes[_candidates[i]] += weightPerCandidate;

            // Update heap to maintain top N candidates
            _updateTopCandidates(_candidates[i], candidateVotes[_candidates[i]]);

            emit VoteCast(msg.sender, _candidates[i], weightPerCandidate, currentEpoch);
        }
    }

    /// @notice Undo previous votes when voting in a new epoch
    /// @param voter The voter whose previous votes should be undone
    function _undoPreviousVotes(address voter) internal {
        uint256 previousEpoch = lastVoteEpoch[voter];
        address[] memory previousCandidates = votesCast[previousEpoch][voter];

        if (previousCandidates.length == 0) return;

        uint256 previousWeight = lastVoteWeight[voter];
        uint256 weightPerCandidate = previousWeight / previousCandidates.length;

        for (uint256 i = 0; i < previousCandidates.length; i++) {
            address candidate = previousCandidates[i];

            // Reduce the candidate's vote count
            if (candidateVotes[candidate] >= weightPerCandidate) {
                candidateVotes[candidate] -= weightPerCandidate;
            } else {
                candidateVotes[candidate] = 0; // Safety check
            }

            // Update heap to reflect reduced votes
            _updateTopCandidatesAfterReduction(candidate, candidateVotes[candidate]);

            emit VoteUndone(voter, candidate, weightPerCandidate, previousEpoch);
        }
    }

    /// @notice Update heap after vote reduction (may need to remove candidate or reheapify)
    /// @param candidate The candidate whose votes were reduced
    /// @param newVotes The candidate's new vote count
    function _updateTopCandidatesAfterReduction(address candidate, uint256 newVotes) internal {
        if (heapIndex[candidate] == 0) return; // Not in heap

        uint256 index = heapIndex[candidate] - 1;
        topCandidatesHeap[index].votes = newVotes;

        // After reduction, we may need to heapify down
        _heapifyDown(index);

        // If votes are now 0, consider removing from heap
        if (newVotes == 0) {
            // Remove from heap by swapping with last element and popping
            uint256 lastIndex = topCandidatesHeap.length - 1;
            if (index != lastIndex) {
                topCandidatesHeap[index] = topCandidatesHeap[lastIndex];
                heapIndex[topCandidatesHeap[index].candidate] = index + 1;
            }
            topCandidatesHeap.pop();
            heapIndex[candidate] = 0;

            // Re-heapify from the swapped position if needed
            if (index < topCandidatesHeap.length) {
                _heapifyDown(index);
                _heapifyUp(index);
            }
        }
    }

    /// @notice Vote with multiple veNFTs
    /// @param _candidates Array of candidate addresses to vote for
    /// @param tokenIds Array of veNFT token IDs to vote with
    function voteMultiple(address[] calldata _candidates, uint256[] calldata tokenIds) external onlyNewEpoch {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            vote(_candidates, tokenIds[i]);
        }
    }

    /// @notice Manually trigger epoch finalization if needed
    function finalizeEpoch() external {
        if (!isNewEpoch()) {
            revert EpochNotEnded();
        }
        _finalizeEpoch();
    }

    /* ========== HEAP FUNCTIONS ========== */

    /// @notice Update the top candidates heap when a candidate receives votes
    /// @param candidate The candidate address
    /// @param newVotes The candidate's new total vote count
    function _updateTopCandidates(address candidate, uint256 newVotes) internal {
        if (heapIndex[candidate] > 0) {
            // Candidate is already in heap, update their votes
            uint256 index = heapIndex[candidate] - 1; // Adjust for 1-based indexing
            topCandidatesHeap[index].votes = newVotes;

            // Since votes only increase, we need to bubble up
            _heapifyUp(index);
        } else if (topCandidatesHeap.length < masterContesterCount) {
            // Heap not full, add candidate
            topCandidatesHeap.push(HeapNode(candidate, newVotes));
            uint256 newIndex = topCandidatesHeap.length - 1;
            heapIndex[candidate] = newIndex + 1; // Store as 1-based index
            _heapifyUp(newIndex);
        } else if (newVotes > topCandidatesHeap[0].votes) {
            // Heap is full but this candidate has more votes than the minimum
            // Remove the minimum and add new candidate
            address oldCandidate = topCandidatesHeap[0].candidate;
            heapIndex[oldCandidate] = 0; // Mark as not in heap

            topCandidatesHeap[0] = HeapNode(candidate, newVotes);
            heapIndex[candidate] = 1; // Index 0 stored as 1
            _heapifyDown(0);
        }
    }

    /// @notice Maintain min-heap property by bubbling up
    /// @param index The index to start bubbling from
    function _heapifyUp(uint256 index) internal {
        while (index > 0) {
            uint256 parentIndex = (index - 1) / 2;

            // If current is smaller than parent (min-heap property satisfied), stop
            if (topCandidatesHeap[index].votes >= topCandidatesHeap[parentIndex].votes) {
                break;
            }

            // Swap with parent
            _swapHeapNodes(index, parentIndex);
            index = parentIndex;
        }
    }

    /// @notice Maintain min-heap property by bubbling down
    /// @param index The index to start bubbling from
    function _heapifyDown(uint256 index) internal {
        uint256 heapSize = topCandidatesHeap.length;

        while (true) {
            uint256 smallest = index;
            uint256 leftChild = 2 * index + 1;
            uint256 rightChild = 2 * index + 2;

            if (leftChild < heapSize &&
                topCandidatesHeap[leftChild].votes < topCandidatesHeap[smallest].votes) {
                smallest = leftChild;
            }

            if (rightChild < heapSize &&
                topCandidatesHeap[rightChild].votes < topCandidatesHeap[smallest].votes) {
                smallest = rightChild;
            }

            if (smallest == index) {
                break;
            }

            _swapHeapNodes(index, smallest);
            index = smallest;
        }
    }

    /// @notice Swap two nodes in the heap
    /// @param i First index
    /// @param j Second index
    function _swapHeapNodes(uint256 i, uint256 j) internal {
        HeapNode memory temp = topCandidatesHeap[i];
        topCandidatesHeap[i] = topCandidatesHeap[j];
        topCandidatesHeap[j] = temp;

        // Update index mappings (add 1 for 1-based indexing)
        heapIndex[topCandidatesHeap[i].candidate] = i + 1;
        heapIndex[topCandidatesHeap[j].candidate] = j + 1;
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    /// @notice Finalize the current epoch and elect new master contesters
    function _finalizeEpoch() internal {
        // Clear old master contesters
        delete masterContesters;

        // The heap already contains the top N candidates, just need to extract them
        // Sort them in descending order for the final result
        uint256 heapSize = topCandidatesHeap.length;

        if (heapSize > 0) {
            // Create temporary array to sort
            HeapNode[] memory sorted = new HeapNode[](heapSize);
            for (uint256 i = 0; i < heapSize; i++) {
                sorted[i] = topCandidatesHeap[i];
            }

            // Sort in descending order
            for (uint256 i = 0; i < heapSize; i++) {
                for (uint256 j = i + 1; j < heapSize; j++) {
                    if (sorted[j].votes > sorted[i].votes) {
                        HeapNode memory temp = sorted[i];
                        sorted[i] = sorted[j];
                        sorted[j] = temp;
                    }
                }
            }

            // Set new master contesters from sorted array
            for (uint256 i = 0; i < heapSize; i++) {
                if (sorted[i].votes > 0) {
                    masterContesters.push(sorted[i].candidate);
                }
            }
        }

        // Update epoch
        currentEpoch++;
        epochStartTime = block.timestamp;

        emit EpochFinalized(currentEpoch - 1, masterContesters);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    /// @notice Set the number of master contesters to elect
    /// @param _count New master contester count
    function setMasterContesterCount(uint256 _count) external onlyOwner {
        uint256 oldCount = masterContesterCount;
        masterContesterCount = _count;
        emit MasterContesterCountChanged(oldCount, _count);
    }

    /// @notice Emergency function to add a master contester
    /// @param _contester Address to add as master contester
    function emergencyAddMasterContester(address _contester) external onlyOwner {
        if (isMasterContester(_contester)) {
            revert AlreadyMasterContester();
        }

        masterContesters.push(_contester);

        emit EmergencyMasterContesterAdded(_contester);
    }

    /// @notice Emergency function to remove a master contester
    /// @param _contester Address to remove from master contesters
    function emergencyRemoveMasterContester(address _contester) external onlyOwner {
        if (!isMasterContester(_contester)) {
            revert NotMasterContester();
        }

        for (uint256 i = 0; i < masterContesters.length; i++) {
            if (masterContesters[i] == _contester) {
                masterContesters[i] = masterContesters[masterContesters.length - 1];
                masterContesters.pop();
                break;
            }
        }

        emit EmergencyMasterContesterRemoved(_contester);
    }
}
