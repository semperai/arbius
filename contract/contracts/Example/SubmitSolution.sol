// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "../interfaces/IArbius.sol";

contract SubmitSolution {
    IArbius arbius;

    constructor(IArbius _arbius) {
        arbius = _arbius;
    }

    function signalCommitment(bytes32 _commitment) public {
        arbius.signalCommitment(_commitment);
    }

    function submitSolution(bytes32 _taskid, bytes memory _cid) public {
        arbius.submitSolution(_taskid, _cid);
    }
}
