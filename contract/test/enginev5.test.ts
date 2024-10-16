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

describe("EngineV5 SetUp", () => {
  let signers: SignerWithAddress[];
  // let deployer: Signer;
  let deployer: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let validator1: SignerWithAddress;
  let validator2: SignerWithAddress;
  let validator3: SignerWithAddress;
  let validator4: SignerWithAddress;
  let treasury: SignerWithAddress;

  let baseToken: BaseToken;
  let enginev2: V2EngineV2;
  let engine: V2EngineV5;

  async function deployAndInitialize() {
    signers = await ethers.getSigners();
    deployer = signers[0];
    user1 = signers[1];
    user2 = signers[2];
    validator1 = signers[3];
    validator2 = signers[4];
    validator3 = signers[5];
    validator4 = signers[6];
    treasury = signers[7];

    const BaseToken = await ethers.getContractFactory("BaseTokenV1");
    baseToken = (await upgrades.deployProxy(BaseToken, [
      await deployer.getAddress(),
      ethers.constants.AddressZero,
    ])) as BaseToken;
    await baseToken.deployed();
    console.log("BaseToken deployed to: ", baseToken.address);

    const V2_EngineV1 = await ethers.getContractFactory("V2_EngineV1");
    const V2_EngineV2 = await ethers.getContractFactory("V2_EngineV2");
    const V2_EngineV3 = await ethers.getContractFactory("V2_EngineV3");
    const V2_EngineV4 = await ethers.getContractFactory("V2_EngineV4");
    const V2_EngineV5 = await ethers.getContractFactory("V2_EngineV5");

    engine = (await upgrades.deployProxy(V2_EngineV1, [
      baseToken.address,
      await treasury.getAddress(),
    ])) as V2EngineV1 as any;
    await engine.deployed();
    console.log("engine deployed to: ", engine.address);

    // upgrade successive versions
    enginev2 = (await upgrades.upgradeProxy(
      engine.address,
      V2_EngineV2
    )) as V2EngineV2 as any;

    // set solution stake amount in v2, since it cant be set in later versions
    await (
      await enginev2
        .connect(deployer)
        .setSolutionStakeAmount(ethers.utils.parseEther("0.001"))
    ).wait();

    engine = (await upgrades.upgradeProxy(enginev2.address, V2_EngineV3, {
      call: "initialize",
    })) as V2EngineV3 as any;
    engine = (await upgrades.upgradeProxy(engine.address, V2_EngineV4, {
      call: "initialize",
    })) as V2EngineV4 as any;
    engine = (await upgrades.upgradeProxy(engine.address, V2_EngineV5, {
      call: "initialize",
    })) as V2EngineV5 as any;

    // for testing transfer from here
    // NOTE this disables rewards unless waiting a long time
    await (
      await baseToken
        .connect(deployer)
        .bridgeMint(
          await deployer.getAddress(),
          ethers.utils.parseEther("2000")
        )
    ).wait();

    await (
      await baseToken
        .connect(deployer)
        .bridgeMint(
          engine.address,
          ethers.utils.parseEther("599600")
        )
    ).wait();

    // send 100 tokens to each validator
    for (const validator of [validator1, validator2, validator3, validator4]) {
      await (
        await baseToken
          .connect(deployer)
          .transfer(validator.address, ethers.utils.parseEther("100"))
      ).wait();
    }

    for (const validator of [validator1, validator2, validator3, validator4]) {
      await (
        await baseToken
          .connect(validator)
          .approve(engine.address, ethers.constants.MaxUint256)
      ).wait();
    }

    await (
      await baseToken.connect(deployer).transferOwnership(engine.address)
    ).wait();
  }

  describe("upgrade", () => {
    it.only("can validate upgrade", async () => {
      await deployAndInitialize();

      const V2_EngineV1 = await ethers.getContractFactory("V2_EngineV1");
      const V2_EngineV2 = await ethers.getContractFactory("V2_EngineV2");
      const V2_EngineV3 = await ethers.getContractFactory("V2_EngineV3");
      const V2_EngineV4 = await ethers.getContractFactory("V2_EngineV4");
      const V2_EngineV5 = await ethers.getContractFactory("V2_EngineV5");

      await upgrades.validateUpgrade(V2_EngineV1, V2_EngineV2);
      await upgrades.validateUpgrade(V2_EngineV2, V2_EngineV3);
      await upgrades.validateUpgrade(V2_EngineV3, V2_EngineV4);
      await upgrades.validateUpgrade(V2_EngineV4, V2_EngineV5);
    });
  });
});
