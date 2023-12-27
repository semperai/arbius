// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "../interfaces/IArbius.sol";

contract RetractTask {
    IArbius arbius;

    constructor(IArbius _arbius) {
        arbius = _arbius;
    }

    function retractTask(bytes32 _taskid) public {
        arbius.retractTask(_taskid);
    }
}
