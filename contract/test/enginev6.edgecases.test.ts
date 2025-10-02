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

describe("EngineV6 Additional Edge Cases", () => {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let validator1: SignerWithAddress;
  let validator2: SignerWithAddress;
  let validator3: SignerWithAddress;
  let validator4: SignerWithAddress;
  let masterContester1: SignerWithAddress;
  let masterContester2: SignerWithAddress;
  let treasury: SignerWithAddress;
  let model1: SignerWithAddress;
  let model2: SignerWithAddress;

  let baseToken: BaseToken;
  let engine: V2EngineV6;
  let masterContesterRegistry: MasterContesterRegistry;
  let votingEscrow: VotingEscrow;
  let veStaking: VeStaking;
  let voter: Voter;
  let veNFTRender: VeNFTRender;

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
    masterContester1 = signers[8];
    masterContester2 = signers[9];
    treasury = signers[10];
    model1 = signers[11];
    model2 = signers[12];

    // Deploy BaseToken
    const BaseToken = await ethers.getContractFactory("BaseTokenV1");
    baseToken = (await upgrades.deployProxy(BaseToken, [
      await deployer.getAddress(),
      ethers.constants.AddressZero,
    ])) as BaseToken;
    await baseToken.deployed();

    // Deploy VE Stack
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

    await votingEscrow.connect(deployer).setVoter(voter.address);

    // Deploy and upgrade Engine
    const V2_EngineV1 = await ethers.getContractFactory("V2_EngineV1");
    const V2_EngineV2 = await ethers.getContractFactory("V2_EngineV2");
    const V2_EngineV3 = await ethers.getContractFactory("V2_EngineV3");
    const V2_EngineV4 = await ethers.getContractFactory("V2_EngineV4");
    const V2_EngineV5 = await ethers.getContractFactory("V2_EngineV5");
    const V2_EngineV5_2 = await ethers.getContractFactory("V2_EngineV5_2");
    const V2_EngineV6 = await ethers.getContractFactory("V2_EngineV6");

    engine = (await upgrades.deployProxy(V2_EngineV1, [
      baseToken.address,
      await treasury.getAddress(),
    ])) as V2EngineV1 as any;
    await engine.deployed();

    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV2) as V2EngineV2 as any;
    await engine.connect(deployer).setSolutionStakeAmount(ethers.utils.parseEther("0.001"));

    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV3, {
      call: "initialize",
    }) as V2EngineV3 as any;

    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV4, {
      call: "initialize",
    }) as V2EngineV4 as any;

    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV5, {
      call: "initialize",
    }) as V2EngineV5 as any;

    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV5_2, {
      call: "initialize",
    }) as V2EngineV5_2 as any;

    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV6, {
      call: "initialize",
    }) as V2EngineV6;

    await engine.connect(deployer).setVeStaking(veStaking.address);
    await engine.connect(deployer).setVoter(voter.address);
    await veStaking.connect(deployer).setEngine(engine.address);

    // Deploy MasterContesterRegistry
    const MasterContesterRegistry = await ethers.getContractFactory("MasterContesterRegistry");
    masterContesterRegistry = await MasterContesterRegistry.deploy(votingEscrow.address);
    await masterContesterRegistry.deployed();

    await engine.connect(deployer).setMasterContesterRegistry(masterContesterRegistry.address);

    // Setup tokens
    await baseToken.connect(deployer).bridgeMint(await deployer.getAddress(), ethers.utils.parseEther("10000"));
    await baseToken.connect(deployer).transferOwnership(engine.address);

    // Bridge tokens to engine for rewards
    await baseToken.connect(deployer).bridgeMint(engine.address, ethers.utils.parseEther('597000'));

    // Distribute tokens
    for (const signer of signers) {
      await baseToken.connect(deployer).transfer(signer.address, ethers.utils.parseEther("100"));
      await baseToken.connect(signer).approve(engine.address, ethers.constants.MaxUint256);
      await baseToken.connect(signer).approve(votingEscrow.address, ethers.constants.MaxUint256);
    }
  });

  describe("Master Contester Vote Adder Edge Cases", () => {
    beforeEach(async () => {
      // Setup validators
      for (const v of [validator1, validator2, validator3, validator4, masterContester1, masterContester2]) {
        await baseToken.connect(deployer).transfer(v.address, ethers.utils.parseEther("50"));
        await engine.connect(v).validatorDeposit(v.address, ethers.utils.parseEther("40"));
      }
    });

    it("should handle vote adder set to 0", async () => {
      await engine.connect(deployer).setMasterContesterVoteAdder(0);
      expect(await engine.masterContesterVoteAdder()).to.equal(0);

      await masterContesterRegistry.connect(deployer).emergencyAddMasterContester(masterContester1.address);

      // Register model and create task
      const modelAddr = await model1.getAddress();
      const modelid = await engine.hashModel({
        addr: modelAddr,
        fee: ethers.utils.parseEther('0'),
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, user1.address);
      await engine.connect(user1).registerModel(modelAddr, ethers.utils.parseEther('0'), TESTBUF);

      const taskParams = {
        version: BigNumber.from("0"),
        owner: await user1.getAddress(),
        model: modelid,
        fee: ethers.utils.parseEther("0"),
        input: TESTBUF,
      };

      const taskidReceipt = await (await engine.connect(user1).submitTask(
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
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Submit contestation
      await engine.connect(masterContester1).submitContestation(taskid);

      // With vote adder = 0, master contester should have same vote weight as regular validator
      const mcVoteCount = (await engine.contestationVoteYeas(taskid, 0)) === masterContester1.address ? 1 : 0;
      expect(mcVoteCount).to.equal(1); // Should have voted yea automatically
    });

    it("should handle vote adder at maximum (500)", async () => {
      await engine.connect(deployer).setMasterContesterVoteAdder(500);
      expect(await engine.masterContesterVoteAdder()).to.equal(500);
    });

    it("should reject vote adder above maximum", async () => {
      await expect(engine.connect(deployer).setMasterContesterVoteAdder(501))
        .to.be.reverted;
    });

    it("should handle multiple master contesters with vote adder", async () => {
      await engine.connect(deployer).setMasterContesterVoteAdder(10);
      await masterContesterRegistry.connect(deployer).emergencyAddMasterContester(masterContester1.address);
      await masterContesterRegistry.connect(deployer).emergencyAddMasterContester(masterContester2.address);

      // Register model and create task
      const modelAddr = await model1.getAddress();
      const modelid = await engine.hashModel({
        addr: modelAddr,
        fee: ethers.utils.parseEther('0'),
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, user1.address);
      await engine.connect(user1).registerModel(modelAddr, ethers.utils.parseEther('0'), TESTBUF);

      const taskParams = {
        version: BigNumber.from("0"),
        owner: await user1.getAddress(),
        model: modelid,
        fee: ethers.utils.parseEther("0"),
        input: TESTBUF,
      };

      const taskidReceipt = await (await engine.connect(user1).submitTask(
        taskParams.version,
        taskParams.owner,
        taskParams.model,
        taskParams.fee,
        taskParams.input,
      )).wait();

      const taskid = taskidReceipt.events![0].args!.id;

      // Submit solution by masterContester1
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(masterContester1.address, taskid, cid);
      await engine.connect(masterContester1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(masterContester1).submitSolution(taskid, cid);

      // MasterContester2 contests
      await engine.connect(masterContester2).submitContestation(taskid);

      // Both master contesters should have auto-voted
      expect(await engine.contestationVoted(taskid, masterContester1.address)).to.be.true;
      expect(await engine.contestationVoted(taskid, masterContester2.address)).to.be.true;
    });
  });

  describe("Allow List Edge Cases", () => {
    let modelid: string;

    beforeEach(async () => {
      // Setup validators
      for (const v of [validator1, validator2, validator3]) {
        await baseToken.connect(deployer).transfer(v.address, ethers.utils.parseEther("50"));
        await engine.connect(v).validatorDeposit(v.address, ethers.utils.parseEther("40"));
      }

      // Register model
      const modelAddr = await model1.getAddress();
      modelid = await engine.hashModel({
        addr: modelAddr,
        fee: ethers.utils.parseEther('0'),
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, model1.address);
      await engine.connect(model1).registerModel(modelAddr, ethers.utils.parseEther('0'), TESTBUF);
    });

    it("should handle empty allow list when required", async () => {
      // Enable allow list but don't add anyone
      await engine.connect(model1).setModelAllowListRequired(modelid, true);
      expect(await engine.modelRequiresAllowList(modelid)).to.be.true;

      // No one should be allowed
      expect(await engine.isSolverAllowed(modelid, validator1.address)).to.be.false;
      expect(await engine.isSolverAllowed(modelid, validator2.address)).to.be.false;

      // Trying to submit solution should fail
      const taskParams = {
        version: BigNumber.from("0"),
        owner: await user1.getAddress(),
        model: modelid,
        fee: ethers.utils.parseEther("0"),
        input: TESTBUF,
      };

      const taskidReceipt = await (await engine.connect(user1).submitTask(
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
      await ethers.provider.send("evm_mine", []);

      await expect(engine.connect(validator1).submitSolution(taskid, cid))
        .to.be.reverted;
    });

    it("should handle adding duplicate addresses to allow list", async () => {
      await engine.connect(model1).setModelAllowListRequired(modelid, true);

      // Add validator1 twice
      await engine.connect(model1).addToModelAllowList(modelid, [validator1.address]);
      await engine.connect(model1).addToModelAllowList(modelid, [validator1.address]);

      // Should still be allowed
      expect(await engine.isSolverAllowed(modelid, validator1.address)).to.be.true;
    });

    it("should handle removing address not in allow list", async () => {
      await engine.connect(model1).setModelAllowListRequired(modelid, true);

      // Remove validator1 who was never added
      await engine.connect(model1).removeFromModelAllowList(modelid, [validator1.address]);

      // Should still not be allowed
      expect(await engine.isSolverAllowed(modelid, validator1.address)).to.be.false;
    });

    it("should handle toggling allow list requirement multiple times", async () => {
      // Enable
      await engine.connect(model1).setModelAllowListRequired(modelid, true);
      expect(await engine.modelRequiresAllowList(modelid)).to.be.true;
      expect(await engine.isSolverAllowed(modelid, validator1.address)).to.be.false;

      // Disable
      await engine.connect(model1).setModelAllowListRequired(modelid, false);
      expect(await engine.modelRequiresAllowList(modelid)).to.be.false;
      expect(await engine.isSolverAllowed(modelid, validator1.address)).to.be.true;

      // Enable again
      await engine.connect(model1).setModelAllowListRequired(modelid, true);
      expect(await engine.modelRequiresAllowList(modelid)).to.be.true;
      expect(await engine.isSolverAllowed(modelid, validator1.address)).to.be.false;
    });

    it("should reject non-owner modifying allow list", async () => {
      // user1 is not the model owner
      await expect(engine.connect(user1).setModelAllowListRequired(modelid, true))
        .to.be.reverted;

      await expect(engine.connect(user1).addToModelAllowList(modelid, [validator1.address]))
        .to.be.reverted;

      await expect(engine.connect(user1).removeFromModelAllowList(modelid, [validator1.address]))
        .to.be.reverted;
    });

    it("should allow contract owner to modify allow list", async () => {
      // Deployer is the contract owner
      await expect(engine.connect(deployer).setModelAllowListRequired(modelid, true))
        .to.emit(engine, "ModelAllowListRequirementChanged");

      await expect(engine.connect(deployer).addToModelAllowList(modelid, [validator1.address]))
        .to.emit(engine, "ModelAllowListUpdated");

      expect(await engine.isSolverAllowed(modelid, validator1.address)).to.be.true;
    });

    it("should handle batch operations on allow list", async () => {
      await engine.connect(model1).setModelAllowListRequired(modelid, true);

      // Add multiple addresses at once
      await engine.connect(model1).addToModelAllowList(
        modelid,
        [validator1.address, validator2.address, validator3.address]
      );

      expect(await engine.isSolverAllowed(modelid, validator1.address)).to.be.true;
      expect(await engine.isSolverAllowed(modelid, validator2.address)).to.be.true;
      expect(await engine.isSolverAllowed(modelid, validator3.address)).to.be.true;

      // Remove multiple addresses at once
      await engine.connect(model1).removeFromModelAllowList(
        modelid,
        [validator1.address, validator2.address]
      );

      expect(await engine.isSolverAllowed(modelid, validator1.address)).to.be.false;
      expect(await engine.isSolverAllowed(modelid, validator2.address)).to.be.false;
      expect(await engine.isSolverAllowed(modelid, validator3.address)).to.be.true;
    });
  });

  describe("Solution Model Fee Override Edge Cases", () => {
    let modelid1: string;
    let modelid2: string;

    beforeEach(async () => {
      // Setup validators
      for (const v of [validator1, validator2]) {
        await baseToken.connect(deployer).transfer(v.address, ethers.utils.parseEther("50"));
        await engine.connect(v).validatorDeposit(v.address, ethers.utils.parseEther("40"));
      }

      // Register two models
      const modelAddr1 = await model1.getAddress();
      modelid1 = await engine.hashModel({
        addr: modelAddr1,
        fee: ethers.utils.parseEther('0.1'),
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, model1.address);
      await engine.connect(model1).registerModel(modelAddr1, ethers.utils.parseEther('0.1'), TESTBUF);

      const modelAddr2 = await model2.getAddress();
      modelid2 = await engine.hashModel({
        addr: modelAddr2,
        fee: ethers.utils.parseEther('0.1'),
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, model2.address);
      await engine.connect(model2).registerModel(modelAddr2, ethers.utils.parseEther('0.1'), TESTBUF);
    });

    it("should handle 100% treasury override (all to treasury)", async () => {
      // Set 100% to treasury
      await engine.connect(deployer).setSolutionModelFeePercentageOverride(
        modelid1,
        ethers.utils.parseEther("1") // 100%
      );

      const modelAddr = await model1.getAddress();
      const modelBalanceBefore = await baseToken.balanceOf(modelAddr);
      const treasuryFeesBefore = await engine.accruedFees();

      // Submit task
      const taskFee = ethers.utils.parseEther("0.2");
      await baseToken.connect(deployer).transfer(user1.address, taskFee);

      const taskParams = {
        version: BigNumber.from("0"),
        owner: await user1.getAddress(),
        model: modelid1,
        fee: taskFee,
        input: TESTBUF,
      };

      const taskidReceipt = await (await engine.connect(user1).submitTask(
        taskParams.version,
        taskParams.owner,
        taskParams.model,
        taskParams.fee,
        taskParams.input,
      )).wait();

      const taskid = taskidReceipt.events![0].args!.id;

      // Submit and claim solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid, cid);

      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);

      await engine.connect(validator1).claimSolution(taskid);

      const modelBalanceAfter = await baseToken.balanceOf(modelAddr);
      const treasuryFeesAfter = await engine.accruedFees();

      // Model owner should receive nothing (all went to treasury)
      expect(modelBalanceAfter).to.equal(modelBalanceBefore);

      // Treasury fees should have increased by model fee amount
      const model = await engine.models(modelid1);
      expect(treasuryFeesAfter).to.be.gt(treasuryFeesBefore);
    });

    it("should handle multiple models with different overrides", async () => {
      // Model1: 100% to treasury
      await engine.connect(deployer).setSolutionModelFeePercentageOverride(
        modelid1,
        ethers.utils.parseEther("1") // 100%
      );

      // Model2: 0% to treasury (all to model owner)
      await engine.connect(deployer).setSolutionModelFeePercentageOverride(
        modelid2,
        ethers.utils.parseEther("0") // 0%
      );

      // Verify overrides are set
      expect(await engine.solutionModelFeePercentageOverride(modelid1))
        .to.equal(ethers.utils.parseEther("1"));
      expect(await engine.solutionModelFeePercentageOverride(modelid2))
        .to.equal(ethers.utils.parseEther("0"));
    });

    it("should reject override above 100%", async () => {
      await expect(engine.connect(deployer).setSolutionModelFeePercentageOverride(
        modelid1,
        ethers.utils.parseEther("1.01") // 101%
      )).to.be.reverted;
    });

    it("should reject setting override for non-existent model", async () => {
      const fakeModelId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("fake"));
      await expect(engine.connect(deployer).setSolutionModelFeePercentageOverride(
        fakeModelId,
        ethers.utils.parseEther("0.5")
      )).to.be.reverted;
    });

    it("should correctly track which models have overrides", async () => {
      expect(await engine.hasSolutionModelFeePercentageOverride(modelid1)).to.be.false;

      await engine.connect(deployer).setSolutionModelFeePercentageOverride(
        modelid1,
        ethers.utils.parseEther("0.5")
      );

      expect(await engine.hasSolutionModelFeePercentageOverride(modelid1)).to.be.true;
      expect(await engine.hasSolutionModelFeePercentageOverride(modelid2)).to.be.false;
    });
  });

  describe("V6 Feature Interactions", () => {
    let modelid: string;

    beforeEach(async () => {
      // Setup validators
      for (const v of [validator1, validator2, masterContester1]) {
        await baseToken.connect(deployer).transfer(v.address, ethers.utils.parseEther("50"));
        await engine.connect(v).validatorDeposit(v.address, ethers.utils.parseEther("40"));
      }

      await masterContesterRegistry.connect(deployer).emergencyAddMasterContester(masterContester1.address);

      // Register model
      const modelAddr = await model1.getAddress();
      modelid = await engine.hashModel({
        addr: modelAddr,
        fee: ethers.utils.parseEther('0.1'),
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, model1.address);
      await engine.connect(model1).registerModel(modelAddr, ethers.utils.parseEther('0.1'), TESTBUF);
    });

    it("should handle allow list + master contester contestation", async () => {
      // Enable allow list and add only validator1
      await engine.connect(model1).setModelAllowListRequired(modelid, true);
      await engine.connect(model1).addToModelAllowList(modelid, [validator1.address]);

      // Submit task
      const taskParams = {
        version: BigNumber.from("0"),
        owner: await user1.getAddress(),
        model: modelid,
        fee: ethers.utils.parseEther("0.2"),
        input: TESTBUF,
      };

      await baseToken.connect(deployer).transfer(user1.address, taskParams.fee);

      const taskidReceipt = await (await engine.connect(user1).submitTask(
        taskParams.version,
        taskParams.owner,
        taskParams.model,
        taskParams.fee,
        taskParams.input,
      )).wait();

      const taskid = taskidReceipt.events![0].args!.id;

      // validator1 (allowed) submits solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Master contester contests
      await expect(engine.connect(masterContester1).submitContestation(taskid))
        .to.emit(engine, "ContestationSubmitted");

      // Verify contestation was created
      const contestation = await engine.contestations(taskid);
      expect(contestation.validator).to.equal(masterContester1.address);
    });

    it("should handle fee override + contestation + vote adder", async () => {
      // Set 0% treasury fee (all to model owner)
      await engine.connect(deployer).setSolutionModelFeePercentageOverride(
        modelid,
        ethers.utils.parseEther("0")
      );

      // Set vote adder to 10
      await engine.connect(deployer).setMasterContesterVoteAdder(10);

      // Submit task
      const taskParams = {
        version: BigNumber.from("0"),
        owner: await user1.getAddress(),
        model: modelid,
        fee: ethers.utils.parseEther("0.2"),
        input: TESTBUF,
      };

      await baseToken.connect(deployer).transfer(user1.address, taskParams.fee);

      const taskidReceipt = await (await engine.connect(user1).submitTask(
        taskParams.version,
        taskParams.owner,
        taskParams.model,
        taskParams.fee,
        taskParams.input,
      )).wait();

      const taskid = taskidReceipt.events![0].args!.id;

      // validator1 submits solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Master contester contests
      await engine.connect(masterContester1).submitContestation(taskid);

      // Verify the contestation was created with vote adder and override active
      const contestation = await engine.contestations(taskid);
      expect(contestation.validator).to.equal(masterContester1.address);
      expect(await engine.hasSolutionModelFeePercentageOverride(modelid)).to.be.true;
      expect(await engine.masterContesterVoteAdder()).to.equal(10);
    });

    it("should handle all v6 features together", async () => {
      // Enable all v6 features:
      // 1. Allow list
      await engine.connect(model1).setModelAllowListRequired(modelid, true);
      await engine.connect(model1).addToModelAllowList(modelid, [validator1.address]);

      // 2. Fee override
      await engine.connect(deployer).setSolutionModelFeePercentageOverride(
        modelid,
        ethers.utils.parseEther("0.2") // 20% to treasury
      );

      // 3. Vote adder
      await engine.connect(deployer).setMasterContesterVoteAdder(5);

      // Submit and process task
      const taskParams = {
        version: BigNumber.from("0"),
        owner: await user1.getAddress(),
        model: modelid,
        fee: ethers.utils.parseEther("0.2"),
        input: TESTBUF,
      };

      await baseToken.connect(deployer).transfer(user1.address, taskParams.fee);

      const taskidReceipt = await (await engine.connect(user1).submitTask(
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
      await ethers.provider.send("evm_mine", []);

      // validator1 is allowed, so this should work
      await expect(engine.connect(validator1).submitSolution(taskid, cid))
        .to.emit(engine, "SolutionSubmitted");

      // Verify all features are active
      expect(await engine.modelRequiresAllowList(modelid)).to.be.true;
      expect(await engine.hasSolutionModelFeePercentageOverride(modelid)).to.be.true;
      expect(await engine.masterContesterVoteAdder()).to.equal(5);
    });
  });
});
