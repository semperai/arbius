// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "../interfaces/IArbius.sol";

contract LookupSolutionCID {
    IArbius arbius;

    constructor(IArbius _arbius) {
        arbius = _arbius;
    }

    function lookupSolutionCID(
        bytes32 taskid
    ) public view returns (bytes memory) {
        IArbius.Solution memory t = arbius.solutions(taskid);
        return t.cid;
    }
}
