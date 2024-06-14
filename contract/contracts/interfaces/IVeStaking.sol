// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IVeStaking {
    // Views
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function earned(address account) external view returns (uint256);
    function getRewardForDuration() external view returns (uint256);
    function lastTimeRewardApplicable() external view returns (uint256);
    function lastUpdateTime() external view returns (uint256);
    function periodFinish() external view returns (uint256);
    function rewardPerToken() external view returns (uint256);
    function rewardsDuration() external view returns (uint256);
    function rewardPerTokenStored() external view returns (uint256);
    function rewardRate() external view returns (uint256);
    function rewards(address) external view returns (uint256);
    function userRewardPerTokenPaid(address) external view returns (uint256);

    // Mutative
    function getReward() external;
    function stake(uint256 amount) external;
    function withdraw(uint256 amount) external;
}