// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IVotingEscrow} from "contracts/interfaces/IVotingEscrow.sol";
import {IVoter} from "contracts/interfaces/IVoter.sol";

contract Voter is IVoter, Ownable {
    address public immutable votingEscrow; // the ve token that governs these contracts

    uint internal constant DURATION = 7 days; // voting duration per epoch

    uint public totalWeight; // total voting weight
    mapping(address => uint256) public weights; // pool => weight

    address[] public pools; // all pools viable for incentives
    mapping(address => address) public gauges; // pool => gauge
    mapping(address => address) public poolForGauge; // gauge => pool
    mapping(uint => mapping(address => uint256)) public votes; // nft => pool => votes
    mapping(uint => address[]) public poolVote; // nft => pools
    mapping(uint => uint) public usedWeights; // nft => total voting weight of user
    mapping(uint => uint) public lastVoted; // nft => timestamp of last vote, to ensure one vote per epoch
    mapping(address => bool) public isGauge;
    mapping(address => bool) public isWhitelisted;
    mapping(address => bool) public isAlive;

    event GaugeCreated(
        address indexed gauge,
        address creator,
        address indexed pool
    );
    event GaugeKilled(address indexed gauge);
    event GaugeRevived(address indexed gauge);
    event Voted(address indexed voter, uint tokenId, uint256 weight);
    event Abstained(uint tokenId, uint256 weight);
    event Whitelisted(address indexed whitelister, address indexed token);

    constructor(address _votingEscrow) Ownable() {
        votingEscrow = _votingEscrow;
    }

    // todo: test that this aligns correctly with rewardsDuration in veStaking (it should)
    modifier onlyNewEpoch(uint _tokenId) {
        // ensure new epoch since last vote
        require(
            (block.timestamp / DURATION) * DURATION > lastVoted[_tokenId],
            "TOKEN_ALREADY_VOTED_THIS_EPOCH"
        );
        _;
    }

    /// @notice Called by users to reset voting state.
    /// @param _tokenId Id of veNFT you are reseting.
    function reset(uint _tokenId) external onlyNewEpoch(_tokenId) {
        require(
            IVotingEscrow(votingEscrow).isApprovedOrOwner(msg.sender, _tokenId)
        );
        lastVoted[_tokenId] = block.timestamp;
        _reset(_tokenId);
        IVotingEscrow(votingEscrow).abstain(_tokenId);
    }

    function _reset(uint _tokenId) internal {
        address[] storage _poolVote = poolVote[_tokenId];
        uint _poolVoteCnt = _poolVote.length;
        uint256 _totalWeight = 0;

        for (uint i = 0; i < _poolVoteCnt; i++) {
            address _pool = _poolVote[i];
            uint256 _votes = votes[_tokenId][_pool];

            if (_votes != 0) {
                weights[_pool] -= _votes;
                votes[_tokenId][_pool] -= _votes;
                if (_votes > 0) {
                    _totalWeight += _votes;
                } else {
                    _totalWeight -= _votes;
                }
                emit Abstained(_tokenId, _votes);
            }
        }
        totalWeight -= uint256(_totalWeight);
        usedWeights[_tokenId] = 0;
        delete poolVote[_tokenId];
    }

    /// @notice Called by users to update voting balances in voting rewards contracts.
    /// @param _tokenId Id of veNFT whose balance you wish to update.
    function poke(uint _tokenId) external {
        address[] memory _poolVote = poolVote[_tokenId];
        uint _poolCnt = _poolVote.length;
        uint256[] memory _weights = new uint256[](_poolCnt);

        for (uint i = 0; i < _poolCnt; i++) {
            _weights[i] = votes[_tokenId][_poolVote[i]];
        }

        _vote(_tokenId, _poolVote, _weights);
    }

    function _vote(
        uint _tokenId,
        address[] memory _poolVote,
        uint256[] memory _weights
    ) internal {
        _reset(_tokenId);
        uint _poolCnt = _poolVote.length;
        uint256 _weight = IVotingEscrow(votingEscrow).balanceOfNFT(_tokenId);
        uint256 _totalVoteWeight = 0;
        uint256 _totalWeight = 0;
        uint256 _usedWeight = 0;

        for (uint i = 0; i < _poolCnt; i++) {
            _totalVoteWeight += _weights[i];
        }

        for (uint i = 0; i < _poolCnt; i++) {
            address _pool = _poolVote[i];
            address _gauge = gauges[_pool];

            if (isGauge[_gauge]) {
                uint256 _poolWeight = (_weights[i] * _weight) /
                    _totalVoteWeight;
                require(votes[_tokenId][_pool] == 0);
                require(_poolWeight != 0);

                poolVote[_tokenId].push(_pool);

                weights[_pool] += _poolWeight;
                votes[_tokenId][_pool] += _poolWeight;

                _usedWeight += _poolWeight;
                _totalWeight += _poolWeight;
                emit Voted(msg.sender, _tokenId, _poolWeight);
            }
        }
        if (_usedWeight > 0) IVotingEscrow(votingEscrow).voting(_tokenId);
        totalWeight += uint256(_totalWeight);
        usedWeights[_tokenId] = uint256(_usedWeight);
    }

    /// @notice Called by users to vote for pools. Votes distributed proportionally based on weights.
    /// @dev Weights are distributed proportional to the sum of the weights in the array.
    /// @param tokenId     Id of veNFT you are voting with.
    /// @param _poolVote    Array of pools you are voting for.
    /// @param _weights     Weights of pools.
    function vote(
        uint tokenId,
        address[] calldata _poolVote,
        uint256[] calldata _weights
    ) external onlyNewEpoch(tokenId) {
        require(
            IVotingEscrow(votingEscrow).isApprovedOrOwner(msg.sender, tokenId)
        );
        require(_poolVote.length == _weights.length);
        lastVoted[tokenId] = block.timestamp;
        _vote(tokenId, _poolVote, _weights);
    }

    function whitelist(address _token) public onlyOwner {
        require(!isWhitelisted[_token]);
        isWhitelisted[_token] = true;
        emit Whitelisted(msg.sender, _token);
    }

    /// @notice Create a new gauge
    /// @dev Governor can create a new gauge for a pool with any address.
    /// @param _pool .
    function createGauge(address _pool) external returns (address) {
        require(gauges[_pool] == address(0x0), "exists");

        if (msg.sender != owner()) {
            // gov can create for any pool, even non-Velodrome pairs
            require(isWhitelisted[_pool], "!whitelisted");
        }

        // todo: redo this logic
        address _gauge = _pool;

        gauges[_pool] = _gauge;
        poolForGauge[_gauge] = _pool;
        isGauge[_gauge] = true;
        isAlive[_gauge] = true;
        pools.push(_pool);
        emit GaugeCreated(_gauge, msg.sender, _pool);
        return _gauge;
    }

    /// @notice Kills a gauge. The gauge will not receive any new emissions and cannot be deposited into.
    ///         Can still withdraw from gauge.
    /// @dev Throws if not called by emergency council.
    ///      Throws if gauge already killed.
    /// @param _gauge .
    function killGauge(address _gauge) external onlyOwner {
        require(isAlive[_gauge], "gauge already dead");
        isAlive[_gauge] = false;
        emit GaugeKilled(_gauge);
    }

    /// @notice Revives a killed gauge. Gauge will can receive emissions and deposits again.
    /// @dev Throws if not called by emergency council.
    ///      Throws if gauge is not killed.
    /// @param _gauge .
    function reviveGauge(address _gauge) external onlyOwner {
        require(!isAlive[_gauge], "gauge already alive");
        isAlive[_gauge] = true;
        emit GaugeRevived(_gauge);
    }

    function length() external view returns (uint) {
        return pools.length;
    }
}
