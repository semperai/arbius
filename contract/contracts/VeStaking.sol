// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IVeStaking} from "./interfaces/IVeStaking.sol";
import {IVotingEscrow} from "contracts/interfaces/IVotingEscrow.sol";
import {Pausable} from "./Pausable.sol";

/// @title VeStaking
/// @notice Staking contract to distribute rewards to veToken holders
/// @dev Based on SNX StakingRewards https://docs.synthetix.io/contracts/source/contracts/stakingrewards
contract VeStaking is IVeStaking, Pausable {
    /* ========== STATE VARIABLES ========== */

    IERC20 public rewardsToken;
    IVotingEscrow public votingEscrow;

    address public rewardsDistribution; // engine

    uint256 public periodFinish = 0;
    uint256 public rewardRate = 0;
    uint256 public rewardsDuration = 7 days; // todo: maybe bind this to epoch 
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    /* ========== CONSTRUCTOR ========== */

    constructor(
        address _rewardsDistribution,
        address _rewardsToken,
        address _votingEscrow
    ) Ownable() {
        rewardsDistribution = _rewardsDistribution;

        rewardsToken = IERC20(_rewardsToken);

        votingEscrow = IVotingEscrow(_votingEscrow);
    }

    /* ========== VIEWS ========== */

    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    function rewardPerToken() public view returns (uint256) {
        uint256 _totalSupply = votingEscrow.totalSupply();
        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored
        + (rewardRate * (lastTimeRewardApplicable() - lastUpdateTime) * 1e18)
            / _totalSupply;
    }

    function earned(address account) public view returns (uint256) {
        // number of veNFTs owned by `account`
        uint256 _veNFTBalance = votingEscrow.balanceOf(account);
        
        // iterate over veNFTs owned by `account`
        // and call votingEscrow.tokenOfOwnerByIndex to get the sum of veAIUS balance
        uint256 _veAIUSBalance;
        for (uint256 i = 0; i < _veNFTBalance; i++) {
            uint256 _veTokenId = votingEscrow.tokenOfOwnerByIndex(account, i);
            _veAIUSBalance += votingEscrow.balanceOfNFT(_veTokenId);
        }

        return (
            (
                _veAIUSBalance
                    * (rewardPerToken() - userRewardPerTokenPaid[account])
            ) / 1e18
        ) + rewards[account];
    }

    function getRewardForDuration() external view returns (uint256) {
        return rewardRate * rewardsDuration;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function stake(uint256 amount) external notPaused onlyVotingEscrow updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");

        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) public onlyVotingEscrow updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");

        emit Withdrawn(msg.sender, amount);
    }

    function getReward() public updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardsToken.transfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function notifyRewardAmount(uint256 reward) external onlyRewardsDistribution updateReward(address(0)) {
        if (block.timestamp >= periodFinish) {
            rewardRate = reward / rewardsDuration;
        } else {
            uint256 remaining = periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardRate;
            rewardRate = (reward + leftover) / rewardsDuration;
        }

        // Ensure the provided reward amount is not more than the balance in the contract.
        // This keeps the reward rate in the right range, preventing overflows due to
        // very high values of rewardRate in the earned and rewardsPerToken functions;
        // Reward + leftover must be less than 2^256 / 10^18 to avoid overflow.
        uint256 balance = rewardsToken.balanceOf(address(this));
        require(rewardRate <= (balance / rewardsDuration), "Provided reward too high");

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + rewardsDuration;
        emit RewardAdded(reward);
    }

    // Added to support recovering LP Rewards from other systems such as BAL to be distributed to holders
    function recoverERC20(address tokenAddress, uint256 tokenAmount) external onlyOwner {
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

    function setRewardsDistribution(address _rewardsDistribution) external onlyOwner {
        rewardsDistribution = _rewardsDistribution;
    }

    /* ========== MODIFIERS ========== */

    modifier onlyVotingEscrow() {
        require(msg.sender == address(votingEscrow), "Caller is not VotingEscrow contract");
        _;
    }

    modifier onlyRewardsDistribution() {
        require(msg.sender == rewardsDistribution, "Caller is not RewardsDistribution contract");
        _;
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    /* ========== EVENTS ========== */

    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardsDurationUpdated(uint256 newDuration);
    event Recovered(address token, uint256 amount);
}
