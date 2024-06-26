// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BaseTest.sol";

import "contracts/V2_EngineV4.sol";
import "contracts/BaseTokenV1.sol";
import {getIPFSCIDMemory} from "contracts/libraries/IPFS.sol";

/**
 * @notice Steps to test EngineV4:
 * 1. Deploy local hardhat node with `npx hardhat node`
 * 2. Then, run hardhat setup on local node with `npx hardhat test test/enginev4.test.ts --network localhost`
 * 3. Run Foundry tests with `npm run forge-test`, or `npm run forge-test-v` for verbose output
 * 3.1 Alternatively, `forge test --fork-url http://localhost:8545 --fork-block-number 18 --mc EngineV4Test`
 */
contract EngineV4Test is BaseTest {
    bytes TESTCID = "0x1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8";
    bytes TESTBUF = "0x746573740a";

    // default test mnemonic used in hardhat tests
    string public constant mnemonic = "test test test test test test test test test test test junk";

    address deployer = vm.addr(vm.deriveKey(mnemonic, 0));
    address user1 = vm.addr(vm.deriveKey(mnemonic, 1));
    address user2 = vm.addr(vm.deriveKey(mnemonic, 2));
    address validator1 = vm.addr(vm.deriveKey(mnemonic, 3));
    address validator2 = vm.addr(vm.deriveKey(mnemonic, 4));
    address validator3 = vm.addr(vm.deriveKey(mnemonic, 5));
    address validator4 = vm.addr(vm.deriveKey(mnemonic, 6));
    address treasury = vm.addr(vm.deriveKey(mnemonic, 7));
    address model1 = vm.addr(vm.deriveKey(mnemonic, 8));
    address newowner = vm.addr(vm.deriveKey(mnemonic, 9));

    // contracts
    V2_EngineV4 public engine = V2_EngineV4(0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9);
    BaseTokenV1 public baseToken = BaseTokenV1(0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0);

    function setUp() public {
        // set up is done in hardhat test file: test/enginev4.test.ts

        // todo: implement this in hardhat
        // vm.warp((1704067200  / WEEK) * WEEK); // Thu Dec 28 2023 00:00:00 GMT+0000
    }

    // early txs need 0 model fees and 0 task fees so they can mine tokens
    // later tests will cover fees
    function deployBootstrapModel() public returns (bytes32 modelid) {
        address addr = user1;
        uint256 fee = 0;

        vm.prank(addr);
        modelid = engine.registerModel(addr, fee, TESTBUF);
    }

    function bootstrapTaskParams(bytes32 modelid, uint256 feeEth)
        public
        view
        returns (uint8 version, address owner, bytes32 model, uint256 fee, bytes memory input, bytes memory cid)
    {
        version = 0;
        owner = user1;
        model = modelid;
        fee = feeEth;
        input = TESTBUF; // normally this would be json but it doesnt matter for testing
        cid = getIPFSCIDMemory(TESTBUF);
    }

    function deployBootstrapValidator() public returns (address) {
        vm.prank(deployer);
        baseToken.bridgeMint(address(engine), 599990 ether);

        vm.prank(deployer);
        baseToken.transfer(validator1, 10 ether);

        vm.prank(validator1);
        engine.validatorDeposit(validator1, 10 ether);

        return validator1;
    }

    function deployBootstrapEngineSlashingNotReached() public {
        vm.prank(deployer);
        baseToken.bridgeMint(address(engine), 597000);
    }

    function deployBootstrapEngineSlashingReached() public {
        vm.prank(deployer);
        baseToken.bridgeMint(address(engine), 597000);
    }

    function deployBootstrapTask(bytes32 modelid, address submitter, uint256 feeEth) public returns (bytes32 taskid) {
        (uint8 version, address owner, bytes32 model, uint256 fee, bytes memory input, bytes memory cid) =
            bootstrapTaskParams(modelid, feeEth);

        Task memory t = Task(model, fee, owner, uint64(block.timestamp), version, cid);

        if (submitter == address(0)) {
            submitter = user1;
        }

        bytes32 prevhash = engine.prevhash();
        taskid = engine.hashTask(t, submitter, prevhash);

        vm.prank(submitter);
        engine.submitTask(version, owner, model, fee, input);
    }

    function testSetPaused() public {
        vm.prank(deployer);
        engine.setPaused(true);
    }

    function testSubmitUncontestedSolution() public {
        deployBootstrapValidator();

        bytes32 modelid = deployBootstrapModel();
        bytes32 taskid = deployBootstrapTask(modelid, user1, 0);

        bytes32 commitment = engine.generateCommitment(validator1, taskid, TESTCID);

        vm.prank(validator1);
        engine.signalCommitment(commitment);

        // skip 12s and 1 block
        skip(12);
        vm.roll(block.number + 1);

        (uint256 staked, uint256 since, address addr) = engine.validators(validator1);

        vm.prank(validator1);
        engine.submitSolution(taskid, TESTCID);
    }

    // todo: rewards over 7 years, ve APY, task submitting etc
}
