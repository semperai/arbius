// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

import "./IBaseToken.sol";

interface IArbius {
    // ============ Structs ============

    struct Model {
        uint256 fee;    // base fee for model
        address addr;   // address to send fee to
        uint256 rate;   // rate for rewards emissions
        bytes cid;      // ipfs cid
    }

    struct Validator {
        uint256 staked; // tokens staked
        uint256 since;  // when validator became validator
        address addr;   // validator address
    }

    struct PendingValidatorWithdrawRequest {
        uint256 unlockTime;
        uint256 amount;
    }

    struct Task {
        bytes32 model;      // model hash
        uint256 fee;        // fee offered for completion on top of model base fee
        address owner;      // who is allowed to retract
        uint64 blocktime;
        uint8 version;      // task version
        bytes cid;          // ipfs cid
    }

    struct Solution {
        address validator;
        uint64 blocktime;
        bool claimed;
        bytes cid;          // ipfs cid
    }

    struct Contestation {
        address validator;
        uint64 blocktime;
        uint32 finish_start_index;  // used for finish claiming of rewards
        uint256 slashAmount;        // amount to slash (v6: added field)
    }

    // v6: struct for model specific allow list for who can submit solutions
    struct ModelAllowListEntry {
        bool requiresAllowList;
        mapping(address => bool) allowList;
    }

    // ============ State Variables ============

    function baseToken() external view returns (IBaseToken);
    function treasury() external view returns (address);
    function pauser() external view returns (address);
    function paused() external view returns (bool);
    function accruedFees() external view returns (uint256);
    function prevhash() external view returns (bytes32);
    function startBlockTime() external view returns (uint64);
    function version() external view returns (uint256);

    // Percentage configurations
    function validatorMinimumPercentage() external view returns (uint256);
    function slashAmountPercentage() external view returns (uint256);
    function solutionFeePercentage() external view returns (uint256);
    function retractionFeePercentage() external view returns (uint256);
    function treasuryRewardPercentage() external view returns (uint256);
    function solutionModelFeePercentage() external view returns (uint256); // v5
    function taskOwnerRewardPercentage() external view returns (uint256);  // v3

    // Time configurations
    function minClaimSolutionTime() external view returns (uint256);
    function minRetractionWaitTime() external view returns (uint256);
    function minContestationVotePeriodTime() external view returns (uint256);
    function maxContestationValidatorStakeSince() external view returns (uint256);
    function exitValidatorMinUnlockTime() external view returns (uint256);
    function contestationVoteExtensionTime() external view returns (uint256); // v3

    // v2 additions
    function solutionsStakeAmount() external view returns (uint256);
    function lastContestationLossTime(address addr) external view returns (uint256);

    // v3 additions
    function totalHeld() external view returns (uint256);
    function solutionRateLimit() external view returns (uint256);
    function lastSolutionSubmission(address addr) external view returns (uint256);

    // v4 additions
    function veStaking() external view returns (address);
    function veRewards() external view returns (uint256);

    // v5 additions
    function voter() external view returns (address);

    // v6 additions
    function masterContesterRegistry() external view returns (address);
    function masterContesterVoteAdder() external view returns (uint32);

    // ============ Mappings ============

    function models(bytes32 model) external view returns (Model memory);
    function validators(address addr) external view returns (Validator memory);
    function pendingValidatorWithdrawRequestsCount(address addr) external view returns (uint256);
    function pendingValidatorWithdrawRequests(address addr, uint256 count)
        external view returns (PendingValidatorWithdrawRequest memory);
    function validatorWithdrawPendingAmount(address addr) external view returns (uint256);
    function tasks(bytes32 taskid) external view returns (Task memory);
    function commitments(bytes32 commitment) external view returns (uint256);
    function solutions(bytes32 taskid) external view returns (Solution memory);
    function contestations(bytes32 taskid) external view returns (Contestation memory);
    function contestationVoted(bytes32 taskid, address addr) external view returns (bool);
    function contestationVotedIndex(bytes32 taskid) external view returns (uint256);
    function contestationVoteYeas(bytes32 taskid, uint256 idx) external view returns (address);
    function contestationVoteNays(bytes32 taskid, uint256 idx) external view returns (address);
    function solutionsStake(bytes32 taskid) external view returns (uint256); // v2

    // v6 mappings
    function solutionModelFeePercentageOverride(bytes32 model) external view returns (uint256);
    function modelRequiresAllowList(bytes32 model_) external view returns (bool);
    function isSolverAllowed(bytes32 model_, address solver_) external view returns (bool);
    function addToModelAllowList(bytes32 model_, address[] calldata solvers_) external;
    function removeFromModelAllowList(bytes32 model_, address[] calldata solvers_) external;
    function setModelAllowListRequired(bytes32 model_, bool required_) external;


    // ============ Events ============

    event ModelRegistered(bytes32 indexed id);
    event ModelFeeChanged(bytes32 indexed id, uint256 fee);
    event ModelAddrChanged(bytes32 indexed id, address addr);

    event ValidatorDeposit(address indexed addr, address indexed validator, uint256 amount);
    event ValidatorWithdrawInitiated(
        address indexed addr,
        uint256 indexed count,
        uint256 unlockTime,
        uint256 amount
    );
    event ValidatorWithdrawCancelled(address indexed addr, uint256 indexed count);
    event ValidatorWithdraw(
        address indexed addr,
        address indexed to,
        uint256 indexed count,
        uint256 amount
    );

    event TaskSubmitted(
        bytes32 indexed id,
        bytes32 indexed model,
        uint256 fee,
        address indexed sender
    );
    event SignalCommitment(address indexed addr, bytes32 indexed commitment);
    event SolutionSubmitted(address indexed addr, bytes32 indexed task);
    event SolutionClaimed(address indexed addr, bytes32 indexed task);
    event ContestationSubmitted(address indexed addr, bytes32 indexed task);
    event ContestationVote(address indexed addr, bytes32 indexed task, bool yea);
    event ContestationVoteFinish(bytes32 indexed id, uint32 indexed start_idx, uint32 end_idx);

    event TreasuryTransferred(address indexed to);
    event PauserTransferred(address indexed to);
    event PausedChanged(bool indexed paused);
    event SolutionMineableRateChange(bytes32 indexed id, uint256 rate);
    event VersionChanged(uint256 version);
    event StartBlockTimeChanged(uint64 indexed startBlockTime); // v2

    // v6 events
    event MasterContesterRegistrySet(address indexed registry);
    event MasterContesterVoteAdderSet(uint32 adder);
    event RewardsPaid(
        bytes32 indexed model,
        bytes32 indexed task,
        address indexed validator,
        uint256 totalRewards,
        uint256 treasuryReward,
        uint256 taskOwnerReward,
        uint256 validatorReward
    );
    event FeesPaid(
        bytes32 indexed model,
        bytes32 indexed task,
        address indexed validator,
        uint256 modelFee,
        uint256 treasuryFee,
        uint256 remainingFee,
        uint256 validatorFee
    );
    event ContestationSuggested(address indexed addr, bytes32 indexed task);
    event ModelAllowListUpdated(bytes32 indexed model, address[] solvers, bool added);
    event ModelAllowListRequirementChanged(bytes32 indexed model, bool required);

    // ============ Admin Functions ============

    function initialize() external;
    function transferOwnership(address to_) external;
    function transferTreasury(address to_) external;
    function transferPauser(address to_) external;
    function setPaused(bool paused_) external;
    function setSolutionMineableRate(bytes32 model_, uint256 rate_) external;
    function setSolutionModelFeePercentage(uint256 solutionModelFeePercentage_) external;
    function setSolutionModelFeePercentageOverride(bytes32 model_, uint256 solutionModelFeePercentage_) external; // v6
    function setVersion(uint256 version_) external;
    function setStartBlockTime(uint64 startBlockTime_) external;
    function setVeStaking(address veStaking_) external;
    function setVoter(address voter_) external;
    function setMasterContesterRegistry(address registry_) external; // v6
    function setMasterContesterVoteAdder(uint32 amount_) external;   // v6

    // ============ Model Functions ============

    function setModelFee(bytes32 model_, uint256 fee_) external;
    function setModelAddr(bytes32 model_, address addr_) external;
    function registerModel(
        address addr_,
        uint256 fee_,
        bytes calldata template_
    ) external returns (bytes32);
    function registerModelWithAllowList(
        address addr_,
        uint256 fee_,
        bytes calldata template_,
        address[] calldata allowList_
    ) external returns (bytes32); // v6

    // ============ View/Pure Functions ============

    function getSlashAmount() external view returns (uint256);
    function getValidatorMinimum() external view returns (uint256);
    function generateIPFSCID(bytes calldata content_) external pure returns (bytes memory);
    function hashModel(Model memory o_, address sender_) external pure returns (bytes32);
    function hashTask(
        Task memory o_,
        address sender_,
        bytes32 prevhash_
    ) external pure returns (bytes32);
    function targetTs(uint256 t) external pure returns (uint256);
    function diffMul(uint256 t, uint256 ts) external pure returns (uint256);
    function reward(uint256 t, uint256 ts) external pure returns (uint256);
    function getPsuedoTotalSupply() external view returns (uint256);
    function getReward() external view returns (uint256);
    function generateCommitment(
        address sender_,
        bytes32 taskid_,
        bytes calldata cid_
    ) external pure returns (bytes32);
    function votingPeriodEnded(bytes32 taskid_) external view returns (bool);
    function validatorCanVote(address addr_, bytes32 taskid_) external view returns (uint256);

    // ============ Core Functions ============

    function withdrawAccruedFees() external;

    // Validator functions
    function validatorDeposit(address validator_, uint256 amount_) external;
    function initiateValidatorWithdraw(uint256 amount_) external returns (uint256);
    function cancelValidatorWithdraw(uint256 count_) external;
    function validatorWithdraw(uint256 count_, address to_) external;

    // Task functions
    function submitTask(
        uint8 version_,
        address owner_,
        bytes32 model_,
        uint256 fee_,
        bytes calldata input_
    ) external;
    function bulkSubmitTask(
        uint8 version_,
        address owner_,
        bytes32 model_,
        uint256 fee_,
        bytes calldata input_,
        uint256 n_
    ) external; // v3

    // Solution functions
    function signalCommitment(bytes32 commitment_) external;
    function submitSolution(bytes32 taskid_, bytes calldata cid_) external;
    function bulkSubmitSolution(
        bytes32[] calldata taskids_,
        bytes[] calldata cids_
    ) external; // v3
    function claimSolution(bytes32 taskid_) external;

    // Contestation functions
    function submitContestation(bytes32 taskid_) external;        // v6: only master contesters
    function suggestContestation(bytes32 taskid_) external;       // v6: new function
    function voteOnContestation(bytes32 taskid_, bool yea_) external;
    function contestationVoteFinish(bytes32 taskid_, uint32 amnt_) external;
}
