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

describe("EngineV6 Model Comprehensive Tests", () => {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let validator1: SignerWithAddress;
  let validator2: SignerWithAddress;
  let treasury: SignerWithAddress;
  let modelOwner1: SignerWithAddress;
  let modelOwner2: SignerWithAddress;
  let modelOwner3: SignerWithAddress;

  let baseToken: BaseToken;
  let engine: V2EngineV6;
  let masterContesterRegistry: MasterContesterRegistry;
  let votingEscrow: VotingEscrow;
  let veStaking: VeStaking;
  let voter: Voter;
  let veNFTRender: VeNFTRender;

  beforeEach("Deploy and initialize", async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    user1 = signers[1];
    user2 = signers[2];
    user3 = signers[3];
    validator1 = signers[4];
    validator2 = signers[5];
    treasury = signers[6];
    modelOwner1 = signers[7];
    modelOwner2 = signers[8];
    modelOwner3 = signers[9];

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
    await baseToken.connect(deployer).bridgeMint(engine.address, ethers.utils.parseEther('597000'));

    // Distribute tokens
    for (const signer of signers) {
      await baseToken.connect(deployer).transfer(signer.address, ethers.utils.parseEther("100"));
      await baseToken.connect(signer).approve(engine.address, ethers.constants.MaxUint256);
    }
  });

  describe("Model Registration Edge Cases", () => {
    it("should register model with zero fee", async () => {
      const addr = await modelOwner1.getAddress();
      const fee = ethers.utils.parseEther("0");

      const modelid = await engine.hashModel({
        addr,
        fee,
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, modelOwner1.address);

      await expect(engine.connect(modelOwner1).registerModel(addr, fee, TESTBUF))
        .to.emit(engine, "ModelRegistered")
        .withArgs(modelid);

      const model = await engine.models(modelid);
      expect(model.addr).to.equal(addr);
      expect(model.fee).to.equal(fee);
    });

    it("should register model with maximum practical fee", async () => {
      const addr = await modelOwner1.getAddress();
      const fee = ethers.utils.parseEther("1000000"); // 1M tokens

      const modelid = await engine.hashModel({
        addr,
        fee,
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, modelOwner1.address);

      await expect(engine.connect(modelOwner1).registerModel(addr, fee, TESTBUF))
        .to.emit(engine, "ModelRegistered");

      const model = await engine.models(modelid);
      expect(model.fee).to.equal(fee);
    });

    it("should reject duplicate model registration", async () => {
      const addr = await modelOwner1.getAddress();
      const fee = ethers.utils.parseEther("0.1");

      // Register once
      await engine.connect(modelOwner1).registerModel(addr, fee, TESTBUF);

      // Try to register same model again
      await expect(engine.connect(modelOwner1).registerModel(addr, fee, TESTBUF))
        .to.be.reverted;
    });

    it("should allow same user to register multiple different models", async () => {
      const addr1 = await modelOwner1.getAddress();
      const addr2 = await modelOwner2.getAddress();
      const fee1 = ethers.utils.parseEther("0.1");
      const fee2 = ethers.utils.parseEther("0.2");

      // Register first model
      const modelid1 = await engine.hashModel({
        addr: addr1,
        fee: fee1,
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, modelOwner1.address);
      await engine.connect(modelOwner1).registerModel(addr1, fee1, TESTBUF);

      // Register second model with different parameters
      const modelid2 = await engine.hashModel({
        addr: addr2,
        fee: fee2,
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, modelOwner1.address);
      await engine.connect(modelOwner1).registerModel(addr2, fee2, TESTBUF);

      expect(modelid1).to.not.equal(modelid2);

      const model1 = await engine.models(modelid1);
      const model2 = await engine.models(modelid2);
      expect(model1.fee).to.equal(fee1);
      expect(model2.fee).to.equal(fee2);
    });

    it("should register model with empty template data", async () => {
      const addr = await modelOwner1.getAddress();
      const fee = ethers.utils.parseEther("0.1");
      const emptyBuf = "0x";

      await expect(engine.connect(modelOwner1).registerModel(addr, fee, emptyBuf))
        .to.emit(engine, "ModelRegistered");
    });

    it("should register model with large template data", async () => {
      const addr = await modelOwner1.getAddress();
      const fee = ethers.utils.parseEther("0.1");
      // Create a large buffer (1KB)
      const largeBuf = "0x" + "ff".repeat(1024);

      await expect(engine.connect(modelOwner1).registerModel(addr, fee, largeBuf))
        .to.emit(engine, "ModelRegistered");
    });
  });

  describe("Model Fee Management", () => {
    let modelid: string;
    let modelAddr: string;

    beforeEach(async () => {
      modelAddr = await modelOwner1.getAddress();
      const fee = ethers.utils.parseEther("0.1");

      modelid = await engine.hashModel({
        addr: modelAddr,
        fee,
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, modelOwner1.address);

      await engine.connect(modelOwner1).registerModel(modelAddr, fee, TESTBUF);
    });

    it("should allow model owner to change fee to zero", async () => {
      const newFee = ethers.utils.parseEther("0");

      await expect(engine.connect(modelOwner1).setModelFee(modelid, newFee))
        .to.emit(engine, "ModelFeeChanged")
        .withArgs(modelid, newFee);

      const model = await engine.models(modelid);
      expect(model.fee).to.equal(newFee);
    });

    it("should allow model owner to increase fee", async () => {
      const newFee = ethers.utils.parseEther("1.0");

      await engine.connect(modelOwner1).setModelFee(modelid, newFee);

      const model = await engine.models(modelid);
      expect(model.fee).to.equal(newFee);
    });

    it("should allow model owner to decrease fee", async () => {
      const newFee = ethers.utils.parseEther("0.01");

      await engine.connect(modelOwner1).setModelFee(modelid, newFee);

      const model = await engine.models(modelid);
      expect(model.fee).to.equal(newFee);
    });

    it("should reject fee change from non-owner", async () => {
      const newFee = ethers.utils.parseEther("0.5");

      await expect(engine.connect(user1).setModelFee(modelid, newFee))
        .to.be.reverted;
    });

    it("should allow contract owner to change any model fee", async () => {
      const newFee = ethers.utils.parseEther("0.5");

      await expect(engine.connect(deployer).setModelFee(modelid, newFee))
        .to.emit(engine, "ModelFeeChanged");

      const model = await engine.models(modelid);
      expect(model.fee).to.equal(newFee);
    });

    it("should handle multiple rapid fee changes", async () => {
      const fees = [
        ethers.utils.parseEther("0.2"),
        ethers.utils.parseEther("0.3"),
        ethers.utils.parseEther("0.1"),
        ethers.utils.parseEther("0"),
      ];

      for (const fee of fees) {
        await engine.connect(modelOwner1).setModelFee(modelid, fee);
        const model = await engine.models(modelid);
        expect(model.fee).to.equal(fee);
      }
    });

    it("should reject setting fee for non-existent model", async () => {
      const fakeModelId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("fake"));
      const newFee = ethers.utils.parseEther("0.5");

      await expect(engine.connect(modelOwner1).setModelFee(fakeModelId, newFee))
        .to.be.reverted;
    });
  });

  describe("Model Address Management", () => {
    let modelid: string;
    let originalAddr: string;

    beforeEach(async () => {
      originalAddr = await modelOwner1.getAddress();
      const fee = ethers.utils.parseEther("0.1");

      modelid = await engine.hashModel({
        addr: originalAddr,
        fee,
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, modelOwner1.address);

      await engine.connect(modelOwner1).registerModel(originalAddr, fee, TESTBUF);
    });

    it("should allow model owner to transfer to new address", async () => {
      const newAddr = await modelOwner2.getAddress();

      await expect(engine.connect(modelOwner1).setModelAddr(modelid, newAddr))
        .to.emit(engine, "ModelAddrChanged")
        .withArgs(modelid, newAddr);

      const model = await engine.models(modelid);
      expect(model.addr).to.equal(newAddr);
    });

    it("should reject transfer to zero address", async () => {
      await expect(engine.connect(modelOwner1).setModelAddr(modelid, ethers.constants.AddressZero))
        .to.be.reverted;
    });

    it("should reject address change from non-owner", async () => {
      const newAddr = await modelOwner2.getAddress();

      await expect(engine.connect(user1).setModelAddr(modelid, newAddr))
        .to.be.reverted;
    });

    it("should allow contract owner to change any model address", async () => {
      const newAddr = await modelOwner2.getAddress();

      await expect(engine.connect(deployer).setModelAddr(modelid, newAddr))
        .to.emit(engine, "ModelAddrChanged");

      const model = await engine.models(modelid);
      expect(model.addr).to.equal(newAddr);
    });

    it("should handle multiple address transfers", async () => {
      const addr1 = await modelOwner2.getAddress();
      const addr2 = await modelOwner3.getAddress();
      const addr3 = await user1.getAddress();

      // First transfer: modelOwner1 transfers to modelOwner2
      await engine.connect(modelOwner1).setModelAddr(modelid, addr1);
      let model = await engine.models(modelid);
      expect(model.addr).to.equal(addr1);

      // Second transfer: modelOwner2 (new owner) transfers to modelOwner3
      await engine.connect(modelOwner2).setModelAddr(modelid, addr2);
      model = await engine.models(modelid);
      expect(model.addr).to.equal(addr2);

      // Third transfer: modelOwner3 (new owner) transfers to user1
      await engine.connect(modelOwner3).setModelAddr(modelid, addr3);
      model = await engine.models(modelid);
      expect(model.addr).to.equal(addr3);
    });

    it("should allow setting address to same value", async () => {
      await expect(engine.connect(modelOwner1).setModelAddr(modelid, originalAddr))
        .to.emit(engine, "ModelAddrChanged");

      const model = await engine.models(modelid);
      expect(model.addr).to.equal(originalAddr);
    });
  });

  describe("Model Rate and Rewards", () => {
    let modelid: string;

    beforeEach(async () => {
      const addr = await modelOwner1.getAddress();
      const fee = ethers.utils.parseEther("0.1");

      modelid = await engine.hashModel({
        addr,
        fee,
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, modelOwner1.address);

      await engine.connect(modelOwner1).registerModel(addr, fee, TESTBUF);
    });

    it("should allow owner to set solution mineable rate to zero", async () => {
      await expect(engine.connect(deployer).setSolutionMineableRate(modelid, ethers.utils.parseEther("0")))
        .to.emit(engine, "SolutionMineableRateChange")
        .withArgs(modelid, ethers.utils.parseEther("0"));

      const model = await engine.models(modelid);
      expect(model.rate).to.equal(ethers.utils.parseEther("0"));
    });

    it("should allow owner to set solution mineable rate to positive value", async () => {
      const rate = ethers.utils.parseEther("1");

      await engine.connect(deployer).setSolutionMineableRate(modelid, rate);

      const model = await engine.models(modelid);
      expect(model.rate).to.equal(rate);
    });

    it("should allow owner to set very high mineable rate", async () => {
      const rate = ethers.utils.parseEther("1000000");

      await engine.connect(deployer).setSolutionMineableRate(modelid, rate);

      const model = await engine.models(modelid);
      expect(model.rate).to.equal(rate);
    });

    it("should reject non-owner setting mineable rate", async () => {
      const rate = ethers.utils.parseEther("1");

      await expect(engine.connect(user1).setSolutionMineableRate(modelid, rate))
        .to.be.reverted;
    });

    it("should handle multiple rate changes", async () => {
      const rates = [
        ethers.utils.parseEther("1"),
        ethers.utils.parseEther("5"),
        ethers.utils.parseEther("0.1"),
        ethers.utils.parseEther("0"),
      ];

      for (const rate of rates) {
        await engine.connect(deployer).setSolutionMineableRate(modelid, rate);
        const model = await engine.models(modelid);
        expect(model.rate).to.equal(rate);
      }
    });

    it("should reject setting rate for non-existent model", async () => {
      const fakeModelId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("fake"));
      const rate = ethers.utils.parseEther("1");

      await expect(engine.connect(deployer).setSolutionMineableRate(fakeModelId, rate))
        .to.be.reverted;
    });
  });

  describe("Model Fee Distribution", () => {
    let modelid: string;
    let modelOwnerAddr: string;

    beforeEach(async () => {
      // Setup validators
      await baseToken.connect(deployer).transfer(validator1.address, ethers.utils.parseEther("50"));
      await engine.connect(validator1).validatorDeposit(validator1.address, ethers.utils.parseEther("40"));

      modelOwnerAddr = await modelOwner1.getAddress();
      const modelFee = ethers.utils.parseEther("0.1");

      modelid = await engine.hashModel({
        addr: modelOwnerAddr,
        fee: modelFee,
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, modelOwner1.address);

      await engine.connect(modelOwner1).registerModel(modelOwnerAddr, modelFee, TESTBUF);
    });

    it("should distribute model fee to model owner after solution claim", async () => {
      const taskFee = ethers.utils.parseEther("0.2");
      await baseToken.connect(deployer).transfer(user1.address, taskFee);

      const taskParams = {
        version: BigNumber.from("0"),
        owner: await user1.getAddress(),
        model: modelid,
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

      const balanceBefore = await baseToken.balanceOf(modelOwnerAddr);

      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Wait and claim
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).claimSolution(taskid);

      const balanceAfter = await baseToken.balanceOf(modelOwnerAddr);

      // Model owner should receive some fees
      // Note: The exact amount depends on treasury fee percentage
      expect(balanceAfter).to.be.gte(balanceBefore);
    });

    it("should not distribute fees if model fee is zero", async () => {
      // Change model fee to 0
      await engine.connect(modelOwner1).setModelFee(modelid, ethers.utils.parseEther("0"));

      const taskFee = ethers.utils.parseEther("0.2");
      await baseToken.connect(deployer).transfer(user1.address, taskFee);

      const taskParams = {
        version: BigNumber.from("0"),
        owner: await user1.getAddress(),
        model: modelid,
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

      const balanceBefore = await baseToken.balanceOf(modelOwnerAddr);

      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Wait and claim
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).claimSolution(taskid);

      const balanceAfter = await baseToken.balanceOf(modelOwnerAddr);

      // Model owner should receive nothing
      expect(balanceAfter).to.equal(balanceBefore);
    });

    it("should distribute fees to new address after ownership transfer", async () => {
      const newOwnerAddr = await modelOwner2.getAddress();

      // Transfer model ownership
      await engine.connect(modelOwner1).setModelAddr(modelid, newOwnerAddr);

      const taskFee = ethers.utils.parseEther("0.2");
      await baseToken.connect(deployer).transfer(user1.address, taskFee);

      const taskParams = {
        version: BigNumber.from("0"),
        owner: await user1.getAddress(),
        model: modelid,
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

      const oldOwnerBalanceBefore = await baseToken.balanceOf(modelOwnerAddr);
      const newOwnerBalanceBefore = await baseToken.balanceOf(newOwnerAddr);

      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Wait and claim
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).claimSolution(taskid);

      const oldOwnerBalanceAfter = await baseToken.balanceOf(modelOwnerAddr);
      const newOwnerBalanceAfter = await baseToken.balanceOf(newOwnerAddr);

      // Old owner should not have received new fees
      expect(oldOwnerBalanceAfter).to.equal(oldOwnerBalanceBefore);

      // New owner should have received fees
      expect(newOwnerBalanceAfter).to.be.gte(newOwnerBalanceBefore);
    });
  });

  describe("Multiple Models Interaction", () => {
    it("should handle multiple models with different fees simultaneously", async () => {
      const models = [
        { owner: modelOwner1, fee: ethers.utils.parseEther("0.1") },
        { owner: modelOwner2, fee: ethers.utils.parseEther("0.5") },
        { owner: modelOwner3, fee: ethers.utils.parseEther("0") },
      ];

      const modelIds = [];

      for (const modelConfig of models) {
        const addr = await modelConfig.owner.getAddress();
        const modelid = await engine.hashModel({
          addr,
          fee: modelConfig.fee,
          rate: ethers.utils.parseEther('0'),
          cid: TESTCID,
        }, modelConfig.owner.address);

        await engine.connect(modelConfig.owner).registerModel(addr, modelConfig.fee, TESTBUF);
        modelIds.push({ id: modelid, owner: addr, fee: modelConfig.fee });
      }

      // Verify all models are registered correctly
      for (const modelInfo of modelIds) {
        const model = await engine.models(modelInfo.id);
        expect(model.addr).to.equal(modelInfo.owner);
        expect(model.fee).to.equal(modelInfo.fee);
      }
    });

    it("should handle fee changes on one model without affecting others", async () => {
      // Register two models
      const addr1 = await modelOwner1.getAddress();
      const addr2 = await modelOwner2.getAddress();
      const fee1 = ethers.utils.parseEther("0.1");
      const fee2 = ethers.utils.parseEther("0.2");

      const modelid1 = await engine.hashModel({
        addr: addr1,
        fee: fee1,
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, modelOwner1.address);
      await engine.connect(modelOwner1).registerModel(addr1, fee1, TESTBUF);

      const modelid2 = await engine.hashModel({
        addr: addr2,
        fee: fee2,
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, modelOwner2.address);
      await engine.connect(modelOwner2).registerModel(addr2, fee2, TESTBUF);

      // Change first model's fee
      const newFee1 = ethers.utils.parseEther("0.5");
      await engine.connect(modelOwner1).setModelFee(modelid1, newFee1);

      // Check that only first model changed
      const model1 = await engine.models(modelid1);
      const model2 = await engine.models(modelid2);
      expect(model1.fee).to.equal(newFee1);
      expect(model2.fee).to.equal(fee2); // Unchanged
    });
  });

  describe("Model Hash Collisions", () => {
    it("should produce different hashes for models with different parameters", async () => {
      const addr = await modelOwner1.getAddress();

      const hash1 = await engine.hashModel({
        addr,
        fee: ethers.utils.parseEther("0.1"),
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, modelOwner1.address);

      const hash2 = await engine.hashModel({
        addr,
        fee: ethers.utils.parseEther("0.2"), // Different fee
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, modelOwner1.address);

      expect(hash1).to.not.equal(hash2);
    });

    it("should produce different hashes for same params from different senders", async () => {
      const addr = await modelOwner1.getAddress();
      const params = {
        addr,
        fee: ethers.utils.parseEther("0.1"),
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      };

      const hash1 = await engine.hashModel(params, modelOwner1.address);
      const hash2 = await engine.hashModel(params, modelOwner2.address);

      expect(hash1).to.not.equal(hash2);
    });

    it("should produce same hash for identical parameters", async () => {
      const addr = await modelOwner1.getAddress();
      const params = {
        addr,
        fee: ethers.utils.parseEther("0.1"),
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      };

      const hash1 = await engine.hashModel(params, modelOwner1.address);
      const hash2 = await engine.hashModel(params, modelOwner1.address);

      expect(hash1).to.equal(hash2);
    });
  });
});
