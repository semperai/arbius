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
import { Voter } from "../typechain/contracts/ve/Voter";
import { VotingEscrow } from "../typechain/contracts/ve/VotingEscrow";
import { VeNFTRender } from "../typechain/contracts/ve/VeNFTRender";
import { VeStaking } from "../typechain/contracts/ve/VeStaking";

const TESTCID = '0x1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8';
const TESTBUF = '0x746573740a';

describe("EngineV6 Focused Security Tests", () => {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let validator1: SignerWithAddress;
  let validator2: SignerWithAddress;
  let validator3: SignerWithAddress;
  let masterContester1: SignerWithAddress;
  let treasury: SignerWithAddress;
  let model1: SignerWithAddress;

  let baseToken: BaseToken;
  let engine: V2EngineV6;
  let masterContesterRegistry: MasterContesterRegistry;
  let voter: Voter;
  let votingEscrow: VotingEscrow;
  let veNFTRender: VeNFTRender;
  let veStaking: VeStaking;

  beforeEach("Deploy and initialize", async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    user1 = signers[1];
    user2 = signers[2];
    validator1 = signers[3];
    validator2 = signers[4];
    validator3 = signers[5];
    masterContester1 = signers[6];
    treasury = signers[7];
    model1 = signers[8];

    // Deploy BaseToken
    const BaseToken = await ethers.getContractFactory("BaseTokenV1");
    baseToken = (await upgrades.deployProxy(BaseToken, [
      await deployer.getAddress(),
      ethers.constants.AddressZero,
    ])) as BaseToken;
    await baseToken.deployed();

    // Deploy and upgrade through all versions
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
    let engineV2_2 = (await upgrades.upgradeProxy(
      engine.address,
      V2_EngineV2
    )) as V2EngineV2;
    
    await (
      await engineV2_2
        .connect(deployer)
        .setSolutionStakeAmount(ethers.utils.parseEther("0.01"))
    ).wait();

    // Upgrade through versions
    engine = (await upgrades.upgradeProxy(engineV2_2.address, V2_EngineV3, {
      call: "initialize",
    })) as V2EngineV3 as any;
    
    engine = (await upgrades.upgradeProxy(engine.address, V2_EngineV4, {
      call: "initialize",
    })) as V2EngineV4 as any;
    
    engine = (await upgrades.upgradeProxy(engine.address, V2_EngineV5, {
      call: "initialize",
    })) as V2EngineV5 as any;
    
    engine = (await upgrades.upgradeProxy(engine.address, V2_EngineV5_2, {
      call: "initialize",
    })) as V2EngineV5_2 as any;

    engine = (await upgrades.upgradeProxy(engine.address, V2_EngineV6, {
      call: "initialize",
    })) as V2EngineV6;

    // Deploy VE contracts
    const VeNFTRender = await ethers.getContractFactory("VeNFTRender");
    veNFTRender = await VeNFTRender.deploy();
    await veNFTRender.deployed();

    const VotingEscrow = await ethers.getContractFactory("VotingEscrow");
    votingEscrow = await VotingEscrow.deploy(
      baseToken.address,
      veNFTRender.address,
      ethers.constants.AddressZero
    );
    await votingEscrow.deployed();

    const VeStaking = await ethers.getContractFactory("VeStaking");
    veStaking = await VeStaking.deploy(baseToken.address, votingEscrow.address);
    await veStaking.deployed();

    await votingEscrow.setVeStaking(veStaking.address);

    const Voter = await ethers.getContractFactory("Voter");
    voter = await Voter.deploy(votingEscrow.address);
    await voter.deployed();

    await votingEscrow.setVoter(voter.address);
    await engine.connect(deployer).setVeStaking(veStaking.address);
    await engine.connect(deployer).setVoter(voter.address);
    await veStaking.setEngine(engine.address);

    // Deploy MasterContesterRegistry
    const MasterContesterRegistry = await ethers.getContractFactory("MasterContesterRegistry");
    masterContesterRegistry = await MasterContesterRegistry.deploy(votingEscrow.address);
    await masterContesterRegistry.deployed();

    await engine.connect(deployer).setMasterContesterRegistry(masterContesterRegistry.address);

    // Setup tokens
    await baseToken.connect(deployer).bridgeMint(await deployer.getAddress(), ethers.utils.parseEther("10000"));
    await baseToken.connect(deployer).transferOwnership(engine.address);

    // Setup approvals
    for (const signer of signers) {
      await baseToken.connect(signer).approve(engine.address, ethers.constants.MaxUint256);
    }

    // Bridge tokens to enable mining
    await baseToken.connect(deployer).bridgeMint(engine.address, ethers.utils.parseEther('597000'));
  });

  describe("V6 Core Features", () => {
    it("should verify V6 initialization", async () => {
      expect(await engine.version()).to.equal(6);
      expect(await engine.masterContesterVoteAdder()).to.equal(10);
      expect(await engine.masterContesterRegistry()).to.equal(masterContesterRegistry.address);
    });

    it("should handle master contester contestation with vote multiplier", async () => {
      // Setup validators
      for (const v of [validator1, validator2, masterContester1]) {
        await baseToken.connect(deployer).transfer(v.address, ethers.utils.parseEther("10"));
        await engine.connect(v).validatorDeposit(v.address, ethers.utils.parseEther("10"));
      }

      // Make masterContester1 a master contester
      await masterContesterRegistry.connect(deployer).emergencyAddMasterContester(masterContester1.address);

      // Deploy model and task
      const modelAddr = await model1.getAddress();
      const modelid = await engine.hashModel({
        addr: modelAddr,
        fee: ethers.utils.parseEther('0'),
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, user1.address);

      await engine.connect(user1).registerModel(modelAddr, ethers.utils.parseEther('0'), TESTBUF);

      // Submit task
      const taskParams = {
        version: BigNumber.from("0"),
        owner: user1.address,
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

      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Master contester submits contestation
      await expect(engine.connect(masterContester1).submitContestation(taskid))
        .to.emit(engine, "ContestationSubmitted")
        .withArgs(masterContester1.address, taskid);

      // Check that master contester auto-voted yes
      const yeaVotes = await engine.contestationVoteYeas(taskid, 0);
      expect(yeaVotes).to.equal(masterContester1.address);
    });

    it("should enforce master contester requirement for contestation", async () => {
      // Setup validators
      for (const v of [validator1, validator2]) {
        await baseToken.connect(deployer).transfer(v.address, ethers.utils.parseEther("10"));
        await engine.connect(v).validatorDeposit(v.address, ethers.utils.parseEther("10"));
      }

      // Deploy model and task
      const modelAddr = await model1.getAddress();
      const modelid = await engine.hashModel({
        addr: modelAddr,
        fee: ethers.utils.parseEther('0'),
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, user1.address);

      await engine.connect(user1).registerModel(modelAddr, ethers.utils.parseEther('0'), TESTBUF);

      // Submit task and solution
      const taskParams = {
        version: BigNumber.from("0"),
        owner: user1.address,
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

      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Regular validator cannot submit contestation
      await expect(engine.connect(validator2).submitContestation(taskid))
        .to.be.reverted;
    });

    it("should allow anyone to suggest contestation", async () => {
      // Setup validator
      await baseToken.connect(deployer).transfer(validator1.address, ethers.utils.parseEther("10"));
      await engine.connect(validator1).validatorDeposit(validator1.address, ethers.utils.parseEther("10"));

      // Deploy model and task
      const modelAddr = await model1.getAddress();
      const modelid = await engine.hashModel({
        addr: modelAddr,
        fee: ethers.utils.parseEther('0'),
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, user1.address);

      await engine.connect(user1).registerModel(modelAddr, ethers.utils.parseEther('0'), TESTBUF);

      // Submit task and solution
      const taskParams = {
        version: BigNumber.from("0"),
        owner: user1.address,
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

      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Anyone can suggest contestation
      await expect(engine.connect(user2).suggestContestation(taskid))
        .to.emit(engine, "ContestationSuggested")
        .withArgs(user2.address, taskid);
    });

    it("should handle model with allow list", async () => {
      // Setup validators
      for (const v of [validator1, validator2]) {
        await baseToken.connect(deployer).transfer(v.address, ethers.utils.parseEther("10"));
        await engine.connect(v).validatorDeposit(v.address, ethers.utils.parseEther("10"));
      }

      // Register model with allow list
      const modelAddr = await model1.getAddress();
      const uniqueBuf = ethers.utils.hexlify(ethers.utils.toUtf8Bytes("allowlist\n"));
      
      await engine.connect(user1).registerModelWithAllowList(
        modelAddr,
        ethers.utils.parseEther('0'),
        uniqueBuf,
        [validator1.address]
      );

      const modelid = await engine.hashModel({
        addr: modelAddr,
        fee: ethers.utils.parseEther('0'),
        rate: ethers.utils.parseEther('0'),
        cid: await engine.generateIPFSCID(uniqueBuf),
      }, user1.address);

      // Check allow list is required
      expect(await engine.modelRequiresAllowList(modelid)).to.be.true;
      expect(await engine.isSolverAllowed(modelid, validator1.address)).to.be.true;
      expect(await engine.isSolverAllowed(modelid, validator2.address)).to.be.false;

      // Submit task
      const taskParams = {
        version: BigNumber.from("0"),
        owner: user2.address,
        model: modelid,
        fee: ethers.utils.parseEther("0"),
        input: uniqueBuf,
      };

      const taskidReceipt = await (await engine
        .connect(user2)
        .submitTask(
          taskParams.version,
          taskParams.owner,
          taskParams.model,
          taskParams.fee,
          taskParams.input,
        )).wait();
      
      const taskid = taskidReceipt.events![0].args!.id;

      // Validator1 (allowed) can submit solution
      const cid = await engine.generateIPFSCID(uniqueBuf);
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      
      await expect(engine.connect(validator1).submitSolution(taskid, cid))
        .to.emit(engine, "SolutionSubmitted");
    });

    it("should manage allow list after model creation", async () => {
      // Deploy model first
      const modelAddr = await model1.getAddress();
      const modelid = await engine.hashModel({
        addr: modelAddr,
        fee: ethers.utils.parseEther('0'),
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, user1.address);

      await engine.connect(user1).registerModel(modelAddr, ethers.utils.parseEther('0'), TESTBUF);

      // Initially no allow list required
      expect(await engine.modelRequiresAllowList(modelid)).to.be.false;
      expect(await engine.isSolverAllowed(modelid, validator1.address)).to.be.true;

      // Enable allow list requirement (must be called by model owner, which is model1)
      await expect(
        engine.connect(model1).setModelAllowListRequired(modelid, true)
      ).to.emit(engine, "ModelAllowListRequirementChanged")
        .withArgs(modelid, true);

      // Now requires allow list but no one is allowed yet
      expect(await engine.modelRequiresAllowList(modelid)).to.be.true;
      expect(await engine.isSolverAllowed(modelid, validator1.address)).to.be.false;

      // Add validator1 to allow list (called by model owner)
      await expect(
        engine.connect(model1).addToModelAllowList(modelid, [validator1.address])
      ).to.emit(engine, "ModelAllowListUpdated")
        .withArgs(modelid, validator1.address, true);

      expect(await engine.isSolverAllowed(modelid, validator1.address)).to.be.true;

      // Remove validator1 from allow list (called by model owner)
      await expect(
        engine.connect(model1).removeFromModelAllowList(modelid, [validator1.address])
      ).to.emit(engine, "ModelAllowListUpdated")
        .withArgs(modelid, validator1.address, false);

      expect(await engine.isSolverAllowed(modelid, validator1.address)).to.be.false;
    });

    it("should stake rewards directly to validator", async () => {
      // Setup validator
      await baseToken.connect(deployer).transfer(validator1.address, ethers.utils.parseEther("10"));
      await engine.connect(validator1).validatorDeposit(validator1.address, ethers.utils.parseEther("10"));

      // Deploy model with rate for rewards
      const modelAddr = await model1.getAddress();
      const modelid = await engine.hashModel({
        addr: modelAddr,
        fee: ethers.utils.parseEther('0'),
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, user1.address);

      await engine.connect(user1).registerModel(modelAddr, ethers.utils.parseEther('0'), TESTBUF);
      await engine.connect(deployer).setSolutionMineableRate(modelid, ethers.utils.parseEther('1'));

      // Create gauge for rewards
      await voter.connect(deployer).createGauge(modelid);

      // Submit task and solution
      const taskParams = {
        version: BigNumber.from("0"),
        owner: user1.address,
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

      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Get stake before claiming
      const stakeBefore = (await engine.validators(validator1.address)).staked;
      const balanceBefore = await baseToken.balanceOf(validator1.address);

      // Wait and claim
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);

      await engine.connect(validator1).claimSolution(taskid);

      const stakeAfter = (await engine.validators(validator1.address)).staked;
      const balanceAfter = await baseToken.balanceOf(validator1.address);

      // Rewards should be staked, not transferred
      expect(stakeAfter).to.be.gt(stakeBefore);
      expect(balanceAfter).to.equal(balanceBefore);
    });
  });
});
