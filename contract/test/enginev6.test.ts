import { ethers, upgrades } from "hardhat";
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

const TESTCID = '0x1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8';
const TESTBUF = '0x746573740a';

describe("EngineV6 Upgrade Validation", () => {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let treasury: SignerWithAddress;
  let validator1: SignerWithAddress;
  let user1: SignerWithAddress;

  let baseToken: BaseToken;
  let engine: V2EngineV6;
  let masterContesterRegistry: MasterContesterRegistry;

  describe("Upgrade Path Validation", () => {
    beforeEach("Deploy base token", async () => {
      signers = await ethers.getSigners();
      deployer = signers[0];
      treasury = signers[1];
      validator1 = signers[2];
      user1 = signers[3];

      const BaseToken = await ethers.getContractFactory("BaseTokenV1");
      baseToken = (await upgrades.deployProxy(BaseToken, [
        await deployer.getAddress(),
        ethers.constants.AddressZero,
      ])) as BaseToken;
      await baseToken.deployed();
    });

    it("should successfully upgrade through all versions to V6", async () => {
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
      expect(await engine.version()).to.equal(0);

      // Upgrade to V2
      engine = await upgrades.upgradeProxy(engine.address, V2_EngineV2) as V2EngineV2 as any;
      expect(await engine.version()).to.equal(0); // V2 doesn't auto-set version
      await engine.connect(deployer).setSolutionStakeAmount(ethers.utils.parseEther("0.001"));

      // Upgrade to V3
      engine = await upgrades.upgradeProxy(engine.address, V2_EngineV3, {
        call: "initialize",
      }) as V2EngineV3 as any;
      expect(await engine.version()).to.equal(0);

      // Upgrade to V4
      engine = await upgrades.upgradeProxy(engine.address, V2_EngineV4, {
        call: "initialize",
      }) as V2EngineV4 as any;
      expect(await engine.version()).to.equal(4);

      // Upgrade to V5
      engine = await upgrades.upgradeProxy(engine.address, V2_EngineV5, {
        call: "initialize",
      }) as V2EngineV5 as any;
      expect(await engine.version()).to.equal(5);

      // Upgrade to V5_2
      engine = await upgrades.upgradeProxy(engine.address, V2_EngineV5_2, {
        call: "initialize",
      }) as V2EngineV5_2 as any;
      expect(await engine.version()).to.equal(5); // V5_2 keeps version 5

      // Upgrade to V6
      engine = await upgrades.upgradeProxy(engine.address, V2_EngineV6, {
        call: "initialize",
      }) as V2EngineV6;
      expect(await engine.version()).to.equal(6);

      // Verify V6 specific initialization
      expect(await engine.masterContesterVoteAdder()).to.equal(50);
    });

    it("should validate storage layout compatibility from V5_2 to V6", async () => {
      const V2_EngineV5_2 = await ethers.getContractFactory("V2_EngineV5_2");
      const V2_EngineV6 = await ethers.getContractFactory("V2_EngineV6");
      
      // This validates that storage slots don't conflict
      await upgrades.validateUpgrade(V2_EngineV5_2, V2_EngineV6);
    });

    it("should preserve state through upgrade to V6", async () => {
      // Setup through V5_2
      const V2_EngineV1 = await ethers.getContractFactory("V2_EngineV1");
      const V2_EngineV2 = await ethers.getContractFactory("V2_EngineV2");
      const V2_EngineV3 = await ethers.getContractFactory("V2_EngineV3");
      const V2_EngineV4 = await ethers.getContractFactory("V2_EngineV4");
      const V2_EngineV5 = await ethers.getContractFactory("V2_EngineV5");
      const V2_EngineV5_2 = await ethers.getContractFactory("V2_EngineV5_2");
      const V2_EngineV6 = await ethers.getContractFactory("V2_EngineV6");

      // Deploy and upgrade to V5_2
      engine = (await upgrades.deployProxy(V2_EngineV1, [
        baseToken.address,
        await treasury.getAddress(),
      ])) as V2EngineV1 as any;
      
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

      // Set some state in V5_2
      await engine.connect(deployer).setSolutionModelFeePercentage(ethers.utils.parseEther("0.05"));
      
      // Store values to check after upgrade
      const solutionFeePercentageBefore = await engine.solutionFeePercentage();
      const treasuryBefore = await engine.treasury();

      // Upgrade to V6
      engine = await upgrades.upgradeProxy(engine.address, V2_EngineV6, {
        call: "initialize",
      }) as V2EngineV6;

      // Verify state preservation
      expect(await engine.solutionFeePercentage()).to.equal(solutionFeePercentageBefore);
      expect(await engine.treasury()).to.equal(treasuryBefore);
      
      // Verify V6 initialization
      expect(await engine.version()).to.equal(6);
      expect(await engine.masterContesterVoteAdder()).to.equal(50);
    });

    it("should allow setting V6-specific parameters after upgrade", async () => {
      // Quick path to V6
      const V2_EngineV1 = await ethers.getContractFactory("V2_EngineV1");
      engine = (await upgrades.deployProxy(V2_EngineV1, [
        baseToken.address,
        await treasury.getAddress(),
      ])) as any;

      // Upgrade directly to V6 for testing (in practice would go through all versions)
      const V2_EngineV6 = await ethers.getContractFactory("V2_EngineV6");
      engine = await upgrades.upgradeProxy(engine.address, V2_EngineV6, {
        call: "initialize",
      }) as V2EngineV6;

      // Deploy MasterContesterRegistry
      const MasterContesterRegistry = await ethers.getContractFactory("MasterContesterRegistry");
      masterContesterRegistry = await MasterContesterRegistry.deploy(ethers.constants.AddressZero);
      await masterContesterRegistry.deployed();

      // Test V6-specific functions work
      await expect(engine.connect(deployer).setMasterContesterRegistry(masterContesterRegistry.address))
        .to.emit(engine, "MasterContesterRegistrySet")
        .withArgs(masterContesterRegistry.address);

      await expect(engine.connect(deployer).setMasterContesterVoteAdder(50))
        .to.emit(engine, "MasterContesterVoteAdderSet")
        .withArgs(50);

      expect(await engine.masterContesterRegistry()).to.equal(masterContesterRegistry.address);
      expect(await engine.masterContesterVoteAdder()).to.equal(50);
    });

    it("should maintain functionality of existing features after V6 upgrade", async () => {
      // Setup engine at V6
      const V2_EngineV1 = await ethers.getContractFactory("V2_EngineV1");
      const V2_EngineV2 = await ethers.getContractFactory("V2_EngineV2");
      const V2_EngineV6 = await ethers.getContractFactory("V2_EngineV6");

      engine = (await upgrades.deployProxy(V2_EngineV1, [
        baseToken.address,
        await treasury.getAddress(),
      ])) as any;

      engine = await upgrades.upgradeProxy(engine.address, V2_EngineV2) as V2EngineV2 as any;
      await engine.connect(deployer).setSolutionStakeAmount(ethers.utils.parseEther("0.001"));

      engine = await upgrades.upgradeProxy(engine.address, V2_EngineV6, {
        call: "initialize",
      }) as V2EngineV6;

      // Setup for testing
      await baseToken.connect(deployer).bridgeMint(await deployer.getAddress(), ethers.utils.parseEther("1000"));
      await baseToken.connect(deployer).transferOwnership(engine.address);
      await baseToken.connect(deployer).bridgeMint(engine.address, ethers.utils.parseEther("597000"));

      // Test that existing functionality still works
      
      // 1. Model registration
      const modelAddr = await user1.getAddress();
      const modelFee = ethers.utils.parseEther("0");
      
      await expect(engine.connect(user1).registerModel(modelAddr, modelFee, TESTBUF))
        .to.emit(engine, "ModelRegistered");

      const modelid = await engine.hashModel({
        addr: modelAddr,
        fee: modelFee,
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, await user1.getAddress());

      const model = await engine.models(modelid);
      expect(model.addr).to.equal(modelAddr);
      expect(model.fee).to.equal(modelFee);

      // 2. Validator deposits
      await baseToken.connect(deployer).transfer(validator1.address, ethers.utils.parseEther("10"));
      await baseToken.connect(validator1).approve(engine.address, ethers.constants.MaxUint256);
      
      await expect(engine.connect(validator1).validatorDeposit(
        validator1.address,
        ethers.utils.parseEther("10")
      )).to.emit(engine, "ValidatorDeposit");

      const validator = await engine.validators(validator1.address);
      expect(validator.staked).to.equal(ethers.utils.parseEther("10"));
    });

    it("should reject invalid V6 parameters", async () => {
      // Setup engine at V6
      const V2_EngineV1 = await ethers.getContractFactory("V2_EngineV1");
      const V2_EngineV6 = await ethers.getContractFactory("V2_EngineV6");

      engine = (await upgrades.deployProxy(V2_EngineV1, [
        baseToken.address,
        await treasury.getAddress(),
      ])) as any;

      engine = await upgrades.upgradeProxy(engine.address, V2_EngineV6, {
        call: "initialize",
      }) as V2EngineV6;

      // Test invalid registry address
      await expect(engine.connect(deployer).setMasterContesterRegistry(ethers.constants.AddressZero))
        .to.be.revertedWith("InvalidRegistry");

      // Test invalid vote adder
      await expect(engine.connect(deployer).setMasterContesterVoteAdder(501))
        .to.be.revertedWith("InvalidMultiplier");

      // Test non-owner cannot set registry
      await expect(engine.connect(user1).setMasterContesterRegistry(user1.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
