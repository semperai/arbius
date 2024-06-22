// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IVeStaking {
    // Views
    function totalSupply() external view returns (uint256);
    function balanceOf(uint256 account) external view returns (uint256);
    function earned(uint256 account) external view returns (uint256);
    function getRewardForDuration() external view returns (uint256);
    function lastTimeRewardApplicable() external view returns (uint256);
    function lastUpdateTime() external view returns (uint256);
    function periodFinish() external view returns (uint256);
    function rewardPerToken() external view returns (uint256);
    function rewardsDuration() external view returns (uint256);
    function rewardPerTokenStored() external view returns (uint256);
    function rewardRate() external view returns (uint256);
    function rewards(uint256) external view returns (uint256);
    function rewardPerTokenPaid(uint256) external view returns (uint256);

    // Mutative
    function notifyRewardAmount(uint256 reward) external;
    function getReward(uint256 tokenId) external;
    function _stake(uint256 tokenId, uint256 amount) external;
    function _withdraw(uint256 amount) external;
    function _updateBalance(uint256 tokenId, uint256 newAmount) external;

}