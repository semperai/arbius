// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "contracts/MasterContesterRegistry.sol";
import "contracts/ve/VotingEscrow.sol";
import "contracts/ve/VeNFTRender.sol";
import "contracts/BaseTokenV1.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

// Mock VeStaking for testing
contract MockVeStaking {
    mapping(uint256 => uint256) public balances;

    function balanceOf(uint256 tokenId) external view returns (uint256) {
        return balances[tokenId];
    }

    function _stake(uint256 tokenId, uint256 amount) external {
        balances[tokenId] += amount;
    }

    function _withdraw(uint256 tokenId) external {
        balances[tokenId] = 0;
    }

    function _updateBalance(uint256 tokenId, uint256 newAmount) external {
        balances[tokenId] = newAmount;
    }

    function getReward(uint256) external pure {
        // Do nothing
    }
}

contract MasterContesterRegistryTest is Test {
    MasterContesterRegistry public registry;
    VotingEscrow public votingEscrow;
    VeNFTRender public veNFTRender;
    BaseTokenV1 public baseToken;

    address public deployer;
    address public user1;
    address public user2;
    address public candidate1;
    address public candidate2;

    function setUp() public {
        deployer = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        candidate1 = makeAddr("candidate1");
        candidate2 = makeAddr("candidate2");

        // Deploy BaseToken
        BaseTokenV1 baseTokenImpl = new BaseTokenV1();
        bytes memory baseTokenInitData = abi.encodeWithSelector(
            BaseTokenV1.initialize.selector,
            deployer,
            address(0)
        );
        ERC1967Proxy baseTokenProxy = new ERC1967Proxy(address(baseTokenImpl), baseTokenInitData);
        baseToken = BaseTokenV1(address(baseTokenProxy));

        // Deploy VeNFTRender
        veNFTRender = new VeNFTRender();

        // Deploy MockVeStaking
        MockVeStaking mockVeStaking = new MockVeStaking();

        // Deploy VotingEscrow with MockVeStaking
        votingEscrow = new VotingEscrow(
            address(baseToken),
            address(veNFTRender),
            address(mockVeStaking)
        );

        // Deploy MasterContesterRegistry
        registry = new MasterContesterRegistry(address(votingEscrow));

        // Setup tokens
        baseToken.bridgeMint(user1, 1000 ether);
        baseToken.bridgeMint(user2, 1000 ether);

        vm.prank(user1);
        baseToken.approve(address(votingEscrow), type(uint256).max);
        vm.prank(user2);
        baseToken.approve(address(votingEscrow), type(uint256).max);
    }

    function test_Initialization() public {
        assertEq(address(registry.votingEscrow()), address(votingEscrow));
        assertEq(registry.EPOCH_DURATION(), 7 days);
        assertEq(registry.masterContesterCount(), 3);
    }

    function test_EmptyMasterContestersOnInit() public {
        address[] memory mcs = registry.getMasterContesters();
        assertEq(mcs.length, 0);
    }

    function test_EmergencyAddMasterContester() public {
        registry.emergencyAddMasterContester(candidate1);
        assertTrue(registry.isMasterContester(candidate1));
    }

    function test_EmergencyRemoveMasterContester() public {
        registry.emergencyAddMasterContester(candidate1);
        assertTrue(registry.isMasterContester(candidate1));

        registry.emergencyRemoveMasterContester(candidate1);
        assertFalse(registry.isMasterContester(candidate1));
    }

    function test_RevertWhen_NonOwnerEmergencyAdd() public {
        vm.prank(user1);
        vm.expectRevert();
        registry.emergencyAddMasterContester(candidate1);
    }

    function test_RevertWhen_NonOwnerEmergencyRemove() public {
        registry.emergencyAddMasterContester(candidate1);

        vm.prank(user1);
        vm.expectRevert();
        registry.emergencyRemoveMasterContester(candidate1);
    }

    function test_GetMasterContestersAfterAdd() public {
        registry.emergencyAddMasterContester(candidate1);
        registry.emergencyAddMasterContester(candidate2);

        address[] memory mcs = registry.getMasterContesters();
        assertEq(mcs.length, 2);
        assertEq(mcs[0], candidate1);
        assertEq(mcs[1], candidate2);
    }

    function test_VotingWithVeNFT() public {
        // Create veNFT
        vm.prank(user1);
        uint256 tokenId = votingEscrow.create_lock(100 ether, block.timestamp + 365 days);

        // Vote for candidate1
        address[] memory candidates = new address[](1);
        candidates[0] = candidate1;

        vm.prank(user1);
        registry.vote(candidates, tokenId);

        // Check vote was recorded
        assertTrue(registry.hasVoted(registry.currentEpoch(), user1));
    }

    function test_RevertWhen_VoteWithNonOwnedNFT() public {
        // user1 creates NFT
        vm.prank(user1);
        uint256 tokenId = votingEscrow.create_lock(100 ether, block.timestamp + 365 days);

        // user2 tries to vote with user1's NFT
        address[] memory candidates = new address[](1);
        candidates[0] = candidate1;

        vm.prank(user2);
        vm.expectRevert();
        registry.vote(candidates, tokenId);
    }

    function test_FinalizeEpoch() public {
        // Setup vote
        vm.prank(user1);
        uint256 tokenId = votingEscrow.create_lock(100 ether, block.timestamp + 365 days);

        address[] memory candidates = new address[](1);
        candidates[0] = candidate1;

        vm.prank(user1);
        registry.vote(candidates, tokenId);

        uint256 epochBefore = registry.currentEpoch();

        // Advance time past epoch
        vm.warp(block.timestamp + 7 days + 1);

        // Finalize
        registry.finalizeEpoch();

        assertEq(registry.currentEpoch(), epochBefore + 1);
    }

    function test_RevertWhen_FinalizeEpochTooEarly() public {
        vm.expectRevert();
        registry.finalizeEpoch();
    }

    function test_SetMasterContesterCount() public {
        registry.setMasterContesterCount(5);
        assertEq(registry.masterContesterCount(), 5);
    }

    function test_RevertWhen_NonOwnerSetsMasterContesterCount() public {
        vm.prank(user1);
        vm.expectRevert();
        registry.setMasterContesterCount(5);
    }

    function test_GetTopCandidates() public {
        // Create veNFTs and vote
        vm.prank(user1);
        uint256 tokenId1 = votingEscrow.create_lock(100 ether, block.timestamp + 365 days);

        vm.prank(user2);
        uint256 tokenId2 = votingEscrow.create_lock(50 ether, block.timestamp + 365 days);

        address[] memory candidates = new address[](2);
        candidates[0] = candidate1;
        candidates[1] = candidate2;

        vm.prank(user1);
        registry.vote(candidates, tokenId1);

        vm.prank(user2);
        registry.vote(candidates, tokenId2);

        (address[] memory topAddresses, uint256[] memory topVotes) = registry.getTopCandidates();
        assertGt(topAddresses.length, 0);
        assertGt(topVotes.length, 0);
    }

    function test_VoteMultiple() public {
        // Create veNFT for user1 and user2
        vm.prank(user1);
        uint256 tokenId1 = votingEscrow.create_lock(100 ether, block.timestamp + 365 days);

        vm.prank(user2);
        uint256 tokenId2 = votingEscrow.create_lock(50 ether, block.timestamp + 365 days);

        address[] memory candidates = new address[](1);
        candidates[0] = candidate1;

        uint256[] memory tokenIds1 = new uint256[](1);
        tokenIds1[0] = tokenId1;

        uint256[] memory tokenIds2 = new uint256[](1);
        tokenIds2[0] = tokenId2;

        // Both users vote
        vm.prank(user1);
        registry.voteMultiple(candidates, tokenIds1);

        vm.prank(user2);
        registry.voteMultiple(candidates, tokenIds2);

        assertTrue(registry.hasVoted(registry.currentEpoch(), user1));
        assertTrue(registry.hasVoted(registry.currentEpoch(), user2));
    }

    function test_IsNewEpoch() public {
        assertFalse(registry.isNewEpoch());

        vm.warp(block.timestamp + 7 days + 1);
        assertTrue(registry.isNewEpoch());
    }

    function test_TimeUntilNextEpoch() public {
        uint256 timeLeft = registry.timeUntilNextEpoch();
        assertEq(timeLeft, 7 days);

        vm.warp(block.timestamp + 3 days);
        timeLeft = registry.timeUntilNextEpoch();
        assertEq(timeLeft, 4 days);

        vm.warp(block.timestamp + 5 days);
        timeLeft = registry.timeUntilNextEpoch();
        assertEq(timeLeft, 0);
    }

    function test_GetVotesCast() public {
        vm.prank(user1);
        uint256 tokenId = votingEscrow.create_lock(100 ether, block.timestamp + 365 days);

        address[] memory candidates = new address[](2);
        candidates[0] = candidate1;
        candidates[1] = candidate2;

        vm.prank(user1);
        registry.vote(candidates, tokenId);

        address[] memory votesCast = registry.getVotesCast(registry.currentEpoch(), user1);
        assertEq(votesCast.length, 2);
        assertEq(votesCast[0], candidate1);
        assertEq(votesCast[1], candidate2);
    }

    function test_RevertWhen_VoteTwiceInSameEpoch() public {
        vm.prank(user1);
        uint256 tokenId = votingEscrow.create_lock(100 ether, block.timestamp + 365 days);

        address[] memory candidates = new address[](1);
        candidates[0] = candidate1;

        vm.prank(user1);
        registry.vote(candidates, tokenId);

        // Try to vote again in same epoch
        vm.prank(user1);
        vm.expectRevert();
        registry.vote(candidates, tokenId);
    }

    function test_VoteInNewEpochUndoesPreviousVotes() public {
        // First epoch vote
        vm.prank(user1);
        uint256 tokenId = votingEscrow.create_lock(100 ether, block.timestamp + 365 days);

        address[] memory candidates1 = new address[](1);
        candidates1[0] = candidate1;

        vm.prank(user1);
        registry.vote(candidates1, tokenId);

        uint256 candidate1VotesEpoch1 = registry.candidateVotes(candidate1);
        assertGt(candidate1VotesEpoch1, 0);

        // Advance to new epoch
        vm.warp(block.timestamp + 7 days + 1);
        registry.finalizeEpoch();

        // Vote for different candidate in new epoch
        address[] memory candidates2 = new address[](1);
        candidates2[0] = candidate2;

        vm.prank(user1);
        registry.vote(candidates2, tokenId);

        // candidate1 votes should be reduced
        uint256 candidate1VotesAfter = registry.candidateVotes(candidate1);
        assertEq(candidate1VotesAfter, 0);

        // candidate2 should have votes
        assertGt(registry.candidateVotes(candidate2), 0);
    }

    function test_MasterContestersElectedAfterFinalize() public {
        // Create votes for multiple candidates
        vm.prank(user1);
        uint256 tokenId1 = votingEscrow.create_lock(100 ether, block.timestamp + 365 days);

        address[] memory candidates = new address[](1);
        candidates[0] = candidate1;

        vm.prank(user1);
        registry.vote(candidates, tokenId1);

        // Advance time and finalize
        vm.warp(block.timestamp + 7 days + 1);
        registry.finalizeEpoch();

        // Check master contesters were elected
        address[] memory mcs = registry.getMasterContesters();
        assertEq(mcs.length, 1);
        assertEq(mcs[0], candidate1);
    }

    function test_EmergencyAddAlreadyMasterContester_Reverts() public {
        registry.emergencyAddMasterContester(candidate1);

        vm.expectRevert();
        registry.emergencyAddMasterContester(candidate1);
    }

    function test_EmergencyRemoveNonMasterContester_Reverts() public {
        vm.expectRevert();
        registry.emergencyRemoveMasterContester(candidate1);
    }
}
