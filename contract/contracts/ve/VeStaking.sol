// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {
    SafeERC20,
    IERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IVeStaking} from "contracts/interfaces/IVeStaking.sol";
import {IVotingEscrow} from "contracts/interfaces/IVotingEscrow.sol";

/// @title VeStaking
/// @notice Staking contract to distribute rewards to veNFT holders
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

    constructor(address _rewardsToken, address _votingEscrow) Ownable() {
        rewardsToken = IERC20(_rewardsToken);

        votingEscrow = IVotingEscrow(_votingEscrow);
    }

    /* ========== VIEWS ========== */

    /// @notice Returns the total supply
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    /// @notice Returns the veStaking balance of `tokenId`
    /// @param tokenId ID of the veNFT
    /// @dev The veStaking balance is the initial veNFT balance at time of staking
    /// @dev It is not decaying over time, unlike the veToken balance
    function balanceOf(uint256 tokenId) external view returns (uint256) {
        return _balances[tokenId];
    }

    /// @notice Returns the last time rewards were applicable
    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    /// @notice Returns the reward per token
    function rewardPerToken() public view returns (uint256) {
        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored +
            (rewardRate *
                (lastTimeRewardApplicable() - lastUpdateTime) *
                1e18) /
            _totalSupply;
    }

    /// @notice Returns earned rewards for `tokenId`
    function earned(uint256 tokenId) public view returns (uint256) {
        return
            ((_balances[tokenId] *
                (rewardPerToken() - rewardPerTokenPaid[tokenId])) / 1e18) +
            rewards[tokenId];
    }

    /// @notice Returns remaining rewards for the current period
    function getRewardForDuration() external view returns (uint256) {
        if (block.timestamp >= periodFinish) {
            return 0;
        } else {
            return rewardRate * (periodFinish - block.timestamp);
        }
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /// @notice Adds `reward` to be distributed to veToken holders
    /// @param reward Amount of rewards to add
    function notifyRewardAmount(uint256 reward) external updateReward(0) {
        // remaining time until periodFinish
        uint256 remaining;

        if (block.timestamp >= periodFinish) {
            // set new periodFinish if the previous period has ended
            // periodFinish is rounded down to weeks to be aligned with the weekly gauge voting schedule
            periodFinish =
                ((block.timestamp + rewardsDuration) / 1 weeks) *
                1 weeks;

            remaining = periodFinish - block.timestamp;
            rewardRate = reward / remaining;
        } else {
            remaining = periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardRate;
            rewardRate = (reward + leftover) / remaining;
        }

        lastUpdateTime = block.timestamp;

        // Ensure the provided reward amount is not more than the balance in the contract.
        // This keeps the reward rate in the right range, preventing overflows due to
        // very high values of rewardRate in the earned and rewardsPerToken functions;
        // Reward + leftover must be less than 2^256 / 10^18 to avoid overflow.
        uint256 balance = rewardsToken.balanceOf(address(this));
        require(
            rewardRate <= (balance / remaining),
            "Provided reward too high"
        );

        emit RewardAdded(reward);
    }

    /// @notice Stakes `amount` for `tokenId`
    /// @param tokenId ID of the veNFT
    /// @param amount Amount to stake
    /// @dev Internal notation is used since this function can only be called by the VotingEscrow contract
    /// @dev This function is called by VotingEscrow.create_lock and VotingEscrow.increase_amount
    function _stake(
        uint256 tokenId,
        uint256 amount
    ) external onlyVotingEscrow updateReward(tokenId) {
        require(amount > 0, "Cannot stake 0");
        _totalSupply += amount;
        _balances[tokenId] += amount;
        emit Staked(tokenId, amount);
    }

    /// @notice Withdraws `tokenId` from the staking contract
    /// @param tokenId ID of the veNFT
    /// @dev Internal notation is used since this function can only be called by the VotingEscrow contract
    /// @dev This function is called by VotingEscrow.withdraw
    function _withdraw(
        uint256 tokenId
    ) external onlyVotingEscrow updateReward(tokenId) {
        uint256 amount = _balances[tokenId];
        _totalSupply -= amount;
        _balances[tokenId] = 0;
        emit Withdrawn(tokenId, amount);
    }

    /// @notice Updates the balance of `tokenId` to `newAmount`
    /// @param tokenId ID of the veNFT
    /// @param newAmount New balance of the veNFT
    /// @dev Internal notation is used since this function can only be called by the VotingEscrow contract
    /// @dev This function is called by VotingEscrow.increase_unlock_time
    function _updateBalance(
        uint256 tokenId,
        uint256 newAmount
    ) external onlyVotingEscrow updateReward(tokenId) {
        uint256 amount = _balances[tokenId];
        _totalSupply = _totalSupply - amount + newAmount;
        _balances[tokenId] = newAmount;
        emit BalanceUpdated(tokenId, amount, newAmount);
    }

    /// @notice Claim rewards for `tokenId`
    /// @param tokenId ID of the veNFT
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

    /// @notice Recover tokens that are accidentally sent to the contract
    /// @param tokenAddress Address of the token to recover
    /// @param tokenAmount Amount of tokens to recover
    function recoverERC20(
        address tokenAddress,
        uint256 tokenAmount
    ) external onlyOwner {
        require(
            tokenAddress != address(rewardsToken),
            "Cannot withdraw the rewards token"
        );
        IERC20(tokenAddress).transfer(msg.sender, tokenAmount);
        emit Recovered(tokenAddress, tokenAmount);
    }

    /// @notice Sets the duration of the rewards period
    /// @param _rewardsDuration Duration of the rewards period in seconds
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
        require(
            msg.sender == address(votingEscrow),
            "Caller is not VotingEscrow contract"
        );
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
    event BalanceUpdated(
        uint256 indexed tokenId,
        uint256 oldAmount,
        uint256 newAmount
    );
    event RewardPaid(address indexed tokenId, uint256 reward);
    event RewardsDurationUpdated(uint256 newDuration);
    event Recovered(address token, uint256 amount);
}
