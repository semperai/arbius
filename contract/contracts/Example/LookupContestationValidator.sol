// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "../interfaces/IArbius.sol";

contract LookupContestationValidator {
    IArbius arbius;

    constructor(IArbius _arbius) {
        arbius = _arbius;
    }

    function lookupContestationValidator(
        bytes32 taskid
    ) public view returns (address) {
        IArbius.Contestation memory t = arbius.contestations(taskid);
        return t.validator;
    }
}
