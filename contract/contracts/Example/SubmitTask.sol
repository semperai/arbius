// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IArbius.sol";

contract SubmitTask {
    IArbius arbius;
    IERC20 arbiusToken;
    bytes32 model;
    bytes input;

    constructor(
        IArbius _arbius,
        IERC20 _arbiusToken,
        bytes32 _model,
        bytes memory _input
    ) {
        arbius = _arbius;
        arbiusToken = _arbiusToken;
        model = _model;
        input = _input;
    }

    function submitTask() public {
        arbiusToken.approve(address(arbius), type(uint256).max);
        bytes32 taskid = arbius.submitTask(
            0x0,
            address(this),
            model,
            0.1e18,
            input
        );
    }
}
