// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "../interfaces/IArbius.sol";

contract FinishContestationVote {
    IArbius arbius;

    constructor(IArbius _arbius) {
        arbius = _arbius;
    }

    function finishVote(bytes32 _taskid, uint32 _iterations) public {
        arbius.contestationVoteFinish(_taskid, _iterations);
    }
}
