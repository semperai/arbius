// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console2.sol";

import "contracts/BaseTokenV1.sol";
import "contracts/V2_EngineV4.sol";
import {getIPFSCIDMemory} from "contracts/libraries/IPFS.sol";

import "contracts/ve/VotingEscrow.sol";
import "contracts/ve/VeNFTRender.sol";
import "contracts/ve/VeStaking.sol";

import "contracts/GovernorV1.sol";
import "contracts/TimelockV1.sol";

/**
 * @notice Tests for onchain governance
 * @dev Steps to run this test contract:
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

    bytes TESTBUF = "0x746573740a";

    // default test mnemonic used in hardhat tests
    string public constant mnemonic =
        "test test test test test test test test test test test junk";

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
    V2_EngineV4 public engine =
        V2_EngineV4(0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9);
    BaseTokenV1 public baseToken =
        BaseTokenV1(0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0);

    function setUp() public {
        // initial set up is done in hardhat test file: test/enginev4.test.ts

        /* ve specific setup */
        veNFTRender = new VeNFTRender();
        votingEscrow = new VotingEscrow(
            address(baseToken),
            address(veNFTRender),
            address(0)
        );
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
        governor = new GovernorV1(
            IVotes(address(votingEscrow)),
            TimelockController(payable(address(timelock)))
        );

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

        uint256 timelockMinDelay = 60 * 60 * 24 * 3;

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

        /* mint aius, stake to receive veAIUS */

        // mint AIUS
        vm.startPrank(deployer);
        baseToken.bridgeMint(user1, 2e18);
        baseToken.bridgeMint(user2, 2e18);
        baseToken.bridgeMint(validator1, 3e18);
        baseToken.bridgeMint(address(timelock), 1e18);
        vm.stopPrank();

        // approve AIUS to votingEscrow
        vm.prank(user1);
        baseToken.approve(address(votingEscrow), 2e18);
        vm.prank(user2);
        baseToken.approve(address(votingEscrow), 2e18);
        vm.prank(validator1);
        baseToken.approve(address(votingEscrow), 3e18);

        // user stakes their AIUS, receives veAIUS
        vm.prank(user1);
        votingEscrow.create_lock(2e18, 104 weeks);
        vm.prank(user2);
        votingEscrow.create_lock(2e18, 104 weeks);
        vm.prank(validator1);
        votingEscrow.create_lock(3e18, 104 weeks);

        // no self-delegation needed
    }

    function testEngineOwner() public {
        assertEq(engine.owner(), address(timelock));
    }

    function testMinDelay() public {
        uint256 timelockMinDelay = 60 * 60 * 24 * 3;
        assertEq(timelock.getMinDelay(), timelockMinDelay);
    }

    function testGovSettings() public {
        assertEq(governor.votingDelay(), 86400);
        assertEq(governor.votingPeriod(), 86400 * 3);
        assertEq(governor.proposalThreshold(), 1e18);
    }

    function testFailProposalHasQuorum() public {
        // deployer stakes 93 AIUS for max lock time, veAIUS total supply is ~100 veAIUS
        // quorum is 4% of total supply, so 4 veAIUS needed for successful proposal
        vm.startPrank(deployer);
        baseToken.approve(address(votingEscrow), 93e18);
        votingEscrow.create_lock(93e18, 104 weeks);
        vm.stopPrank();

        // proposal
        address[] memory targets = new address[](1);
        targets[0] = address(baseToken);

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        // calldata to transfer 1 AIUS to user1
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature(
            "transfer(address,uint256)",
            user1,
            1e18
        );

        string memory description = "Proposal #1: Give grant to team";
        bytes32 descriptionHash = keccak256(bytes(description));

        // propose
        vm.startPrank(user1);
        governor.propose(targets, values, calldatas, description);

        uint256 proposalId = governor.hashProposal(
            targets,
            values,
            calldatas,
            descriptionHash
        );

        // fast forward one day (initialVotingDelay)
        skip(1 days + 1);

        // user1 votes for, but proposal should fail due to lack of quorum
        governor.castVote(proposalId, 1);

        // queue
        governor.queue(targets, values, calldatas, descriptionHash);
    }

    function testProposalHasQuorum() public {
        // deployer stakes 93 AIUS for max lock time, veAIUS total supply is ~100 veAIUS
        // quorum is 4% of total supply, so 4 veAIUS needed for successful proposal
        vm.startPrank(deployer);
        baseToken.approve(address(votingEscrow), 93e18);
        votingEscrow.create_lock(93e18, 104 weeks);
        vm.stopPrank();

        // proposal
        address[] memory targets = new address[](1);
        targets[0] = address(baseToken);

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        // calldata to transfer 1 AIUS to user1
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature(
            "transfer(address,uint256)",
            user1,
            1e18
        );

        string memory description = "Proposal #1: Give grant to team";
        bytes32 descriptionHash = keccak256(bytes(description));

        // propose
        vm.prank(user1);
        governor.propose(targets, values, calldatas, description);

        uint256 proposalId = governor.hashProposal(
            targets,
            values,
            calldatas,
            descriptionHash
        );

        // fast forward one day (initialVotingDelay)
        skip(1 days + 1);

        // user1 and validator1 votes for: votes > quorum
        vm.prank(user1);
        governor.castVote(proposalId, 1);
        vm.prank(validator1);
        governor.castVote(proposalId, 1);

        // fast forward 3 days (votingPeriod)
        skip(3 days);

        // queue
        vm.prank(user1);
        governor.queue(targets, values, calldatas, descriptionHash);

        // fast forward timelockMinDelay
        skip(3 days);

        // execute
        vm.prank(user1);
        governor.execute(targets, values, calldatas, descriptionHash);

        // user1 should have received 1 AIUS from timelock
        assertEq(baseToken.balanceOf(user1), 1e18);
        assertEq(baseToken.balanceOf(address(timelock)), 0);
    }

    function testTreasuryVote() public {
        address[] memory targets = new address[](1);
        targets[0] = address(baseToken);

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        // calldata to transfer 1 AIUS to user1
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature(
            "transfer(address,uint256)",
            user1,
            1e18
        );

        string memory description = "Proposal #1: Give grant to team";
        bytes32 descriptionHash = keccak256(bytes(description));

        // propose
        vm.prank(user1);
        governor.propose(targets, values, calldatas, description);

        uint256 proposalId = governor.hashProposal(
            targets,
            values,
            calldatas,
            descriptionHash
        );

        // fast forward one day (initialVotingDelay)
        skip(1 days + 1);

        // castVote
        vm.prank(user1);
        governor.castVote(proposalId, 1);

        // fast forward 3 days (votingPeriod)
        skip(3 days);

        // queue
        vm.prank(user1);
        governor.queue(targets, values, calldatas, descriptionHash);

        // fast forward timelockMinDelay
        skip(3 days);

        // execute
        vm.prank(user1);
        governor.execute(targets, values, calldatas, descriptionHash);

        // user1 should have received 1 AIUS from timelock
        assertEq(baseToken.balanceOf(user1), 1e18);
        assertEq(baseToken.balanceOf(address(timelock)), 0);
    }

    function testTreasuryVoteFails() public {
        // proposal
        address[] memory targets = new address[](1);
        targets[0] = address(baseToken);

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        // calldata to transfer 1 AIUS to user1
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature(
            "transfer(address,uint256)",
            user1,
            1e18
        );

        string memory description = "Proposal #1: Give grant to team";
        bytes32 descriptionHash = keccak256(bytes(description));

        // propose
        vm.prank(user1);
        governor.propose(targets, values, calldatas, description);

        uint256 proposalId = governor.hashProposal(
            targets,
            values,
            calldatas,
            descriptionHash
        );

        // fast forward one day (initialVotingDelay)
        skip(1 days + 1);

        // vote for
        vm.prank(user1);
        governor.castVote(proposalId, 1);

        // vote against
        vm.prank(user2);
        governor.castVote(proposalId, 0);

        // fast forward 3 days (votingPeriod)
        skip(3 days);

        // queue
        vm.prank(user1);
        vm.expectRevert(abi.encodePacked("Governor: proposal not successful"));
        governor.queue(targets, values, calldatas, descriptionHash);
    }

    function testSolutionMineableRate() public {
        // register model
        bytes32 modelid = engine.registerModel(user1, 0, TESTBUF);

        address[] memory targets = new address[](1);
        targets[0] = address(engine);

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        // calldata to set solutionMineableRate to 1 ether
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature(
            "setSolutionMineableRate(bytes32,uint256)",
            modelid,
            1e18
        );

        string
            memory description = "Proposal #1: setSolutionMineableRate model_1";
        bytes32 descriptionHash = keccak256(bytes(description));

        // propose
        vm.prank(user1);
        governor.propose(targets, values, calldatas, description);

        uint256 proposalId = governor.hashProposal(
            targets,
            values,
            calldatas,
            descriptionHash
        );

        // fast forward one day (initialVotingDelay)
        skip(1 days + 1);

        // castVote
        vm.prank(user1);
        governor.castVote(proposalId, 1);

        // fast forward 3 days (votingPeriod)
        skip(3 days);

        // queue
        vm.prank(user1);
        governor.queue(targets, values, calldatas, descriptionHash);

        // fast forward timelockMinDelay
        skip(3 days);

        // execute
        vm.prank(user1);
        governor.execute(targets, values, calldatas, descriptionHash);

        // model should have updated solutionMineableRate
        (, , uint256 rate, ) = engine.models(modelid);
        assertEq(rate, 1e18);
    }

    function testInitialVotingDelay() public {
        // proposal
        address[] memory targets = new address[](1);
        targets[0] = address(baseToken);

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        // calldata to transfer 1 AIUS to user1
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature(
            "transfer(address,uint256)",
            user1,
            1e18
        );

        string memory description = "Proposal #1: Give grant to team";
        bytes32 descriptionHash = keccak256(bytes(description));

        // propose
        vm.prank(user1);
        governor.propose(targets, values, calldatas, description);

        uint256 proposalId = governor.hashProposal(
            targets,
            values,
            calldatas,
            descriptionHash
        );

        // fast forward less than `initialVotingDelay`
        skip(1 days - 1);

        // vote for
        vm.prank(user1);
        vm.expectRevert(
            abi.encodePacked("Governor: vote not currently active")
        );
        governor.castVote(proposalId, 1);
    }

    function testVotingPeriod() public {
        // proposal
        address[] memory targets = new address[](1);
        targets[0] = address(baseToken);

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        // calldata to transfer 1 AIUS to user1
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature(
            "transfer(address,uint256)",
            user1,
            1e18
        );

        string memory description = "Proposal #1: Give grant to team";
        bytes32 descriptionHash = keccak256(bytes(description));

        // propose
        vm.prank(user1);
        governor.propose(targets, values, calldatas, description);

        uint256 proposalId = governor.hashProposal(
            targets,
            values,
            calldatas,
            descriptionHash
        );

        // fast forward one day (initialVotingDelay)
        skip(1 days + 1);

        // vote for
        vm.prank(user1);
        governor.castVote(proposalId, 1);

        // fast forward less than `votingPeriod`
        skip(3 days - 1);

        // queue
        vm.prank(user1);
        vm.expectRevert(abi.encodePacked("Governor: proposal not successful"));
        governor.queue(targets, values, calldatas, descriptionHash);
    }

    function testTimelockMinDelay() public {
        address[] memory targets = new address[](1);
        targets[0] = address(baseToken);

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        // calldata to transfer 1 AIUS to user1
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature(
            "transfer(address,uint256)",
            user1,
            1e18
        );

        string memory description = "Proposal #1: Give grant to team";
        bytes32 descriptionHash = keccak256(bytes(description));

        // propose
        vm.prank(user1);
        governor.propose(targets, values, calldatas, description);

        uint256 proposalId = governor.hashProposal(
            targets,
            values,
            calldatas,
            descriptionHash
        );

        // fast forward one day (initialVotingDelay)
        skip(1 days + 1);

        // castVote
        vm.prank(user1);
        governor.castVote(proposalId, 1);

        // fast forward 3 days (votingPeriod)
        skip(3 days);

        // queue
        vm.prank(user1);
        governor.queue(targets, values, calldatas, descriptionHash);

        // fast forward less than `timelockMinDelay`
        skip(3 days - 1);

        // execute
        vm.prank(user1);
        vm.expectRevert(
            abi.encodePacked("TimelockController: operation is not ready")
        );
        governor.execute(targets, values, calldatas, descriptionHash);
    }

    function testProposalThreshold() public {
        // proposal
        address[] memory targets = new address[](1);
        targets[0] = address(baseToken);

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        // calldata to transfer 1 AIUS to user1
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature(
            "transfer(address,uint256)",
            user1,
            1e18
        );

        string memory description = "Proposal #1: Give grant to team";
        bytes32 descriptionHash = keccak256(bytes(description));

        // deployer cant propose since he has no veAIUS
        vm.prank(deployer);
        vm.expectRevert(
            abi.encodePacked(
                "Governor: proposer votes below proposal threshold"
            )
        );
        governor.propose(targets, values, calldatas, description);

        // user1 can propose since he has veAIUS
        vm.prank(user1);
        governor.propose(targets, values, calldatas, description);
    }

    function testVoteWithoutVeAIUS() public {
        // proposal
        address[] memory targets = new address[](1);
        targets[0] = address(baseToken);

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        // calldata to transfer 1 AIUS to user1
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature(
            "transfer(address,uint256)",
            user1,
            1e18
        );

        string memory description = "Proposal #1: Give grant to team";
        bytes32 descriptionHash = keccak256(bytes(description));

        // propose
        vm.prank(user1);
        governor.propose(targets, values, calldatas, description);

        uint256 proposalId = governor.hashProposal(
            targets,
            values,
            calldatas,
            descriptionHash
        );

        // fast forward one day (initialVotingDelay)
        skip(1 days + 1);

        // deployer votes with zero veAIUS but a lot of AIUS, weight should be zero
        vm.prank(deployer);
        governor.castVote(proposalId, 1);

        // fast forward 3 days (votingPeriod)
        skip(3 days);

        // proposal should fail
        vm.prank(user1);
        vm.expectRevert(abi.encodePacked("Governor: proposal not successful"));
        governor.queue(targets, values, calldatas, descriptionHash);
    }

    function testAutoDelegate() public {
        // should auto delegate to self
        assertEq(votingEscrow.delegates(user1), user1);
        assertEq(votingEscrow.delegates(user2), user2);
        assertEq(votingEscrow.delegates(validator1), validator1);

        // user1 delegates to user2
        vm.prank(user1);
        votingEscrow.delegate(user2);

        // now user1 delegates to user2
        assertEq(votingEscrow.delegates(user1), user2);
    }

    function testDelegate() public {
        // validator1 delegates his veAIUS to validator2 (val2 has ZERO veAIUS)
        vm.prank(validator1);
        votingEscrow.delegate(validator2);

        // register model
        bytes32 modelid = engine.registerModel(user1, 0, TESTBUF);

        address[] memory targets = new address[](1);
        targets[0] = address(engine);

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        // calldata to set solutionMineableRate to 1 ether
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature(
            "setSolutionMineableRate(bytes32,uint256)",
            modelid,
            1e18
        );

        string
            memory description = "Proposal #1: setSolutionMineableRate model_1";
        bytes32 descriptionHash = keccak256(bytes(description));

        // propose
        vm.prank(user1);
        governor.propose(targets, values, calldatas, description);

        uint256 proposalId = governor.hashProposal(
            targets,
            values,
            calldatas,
            descriptionHash
        );

        // fast forward one day (initialVotingDelay)
        skip(1 days + 1);

        // validator2 votes for
        vm.prank(validator2);
        governor.castVote(proposalId, 1);

        // fast forward 3 days (votingPeriod)
        skip(3 days);

        // queue
        vm.prank(user1);
        governor.queue(targets, values, calldatas, descriptionHash);

        // fast forward timelockMinDelay
        skip(3 days);

        // execute
        vm.prank(user1);
        governor.execute(targets, values, calldatas, descriptionHash);

        // model should have updated solutionMineableRate
        (, , uint256 rate, ) = engine.models(modelid);
        assertEq(rate, 1e18);
    }

    function testDelegateLimitGas() public {
        // mint 1M AIUS
        vm.prank(deployer);
        baseToken.bridgeMint(address(this), 1e24);
        baseToken.approve(address(votingEscrow), type(uint256).max);

        uint tokenId = votingEscrow.create_lock(100 ether, 7 days);

        for (uint256 i = 0; i < votingEscrow.MAX_DELEGATES() - 1; i++) {
            vm.roll(block.number + 1);
            vm.warp(block.timestamp + 2);

            address fakeAccount = address(uint160(420 + i));

            baseToken.transfer(fakeAccount, 1 ether);

            vm.startPrank(fakeAccount);
            baseToken.approve(address(votingEscrow), type(uint256).max);
            votingEscrow.create_lock(1 ether, 52 weeks);
            votingEscrow.delegate(address(this));
            vm.stopPrank();
        }

        vm.roll(block.number + 1);
        vm.warp(block.timestamp + 7 days);

        uint initialGas = gasleft();
        votingEscrow.withdraw(tokenId);
        uint gasUsed = initialGas - gasleft();

        // gas limit on arbitrum is 32M
        assertLt(gasUsed, 32_000_000);
    }
}
