// SPDX-License-Identifier: MIT
pragma solidity >=0.8.13;

import "./IBaseToken.sol";

interface IArbius {
    struct Model {
        uint256 fee;
        address addr;
        uint256 rate;
        bytes cid;
    }

    struct Validator {
        uint256 staked; // tokens staked
        address addr; // TODO is this needed?
    }

    struct PendingValidatorWithdrawRequest {
        uint256 unlockTime;
        uint256 amount;
    }

    struct Task {
        bytes32 model; // model hash
        uint256 fee; // fee offered for completion on top of model base fee
        address owner; // who is allowed to retract
        uint64 blocktime;
        uint8 version; // task version
        bytes cid; // ipfs cid
    }

    struct Solution {
        address validator;
        uint64 blocktime;
        bool claimed;
        bytes cid; // ipfs cid
    }

    struct Contestation {
        address validator;
        uint64 blocktime;
        uint32 finish_start_index; // used for finish claiming of rewards
    }

    function baseToken() external view returns (IBaseToken);

    function treasury() external view returns (address);

    function accruedFees() external view returns (uint256);

    function prevhash() external view returns (bytes32);

    function startBlockTime() external view returns (uint64);

    function version() external view returns (uint256);

    function validatorMinimumPercentage() external view returns (uint256);

    function slashAmountPercentage() external view returns (uint256);

    function solutionFeePercentage() external view returns (uint256);

    function retractionFeePercentage() external view returns (uint256);

    function treasuryRewardPercentage() external view returns (uint256);

    function minClaimSolutionTime() external view returns (uint256);

    function minRetractionWaitTime() external view returns (uint256);

    function minContestationVotePeriodTime() external view returns (uint256);

    function exitValidatorMinUnlockTime() external view returns (uint256);

    function models(bytes32 model) external view returns (Model memory);

    function validators(address addr) external view returns (Validator memory);

    function pendingValidatorWithdrawRequestsCount(
        address addr
    ) external view returns (uint256);

    function pendingValidatorWithdrawRequests(
        address addr,
        uint256 count
    ) external view returns (PendingValidatorWithdrawRequest memory);

    function validatorWithdrawPendingAmount(
        address addr
    ) external view returns (uint256);

    function tasks(bytes32 taskid) external view returns (Task memory);

    function commitments(bytes32 commitment) external view returns (uint64);

    function solutions(bytes32 taskid) external view returns (Solution memory);

    function contestations(
        bytes32 taskid
    ) external view returns (Contestation memory);

    function contestationVoted(
        bytes32 taskid,
        address addr
    ) external returns (bool);

    function contestationVotedIndex(bytes32 taskid) external returns (uint256);

    function contestationVoteYeas(
        bytes32 taskid,
        uint256 idx
    ) external returns (address);

    function contestationVoteNays(
        bytes32 taskid,
        uint256 idx
    ) external returns (address);

    event ModelRegistered(bytes32 indexed id);

    event ValidatorDeposit(
        address indexed addr,
        address indexed validator,
        uint256 amount
    );
    event ValidatorWithdrawInitiated(
        address indexed addr,
        uint256 indexed count,
        uint256 unlockTime,
        uint256 amount
    );
    event ValidatorWithdrawCancelled(
        address indexed addr,
        uint256 indexed count
    );
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
    event TaskRetracted(bytes32 indexed id);
    event SignalCommitment(address indexed addr, bytes32 indexed commitment);
    event SolutionSubmitted(address indexed addr, bytes32 indexed task);
    event SolutionClaimed(address indexed addr, bytes32 indexed task);
    event ContestationSubmitted(address indexed addr, bytes32 indexed task);
    event ContestationVote(
        address indexed addr,
        bytes32 indexed task,
        bool yea
    );
    event ContestationVoteFinish(
        bytes32 indexed id,
        uint32 indexed start_idx,
        uint32 end_idx
    );

    event SignalSupport(
        address indexed addr,
        bytes32 indexed model,
        bool supported
    );

    event TreasuryTransferred(address indexed to);
    event SolutionMineableRateChange(bytes32 indexed id, uint256 rate);
    event ValidatorMinimumPercentageChanged(uint256 indexed amount);
    event SlashAmountPercentageChanged(uint256 indexed amount);
    event SolutionFeePercentageChanged(uint256 indexed amount);
    event RetractionFeePercentageChanged(uint256 indexed amount);
    event TreasuryRewardPercentageChanged(uint256 indexed amount);
    event MinClaimSolutionTimeChanged(uint256 indexed amount);
    event MinRetractionWaitTimeChanged(uint256 indexed amount);
    event MinContestationVotePeriodTimeChanged(uint256 indexed amount);
    event ExitValidatorMinUnlockTimeChanged(uint256 indexed amount);

    function transferOwnership(address to_) external;

    function transferTreasury(address to_) external;

    function setSolutionMineableStatus(bytes32 model_, uint256 rate_) external;

    function setVersion(uint256 version_) external;

    function setValidatorMinimumPercentage(uint256 amount_) external;

    function setSlashAmountPercentage(uint256 amount_) external;

    function setSolutionFeePercentage(uint256 amount_) external;

    function setRetractionFeePercentage(uint256 amount_) external;

    function setTreasuryRewardPercentage(uint256 amount_) external;

    function setMinClaimSolutionTime(uint256 amount_) external;

    function setMinRetractionWaitTime(uint256 amount_) external;

    function setMinContestationVotePeriodTime(uint256 amount_) external;

    function getSlashAmount() external view returns (uint256);

    function getValidatorMinimum() external view returns (uint256);

    function generateIPFSCID(
        bytes calldata content_
    ) external pure returns (bytes memory);

    function hashModel(
        Model memory o_,
        address sender_
    ) external pure returns (bytes32);

    function hashTask(
        Task memory o_,
        address sender_,
        bytes32 prevhash_
    ) external pure returns (bytes32);

    function targetTs(uint256 t) external pure returns (uint256);

    function diffMul(uint256 t, uint256 ts) external pure returns (uint256);

    function reward(uint256 t, uint256 ts) external pure returns (uint256);

    function getReward() external view returns (uint256);

    function generateCommitment(
        address sender_,
        bytes32 taskid_,
        bytes calldata cid_
    ) external pure returns (bytes32);

    function withdrawAccruedFees() external;

    function registerModel(
        address addr_,
        uint256 fee_,
        bytes calldata template_
    ) external returns (bytes32);

    function validatorDeposit(address validator_, uint256 amount_) external;

    function initiateValidatorWithdraw(
        uint256 amount_
    ) external returns (uint256);

    function cancelValidatorWithdraw(uint256 count_) external;

    function validatorWithdraw(uint256 count_, address to_) external;

    function submitTask(
        uint8 version_,
        address owner_,
        bytes32 model_,
        uint256 fee_,
        bytes calldata input_
    ) external returns (bytes32);

    function retractTask(bytes32 taskid_) external;

    function signalCommitment(bytes32 commitment_) external;

    function signalSupport(bytes32 model_, bool support_) external;

    function submitSolution(bytes32 taskid_, bytes calldata cid_) external;

    function claimSolution(bytes32 taskid_) external;

    function submitContestation(bytes32 taskid_) external;

    function voteOnContestation(bytes32 taskid_, bool yea_) external;

    function contestationVoteFinish(bytes32 taskid_, uint32 amnt_) external;
}
