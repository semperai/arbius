// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IArbius.sol";

contract BulkSubmitter {
    IArbius arbius;
    IERC20 arbiusToken;
    bytes32 model;
    bytes input;
    bytes cid;
    bytes solutionCid;

    event TaskSubmitted(bytes32 taskid);

    constructor(
        IArbius _arbius,
        IERC20 _arbiusToken,
        bytes32 _model,
        bytes memory _input,
        bytes memory _solutionCid
    ) {
        arbius = _arbius;
        arbiusToken = _arbiusToken;
        model = _model;
        input = _input;
        solutionCid = _solutionCid;

        arbiusToken.approve(address(arbius), type(uint256).max);
    }

    function deposit(uint256 amount) public {
        arbius.validatorDeposit(address(this), amount);
    }

    function bulkTask() public {
        for (uint256 i = 0; i < 10; i++) {
            bytes32 taskid = arbius.submitTask(
                0x0,
                address(this),
                model,
                0.1e18,
                input
            );
            bytes32 commitment = arbius.generateCommitment(
                address(this),
                taskid,
                solutionCid
            );
            arbius.signalCommitment(commitment);

            emit TaskSubmitted(taskid);
        }
    }

    function bulkSolution(bytes32[10] memory taskids) public {
        for (uint256 i = 0; i < 10; i++) {
            arbius.submitSolution(taskids[i], solutionCid);
        }
    }
}
