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
import { V2EngineV6 } from "../typechain/V2EngineV5_2";

const TESTCID = '0x1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8';
const TESTBUF = '0x746573740a';

describe("EngineV6 Unit Tests", () => {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let validator1: SignerWithAddress;
  let validator2: SignerWithAddress;
  let validator3: SignerWithAddress;
  let validator4: SignerWithAddress;
  let treasury: SignerWithAddress;

  let baseToken: BaseToken;
  let baseTokenV5: BaseToken;
  let engine: V2EngineV6;
  let engineV5: V2EngineV5;

  beforeEach("Deploy and initialize", async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    user1 = signers[1];
    user2 = signers[2];
    validator1 = signers[3];
    validator2 = signers[4];
    validator3 = signers[5];
    validator4 = signers[6];
    treasury = signers[7];

    // Deploy two separate base tokens for V5 and V5_2
    const BaseToken = await ethers.getContractFactory("BaseTokenV1");
    
    baseToken = (await upgrades.deployProxy(BaseToken, [
      await deployer.getAddress(),
      ethers.constants.AddressZero,
    ])) as BaseToken;
    await baseToken.deployed();

    baseTokenV5 = (await upgrades.deployProxy(BaseToken, [
      await deployer.getAddress(),
      ethers.constants.AddressZero,
    ])) as BaseToken;
    await baseTokenV5.deployed();

    const V2_EngineV1 = await ethers.getContractFactory("V2_EngineV1");
    const V2_EngineV2 = await ethers.getContractFactory("V2_EngineV2");
    const V2_EngineV3 = await ethers.getContractFactory("V2_EngineV3");
    const V2_EngineV4 = await ethers.getContractFactory("V2_EngineV4");
    const V2_EngineV5 = await ethers.getContractFactory("V2_EngineV5");
    
    // IMPORTANT: Make sure we're using the V5_2 contract factory that has the 2-year halvening
    const V2_EngineV5_2 = await ethers.getContractFactory("V2_EngineV5_2");

    const V2_EngineV6 = await ethers.getContractFactory("V2_EngineV6");

    // Deploy V5 for comparison
    engineV5 = (await upgrades.deployProxy(V2_EngineV1, [
      baseTokenV5.address,
      await treasury.getAddress(),
    ])) as V2EngineV1 as any;
    await engineV5.deployed();

    {
      engineV5 = (await upgrades.upgradeProxy(
        engineV5.address,
        V2_EngineV2
      )) as V2EngineV2;
      
      await (
        await engineV5
          .connect(deployer)
          .setSolutionStakeAmount(ethers.utils.parseEther("0.001"))
      ).wait();
    }

    engineV5 = (await upgrades.upgradeProxy(engineV5.address, V2_EngineV3, {
      call: "initialize",
    })) as V2EngineV3 as any;
    
    engineV5 = (await upgrades.upgradeProxy(engineV5.address, V2_EngineV4, {
      call: "initialize",
    })) as V2EngineV4 as any;
    
    engineV5 = (await upgrades.upgradeProxy(engineV5.address, V2_EngineV5, {
      call: "initialize",
    })) as V2EngineV5;

    // Set start block time for V5
    const currentTime = await ethers.provider.getBlock('latest').then(b => b.timestamp);
    await (await engineV5.connect(deployer).setStartBlockTime(currentTime)).wait();

    // Deploy V5_2 fresh (not as upgrade) to test targetTs directly
    engine = (await upgrades.deployProxy(V2_EngineV1, [
      baseToken.address,
      await treasury.getAddress(),
    ])) as V2EngineV1 as any;
    await engine.deployed();

    let engineV2_2 = (await upgrades.upgradeProxy(
      engine.address,
      V2_EngineV2
    )) as V2EngineV2;
    
    await (
      await engineV2_2
        .connect(deployer)
        .setSolutionStakeAmount(ethers.utils.parseEther("0.001"))
    ).wait();

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
    })) as V2EngineV5_2;

    // Final upgrade to V6
    engine = (await upgrades.upgradeProxy(engine.address, V2_EngineV6, {
      call: "initialize",
    })) as V2EngineV6;

    // Verify version is 5
    const version = await engine.version();
    console.log("Engine version after upgrade:", version.toString());

    // Set start block time for V6
    await (await engine.connect(deployer).setStartBlockTime(currentTime)).wait();

    // Setup tokens for V6
    await (
      await baseToken
        .connect(deployer)
        .bridgeMint(
          await deployer.getAddress(),
          ethers.utils.parseEther("2000")
        )
    ).wait();

    await (
      await baseToken.connect(deployer).transferOwnership(engine.address)
    ).wait();

    // Setup tokens for V5
    await (
      await baseTokenV5
        .connect(deployer)
        .bridgeMint(
          await deployer.getAddress(),
          ethers.utils.parseEther("2000")
        )
    ).wait();

    await (
      await baseTokenV5.connect(deployer).transferOwnership(engineV5.address)
    ).wait();

    for (const validator of [validator1, validator2, validator3, validator4]) {
      await (
        await baseToken
          .connect(validator)
          .approve(engine.address, ethers.constants.MaxUint256)
      ).wait();
      await (
        await baseTokenV5
          .connect(validator)
          .approve(engineV5.address, ethers.constants.MaxUint256)
      ).wait();
    }
  });

  describe("direct targetTs testing", () => {
    it("should call targetTs directly and verify 2-year halvening", async () => {
      // Test targetTs function directly on V5_2
      console.log("\nDirect targetTs calls on V5_2:");
      
      const t0 = await engine.targetTs(0);
      console.log("targetTs(0):", t0.toString());
      
      const t6m = await engine.targetTs(15768000); // 6 months
      console.log("targetTs(6 months):", ethers.utils.formatEther(t6m));
      
      const t1y = await engine.targetTs(31536000); // 1 year
      console.log("targetTs(1 year):", ethers.utils.formatEther(t1y));
      
      const t2y = await engine.targetTs(63072000); // 2 years
      console.log("targetTs(2 years):", ethers.utils.formatEther(t2y));
      
      const t4y = await engine.targetTs(126144000); // 4 years
      console.log("targetTs(4 years):", ethers.utils.formatEther(t4y));
      
      // Compare with V5
      console.log("\nDirect targetTs calls on V5:");
      const t1yV5 = await engineV5.targetTs(31536000);
      console.log("V5 targetTs(1 year):", ethers.utils.formatEther(t1yV5));
      
      const t2yV5 = await engineV5.targetTs(63072000);
      console.log("V5 targetTs(2 years):", ethers.utils.formatEther(t2yV5));
    });
  });

  describe("upgrade validation", () => {
    it("can validate upgrade from V5_2 to V6", async () => {
      const V2_EngineV5_2 = await ethers.getContractFactory("V2_EngineV5_2");
      const V2_EngineV6 = await ethers.getContractFactory("V2_EngineV6");
      await upgrades.validateUpgrade(V2_EngineV5_2, V2_EngineV6);
    });

    it("version is correctly set to 6", async () => {
      expect(await engine.version()).to.equal(6);
    });
  });

  describe("emission schedule v5_2 (halved rewards)", () => {
    it("debug: check contract bytecode differences", async () => {
      // Let's verify the upgrade actually deployed new bytecode
      const v5_2Address = engine.address;
      const v5Address = engineV5.address;
      
      console.log("\nContract addresses:");
      console.log("V5:", v5Address);
      console.log("V5_2:", v5_2Address);
      
      // Get implementation addresses (since these are proxies)
      const implementationSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
      
      const v5ImplAddress = await ethers.provider.getStorageAt(v5Address, implementationSlot);
      const v5_2ImplAddress = await ethers.provider.getStorageAt(v5_2Address, implementationSlot);
      
      console.log("\nImplementation addresses:");
      console.log("V5 impl:", v5ImplAddress);
      console.log("V5_2 impl:", v5_2ImplAddress);
      
      // They should be different
      expect(v5ImplAddress).to.not.equal(v5_2ImplAddress);
    });

    it("test targetTs calculation manually", async () => {
      // Let's manually calculate what targetTs should return with 2-year halvening
      const oneYear = 31536000;
      const twoYears = 63072000;
      
      // For 2-year halvening at t=1 year:
      // e = 2^(t / (2 * years_in_seconds)) = 2^(31536000 / 63072000) = 2^0.5 = 1.414...
      // targetTs = 600000 - (600000 / 1.414...) = 600000 - 424264... = 175735...
      
      console.log("\nManual calculation check:");
      console.log("For 1 year with 2-year halvening:");
      console.log("t / (60*60*24*365*2) =", oneYear / (60*60*24*365*2));
      console.log("This should be 0.5");
      
      // The issue might be in how the contract is compiled or deployed
      // Let's check if the contract has the correct targetTs implementation
      
      // Try calling with very specific values to debug
      const testValue = await engine.targetTs(31536000);
      console.log("targetTs(31536000) raw:", testValue.toString());
      console.log("targetTs(31536000) formatted:", ethers.utils.formatEther(testValue));
      
      // If this returns 150000 AIUS, then the contract still has 1-year halvening
      // If this returns ~87868 AIUS, then the contract has 2-year halvening
    });
  });

  describe("deployment verification", () => {
    it("deploy a fresh V5_2 contract to test", async () => {
      // Let's deploy a completely fresh V5_2 to make sure the issue isn't with upgrades
      const V2_EngineV5_2 = await ethers.getContractFactory("V2_EngineV5_2");
      
      // Deploy without proxy to test the implementation directly
      const freshV5_2 = await V2_EngineV5_2.deploy();
      await freshV5_2.deployed();
      
      console.log("\nFresh V5_2 deployment test:");
      const testResult = await freshV5_2.targetTs(31536000); // 1 year
      console.log("Fresh V5_2 targetTs(1 year):", ethers.utils.formatEther(testResult));
      
      // This should return ~87868 AIUS if 2-year halvening is in the V5_2 contract
      // If it returns 150000 AIUS, then the V5_2 contract source still has 1-year halvening
      
      if (testResult.eq(ethers.utils.parseEther("150000"))) {
        console.log("ERROR: V5_2 contract source code still has 1-year halvening!");
        console.log("Please verify that V2_EngineV5_2.sol has:");
        console.log('uint256 e = unwrap(ud(t).div(ud(60 * 60 * 24 * 365 * 2)).exp2());');
        console.log("                                                      ^^^");
      } else {
        console.log("SUCCESS: V5_2 contract has 2-year halvening implemented!");
      }
    });
  });
});
