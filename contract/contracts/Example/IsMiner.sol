// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./../interfaces/IArbius.sol";

contract IsMiner {
    IArbius public engine;

    constructor(address engine_) {
        engine = IArbius(engine_);
    }

    function isMiner(address addr_) external view returns (uint256) {
        uint256 staked = engine.validators(addr_).staked;
        uint256 validatorMinimum = engine.getValidatorMinimum();
        return staked >= validatorMinimum ? 1 : 0;
    }
}
