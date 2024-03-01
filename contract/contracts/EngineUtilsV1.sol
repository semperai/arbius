// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IArbius.sol";

contract EngineUtilsV1 {
    IArbius public engine;

    constructor(address engine_) {
        engine = IArbius(engine_);
    }

    function bulkClaim(bytes32[] calldata taskids_) external {
        for (uint256 i = 0; i < taskids_.length; i++) {
            (bool success, bytes memory data) = address(engine).call{
                gas: 300000
            }(abi.encodeWithSignature("claimSolution(bytes32)", taskids_[i]));
        }
    }

    function staked(address addr_) external view returns (uint256) {
        return engine.validators(addr_).staked;
    }

    function since(address addr_) external view returns (uint256) {
        return engine.validators(addr_).since;
    }
}
