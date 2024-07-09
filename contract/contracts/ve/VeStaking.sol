// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IVeStaking} from "contracts/interfaces/IVeStaking.sol";
import {IVotingEscrow} from "contracts/interfaces/IVotingEscrow.sol";

/// @title VeStaking
/// @notice Staking contract to distribute rewards to veToken holders
/// @dev Based on SNX StakingRewards https://docs.synthetix.io/contracts/source/contracts/stakingrewards
contract VeStaking is IVeStaking, Ownable {
    using SafeERC20 for IERC20;

    /* ========== STATE VARIABLES ========== */

    IERC20 public rewardsToken;
    IVotingEscrow public votingEscrow;

    uint256 public periodFinish;
    uint256 public rewardRate;
    uint256 public rewardsDuration = 1 weeks; 
    // last time any user staked, withdrew or claimed rewards
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(uint256 => uint256) public rewardPerTokenPaid;
    mapping(uint256 => uint256) public rewards;

    uint256 private _totalSupply;
    mapping(uint256 => uint256) private _balances;

    /* ========== CONSTRUCTOR ========== */

    constructor(
        address _rewardsToken,
        address _votingEscrow
    ) Ownable() {
        rewardsToken = IERC20(_rewardsToken);

        votingEscrow = IVotingEscrow(_votingEscrow);
    }

    /* ========== VIEWS ========== */

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(uint256 tokenId) external view returns (uint256) {
        return _balances[tokenId];
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    function rewardPerToken() public view returns (uint256) {
        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored
        + (rewardRate * (lastTimeRewardApplicable() - lastUpdateTime) * 1e18)
            / _totalSupply;
    }

    function earned(uint256 tokenId) public view returns (uint256) {
        return (
            (
                _balances[tokenId]
                    * (rewardPerToken() - rewardPerTokenPaid[tokenId])
            ) / 1e18
        ) + rewards[tokenId];
    }

    function getRewardForDuration() external view returns (uint256) {
        return rewardRate * rewardsDuration;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function notifyRewardAmount(uint256 reward) external updateReward(0) {
        if (block.timestamp >= periodFinish) {
            rewardRate = reward / rewardsDuration;
        } else {
            uint256 remaining = periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardRate;
            rewardRate = (reward + leftover) / rewardsDuration;
        }

        lastUpdateTime = block.timestamp;
        periodFinish = (block.timestamp + rewardsDuration) / 1 weeks * 1 weeks; // periodFinish is rounded down to weeks

        // Ensure the provided reward amount is not more than the balance in the contract.
        // This keeps the reward rate in the right range, preventing overflows due to
        // very high values of rewardRate in the earned and rewardsPerToken functions;
        // Reward + leftover must be less than 2^256 / 10^18 to avoid overflow.
        uint256 balance = rewardsToken.balanceOf(address(this));
        require(rewardRate <= (balance / rewardsDuration), "Provided reward too high");

        emit RewardAdded(reward);
    }

    // we use internal notation since this function can only be called by the VotingEscrow contract
    function _stake(uint256 tokenId, uint256 amount) external onlyVotingEscrow updateReward(tokenId) {
        require(amount > 0, "Cannot stake 0");
        _totalSupply += amount;
        _balances[tokenId] += amount;
        emit Staked(tokenId, amount);
    }

    // we use internal notation since this function can only be called by the VotingEscrow contract
    function _withdraw(uint256 tokenId) external onlyVotingEscrow updateReward(tokenId) {
        uint256 amount = _balances[tokenId];
        _totalSupply -= amount;
        _balances[tokenId] = 0;
        emit Withdrawn(tokenId, amount);
    }

    // we use internal notation since this function can only be called by the VotingEscrow contract
    function _updateBalance(uint256 tokenId, uint256 newAmount) external onlyVotingEscrow updateReward(tokenId) {
        uint256 amount = _balances[tokenId];
        _totalSupply = _totalSupply - amount + newAmount;
        _balances[tokenId] = newAmount;
        emit BalanceUpdated(tokenId, amount, newAmount);
    }

    function getReward(uint256 tokenId) external updateReward(tokenId) {
        address tokenOwner = votingEscrow.ownerOf(tokenId);

        uint256 reward = rewards[tokenId];
        if (reward > 0) {
            rewards[tokenId] = 0;
            rewardsToken.safeTransfer(tokenOwner, reward);
            emit RewardPaid(tokenOwner, reward);
        }
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    // Recover tokens that are accidentally sent to the contract
    function recoverERC20(address tokenAddress, uint256 tokenAmount) external onlyOwner {
        require(tokenAddress != address(rewardsToken), "Cannot withdraw the rewards token");
        IERC20(tokenAddress).transfer(msg.sender, tokenAmount);
        emit Recovered(tokenAddress, tokenAmount);
    }

    function setRewardsDuration(uint256 _rewardsDuration) external onlyOwner {
        require(
            block.timestamp > periodFinish,
            "Previous rewards period must be complete before changing the duration for the new period"
        );
        rewardsDuration = _rewardsDuration;
        emit RewardsDurationUpdated(rewardsDuration);
    }

    /* ========== MODIFIERS ========== */

    modifier onlyVotingEscrow() {
        require(msg.sender == address(votingEscrow), "Caller is not VotingEscrow contract");
        _;
    }

    modifier updateReward(uint256 tokenId) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (tokenId != 0) {
            rewards[tokenId] = earned(tokenId);
            rewardPerTokenPaid[tokenId] = rewardPerTokenStored;
        }
        _;
    }

    /* ========== EVENTS ========== */

    event RewardAdded(uint256 reward);
    event Staked(uint256 indexed tokenId, uint256 amount);
    event Withdrawn(uint256 indexed tokenId, uint256 amount);
    event BalanceUpdated(uint256 indexed tokenId, uint256 oldAmount, uint256 newAmount);
    event RewardPaid(address indexed tokenId, uint256 reward);
    event RewardsDurationUpdated(uint256 newDuration);
    event Recovered(address token, uint256 amount);
}
