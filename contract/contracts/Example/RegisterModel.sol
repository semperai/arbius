// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "../interfaces/IArbius.sol";

contract RegisterModel {
    IArbius arbius;

    constructor(IArbius _arbius) {
        arbius = _arbius;
    }

    function registerModel(bytes memory _template) public {
        bytes32 modelid = arbius.registerModel(
            address(this),
            0.1e18,
            _template
        );
    }
}
