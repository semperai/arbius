// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "../interfaces/IArbius.sol";

contract SubmitContestation {
    IArbius arbius;

    constructor(IArbius _arbius) {
        arbius = _arbius;
    }

    function submitContestation(bytes32 _taskid) public {
        arbius.submitContestation(_taskid);
    }
}
