// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "../interfaces/IArbius.sol";

contract LookupTaskCID {
    IArbius arbius;

    constructor(IArbius _arbius) {
        arbius = _arbius;
    }

    function lookupTaskCID(bytes32 taskid) public view returns (bytes memory) {
        IArbius.Task memory t = arbius.tasks(taskid);
        return t.cid;
    }
}
