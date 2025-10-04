// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "contracts/MasterContesterRegistry.sol";
import "contracts/ve/VotingEscrow.sol";
import "contracts/ve/VeNFTRender.sol";
import "contracts/BaseTokenV1.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

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

        // Deploy VotingEscrow (with address(0) for veStaking initially)
        votingEscrow = new VotingEscrow(
            address(baseToken),
            address(veNFTRender),
            address(0)
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
}
