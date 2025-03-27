// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "./interfaces/IArbius.sol";
import "./SwapReceiver.sol";


struct Signature {
    address signer;
    bytes signature;
}

error InvalidValidator();
error InsufficientSignatures();
error SignersNotSorted();
error InvalidSignature();
error TimeNotPassed();

contract ArbiusRouterV1 is Ownable {
    IArbius public engine;
    IERC20 public arbius;
    IUniswapV2Router02 public router;
    SwapReceiver public receiver;

    mapping(address => bool) public validators;
    uint256 public minValidators;

    // taskid -> amount
    mapping(bytes32 => uint256) public incentives;

    event ValidatorSet(address indexed validator, bool status);
    event MinValidatorsSet(uint256 minValidators);
    event IncentiveAdded(bytes32 indexed taskid, uint256 amount);
    event IncentiveClaimed(bytes32 indexed taskid, address indexed recipient, uint256 amount);

    constructor(
        address engine_,
        address arbius_,
        address router_,
        address receiver_
    ) Ownable() {
        engine = IArbius(engine_);
        arbius = IERC20(arbius_);
        router = IUniswapV2Router02(router_);
        receiver = SwapReceiver(receiver_);

        arbius.approve(engine_, type(uint256).max);
        arbius.approve(router_, type(uint256).max);

        minValidators = 0;
    }

    /// @notice Allow any token to be approved for uniswap
    /// @param token_ Token address
    function uniswapApprove(address token_) external {
        IERC20 token = IERC20(token_);
        token.approve(address(router), type(uint256).max);
    }

    /// @notice Withdraw tokens from the contract
    /// @param token_ Token address
    function withdraw(address token_) external onlyOwner {
        IERC20 token = IERC20(token_);
        uint256 balance = token.balanceOf(address(this));
        token.transfer(owner(), balance);
    }

    /// @notice Withdraw eth from the contract
    function withdrawETH() external onlyOwner {
        msg.sender.call{value: address(this).balance}("");
    }

    /// @notice Sets validator status
    /// @param validator_ Address of validator
    /// @param status_ Status of validator (0 = inactive, 1 = active)
    function setValidator(address validator_, bool status_) external onlyOwner {
        validators[validator_] = status_;
        emit ValidatorSet(validator_, status_);
    }

    /// @notice Sets minimum number of validators required to claim incentive
    /// @param minValidators_ Minimum number of validators
    function setMinValidators(uint256 minValidators_) external onlyOwner {
        minValidators = minValidators_;
        emit MinValidatorsSet(minValidators_);
    }

    /// @notice Submit a task
    /// @param version_ Version of task
    /// @param owner_ Address of task owner
    /// @param model_ Model hash
    /// @param fee_ Fee for task
    /// @param input_ Input data for task
    /// @param gas_ Gas for task
    function submitTask(
        uint8 version_,
        address owner_,
        bytes32 model_,
        uint256 fee_,
        bytes calldata input_,
        uint256 incentive_,
        uint256 gas_
    ) external returns (bytes32) {
        arbius.transferFrom(msg.sender, address(this), fee_+incentive_);
        bytes memory enc = abi.encodeWithSignature(
            "submitTask(uint8,address,bytes32,uint256,bytes)",
            version_,
            owner_,
            model_,
            fee_,
            input_
        );
        
        (bool success, ) = address(engine).call{gas: gas_}(enc);
        if (!success) {
            revert("submitTask failed");
        }
        bytes32 taskid = engine.prevhash();

        if (incentive_ > 0) {
            incentives[taskid] += incentive_;
            emit IncentiveAdded(taskid, incentive_);
        }

        return taskid;
    }

    /// @notice Submit a task paid in another token
    /// @param version_ Version of task
    /// @param owner_ Address of task owner
    /// @param model_ Model hash
    /// @param fee_ Fee for task
    /// @param input_ Input data for task
    /// @param incentive_ Incentive for task
    /// @param token_ Token address
    /// @param gas_ Gas for task
    function submitTaskWithToken(
        uint8 version_,
        address owner_,
        bytes32 model_,
        uint256 fee_,
        bytes calldata input_,
        uint256 incentive_,
        address token_,
        uint256 amountInMax_,
        uint256 gas_
    ) public returns (bytes32) {
        IERC20 token = IERC20(token_);
        token.transferFrom(msg.sender, address(this), amountInMax_);

        address[] memory path = new address[](3);
        path[0] = token_;
        path[1] = router.WETH();
        path[2] = address(arbius);

        router.swapTokensForExactTokens(
            fee_+incentive_,
            amountInMax_,
            path,
            address(receiver),
            type(uint256).max
        );
        receiver.recover(address(arbius), arbius.balanceOf(address(receiver)));

        bytes memory enc = abi.encodeWithSignature(
            "submitTask(uint8,address,bytes32,uint256,bytes)",
            version_,
            owner_,
            model_,
            fee_,
            input_
        );
        
        (bool success, ) = address(engine).call{gas: gas_}(enc);
        if (!success) {
            revert("submitTask failed");
        }
        bytes32 taskid = engine.prevhash();

        if (incentive_ > 0) {
            incentives[taskid] += incentive_;
            emit IncentiveAdded(taskid, incentive_);
        }

        uint256 remaining = token.balanceOf(address(this));
        if (remaining > 0) {
            token.transfer(msg.sender, remaining);
        }

        return taskid;
    }

    /// @notice Submit a task paid in eth
    /// @param version_ Version of task
    /// @param owner_ Address of task owner
    /// @param model_ Model hash
    /// @param fee_ Fee for task
    /// @param input_ Input data for task
    /// @param incentive_ Incentive for task
    /// @param gas_ Gas for task
    function submitTaskWithETH(
        uint8 version_,
        address owner_,
        bytes32 model_,
        uint256 fee_,
        bytes calldata input_,
        uint256 incentive_,
        uint256 gas_
    ) payable public returns(bytes32) {
        address[] memory path = new address[](2);
        path[0] = router.WETH();
        path[1] = address(arbius);

        router.swapETHForExactTokens{value: msg.value}(
            fee_+incentive_,
            path,
            address(receiver),
            type(uint256).max
        );
        receiver.recover(address(arbius), arbius.balanceOf(address(receiver)));

        bytes memory enc = abi.encodeWithSignature(
            "submitTask(uint8,address,bytes32,uint256,bytes)",
            version_,
            owner_,
            model_,
            fee_,
            input_
        );
        
        (bool success, ) = address(engine).call{gas: gas_}(enc);
        if (!success) {
            revert("submitTask failed");
        }
        bytes32 taskid = engine.prevhash();

        if (incentive_ > 0) {
            incentives[taskid] += incentive_;
            emit IncentiveAdded(taskid, incentive_);
        }

        uint256 remaining = address(this).balance;
        if (remaining > 0) {
            msg.sender.call{value: address(this).balance}("");
        }

        return taskid;
    }

    /// @notice Add incentive to a task
    /// @dev Normally use submitTask or submitTaskWithToken to add incentive
    /// @dev This is for adding additional incentive
    /// @param taskid_ Task ID
    /// @param amount_ Amount of incentive
    function addIncentive(bytes32 taskid_, uint256 amount_) external {
        arbius.transferFrom(msg.sender, address(this), amount_);
        incentives[taskid_] += amount_;
        emit IncentiveAdded(taskid_, amount_);
    }

    /// @notice Validate signatures
    /// @param hash_ Hash of the CID
    /// @param sigs_ Signatures
    function validateSignatures(bytes32 hash_, Signature[] calldata sigs_) public view {
        if (sigs_.length < minValidators) {
            revert InsufficientSignatures();
        }

        address last = address(0); // Ensure signers are sorted (to ensure they are unique)
        for (uint256 i = 0; i < sigs_.length; ++i) {
            address signer = sigs_[i].signer;

            if (last >= signer) {
                revert SignersNotSorted();
            }

            if (! validators[signer]) {
                revert InvalidValidator();
            }

            if (ECDSA.recover(hash_, sigs_[i].signature) != signer) {
                revert InvalidSignature();
            }

            last = signer;
        }
    }

    /// @notice Claim incentive for a task
    /// @dev signers must be sorted and derived from the hash of the CID
    /// @param taskid_ Task ID
    /// @param sigs_ Signatures
    function claimIncentive(bytes32 taskid_, Signature[] calldata sigs_) external {
        // only allow miner to claim unless some time has passed

        (/*bool success*/, bytes memory result) = address(engine).call(abi.encodeWithSignature("solutions(bytes32)", taskid_));
        (address validator, uint64 blocktime, /*bool claimed*/, bytes memory cid) = abi.decode(result, (address, uint64, bool, bytes));

        if (msg.sender != validator) {
            if (blocktime + 1 minutes < block.timestamp) {
                revert TimeNotPassed();
            }
        }

        validateSignatures(keccak256(cid), sigs_);

        arbius.transfer(msg.sender, incentives[taskid_]);

        emit IncentiveClaimed(taskid_, msg.sender, incentives[taskid_]);
        delete incentives[taskid_];
    }

    /// @notice Emergency claim incentive for a task
    /// @param taskid_ Task ID
    function emergencyClaimIncentive(bytes32 taskid_) external onlyOwner {
        arbius.transfer(msg.sender, incentives[taskid_]);
        emit IncentiveClaimed(taskid_, msg.sender, incentives[taskid_]);
        delete incentives[taskid_];
    }

    /// @notice Fallback function to receive eth
    receive() external payable {}
}
