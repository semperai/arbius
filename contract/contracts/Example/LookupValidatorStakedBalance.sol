// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "../interfaces/IArbius.sol";

contract LookupValidatorStakedBalance {
    IArbius arbius;

    constructor(IArbius _arbius) {
        arbius = _arbius;
    }

    function lookupLookupValidatorStakedBalance(
        address _validator
    ) public view returns (uint256) {
        IArbius.Validator memory v = arbius.validators(_validator);
        return v.staked;
    }
}
