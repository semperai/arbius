// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BulkClaimSolution {
    address public engine;

    constructor(address engine_) {
        engine = engine_;
    }

    function claimSolutionBulk(
        bytes32[] calldata taskids_,
        uint256 gas_
    ) public {
        for (uint256 i = 0; i < taskids_.length; i++) {
            bytes memory enc = abi.encodeWithSignature(
                "claimSolution(bytes32)",
                taskids_[i]
            );
            address(engine).call{gas: gas_}(enc);
        }
    }
}
