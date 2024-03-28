import { ethers, upgrades } from "hardhat";
import { BigNumber } from 'ethers';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "./chai-setup";
import { Signer } from "ethers";
import { BaseTokenV1 as BaseToken } from "../typechain/BaseTokenV1";
import { EngineV1 } from "../typechain/EngineV1";
import { V2EngineV1 } from "../typechain/V2EngineV1";
import { V2EngineV2 } from "../typechain/V2EngineV2";
import { V2EngineV3 } from "../typechain/V2EngineV3";

const TESTCID = '0x1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8';
const TESTBUF = '0x746573740a';

describe("V2_EngineV3 Migrate Test", () => {
  let signers: SignerWithAddress[];
  // let deployer: Signer;
  let deployer:   SignerWithAddress;
  let user1:      SignerWithAddress;
  let user2:      SignerWithAddress;
  let validator1: SignerWithAddress;
  let validator2: SignerWithAddress;
  let validator3: SignerWithAddress;
  let validator4: SignerWithAddress;
  let treasury:   SignerWithAddress;
  let model1:     SignerWithAddress;
  let newowner:   SignerWithAddress;

  let baseToken: BaseToken;
  let oldengine: EngineV1;
  let engine: V2EngineV1;

  beforeEach("Deploy and initialize", async () => {
    signers = await ethers.getSigners();
    deployer   = signers[0];
    user1      = signers[1];
    user2      = signers[2];
    validator1 = signers[3];
    validator2 = signers[4];
    validator3 = signers[5];
    validator4 = signers[6];
    treasury   = signers[7];
    model1     = signers[8];
    newowner   = signers[9];

    const BaseToken = await ethers.getContractFactory(
      "BaseTokenV1"
    );
    baseToken = (await upgrades.deployProxy(BaseToken, [
      await deployer.getAddress(),
      ethers.constants.AddressZero,
    ])) as BaseToken;
    await baseToken.deployed();
    // console.log("BaseToken deployed to:", baseToken.address);

    const V2_EngineV1 = await ethers.getContractFactory(
      "V2_EngineV1"
    );
    engine = (await upgrades.deployProxy(V2_EngineV1, [
      baseToken.address,
      await treasury.getAddress(),
    ])) as V2_EngineV1;

    const EngineV1 = await ethers.getContractFactory(
      "EngineV1"
    );
    oldengine = (await upgrades.deployProxy(EngineV1, [
      baseToken.address,
      await treasury.getAddress(),
    ])) as EngineV1;
    await engine.deployed();
    // console.log("Engine deployed to:", engine.address);
    
    // for testing transfer from here
    // NOTE this disables rewards unless waiting a long time
    await (await baseToken
      .connect(deployer)
      .bridgeMint(await deployer.getAddress(), ethers.utils.parseEther('2000'))
    ).wait();

    await (await baseToken
      .connect(deployer)
      .transferOwnership(oldengine.address)
    ).wait();

    for (const validator of [validator1, validator2, validator3, validator4]) {
      await (await baseToken
        .connect(validator)
        .approve(oldengine.address, ethers.constants.MaxUint256)
      ).wait();
    }
  });

  describe("migrate", () => {
    it("import validators", async () => {
      await (await baseToken
        .connect(deployer)
        .bridgeMint(oldengine.address, ethers.utils.parseEther('599990'))
      ).wait();

      await (await baseToken
        .connect(deployer)
        .transfer(await validator1.getAddress(), ethers.utils.parseEther('2.4'))
      ).wait();

      await (await oldengine
        .connect(validator1)
        .validatorDeposit(await validator1.getAddress(), ethers.utils.parseEther('2.4'))
      ).wait();

      await (await engine.migrateValidator(oldengine.address, await validator1.getAddress())).wait();

      const val = await engine.validators(await validator1.getAddress());

      expect(val.staked).to.equal(ethers.utils.parseEther('2.4'));
      // since is dynamic on time of test
      expect(val.addr).to.equal(await validator1.getAddress());
    });
  });
});


describe("EngineV2 Unit Tests", () => {
  let signers: SignerWithAddress[];
  // let deployer: Signer;
  let deployer:   SignerWithAddress;
  let user1:      SignerWithAddress;
  let user2:      SignerWithAddress;
  let validator1: SignerWithAddress;
  let validator2: SignerWithAddress;
  let validator3: SignerWithAddress;
  let validator4: SignerWithAddress;
  let treasury:   SignerWithAddress;
  let model1:     SignerWithAddress;
  let newowner:   SignerWithAddress;

  let baseToken: BaseToken;
  let engine: V2_EngineV2;

  beforeEach("Deploy and initialize", async () => {
    signers = await ethers.getSigners();
    deployer   = signers[0];
    user1      = signers[1];
    user2      = signers[2];
    validator1 = signers[3];
    validator2 = signers[4];
    validator3 = signers[5];
    validator4 = signers[6];
    treasury   = signers[7];
    model1     = signers[8];
    newowner   = signers[9];

    const BaseToken = await ethers.getContractFactory(
      "BaseTokenV1"
    );
    baseToken = (await upgrades.deployProxy(BaseToken, [
      await deployer.getAddress(),
      ethers.constants.AddressZero,
    ])) as BaseToken;
    await baseToken.deployed();
    // console.log("BaseToken deployed to:", baseToken.address);

    const V2_EngineV1 = await ethers.getContractFactory(
      "V2_EngineV1"
    );
    const V2_EngineV2 = await ethers.getContractFactory(
      "V2_EngineV2"
    );
    const V2_EngineV3 = await ethers.getContractFactory(
      "V2_EngineV3"
    );

    engine = (await upgrades.deployProxy(V2_EngineV1, [
      baseToken.address,
      await treasury.getAddress(),
    ])) as V2EngineV1;
    await engine.deployed();
    // console.log("Engine deployed to:", engine.address);
    
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV2) as V2EngineV2;
    // console.log("Engine upgraded");
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV3) as V2EngineV3;

    // for testing transfer from here
    // NOTE this disables rewards unless waiting a long time
    await (await baseToken
      .connect(deployer)
      .bridgeMint(await deployer.getAddress(), ethers.utils.parseEther('2000'))
    ).wait();

    await (await baseToken
      .connect(deployer)
      .transferOwnership(engine.address)
    ).wait();

    for (const validator of [validator1, validator2, validator3, validator4]) {
      await (await baseToken
        .connect(validator)
        .approve(engine.address, ethers.constants.MaxUint256)
      ).wait();
    }
  });

  // early txs need 0 model fees and 0 task fees so they can mine tokens
  // later tests will cover fees
  async function deployBootstrapModel(): Promise<string> {
    const addr = await user1.getAddress();
    const fee = ethers.utils.parseEther('0');

    const modelid = await engine.hashModel({
      addr,
      fee,
      rate: ethers.utils.parseEther('0'),
      cid: TESTCID,
    }, await user1.getAddress());

    await (await engine
      .connect(user1)
      .registerModel(addr, fee, TESTBUF)
    ).wait();

    return modelid;
  }

  async function bootstrapTaskParams(modelid: string) {
    return {
      version: BigNumber.from("0"),
      owner: await user1.getAddress(),
      model: modelid,
      fee: ethers.utils.parseEther("0"),
      input: TESTBUF, // normally this would be json but it doesnt matter for testing
      cid: TESTCID,
    };
  }

  async function deployBootstrapValidator(): Promise<string> {
    // deposit just below the 600k max supply
    await (await baseToken
      .connect(deployer)
      .bridgeMint(engine.address, ethers.utils.parseEther('599990'))
    ).wait();

    await (await baseToken
      .connect(deployer)
      .transfer(await validator1.getAddress(), ethers.utils.parseEther('2.4'))
    ).wait();

    await (await engine
      .connect(validator1)
      .validatorDeposit(await validator1.getAddress(), ethers.utils.parseEther('2.4'))
    ).wait();
    return await validator1.getAddress();
  }

  async function deployBootstrapEngineSlashingNotReached(): Promise<void> {
    // deposit just below the 598000 max supply
    await (await baseToken
      .connect(deployer)
      .bridgeMint(engine.address, ethers.utils.parseEther('599000'))
    ).wait();
}

  async function deployBootstrapEngineSlashingReached(): Promise<void> {
      // deposit just below the 598000 max supply
      await (await baseToken
        .connect(deployer)
        .bridgeMint(engine.address, ethers.utils.parseEther('597000'))
      ).wait();
  }

  async function deployBootstrapTask(modelid: string, submitter?: SignerWithAddress): Promise<string> {
    const taskParams = await bootstrapTaskParams(modelid);
    const taskidReceipt = await (await engine
      .connect(submitter ?? user1)
      .submitTask(
        taskParams.version,
        taskParams.owner,
        taskParams.model,
        taskParams.fee,
        taskParams.input,
      )).wait();
    const taskSubmittedEvent = taskidReceipt.events![0];
    // @ts-ignore
    const { id: taskid } = taskSubmittedEvent.args;
    return taskid;
  }

  describe("upgrade", () => {
    it("can validate upgrade", async () => {
      const V2_EngineV1 = await ethers.getContractFactory('V2_EngineV1');
      const V2_EngineV2 = await ethers.getContractFactory('V2_EngineV2');
      const V2_EngineV3 = await ethers.getContractFactory('V2_EngineV2');
      await upgrades.validateUpgrade(V2_EngineV1, V2_EngineV2);
    });
  });

  // TODO
  // test all totalHeld interactions (deposit, withdraw, claim, contest, etc)
  // test solution rate limit
  // test bulk solution submission
  // test update to solution submission
  // test bulk task submission
  // test update to task submission
  // test claim sends correct rewards to task owner (as well as validator)
  // test claim sends rewards correctly during contestation

});
