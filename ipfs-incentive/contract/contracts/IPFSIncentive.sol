// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./IArbius.sol";

uint256 constant ARBITRUM_NOVA_CHAINID = 0xa4ba;
uint256 constant ARBITRUM_GOERLI_CHAINID = 0x66eed;
uint256 constant ARBITRUM_SEPOLIA_CHAINID = 0x66eee;

struct Signature {
    address signer;
    bytes signature;
}

error InvalidValidator();
error InsufficientSignatures();
error SignersNotSorted();
error InvalidSignature();


contract IPFSIncentive is OwnableUpgradeable {
    IArbius public engine;
    IERC20 public arbius;

    uint256 public feePercentage;
    mapping(address => uint256) public accruedFees;

    mapping(address => bool) public validators;

    uint256 public minValidators;

    // taskid -> amount
    mapping(bytes32 => uint256) public immediateArbiusIncentives;

    // taskid -> timestamp -> amount
    mapping(bytes32 => mapping(uint256 => uint256)) public delayedArbiusIncentives;

    // taskid -> token -> amount
    mapping(bytes32 => mapping(IERC20 => uint256)) public immediateTokenIncentives;

    // taskid -> token -> timestamp -> amount
    mapping(bytes32 => mapping(IERC20 => mapping(uint256 => uint256))) public delayedTokenIncentives;

    uint256[50] private __gap;

    event ValidatorSet(address indexed validator, bool status);
    event ImmediateIncentiveAdded(bytes32 indexed taskid, address indexed token, uint256 amount);
    event DelayedIncentiveAdded(bytes32 indexed taskid, address indexed token, uint256 indexed timestamp, uint256 amount);
    event ImmediateIncentiveClaimed(bytes32 indexed taskid, address indexed token, address recipient);
    event DelayedIncentiveClaimed(bytes32 indexed taskid, address indexed token, uint256 indexed timestamp, address recipient);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address engine_, address arbius_) public initializer {
        __Ownable_init(msg.sender);
        engine = IArbius(engine_);
        arbius = IERC20(arbius_);

        minValidators = 0;
    }

    /// @notice Transfer ownership
    /// @param to_ Address to transfer ownership to
    function transferOwnership(
        address to_
    ) public override(OwnableUpgradeable) onlyOwner {
        super.transferOwnership(to_);
    }

    function setValidator(address validator_, bool status_) external onlyOwner {
        validators[validator_] = status_;
        emit ValidatorSet(validator_, status_);
    }

    function setMinValidators(uint256 minValidators_) external onlyOwner {
        minValidators = minValidators_;
    }

    function addImmediateArbiusIncentive(bytes32 taskid_, uint256 amount_) external {
        arbius.transferFrom(msg.sender, address(this), amount_);
        immediateArbiusIncentives[taskid_] += amount_;
        emit ImmediateIncentiveAdded(taskid_, address(arbius), amount_);
    }

    function addDelayedArbiusIncentive(bytes32 taskid_, uint256 timestamp_, uint256 amount_) external {
        arbius.transferFrom(msg.sender, address(this), amount_);
        delayedArbiusIncentives[taskid_][timestamp_] += amount_;
        emit DelayedIncentiveAdded(taskid_, address(arbius), timestamp_, amount_);
    }

    function addImmediateTokenIncentive(bytes32 taskid_, IERC20 token_, uint256 amount_) external {
        token_.transferFrom(msg.sender, address(this), amount_);
        immediateTokenIncentives[taskid_][token_] += amount_;
        emit ImmediateIncentiveAdded(taskid_, address(token_), amount_);
    }

    function addDelayedTokenIncentive(bytes32 taskid_, IERC20 token_, uint256 timestamp_, uint256 amount_) external {
        token_.transferFrom(msg.sender, address(this), amount_);
        delayedTokenIncentives[taskid_][token_][timestamp_] += amount_;
        emit DelayedIncentiveAdded(taskid_, address(token_), timestamp_, amount_);
    }

    /// @dev Users hit validator /oracle/:taskid/:timestamp
    /// Validators check if they can download the solution cid from IPFS
    /// For immediate mode, timestamp is 0, and so any time in future will work
    /// For delayed mode, timestamp is some future timestamp, and validators must provide a signature after that time
    function _checkSigsForTask(bytes32 taskid_, uint256 timestamp_, Signature[] calldata sigs_) internal view {
        if (sigs_.length < minValidators) {
            revert InsufficientSignatures();
        }

        bytes32 hash = keccak256(abi.encodePacked(timestamp_, engine.solutions(taskid_).cid));

        address last = address(0); // Ensure signers are sorted (to ensure they are unique)
        for (uint256 i = 0; i < sigs_.length; ++i) {
            address signer = sigs_[i].signer;

            if (last >= signer) {
                revert SignersNotSorted();
            }

            if (! validators[signer]) {
                revert InvalidValidator();
            }

            if (ECDSA.recover(hash, sigs_[i].signature) != signer) {
                revert InvalidSignature();
            }

            last = signer;
        }
    }

    function getTreasuryFee(uint256 amount_) internal view returns (uint256) {
        return amount_ - ((amount_ * (1e18 - feePercentage)) / 1e18);
    }

    /// @dev Request with timestamp 0 from validators for immediate incentives
    function claimImmediateArbiusIncentive(bytes32 taskid_, Signature[] calldata sigs_) external {
        _checkSigsForTask(taskid_, 0, sigs_);

        uint256 incentive = immediateArbiusIncentives[taskid_];
        uint256 treasuryFee = getTreasuryFee(incentive);

        accruedFees[address(arbius)] += treasuryFee;
        arbius.transfer(msg.sender, incentive - treasuryFee);
        delete immediateArbiusIncentives[taskid_];

        emit ImmediateIncentiveClaimed(taskid_, address(arbius), msg.sender);
    }

    function claimDelayedArbiusIncentive(bytes32 taskid_, uint256 timestamp_, Signature[] calldata sigs_) external {
        _checkSigsForTask(taskid_, timestamp_, sigs_);

        uint256 incentive = delayedArbiusIncentives[taskid_][timestamp_];
        uint256 treasuryFee = getTreasuryFee(incentive);

        accruedFees[address(arbius)] += treasuryFee;
        arbius.transfer(msg.sender, incentive - treasuryFee);
        delete delayedArbiusIncentives[taskid_][timestamp_];

        emit DelayedIncentiveClaimed(taskid_, address(arbius), timestamp_, msg.sender);
    }

    function claimImmediateTokenIncentive(bytes32 taskid_, IERC20 token_, Signature[] calldata sigs_) external {
        _checkSigsForTask(taskid_, 0, sigs_);

        uint256 incentive = immediateTokenIncentives[taskid_][token_];
        uint256 treasuryFee = getTreasuryFee(incentive);

        accruedFees[address(token_)] += treasuryFee;
        token_.transfer(msg.sender, incentive - treasuryFee);
        delete immediateTokenIncentives[taskid_][token_];

        emit ImmediateIncentiveClaimed(taskid_, address(token_), msg.sender);
    }

    function claimDelayedTokenIncentive(bytes32 taskid_, IERC20 token_, uint256 timestamp_, Signature[] calldata sigs_) external {
        _checkSigsForTask(taskid_, timestamp_, sigs_);

        uint256 incentive = delayedTokenIncentives[taskid_][token_][timestamp_];
        uint256 treasuryFee = getTreasuryFee(incentive);

        accruedFees[address(token_)] += treasuryFee;
        token_.transfer(msg.sender, incentive - treasuryFee);
        delete delayedTokenIncentives[taskid_][token_][timestamp_];

        emit DelayedIncentiveClaimed(taskid_, address(token_), timestamp_, msg.sender);
    }
}
