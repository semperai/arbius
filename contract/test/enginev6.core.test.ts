import { ethers, upgrades } from "hardhat";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "./chai-setup";
import { BaseTokenV1 as BaseToken } from "../typechain/contracts/BaseTokenV1";
import { V2_EngineV6 } from "../typechain/contracts/V2_EngineV6";
import { MasterContesterRegistry } from "../typechain/contracts/MasterContesterRegistry";
import { VeStaking } from "../typechain/contracts/ve/VeStaking";
import { VotingEscrow } from "../typechain/contracts/ve/VotingEscrow";
import { VeNFTRender } from "../typechain/contracts/ve/VeNFTRender";
import { Voter } from "../typechain/contracts/ve/Voter";
import { setupTest, TESTCID, TESTBUF } from "./helpers/setup";

describe("EngineV6 Core Tests", () => {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let validator1: SignerWithAddress;
  let validator2: SignerWithAddress;
  let validator3: SignerWithAddress;
  let validator4: SignerWithAddress;
  let masterContester1: SignerWithAddress;
  let masterContester2: SignerWithAddress;
  let treasury: SignerWithAddress;
  let model1: SignerWithAddress;

  let baseToken: BaseToken;
  let engine: V2_EngineV6;
  let masterContesterRegistry: MasterContesterRegistry;
  let veStaking: VeStaking;
  let votingEscrow: VotingEscrow;
  let veNFTRender: VeNFTRender;
  let voter: Voter;

  beforeEach("Deploy and initialize", async () => {
    const setup = await setupTest();
    ({
      signers,
      deployer,
      user1,
      user2,
      validator1,
      validator2,
      validator3,
      validator4,
      masterContester1,
      masterContester2,
      treasury,
      model1,
      baseToken,
      engine,
      masterContesterRegistry,
      veStaking,
      votingEscrow,
      veNFTRender,
      voter
    } = setup);
  });

  describe("V6 Initialization", () => {
    it("should initialize with correct version", async () => {
      expect(await engine.version()).to.equal(6);
    });

    it("should initialize masterContesterVoteAdder to 10", async () => {
      expect(await engine.masterContesterVoteAdder()).to.equal(10);
    });

    it("should have masterContesterRegistry set", async () => {
      expect(await engine.masterContesterRegistry()).to.equal(masterContesterRegistry.address);
    });
  });

  describe("Master Contester Registry", () => {
    it("should allow owner to set master contester registry", async () => {
      const MasterContesterRegistryFactory = await ethers.getContractFactory("MasterContesterRegistry");
      const newRegistry = await MasterContesterRegistryFactory.deploy(ethers.constants.AddressZero);
      await newRegistry.deployed();
      
      await expect(engine.connect(deployer).setMasterContesterRegistry(newRegistry.address))
        .to.emit(engine, "MasterContesterRegistrySet")
        .withArgs(newRegistry.address);
      
      expect(await engine.masterContesterRegistry()).to.equal(newRegistry.address);
    });

    it("should revert when non-owner tries to set registry", async () => {
      const MasterContesterRegistryFactory = await ethers.getContractFactory("MasterContesterRegistry");
      const newRegistry = await MasterContesterRegistryFactory.deploy(ethers.constants.AddressZero);
      await newRegistry.deployed();
      
      await expect(engine.connect(user1).setMasterContesterRegistry(newRegistry.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should revert when setting zero address as registry", async () => {
      await expect(engine.connect(deployer).setMasterContesterRegistry(ethers.constants.AddressZero))
        .to.be.revertedWith("InvalidRegistry()");
    });

    it("should allow owner to set master contester vote adder", async () => {
      await expect(engine.connect(deployer).setMasterContesterVoteAdder(50))
        .to.emit(engine, "MasterContesterVoteAdderSet")
        .withArgs(50);
      
      expect(await engine.masterContesterVoteAdder()).to.equal(50);
    });

    it("should revert when vote adder exceeds 500", async () => {
      await expect(engine.connect(deployer).setMasterContesterVoteAdder(501))
        .to.be.revertedWith("InvalidMultiplier()");
    });
  });

  describe("Solution Model Fee Percentage Override", () => {
    let modelid: string;

    beforeEach(async () => {
      // Setup validators
      await baseToken.connect(deployer).bridgeMint(engine.address, ethers.utils.parseEther('597000'));
      for (const validator of [validator1, validator2, validator3, validator4]) {
        await baseToken.connect(deployer).transfer(await validator.getAddress(), ethers.utils.parseEther('10'));
        await engine.connect(validator).validatorDeposit(await validator.getAddress(), ethers.utils.parseEther('10'));
      }

      // Create model
      const addr = await model1.getAddress();
      const fee = ethers.utils.parseEther('0');

      modelid = await engine.hashModel({
        addr,
        fee,
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, await user1.getAddress());

      await engine.connect(user1).registerModel(addr, fee, TESTBUF);
    });

    it("should set model fee percentage override", async () => {
      await engine.connect(deployer).setSolutionModelFeePercentageOverride(
        modelid,
        ethers.utils.parseEther("0.5") // 50%
      );

      expect(await engine.solutionModelFeePercentageOverride(modelid))
        .to.equal(ethers.utils.parseEther("0.5"));
    });

    it("should revert when setting override for non-existent model", async () => {
      const fakeModelId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("fake"));
      
      await expect(
        engine.connect(deployer).setSolutionModelFeePercentageOverride(
          fakeModelId,
          ethers.utils.parseEther("0.5")
        )
      ).to.be.revertedWith("ModelDoesNotExist()");
    });

    it("should revert when percentage exceeds 100%", async () => {
      await expect(
        engine.connect(deployer).setSolutionModelFeePercentageOverride(
          modelid,
          ethers.utils.parseEther("1.1") // 110%
        )
      ).to.be.revertedWith("PercentageTooHigh()");
    });
  });
});
