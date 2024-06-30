// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console2.sol";

import "contracts/BaseTokenV1.sol";
import "contracts/V2_EngineV4.sol";
import {getIPFSCIDMemory} from "contracts/libraries/IPFS.sol";

import "contracts/VotingEscrow.sol";
import "contracts/VeNFTRender.sol";
import "contracts/VeStaking.sol";

import "contracts/GovernorV1.sol";
import "contracts/TimelockV1.sol";

/**
 * @notice Steps to test EngineV4:
 * 1. Deploy local hardhat node with `npx hardhat node`
 * 2. Then, run hardhat setup on local node with `npx hardhat test test/enginev4.test.ts --network localhost`
 * 3. Run Foundry tests with `npm run forge-test`, or `npm run forge-test-v` for verbose output
 * 3.1 Alternatively, `forge test --fork-url http://localhost:8545 --fork-block-number 18 --mc GovernanceTest`
 */

contract GovernanceTest is Test {
    VotingEscrow public votingEscrow;
    VeStaking public veStaking;
    VeNFTRender public veNFTRender;

    GovernorV1 public governor;
    TimelockV1 public timelock;

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
    address modelOwner = vm.addr(vm.deriveKey(mnemonic, 8));
    address newowner = vm.addr(vm.deriveKey(mnemonic, 9));

    // contracts
    V2_EngineV4 public engine = V2_EngineV4(0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9);
    BaseTokenV1 public baseToken = BaseTokenV1(0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0);

    function setUp() public {
        // initial set up is done in hardhat test file: test/enginev4.test.ts

        /* ve specific setup */
        veNFTRender = new VeNFTRender();
        votingEscrow = new VotingEscrow(address(baseToken), address(veNFTRender), address(0));
        veStaking = new VeStaking(address(baseToken), address(votingEscrow));

        // set veStaking in escrow
        votingEscrow.setVeStaking(address(veStaking));

        /* v4 specific setup */
        vm.prank(deployer);
        engine.setVeStaking(address(veStaking));

        /* gov setup */
        vm.startPrank(deployer);

        address[] memory proposers = new address[](2);
        proposers[0] = deployer;
        proposers[1] = user1;

        address[] memory executors = new address[](2);
        executors[0] = deployer;
        executors[1] = user1;

        timelock = new TimelockV1(0, proposers, executors, deployer);
        governor = new GovernorV1(IVotes(address(baseToken)), TimelockController(payable(address(timelock))));

        // transfer ownership to timelock
        engine.transferOwnership(address(timelock));

        // normally we'd do this, but we want ability to mint whenever easily for testing
        // baseToken.transferOwnership(adress(engine));
        
        bytes32 TIMELOCK_ADMIN_ROLE = keccak256("TIMELOCK_ADMIN_ROLE");
        bytes32 PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
        bytes32 EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
        
        // grant roles
        timelock.grantRole(PROPOSER_ROLE, address(governor));
        timelock.grantRole(EXECUTOR_ROLE, address(governor));

        uint256 timelockMinDelay = 60*60*24*3;
        
        timelock.schedule(
            address(timelock),
            0, // value
            abi.encodeWithSignature("updateDelay(uint256)", timelockMinDelay),
            bytes32(0), // predecessor
            bytes32(0), // salt
            0 // delay
        );  

        // execute the proposal
        timelock.execute(
            address(timelock),
            0, // value
            abi.encodeWithSignature("updateDelay(uint256)", timelockMinDelay),
            bytes32(0), // predecessor
            bytes32(0) // salt
        );
        //console2.log('Timelock: Minimum delay updated');

        // renounce roles
        
        timelock.renounceRole(PROPOSER_ROLE, deployer);
        timelock.renounceRole(TIMELOCK_ADMIN_ROLE, deployer);

        vm.stopPrank();
    }

    function testEngineOwner() public {
        assertEq(engine.owner(), address(timelock));
    }

    function testMinDelay() public {
        uint256 timelockMinDelay = 60*60*24*3;
        assertEq(timelock.getMinDelay(), timelockMinDelay);
    }
}