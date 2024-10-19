// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IVotingEscrow} from "contracts/interfaces/IVotingEscrow.sol";
import {IVoter} from "contracts/interfaces/IVoter.sol";

contract Voter is IVoter, Ownable {

    /* ========== STATE VARIABLES ========== */

    address public immutable votingEscrow; // the ve token that governs these contracts

    uint256 internal constant DURATION = 1 weeks; // voting duration per epoch

    uint256 public totalWeight; // total voting weight
    mapping(bytes32 => uint256) public weights; // model => weight

    bytes32[] public models; // all models viable for incentives
    mapping(bytes32 => bool) public isGauge; // model => isGauge
    mapping(uint256 => mapping(bytes32 => uint256)) public votes; // nft => model => votes
    mapping(uint256 => bytes32[]) public modelVote; // nft => models
    mapping(uint256 => uint) public usedWeights; // nft => total voting weight of user
    mapping(uint256 => uint) public lastVoted; // nft => timestamp of last vote, to ensure one vote per epoch
    mapping(bytes32 => bool) public isWhitelisted; // model => isWhitelisted
    mapping(bytes32 => bool) public isAlive; // model => isAlive

    /* ========== EVENTS ========== */

    event GaugeCreated(address creator, bytes32 indexed model);
    event GaugeKilled(bytes32 indexed model);
    event GaugeRevived(bytes32 indexed model);
    event Voted(
        address indexed voter,
        uint256 tokenId,
        bytes32 model,
        uint256 weight
    );
    event Abstained(uint256 tokenId, uint256 weight);
    event Whitelisted(address indexed whitelister, bytes32 indexed model);

    /* ========== CONSTRUCTOR ========== */

    constructor(address _votingEscrow) Ownable() {
        votingEscrow = _votingEscrow;
    }

    /* ========== MODIFIERS ========== */

    modifier onlyNewEpoch(uint256 _tokenId) {
        // ensure new epoch since last vote
        require(
            (block.timestamp / DURATION) * DURATION > lastVoted[_tokenId],
            "only new epoch"
        );
        _;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /// @notice Called by users to update voting balances in voting rewards contracts.
    /// @param _tokenId Id of veNFT whose balance you wish to update.
    function poke(uint256 _tokenId) external {
        bytes32[] memory _modelVote = modelVote[_tokenId];
        uint256 _modelCnt = _modelVote.length;
        uint256[] memory _weights = new uint256[](_modelCnt);

        for (uint256 i = 0; i < _modelCnt; i++) {
            _weights[i] = votes[_tokenId][_modelVote[i]];
        }

        _vote(_tokenId, _modelVote, _weights);
    }

    /// @notice Called by users to vote for models. Votes distributed proportionally based on weights.
    /// @dev Weights are distributed proportional to the sum of the weights in the array.
    /// @param tokenId      Id of veNFT you are voting with.
    /// @param _modelVote   Array of models you are voting for.
    /// @param _weights     Weights of models.
    function vote(
        uint256 tokenId,
        bytes32[] calldata _modelVote,
        uint256[] calldata _weights
    ) external onlyNewEpoch(tokenId) {
        require(
            IVotingEscrow(votingEscrow).isApprovedOrOwner(msg.sender, tokenId)
        );
        require(_modelVote.length == _weights.length, "length mismatch");
        lastVoted[tokenId] = block.timestamp;
        _vote(tokenId, _modelVote, _weights);
    }

    function _vote(
        uint256 _tokenId,
        bytes32[] memory _modelVote,
        uint256[] memory _weights
    ) internal {
        _reset(_tokenId);
        uint256 _modelCnt = _modelVote.length;
        uint256 _weight = IVotingEscrow(votingEscrow).balanceOfNFT(_tokenId);
        uint256 _totalVoteWeight = 0;
        uint256 _totalWeight = 0;
        uint256 _usedWeight = 0;

        for (uint256 i = 0; i < _modelCnt; i++) {
            _totalVoteWeight += _weights[i];
        }

        for (uint256 i = 0; i < _modelCnt; i++) {
            bytes32 _model = _modelVote[i];

            if (isAlive[_model]) {
                uint256 _modelWeight = (_weights[i] * _weight) /
                    _totalVoteWeight;
                require(votes[_tokenId][_model] == 0, "nonzero votes");
                require(_modelWeight != 0, "zero weight");

                modelVote[_tokenId].push(_model);

                weights[_model] += _modelWeight;
                votes[_tokenId][_model] += _modelWeight;

                _usedWeight += _modelWeight;
                _totalWeight += _modelWeight;

                emit Voted(msg.sender, _tokenId, _model, _modelWeight);
            }
        }
        if (_usedWeight > 0) IVotingEscrow(votingEscrow).voting(_tokenId);
        totalWeight += _totalWeight;
        usedWeights[_tokenId] = _usedWeight;
    }

    /// @notice Called by users to reset voting state.
    /// @param _tokenId Id of veNFT you are reseting.
    function reset(uint256 _tokenId) external onlyNewEpoch(_tokenId) {
        require(
            IVotingEscrow(votingEscrow).isApprovedOrOwner(msg.sender, _tokenId)
        );
        _reset(_tokenId);
    }

    function _reset(uint256 _tokenId) internal {
        bytes32[] storage _modelVote = modelVote[_tokenId];
        uint256 _modelVoteCnt = _modelVote.length;
        uint256 _totalWeight = 0;

        for (uint256 i = 0; i < _modelVoteCnt; i++) {
            bytes32 _model = _modelVote[i];
            uint256 _votes = votes[_tokenId][_model];

            if (_votes != 0) {
                weights[_model] -= _votes;
                //votes[_tokenId][_model] -= _votes;
                delete votes[_tokenId][_model];
                _totalWeight += _votes;
                emit Abstained(_tokenId, _votes);
            }
        }
        IVotingEscrow(votingEscrow).abstain(_tokenId);
        totalWeight -= _totalWeight;
        usedWeights[_tokenId] = 0;
        delete modelVote[_tokenId];
    }

    /// @notice Create a new gauge for a model.
    /// @dev Governor can create a new gauge for a non-whitelisted model
    function createGauge(bytes32 _model) external {
        require(isGauge[_model] == false, "exists");

        // only owner can create a gauge for a non-whitelisted model
        if (msg.sender != owner()) {
            require(isWhitelisted[_model], "!whitelisted");
        }

        isAlive[_model] = true;
        isGauge[_model] = true;
        models.push(_model);
        emit GaugeCreated(msg.sender, _model);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function whitelist(bytes32 _model) external onlyOwner {
        require(!isWhitelisted[_model], "whitelisted");
        isWhitelisted[_model] = true;
        emit Whitelisted(msg.sender, _model);
    }

    /// @notice Kills a gauge. It can not receive any more votes.
    /// @dev Throws if not called by owner/governance.
    ///      Throws if gauge already killed.
    function killGauge(bytes32 _model) external onlyOwner {
        require(isAlive[_model], "gauge already dead");
        isAlive[_model] = false;
        emit GaugeKilled(_model);
    }

    /// @notice Revives a killed gauge
    /// @dev Throws if not called by owner/governance.
    ///      Throws if gauge is not killed or does not exist.
    /// @param _model Model to revive
    function reviveGauge(bytes32 _model) external onlyOwner {
        require(isGauge[_model], "not a gauge");
        require(!isAlive[_model], "gauge already alive");
        isAlive[_model] = true;
        emit GaugeRevived(_model);
    }

    /* ========== VIEWS ========== */

    function length() external view returns (uint) {
        return models.length;
    }

    function epochVoteEnd() external view returns (uint256) {
        return ((block.timestamp / DURATION) * DURATION) + DURATION;
    }

    function getGaugeMultiplier(
        bytes32 _model
    ) external view returns (uint256) {
        require(totalWeight > 0, "no votes");
        
        return (weights[_model] * 1e18) / totalWeight;
    }
}
