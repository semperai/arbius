// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "../interfaces/IArbius.sol";

contract LookupModelAddress {
    IArbius arbius;

    constructor(IArbius _arbius) {
        arbius = _arbius;
    }

    function lookupModelAddress(bytes32 modelid) public view returns (address) {
        IArbius.Model memory m = arbius.models(modelid);
        return m.addr;
    }
}
