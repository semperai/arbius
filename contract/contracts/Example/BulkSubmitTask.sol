// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BulkSubmitTask {
    address public engine;
    IERC20 public token;

    constructor(address engine_, address token_) {
        engine = engine_;
        token = IERC20(token_);
        token.approve(engine, type(uint256).max);
    }

    function submitTaskBulk(
        uint8 version_,
        address owner_,
        bytes32 model_,
        uint256 fee_,
        bytes calldata input_,
        uint256 count_,
        uint256 gas_
    ) public {
        bytes memory enc = abi.encodeWithSignature(
            "submitTask(uint8,address,bytes32,uint256,bytes)",
            version_,
            owner_,
            model_,
            fee_,
            input_
        );

        for (uint256 i = 0; i < count_; i++) {
            address(engine).call{gas: gas_}(enc);
        }
    }

    function submitTaskBulkWithFee(
        uint8 version_,
        address owner_,
        bytes32 model_,
        uint256 fee_,
        bytes calldata input_,
        uint256 count_,
        uint256 gas_,
        uint256 feeAmount_
    ) public {
        token.transferFrom(msg.sender, address(this), feeAmount_);

        bytes memory enc = abi.encodeWithSignature(
            "submitTask(uint8,address,bytes32,uint256,bytes)",
            version_,
            owner_,
            model_,
            fee_,
            input_
        );
        for (uint256 i = 0; i < count_; i++) {
            address(engine).call{gas: gas_}(enc);
        }
    }
}
