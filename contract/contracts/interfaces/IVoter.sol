// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IVoter {
    function createGauge(address _pool) external returns (address);

    function gauges(address) external view returns (address);

    function isAlive(address) external view returns (bool);

    function isGauge(address) external view returns (bool);

    function isWhitelisted(address) external view returns (bool);

    function killGauge(address _gauge) external;

    function lastVoted(uint256) external view returns (uint256);

    function length() external view returns (uint256);

    function owner() external view returns (address);

    function poke(uint256 _tokenId) external;

    function poolForGauge(address) external view returns (address);

    function poolVote(uint256, uint256) external view returns (address);

    function pools(uint256) external view returns (address);

    function renounceOwnership() external;

    function reset(uint256 _tokenId) external;

    function reviveGauge(address _gauge) external;

    function totalWeight() external view returns (uint256);

    function transferOwnership(address newOwner) external;

    function usedWeights(uint256) external view returns (uint256);

    function vote(
        uint256 tokenId,
        address[] memory _poolVote,
        uint256[] memory _weights
    ) external;

    function votes(uint256, address) external view returns (uint256);

    function votingEscrow() external view returns (address);

    function weights(address) external view returns (uint256);

    function whitelist(address _token) external;
}
