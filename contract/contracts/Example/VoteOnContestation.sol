// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "../interfaces/IArbius.sol";

contract VoteOnContestation {
    IArbius arbius;

    constructor(IArbius _arbius) {
        arbius = _arbius;
    }

    function voteOnContestation(bytes32 _taskid, bool _agree) public {
        arbius.voteOnContestation(_taskid, _agree);
    }
}
