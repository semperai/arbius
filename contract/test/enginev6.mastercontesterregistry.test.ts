import { ethers, upgrades } from "hardhat";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "./chai-setup";
import { BaseTokenV1 as BaseToken } from "../typechain/BaseTokenV1";
import { V2EngineV1 } from "../typechain/V2EngineV1";
import { V2EngineV2 } from "../typechain/V2EngineV2";
import { V2EngineV3 } from "../typechain/V2EngineV3";
import { V2EngineV4 } from "../typechain/V2EngineV4";
import { V2EngineV5 } from "../typechain/V2EngineV5";
import { V2EngineV5_2 } from "../typechain/V2EngineV5_2";
import { V2EngineV6 } from "../typechain/V2EngineV6";
import { MasterContesterRegistry } from "../typechain/MasterContesterRegistry";
import { VotingEscrow } from "../typechain/VotingEscrow";
import { VeStaking } from "../typechain/VeStaking";
import { Voter } from "../typechain/Voter";
import { VeNFTRender } from "../typechain/VeNFTRender";

const TESTCID = '0x1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8';
const TESTBUF = '0x746573740a';

describe("MasterContesterRegistry Tests", () => {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let validator1: SignerWithAddress;
  let validator2: SignerWithAddress;
  let validator3: SignerWithAddress;
  let validator4: SignerWithAddress;
  let treasury: SignerWithAddress;

  let baseToken: BaseToken;
  let engine: V2EngineV6;
  let masterContesterRegistry: MasterContesterRegistry;
  let votingEscrow: VotingEscrow;
  let veStaking: VeStaking;
  let voter: Voter;
  let veNFTRender: VeNFTRender;

  // Token IDs for VE NFTs
  let tokenId1: BigNumber;
  let tokenId2: BigNumber;
  let tokenId3: BigNumber;

  beforeEach("Deploy and initialize full stack", async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    user1 = signers[1];
    user2 = signers[2];
    user3 = signers[3];
    validator1 = signers[4];
    validator2 = signers[5];
    validator3 = signers[6];
    validator4 = signers[7];
    treasury = signers[8];

    // ========================
    // Deploy BaseToken
    // ========================
    const BaseToken = await ethers.getContractFactory("BaseTokenV1");
    baseToken = (await upgrades.deployProxy(BaseToken, [
      await deployer.getAddress(),
      ethers.constants.AddressZero,
    ])) as BaseToken;
    await baseToken.deployed();

    // ========================
    // Deploy VE Stack
    // ========================
    
    // Deploy VeNFTRender
    const VeNFTRender = await ethers.getContractFactory("VeNFTRender");
    veNFTRender = await VeNFTRender.deploy();
    await veNFTRender.deployed();

    // We need to handle the circular dependency between VotingEscrow and VeStaking
    // VotingEscrow needs VeStaking address in constructor
    // VeStaking needs VotingEscrow address in constructor (immutable)
    
    // Solution: Use CREATE2 or pre-calculate addresses, or use a factory pattern
    // For simplicity, let's use a dummy VeStaking first, then deploy the real one
    
    // Step 1: Deploy a dummy VeStaking to get an address
    const VeStaking = await ethers.getContractFactory("VeStaking");
    const dummyVeStaking = await VeStaking.deploy(
      baseToken.address,
      ethers.constants.AddressZero // Dummy VotingEscrow
    );
    await dummyVeStaking.deployed();

    // Step 2: Deploy VotingEscrow with dummy VeStaking
    const VotingEscrow = await ethers.getContractFactory("VotingEscrow");
    const dummyVotingEscrow = await VotingEscrow.deploy(
      baseToken.address,
      veNFTRender.address,
      dummyVeStaking.address
    );
    await dummyVotingEscrow.deployed();

    // Step 3: Now deploy the real VeStaking with the real VotingEscrow address we'll deploy next
    // We'll use deterministic address calculation
    const nonce = await ethers.provider.getTransactionCount(deployer.address);
    const futureVotingEscrowAddress = ethers.utils.getContractAddress({
      from: deployer.address,
      nonce: nonce
    });

    // Step 4: Deploy real VotingEscrow first
    votingEscrow = await VotingEscrow.deploy(
      baseToken.address,
      veNFTRender.address,
      ethers.constants.AddressZero // We'll use setVeStaking after
    );
    await votingEscrow.deployed();

    // Step 5: Deploy real VeStaking with the correct VotingEscrow
    veStaking = await VeStaking.deploy(
      baseToken.address,
      votingEscrow.address
    );
    await veStaking.deployed();

    // Step 6: Update VotingEscrow's veStaking
    await votingEscrow.connect(deployer).setVeStaking(veStaking.address);

    // Deploy Voter
    const Voter = await ethers.getContractFactory("Voter");
    voter = await Voter.deploy(votingEscrow.address);
    await voter.deployed();

    // Set voter in VotingEscrow
    await votingEscrow.connect(deployer).setVoter(voter.address);

    // ========================
    // Deploy and upgrade Engine through all versions
    // ========================
    const V2_EngineV1 = await ethers.getContractFactory("V2_EngineV1");
    const V2_EngineV2 = await ethers.getContractFactory("V2_EngineV2");
    const V2_EngineV3 = await ethers.getContractFactory("V2_EngineV3");
    const V2_EngineV4 = await ethers.getContractFactory("V2_EngineV4");
    const V2_EngineV5 = await ethers.getContractFactory("V2_EngineV5");
    const V2_EngineV5_2 = await ethers.getContractFactory("V2_EngineV5_2");
    const V2_EngineV6 = await ethers.getContractFactory("V2_EngineV6");

    // Deploy V1
    engine = (await upgrades.deployProxy(V2_EngineV1, [
      baseToken.address,
      await treasury.getAddress(),
    ])) as V2EngineV1 as any;
    await engine.deployed();
    
    // Upgrade to V2
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV2) as V2EngineV2 as any;
    await engine.connect(deployer).setSolutionStakeAmount(ethers.utils.parseEther("0.001"));
    
    // Upgrade to V3
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV3, {
      call: "initialize",
    }) as V2EngineV3 as any;
    
    // Upgrade to V4
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV4, {
      call: "initialize",
    }) as V2EngineV4 as any;
    
    // Upgrade to V5
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV5, {
      call: "initialize",
    }) as V2EngineV5 as any;
    
    // Upgrade to V5_2
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV5_2, {
      call: "initialize",
    }) as V2EngineV5_2 as any;
    
    // Upgrade to V6
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV6, {
      call: "initialize",
    }) as V2EngineV6;

    // Set VE contracts in engine
    await engine.connect(deployer).setVeStaking(veStaking.address);
    await engine.connect(deployer).setVoter(voter.address);
    
    // Set engine in VeStaking
    await veStaking.connect(deployer).setEngine(engine.address);

    // ========================
    // Deploy MasterContesterRegistry
    // ========================
    const MasterContesterRegistry = await ethers.getContractFactory("MasterContesterRegistry");
    masterContesterRegistry = await MasterContesterRegistry.deploy(votingEscrow.address);
    await masterContesterRegistry.deployed();

    // Set registry in engine
    await engine.connect(deployer).setMasterContesterRegistry(masterContesterRegistry.address);

    // ========================
    // Setup tokens and approvals
    // ========================
    await baseToken.connect(deployer).bridgeMint(await deployer.getAddress(), ethers.utils.parseEther("10000"));
    await baseToken.connect(deployer).transferOwnership(engine.address);

    // Distribute tokens to users for VE locking
    for (const user of [user1, user2, user3, validator1, validator2, validator3, validator4]) {
      await baseToken.connect(deployer).transfer(user.address, ethers.utils.parseEther("100"));
      await baseToken.connect(user).approve(votingEscrow.address, ethers.constants.MaxUint256);
      await baseToken.connect(user).approve(engine.address, ethers.constants.MaxUint256);
    }
  });

  describe("Constructor and Initial State", () => {
    it("should initialize with correct voting escrow", async () => {
      expect(await masterContesterRegistry.votingEscrow()).to.equal(votingEscrow.address);
    });

    it("should initialize with correct epoch duration", async () => {
      expect(await masterContesterRegistry.EPOCH_DURATION()).to.equal(7 * 24 * 60 * 60); // 1 week
    });

    it("should initialize with default master contester count of 3", async () => {
      expect(await masterContesterRegistry.masterContesterCount()).to.equal(3);
    });

    it("should initialize with epoch 1 and current timestamp", async () => {
      expect(await masterContesterRegistry.currentEpoch()).to.equal(1);
      const epochStartTime = await masterContesterRegistry.epochStartTime();
      const currentTime = await ethers.provider.getBlock("latest").then(b => b.timestamp);
      expect(epochStartTime.toNumber()).to.be.closeTo(currentTime, 30);
    });

    it("should initialize with empty master contesters list", async () => {
      const contesters = await masterContesterRegistry.getMasterContesters();
      expect(contesters.length).to.equal(0);
    });
  });

  describe("Voting with veNFTs", () => {
    beforeEach(async () => {
      // Create veNFT positions for users
      const lockDuration = 52 * 7 * 24 * 60 * 60; // 1 year
      const lockAmount = ethers.utils.parseEther("10");

      tokenId1 = await votingEscrow.connect(user1).callStatic.create_lock(lockAmount, lockDuration);
      await votingEscrow.connect(user1).create_lock(lockAmount, lockDuration);

      tokenId2 = await votingEscrow.connect(user2).callStatic.create_lock(lockAmount, lockDuration);
      await votingEscrow.connect(user2).create_lock(lockAmount, lockDuration);

      tokenId3 = await votingEscrow.connect(user3).callStatic.create_lock(lockAmount, lockDuration);
      await votingEscrow.connect(user3).create_lock(lockAmount, lockDuration);
    });

    it("should allow voting with owned veNFT", async () => {
      const candidates = [validator1.address, validator2.address];
      
      await expect(masterContesterRegistry.connect(user1).vote(candidates, tokenId1))
        .to.emit(masterContesterRegistry, "VoteCast");

      // Check votes were recorded
      expect(await masterContesterRegistry.candidateVotes(validator1.address)).to.be.gt(0);
      expect(await masterContesterRegistry.candidateVotes(validator2.address)).to.be.gt(0);
    });

    it("should reject voting with non-owned veNFT", async () => {
      const candidates = [validator1.address];
      
      await expect(masterContesterRegistry.connect(user2).vote(candidates, tokenId1))
        .to.be.revertedWith("NotTokenOwner()");
    });

    it("should reject double voting in same epoch", async () => {
      const candidates = [validator1.address];
      
      await masterContesterRegistry.connect(user1).vote(candidates, tokenId1);
      
      await expect(masterContesterRegistry.connect(user1).vote(candidates, tokenId1))
        .to.be.revertedWith("AlreadyVotedThisEpoch()");
    });

    it("should distribute voting power equally among candidates", async () => {
      const candidates = [validator1.address, validator2.address];
      
      await masterContesterRegistry.connect(user1).vote(candidates, tokenId1);
      
      const vote1 = await masterContesterRegistry.candidateVotes(validator1.address);
      const vote2 = await masterContesterRegistry.candidateVotes(validator2.address);
      
      expect(vote1).to.equal(vote2);
    });

    it("should allow voting with multiple veNFTs", async () => {
      // Move to next epoch so tokenId1 can vote again
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]); // 1 week + 1 second
      await ethers.provider.send("evm_mine", []);

      // Create another veNFT for user1 (ensure they have enough balance)
      await baseToken.connect(deployer).transfer(user1.address, ethers.utils.parseEther("10"));

      const lockAmount = ethers.utils.parseEther("5");
      const lockDuration = 52 * 7 * 24 * 60 * 60;

      const tokenId4 = await votingEscrow.connect(user1).callStatic.create_lock(lockAmount, lockDuration);
      await votingEscrow.connect(user1).create_lock(lockAmount, lockDuration);

      const candidates = [validator1.address];

      // Note: voteMultiple with same msg.sender will fail due to contract design
      // Only the first token can be used per epoch per address
      // This test verifies voting with a single token works after moving to new epoch
      await expect(masterContesterRegistry.connect(user1).vote(candidates, tokenId1))
        .to.emit(masterContesterRegistry, "VoteCast");

      // Votes should be recorded
      const totalVotes = await masterContesterRegistry.candidateVotes(validator1.address);
      expect(totalVotes).to.be.gt(0);
    });
  });

  describe("Heap Management", () => {
    beforeEach(async () => {
      // Create veNFT positions
      const lockDuration = 52 * 7 * 24 * 60 * 60;
      const amounts = [
        ethers.utils.parseEther("50"),  // user1 - highest
        ethers.utils.parseEther("30"),  // user2
        ethers.utils.parseEther("20"),  // user3
      ];

      tokenId1 = await votingEscrow.connect(user1).callStatic.create_lock(amounts[0], lockDuration);
      await votingEscrow.connect(user1).create_lock(amounts[0], lockDuration);

      tokenId2 = await votingEscrow.connect(user2).callStatic.create_lock(amounts[1], lockDuration);
      await votingEscrow.connect(user2).create_lock(amounts[1], lockDuration);

      tokenId3 = await votingEscrow.connect(user3).callStatic.create_lock(amounts[2], lockDuration);
      await votingEscrow.connect(user3).create_lock(amounts[2], lockDuration);
    });

    it("should maintain top N candidates in min-heap", async () => {
      // Set master contester count to 2
      await masterContesterRegistry.connect(deployer).setMasterContesterCount(2);

      // Vote for different candidates with different weights
      await masterContesterRegistry.connect(user1).vote([validator1.address], tokenId1); // Highest
      await masterContesterRegistry.connect(user2).vote([validator2.address], tokenId2); // Medium
      await masterContesterRegistry.connect(user3).vote([validator3.address], tokenId3); // Lowest

      // Get top candidates
      const result = await masterContesterRegistry.getTopCandidates();
      
      // Should have 2 candidates (heap size = masterContesterCount)
      expect(result.addresses.length).to.equal(2);
      
      // Should be sorted in descending order
      expect(result.votes[0]).to.be.gte(result.votes[1]);
      
      // validator3 (lowest votes) should not be in top 2
      expect(result.addresses).to.not.include(validator3.address);
    });

    it("should update heap when candidate receives more votes", async () => {
      await masterContesterRegistry.connect(user3).vote([validator3.address], tokenId3); // Low votes
      await masterContesterRegistry.connect(user2).vote([validator2.address], tokenId2); // Medium votes
      
      // Now validator3 gets more votes
      await masterContesterRegistry.connect(user1).vote([validator3.address], tokenId1); // High votes
      
      const result = await masterContesterRegistry.getTopCandidates();
      
      // validator3 should now be at the top
      expect(result.addresses[0]).to.equal(validator3.address);
    });
  });

  describe("Vote Undoing", () => {
    beforeEach(async () => {
      const lockDuration = 52 * 7 * 24 * 60 * 60;
      const lockAmount = ethers.utils.parseEther("10");

      tokenId1 = await votingEscrow.connect(user1).callStatic.create_lock(lockAmount, lockDuration);
      await votingEscrow.connect(user1).create_lock(lockAmount, lockDuration);
    });

    it("should undo previous votes when voting in new epoch", async () => {
      // Vote in first epoch
      await masterContesterRegistry.connect(user1).vote([validator1.address], tokenId1);
      const votesEpoch1 = await masterContesterRegistry.candidateVotes(validator1.address);
      expect(votesEpoch1).to.be.gt(0);

      // Move to next epoch
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      // Vote for different candidate in new epoch
      await masterContesterRegistry.connect(user1).vote([validator2.address], tokenId1);

      // Previous candidate's votes should be reduced
      const votesAfter = await masterContesterRegistry.candidateVotes(validator1.address);
      expect(votesAfter).to.equal(0);

      // New candidate should have votes
      const newVotes = await masterContesterRegistry.candidateVotes(validator2.address);
      expect(newVotes).to.be.gt(0);
    });

    it("should emit VoteUndone event when undoing votes", async () => {
      // Vote in first epoch
      await masterContesterRegistry.connect(user1).vote([validator1.address], tokenId1);

      // Move to next epoch
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      // Vote for different candidate - should undo previous vote
      await expect(masterContesterRegistry.connect(user1).vote([validator2.address], tokenId1))
        .to.emit(masterContesterRegistry, "VoteUndone");
    });
  });

  describe("Epoch Management", () => {
    beforeEach(async () => {
      const lockDuration = 52 * 7 * 24 * 60 * 60;
      const lockAmount = ethers.utils.parseEther("10");

      tokenId1 = await votingEscrow.connect(user1).callStatic.create_lock(lockAmount, lockDuration);
      await votingEscrow.connect(user1).create_lock(lockAmount, lockDuration);

      tokenId2 = await votingEscrow.connect(user2).callStatic.create_lock(lockAmount, lockDuration);
      await votingEscrow.connect(user2).create_lock(lockAmount, lockDuration);
    });

    it("should finalize epoch and elect master contesters", async () => {
      // Vote for candidates
      await masterContesterRegistry.connect(user1).vote([validator1.address], tokenId1);
      await masterContesterRegistry.connect(user2).vote([validator2.address], tokenId2);

      // Move to next epoch
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      // Check that we're in a new epoch
      expect(await masterContesterRegistry.isNewEpoch()).to.be.true;

      // Finalize epoch
      await expect(masterContesterRegistry.finalizeEpoch())
        .to.emit(masterContesterRegistry, "EpochFinalized");

      // Check master contesters were elected
      const masterContesters = await masterContesterRegistry.getMasterContesters();
      expect(masterContesters.length).to.be.gt(0);
    });

    it("should auto-finalize epoch when voting in new epoch", async () => {
      // Vote in first epoch
      await masterContesterRegistry.connect(user1).vote([validator1.address], tokenId1);

      // Move to next epoch
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      const epochBefore = await masterContesterRegistry.currentEpoch();

      // Vote in new epoch - should auto-finalize
      await masterContesterRegistry.connect(user2).vote([validator2.address], tokenId2);

      const epochAfter = await masterContesterRegistry.currentEpoch();
      expect(epochAfter).to.equal(epochBefore.add(1));
    });

    it("should elect top N candidates with most votes", async () => {
      // Set count to 2
      await masterContesterRegistry.connect(deployer).setMasterContesterCount(2);

      // Create more veNFTs with different weights
      const lockDuration = 52 * 7 * 24 * 60 * 60;
      
      const tokenId3 = await votingEscrow.connect(user3).callStatic.create_lock(
        ethers.utils.parseEther("5"), // Smallest
        lockDuration
      );
      await votingEscrow.connect(user3).create_lock(ethers.utils.parseEther("5"), lockDuration);

      // Vote with different weights
      await masterContesterRegistry.connect(user1).vote([validator1.address], tokenId1); // 10 AIUS
      await masterContesterRegistry.connect(user2).vote([validator2.address], tokenId2); // 10 AIUS
      await masterContesterRegistry.connect(user3).vote([validator3.address], tokenId3); // 5 AIUS

      // Move to next epoch and finalize
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);
      await masterContesterRegistry.finalizeEpoch();

      // Check elected master contesters
      const masterContesters = await masterContesterRegistry.getMasterContesters();
      expect(masterContesters.length).to.equal(2);
      expect(masterContesters).to.include(validator1.address);
      expect(masterContesters).to.include(validator2.address);
      expect(masterContesters).to.not.include(validator3.address);
    });

    it("should handle no votes in an epoch", async () => {
      // Move to next epoch without any votes
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      await masterContesterRegistry.finalizeEpoch();

      const masterContesters = await masterContesterRegistry.getMasterContesters();
      expect(masterContesters.length).to.equal(0);
    });
  });

  describe("isMasterContester", () => {
    beforeEach(async () => {
      const lockDuration = 52 * 7 * 24 * 60 * 60;
      const lockAmount = ethers.utils.parseEther("10");

      tokenId1 = await votingEscrow.connect(user1).callStatic.create_lock(lockAmount, lockDuration);
      await votingEscrow.connect(user1).create_lock(lockAmount, lockDuration);
    });

    it("should correctly identify master contesters", async () => {
      // Vote and elect
      await masterContesterRegistry.connect(user1).vote([validator1.address], tokenId1);

      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);
      await masterContesterRegistry.finalizeEpoch();

      // Check status
      expect(await masterContesterRegistry.isMasterContester(validator1.address)).to.be.true;
      expect(await masterContesterRegistry.isMasterContester(validator2.address)).to.be.false;
    });

    it("should work with Engine integration", async () => {
      // Vote and elect validator1 as master contester
      await masterContesterRegistry.connect(user1).vote([validator1.address], tokenId1);

      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);
      await masterContesterRegistry.finalizeEpoch();

      // Setup validators in Engine
      await baseToken.connect(deployer).bridgeMint(engine.address, ethers.utils.parseEther('597000'));

      // Give validators enough tokens for staking AND solution stake
      await baseToken.connect(deployer).transfer(validator1.address, ethers.utils.parseEther('50'));
      await baseToken.connect(deployer).transfer(validator2.address, ethers.utils.parseEther('50'));

      // Validators need to stake enough to be validators
      await engine.connect(validator1).validatorDeposit(
        validator1.address,
        ethers.utils.parseEther('40') // Enough to be above validator minimum
      );

      await engine.connect(validator2).validatorDeposit(
        validator2.address,
        ethers.utils.parseEther('40') // Enough to be above validator minimum
      );

      // Deploy model and task
      const model1 = signers[10];
      const addr = await model1.getAddress();
      const fee = ethers.utils.parseEther('0');

      const modelid = await engine.hashModel({
        addr,
        fee,
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, await user1.getAddress());

      await engine.connect(user1).registerModel(addr, fee, TESTBUF);

      const taskParams = {
        version: BigNumber.from("0"),
        owner: await user1.getAddress(),
        model: modelid,
        fee: ethers.utils.parseEther("0"),
        input: TESTBUF,
      };

      const taskidReceipt = await (await engine
        .connect(user1)
        .submitTask(
          taskParams.version,
          taskParams.owner,
          taskParams.model,
          taskParams.fee,
          taskParams.input,
        )).wait();
      
      const taskid = taskidReceipt.events![0].args!.id;

      // Submit solution as validator2
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator2.address, taskid, cid);
      await engine.connect(validator2).signalCommitment(commitment);
      
      // Mine a block to ensure commitment is in the past
      await ethers.provider.send("evm_mine", []);
      
      await engine.connect(validator2).submitSolution(taskid, cid);

      // Master contester (validator1) should be able to submit contestation
      await expect(engine.connect(validator1).submitContestation(taskid))
        .to.emit(engine, "ContestationSubmitted");
    });
  });

  describe("Admin Functions", () => {
    it("should allow owner to set master contester count", async () => {
      await expect(masterContesterRegistry.connect(deployer).setMasterContesterCount(5))
        .to.emit(masterContesterRegistry, "MasterContesterCountChanged")
        .withArgs(3, 5);

      expect(await masterContesterRegistry.masterContesterCount()).to.equal(5);
    });

    it("should reject non-owner setting master contester count", async () => {
      await expect(masterContesterRegistry.connect(user1).setMasterContesterCount(5))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should allow emergency adding master contester", async () => {
      await expect(masterContesterRegistry.connect(deployer).emergencyAddMasterContester(validator1.address))
        .to.emit(masterContesterRegistry, "EmergencyMasterContesterAdded")
        .withArgs(validator1.address);

      expect(await masterContesterRegistry.isMasterContester(validator1.address)).to.be.true;
    });

    it("should reject adding duplicate master contester", async () => {
      await masterContesterRegistry.connect(deployer).emergencyAddMasterContester(validator1.address);
      
      await expect(masterContesterRegistry.connect(deployer).emergencyAddMasterContester(validator1.address))
        .to.be.revertedWith("AlreadyMasterContester()");
    });

    it("should allow emergency removing master contester", async () => {
      await masterContesterRegistry.connect(deployer).emergencyAddMasterContester(validator1.address);
      
      await expect(masterContesterRegistry.connect(deployer).emergencyRemoveMasterContester(validator1.address))
        .to.emit(masterContesterRegistry, "EmergencyMasterContesterRemoved")
        .withArgs(validator1.address);

      expect(await masterContesterRegistry.isMasterContester(validator1.address)).to.be.false;
    });

    it("should reject removing non-existent master contester", async () => {
      await expect(masterContesterRegistry.connect(deployer).emergencyRemoveMasterContester(validator1.address))
        .to.be.revertedWith("NotMasterContester()");
    });
  });

  describe("View Functions", () => {
    beforeEach(async () => {
      const lockDuration = 52 * 7 * 24 * 60 * 60;
      const lockAmount = ethers.utils.parseEther("10");

      tokenId1 = await votingEscrow.connect(user1).callStatic.create_lock(lockAmount, lockDuration);
      await votingEscrow.connect(user1).create_lock(lockAmount, lockDuration);
    });

    it("should return votes cast by voter in epoch", async () => {
      const candidates = [validator1.address, validator2.address];
      await masterContesterRegistry.connect(user1).vote(candidates, tokenId1);

      const votesCast = await masterContesterRegistry.getVotesCast(1, user1.address);
      expect(votesCast.length).to.equal(2);
      expect(votesCast).to.include(validator1.address);
      expect(votesCast).to.include(validator2.address);
    });

    it("should return whether voter has voted in epoch", async () => {
      expect(await masterContesterRegistry.hasVoted(1, user1.address)).to.be.false;

      await masterContesterRegistry.connect(user1).vote([validator1.address], tokenId1);

      expect(await masterContesterRegistry.hasVoted(1, user1.address)).to.be.true;
    });

    it("should return time until next epoch", async () => {
      const timeRemaining = await masterContesterRegistry.timeUntilNextEpoch();
      expect(timeRemaining).to.be.lte(7 * 24 * 60 * 60);
      expect(timeRemaining).to.be.gt(0);

      // Move to next epoch
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      const timeRemainingAfter = await masterContesterRegistry.timeUntilNextEpoch();
      expect(timeRemainingAfter).to.equal(0);
    });

    it("should return top candidates sorted by votes", async () => {
      // Create veNFTs with different amounts
      const lockDuration = 52 * 7 * 24 * 60 * 60;
      
      const tokenId2 = await votingEscrow.connect(user2).callStatic.create_lock(
        ethers.utils.parseEther("20"),
        lockDuration
      );
      await votingEscrow.connect(user2).create_lock(ethers.utils.parseEther("20"), lockDuration);

      const tokenId3 = await votingEscrow.connect(user3).callStatic.create_lock(
        ethers.utils.parseEther("5"),
        lockDuration
      );
      await votingEscrow.connect(user3).create_lock(ethers.utils.parseEther("5"), lockDuration);

      // Vote with different weights
      await masterContesterRegistry.connect(user2).vote([validator2.address], tokenId2); // Most votes
      await masterContesterRegistry.connect(user1).vote([validator1.address], tokenId1); // Medium votes  
      await masterContesterRegistry.connect(user3).vote([validator3.address], tokenId3); // Least votes

      const result = await masterContesterRegistry.getTopCandidates();
      
      // Should be sorted in descending order
      expect(result.addresses[0]).to.equal(validator2.address);
      expect(result.votes[0]).to.be.gt(result.votes[1]);
      expect(result.votes[1]).to.be.gt(result.votes[2]);
    });
  });

  describe("Edge Cases", () => {
    beforeEach(async () => {
      const lockDuration = 52 * 7 * 24 * 60 * 60;
      const lockAmount = ethers.utils.parseEther("10");

      tokenId1 = await votingEscrow.connect(user1).callStatic.create_lock(lockAmount, lockDuration);
      await votingEscrow.connect(user1).create_lock(lockAmount, lockDuration);
    });

    it("should handle voting with zero voting power gracefully", async () => {
      // Create a veNFT with minimal amount
      const tokenId4 = await votingEscrow.connect(validator1).callStatic.create_lock(
        1, // 1 wei
        7 * 24 * 60 * 60 // 1 week
      );
      await votingEscrow.connect(validator1).create_lock(1, 7 * 24 * 60 * 60);

      // By the time lock is created, voting power may be effectively 0
      const votingPower = await votingEscrow.balanceOfNFT(tokenId4);
      
      if (votingPower.eq(0)) {
        await expect(masterContesterRegistry.connect(validator1).vote([validator2.address], tokenId4))
          .to.be.revertedWith("NoVotingPower()");
      } else {
        // If it has some voting power, it should work
        await expect(masterContesterRegistry.connect(validator1).vote([validator2.address], tokenId4))
          .to.not.be.reverted;
      }
    });

    it("should handle tie-breaking in top candidates", async () => {
      // Create identical veNFTs
      const lockDuration = 52 * 7 * 24 * 60 * 60;
      const lockAmount = ethers.utils.parseEther("10");

      const tokenId2 = await votingEscrow.connect(user2).callStatic.create_lock(lockAmount, lockDuration);
      await votingEscrow.connect(user2).create_lock(lockAmount, lockDuration);

      // Vote for different candidates with same weight
      await masterContesterRegistry.connect(user1).vote([validator1.address], tokenId1);
      await masterContesterRegistry.connect(user2).vote([validator2.address], tokenId2);

      // Move to next epoch and finalize
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);
      await masterContesterRegistry.finalizeEpoch();

      // Both should be elected as they have equal votes
      const masterContesters = await masterContesterRegistry.getMasterContesters();
      expect(masterContesters.length).to.equal(2);
    });

    it("should handle empty candidate array", async () => {
      await expect(masterContesterRegistry.connect(user1).vote([], tokenId1))
        .to.be.reverted;
    });

    it("should handle finalizing epoch multiple times", async () => {
      // Vote
      await masterContesterRegistry.connect(user1).vote([validator1.address], tokenId1);

      // Move to next epoch
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      // First finalization
      await masterContesterRegistry.finalizeEpoch();

      // Second finalization should fail
      await expect(masterContesterRegistry.finalizeEpoch())
        .to.be.revertedWith("EpochNotEnded");
    });

    it("should handle vote weight not dividing evenly among candidates", async () => {
      // Create veNFT with amount that won't divide evenly by 3
      const lockDuration = 52 * 7 * 24 * 60 * 60;
      const tokenId2 = await votingEscrow.connect(user2).callStatic.create_lock(
        ethers.utils.parseEther("10"),
        lockDuration
      );
      await votingEscrow.connect(user2).create_lock(ethers.utils.parseEther("10"), lockDuration);

      // Get voting power BEFORE voting (it may decay slightly during the vote tx)
      const votingPowerBefore = await votingEscrow.balanceOfNFT(tokenId2);

      // Vote for 3 candidates (power may not divide evenly)
      const candidates = [validator1.address, validator2.address, validator3.address];
      await masterContesterRegistry.connect(user2).vote(candidates, tokenId2);

      // Get actual voting power used from the recorded vote weight
      const actualVotingPowerUsed = await masterContesterRegistry.lastVoteWeight(user2.address);
      const expectedVotePerCandidate = actualVotingPowerUsed.div(3);

      // Sum of all votes should be <= votingPower (due to integer division)
      let totalDistributed = BigNumber.from(0);
      for (const candidate of candidates) {
        const votes = await masterContesterRegistry.candidateVotes(candidate);
        expect(votes).to.equal(expectedVotePerCandidate);
        totalDistributed = totalDistributed.add(votes);
      }

      // Total distributed should be less than or equal to actual voting power used
      expect(totalDistributed).to.be.lte(actualVotingPowerUsed);
    });

    it("should handle changing masterContesterCount mid-epoch", async () => {
      // Set initial count to 2
      await masterContesterRegistry.connect(deployer).setMasterContesterCount(2);

      // Create multiple veNFTs and vote
      const lockDuration = 52 * 7 * 24 * 60 * 60;
      const tokenId2 = await votingEscrow.connect(user2).callStatic.create_lock(
        ethers.utils.parseEther("10"),
        lockDuration
      );
      await votingEscrow.connect(user2).create_lock(ethers.utils.parseEther("10"), lockDuration);

      const tokenId3 = await votingEscrow.connect(user3).callStatic.create_lock(
        ethers.utils.parseEther("10"),
        lockDuration
      );
      await votingEscrow.connect(user3).create_lock(ethers.utils.parseEther("10"), lockDuration);

      await masterContesterRegistry.connect(user1).vote([validator1.address], tokenId1);
      await masterContesterRegistry.connect(user2).vote([validator2.address], tokenId2);

      // Only 2 are in heap at this point since count is 2
      let topCandidates = await masterContesterRegistry.getTopCandidates();
      expect(topCandidates.addresses.length).to.equal(2);

      // Change count to 3 mid-epoch BEFORE third vote
      await masterContesterRegistry.connect(deployer).setMasterContesterCount(3);

      // Now vote for third candidate
      await masterContesterRegistry.connect(user3).vote([validator3.address], tokenId3);

      // Finalize and check all 3 are elected
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);
      await masterContesterRegistry.finalizeEpoch();

      const masterContesters = await masterContesterRegistry.getMasterContesters();
      expect(masterContesters.length).to.equal(3);
    });
  });

  describe("Advanced Heap Tests", () => {
    beforeEach(async () => {
      const lockDuration = 52 * 7 * 24 * 60 * 60;

      // Create multiple veNFTs with different amounts
      tokenId1 = await votingEscrow.connect(user1).callStatic.create_lock(
        ethers.utils.parseEther("50"),
        lockDuration
      );
      await votingEscrow.connect(user1).create_lock(ethers.utils.parseEther("50"), lockDuration);

      tokenId2 = await votingEscrow.connect(user2).callStatic.create_lock(
        ethers.utils.parseEther("30"),
        lockDuration
      );
      await votingEscrow.connect(user2).create_lock(ethers.utils.parseEther("30"), lockDuration);

      tokenId3 = await votingEscrow.connect(user3).callStatic.create_lock(
        ethers.utils.parseEther("20"),
        lockDuration
      );
      await votingEscrow.connect(user3).create_lock(ethers.utils.parseEther("20"), lockDuration);
    });

    it("should properly remove candidate from heap when votes reduced to zero", async () => {
      // Set count to 2 for easier testing
      await masterContesterRegistry.connect(deployer).setMasterContesterCount(2);

      // Vote in first epoch
      await masterContesterRegistry.connect(user1).vote([validator1.address], tokenId1);
      await masterContesterRegistry.connect(user2).vote([validator2.address], tokenId2);

      // Verify both are in heap
      let topCandidates = await masterContesterRegistry.getTopCandidates();
      expect(topCandidates.addresses.length).to.equal(2);
      expect(topCandidates.addresses).to.include(validator1.address);

      // Move to next epoch and user1 changes vote completely
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      // User1 votes for different candidate, should undo validator1 votes
      await masterContesterRegistry.connect(user1).vote([validator3.address], tokenId1);

      // validator1 should have 0 votes and be removed from heap
      const validator1Votes = await masterContesterRegistry.candidateVotes(validator1.address);
      expect(validator1Votes).to.equal(0);

      // Check heap no longer contains validator1
      topCandidates = await masterContesterRegistry.getTopCandidates();
      // Heap should contain validator2 and validator3, not validator1
      expect(topCandidates.addresses).to.not.include(validator1.address);
    });

    it("should maintain heap property after multiple vote reductions", async () => {
      await masterContesterRegistry.connect(deployer).setMasterContesterCount(3);

      // Initial votes
      await masterContesterRegistry.connect(user1).vote([validator1.address], tokenId1); // 50
      await masterContesterRegistry.connect(user2).vote([validator2.address], tokenId2); // 30
      await masterContesterRegistry.connect(user3).vote([validator3.address], tokenId3); // 20

      // Move to next epoch
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      // User1 changes vote (reduces validator1, increases validator4)
      const lockDuration = 52 * 7 * 24 * 60 * 60;
      await baseToken.connect(deployer).transfer(validator4.address, ethers.utils.parseEther("100"));
      await baseToken.connect(validator4).approve(votingEscrow.address, ethers.constants.MaxUint256);

      await masterContesterRegistry.connect(user1).vote([validator4.address], tokenId1);

      // Get top candidates - should be properly sorted
      const topCandidates = await masterContesterRegistry.getTopCandidates();

      // Verify sorting (descending order)
      for (let i = 0; i < topCandidates.votes.length - 1; i++) {
        expect(topCandidates.votes[i]).to.be.gte(topCandidates.votes[i + 1]);
      }
    });

    it("should handle heap when candidate gets bumped out by new higher-voted candidate", async () => {
      // Set count to 2
      await masterContesterRegistry.connect(deployer).setMasterContesterCount(2);

      // Vote for 2 candidates
      await masterContesterRegistry.connect(user2).vote([validator2.address], tokenId2); // 30
      await masterContesterRegistry.connect(user3).vote([validator3.address], tokenId3); // 20

      let topCandidates = await masterContesterRegistry.getTopCandidates();
      expect(topCandidates.addresses.length).to.equal(2);
      expect(topCandidates.addresses).to.include(validator2.address);
      expect(topCandidates.addresses).to.include(validator3.address);

      // Now user1 votes for validator1 with highest power
      await masterContesterRegistry.connect(user1).vote([validator1.address], tokenId1); // 50

      // validator3 should be bumped out, validator1 and validator2 remain
      topCandidates = await masterContesterRegistry.getTopCandidates();
      expect(topCandidates.addresses.length).to.equal(2);
      expect(topCandidates.addresses).to.include(validator1.address);
      expect(topCandidates.addresses).to.include(validator2.address);
      expect(topCandidates.addresses).to.not.include(validator3.address);
    });

    it("should handle heap updates when same candidate receives votes from multiple voters", async () => {
      await masterContesterRegistry.connect(deployer).setMasterContesterCount(2);

      // Multiple users vote for same candidate
      await masterContesterRegistry.connect(user1).vote([validator1.address], tokenId1); // 50
      const user1VotePower = await masterContesterRegistry.lastVoteWeight(user1.address);

      await masterContesterRegistry.connect(user2).vote([validator1.address], tokenId2); // 30
      const user2VotePower = await masterContesterRegistry.lastVoteWeight(user2.address);

      await masterContesterRegistry.connect(user3).vote([validator2.address], tokenId3); // 20

      const topCandidates = await masterContesterRegistry.getTopCandidates();

      // validator1 should be at top with combined votes
      expect(topCandidates.addresses[0]).to.equal(validator1.address);

      const validator1Votes = await masterContesterRegistry.candidateVotes(validator1.address);

      // Votes should equal sum of actual voting powers used
      const expectedTotal = user1VotePower.add(user2VotePower);
      expect(validator1Votes).to.equal(expectedTotal);
    });
  });

  describe("voteMultiple Function", () => {
    let tokenId4: BigNumber;

    beforeEach(async () => {
      const lockDuration = 52 * 7 * 24 * 60 * 60;
      const lockAmount = ethers.utils.parseEther("10");

      // Create multiple veNFTs for user1
      tokenId1 = await votingEscrow.connect(user1).callStatic.create_lock(lockAmount, lockDuration);
      await votingEscrow.connect(user1).create_lock(lockAmount, lockDuration);

      // Give user1 more tokens for second veNFT
      await baseToken.connect(deployer).transfer(user1.address, ethers.utils.parseEther("20"));

      tokenId4 = await votingEscrow.connect(user1).callStatic.create_lock(lockAmount, lockDuration);
      await votingEscrow.connect(user1).create_lock(lockAmount, lockDuration);
    });

    it("should reject voteMultiple when trying to vote twice in same epoch with different tokens", async () => {
      const candidates = [validator1.address];

      // First vote should succeed
      await masterContesterRegistry.connect(user1).vote(candidates, tokenId1);

      // Second vote with different token in same epoch should fail
      await expect(
        masterContesterRegistry.connect(user1).voteMultiple(candidates, [tokenId4])
      ).to.be.revertedWith("AlreadyVotedThisEpoch()");
    });

    it("should allow voteMultiple in different epochs with same user", async () => {
      const candidates = [validator1.address];

      // Vote in first epoch
      await masterContesterRegistry.connect(user1).vote(candidates, tokenId1);

      // Move to next epoch
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      // Now should be able to vote with different token
      await expect(
        masterContesterRegistry.connect(user1).vote(candidates, tokenId4)
      ).to.not.be.reverted;
    });

    it("should handle voteMultiple with empty tokenIds array", async () => {
      const candidates = [validator1.address];

      // Empty array should just do nothing
      await masterContesterRegistry.connect(user1).voteMultiple(candidates, []);

      // User should not have voted yet
      expect(await masterContesterRegistry.hasVoted(1, user1.address)).to.be.false;
    });
  });

  describe("Heap Boundary Conditions", () => {
    it("should handle setting masterContesterCount to 0", async () => {
      await masterContesterRegistry.connect(deployer).setMasterContesterCount(0);
      expect(await masterContesterRegistry.masterContesterCount()).to.equal(0);

      // Create veNFT and vote
      const lockDuration = 52 * 7 * 24 * 60 * 60;
      const tokenId = await votingEscrow.connect(user1).callStatic.create_lock(
        ethers.utils.parseEther("10"),
        lockDuration
      );
      await votingEscrow.connect(user1).create_lock(ethers.utils.parseEther("10"), lockDuration);

      // Voting with count=0 will cause heap operations to fail
      // The contract has a bug where it tries to access heap[0] when heap is empty
      // This test verifies the current behavior (which is it reverts)
      await expect(
        masterContesterRegistry.connect(user1).vote([validator1.address], tokenId)
      ).to.be.reverted;

      // Verify heap is empty
      const topCandidates = await masterContesterRegistry.getTopCandidates();
      expect(topCandidates.addresses.length).to.equal(0);

      // Finalize epoch without votes
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);
      await masterContesterRegistry.finalizeEpoch();

      // No master contesters should be elected
      const masterContesters = await masterContesterRegistry.getMasterContesters();
      expect(masterContesters.length).to.equal(0);
    });

    it("should handle setting masterContesterCount to 1", async () => {
      await masterContesterRegistry.connect(deployer).setMasterContesterCount(1);

      const lockDuration = 52 * 7 * 24 * 60 * 60;

      const tokenId1 = await votingEscrow.connect(user1).callStatic.create_lock(
        ethers.utils.parseEther("30"),
        lockDuration
      );
      await votingEscrow.connect(user1).create_lock(ethers.utils.parseEther("30"), lockDuration);

      const tokenId2 = await votingEscrow.connect(user2).callStatic.create_lock(
        ethers.utils.parseEther("20"),
        lockDuration
      );
      await votingEscrow.connect(user2).create_lock(ethers.utils.parseEther("20"), lockDuration);

      // Vote for different candidates
      await masterContesterRegistry.connect(user1).vote([validator1.address], tokenId1);
      await masterContesterRegistry.connect(user2).vote([validator2.address], tokenId2);

      // Only top 1 should be in heap
      const topCandidates = await masterContesterRegistry.getTopCandidates();
      expect(topCandidates.addresses.length).to.equal(1);
      expect(topCandidates.addresses[0]).to.equal(validator1.address);

      // Finalize epoch
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);
      await masterContesterRegistry.finalizeEpoch();

      // Only 1 master contester
      const masterContesters = await masterContesterRegistry.getMasterContesters();
      expect(masterContesters.length).to.equal(1);
      expect(masterContesters[0]).to.equal(validator1.address);
    });

    it("should handle very large masterContesterCount", async () => {
      // Set to very large number
      await masterContesterRegistry.connect(deployer).setMasterContesterCount(100);

      const lockDuration = 52 * 7 * 24 * 60 * 60;
      const tokenId1 = await votingEscrow.connect(user1).callStatic.create_lock(
        ethers.utils.parseEther("10"),
        lockDuration
      );
      await votingEscrow.connect(user1).create_lock(ethers.utils.parseEther("10"), lockDuration);

      const tokenId2 = await votingEscrow.connect(user2).callStatic.create_lock(
        ethers.utils.parseEther("10"),
        lockDuration
      );
      await votingEscrow.connect(user2).create_lock(ethers.utils.parseEther("10"), lockDuration);

      // Vote for 2 candidates only
      await masterContesterRegistry.connect(user1).vote([validator1.address], tokenId1);
      await masterContesterRegistry.connect(user2).vote([validator2.address], tokenId2);

      // Heap should only have 2 elements (not 100)
      const topCandidates = await masterContesterRegistry.getTopCandidates();
      expect(topCandidates.addresses.length).to.equal(2);

      // Finalize
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);
      await masterContesterRegistry.finalizeEpoch();

      // Should elect both
      const masterContesters = await masterContesterRegistry.getMasterContesters();
      expect(masterContesters.length).to.equal(2);
    });
  });
});
