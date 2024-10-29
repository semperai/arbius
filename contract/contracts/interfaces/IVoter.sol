// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IVoter {
    function createGauge(bytes32 _model) external;

    function epochVoteEnd() external view returns (uint256);

    function getGaugeMultiplier(bytes32 _model) external view returns (uint256);

    function isAlive(bytes32) external view returns (bool);

    function isGauge(bytes32) external view returns (bool);

    function isWhitelisted(bytes32) external view returns (bool);

    function killGauge(bytes32 _model) external;

    function lastVoted(uint256) external view returns (uint256);

    function length() external view returns (uint256);

    function modelVote(uint256, uint256) external view returns (bytes32);

    function models(uint256) external view returns (bytes32);

    function poke(uint256 _tokenId) external;

    function reset(uint256 _tokenId) external;

    function reviveGauge(bytes32 _model) external;

    function totalWeight() external view returns (uint256);

    function usedWeights(uint256) external view returns (uint256);

    function vote(
        uint256 tokenId,
        bytes32[] memory _modelVote,
        uint256[] memory _weights
    ) external;

    function votes(uint256, bytes32) external view returns (uint256);

    function votingEscrow() external view returns (address);

    function weights(bytes32) external view returns (uint256);

    function whitelist(bytes32 _model) external;
}
