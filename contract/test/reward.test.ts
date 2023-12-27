import { ethers, upgrades } from "hardhat";
import { BigNumber } from 'ethers';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "./chai-setup";
import { Signer } from "ethers";
import { BaseTokenV1 as BaseToken } from "../typechain/BaseTokenV1";
import { EngineV1 as Engine } from "../typechain/EngineV1";

const TESTCID = '0x1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8';
const TESTBUF = '0x746573740a';


describe("Reward Unit Tests", () => {
  let signers: SignerWithAddress[];
  // let deployer: Signer;
  let deployer:   SignerWithAddress;
  let user1:      SignerWithAddress;
  let user2:      SignerWithAddress;
  let validator1: SignerWithAddress;
  let validator2: SignerWithAddress;
  let validator3: SignerWithAddress;
  let treasury:   SignerWithAddress;
  let lpreward:   SignerWithAddress;

  let baseToken: BaseToken;
  let engine: Engine;

  beforeEach("Deploy and initialize", async () => {
    signers = await ethers.getSigners();
    deployer   = signers[0];
    user1      = signers[1];
    user2      = signers[2];
    validator1 = signers[3];
    validator2 = signers[4];
    validator3 = signers[5];
    treasury   = signers[6];
    lpreward   = signers[7];

    console.log('treasury', await treasury.getAddress());

    const BaseToken = await ethers.getContractFactory(
      "BaseTokenV1"
    );
    baseToken = (await upgrades.deployProxy(BaseToken, [
      /* no construct params */
    ])) as BaseToken;
    await baseToken.deployed();
    // console.log("BaseToken deployed to:", baseToken.address);

    const Engine = await ethers.getContractFactory(
      "EngineV1"
    );
    engine = (await upgrades.deployProxy(Engine, [
      baseToken.address,
      await treasury.getAddress(),
      await lpreward.getAddress(),
    ])) as Engine;
    await engine.deployed();
    // console.log("Engine deployed to:", engine.address);
    
    await (await baseToken.connect(deployer).transferOwnership(engine.address)).wait();
  });

  // early txs need 0 model fees and 0 task fees so they can mine tokens
  // later tests will cover fees
  async function bootstrapModelParams() {
    return {
      addr: await user1.getAddress(), // addr doesnt matter
      fee: BigNumber.from("0"),
      cid: 'XXX',
    };
  }

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

  async function bootstrapTaskParams(modelid) {
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
      await (await engine
        .connect(validator1)
        .validatorDeposit(await validator1.getAddress(), ethers.utils.parseEther('0'))
      ).wait();
      return await validator1.getAddress();
  }

  async function deployBootstrapTask(modelid): Promise<string> {
    const taskParams = await bootstrapTaskParams(modelid);
    const taskidReceipt = await (await engine
      .connect(user1)
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


  describe("daa", () => {
    it("check targetTs", async () => {
      expect(await engine.targetTs(0))           .to.equal(ethers.BigNumber.from("0"));
      expect(await engine.targetTs(15768000))    .to.equal(ethers.BigNumber.from("292893218813452475198312"));
      expect(await engine.targetTs(31536000))    .to.equal(ethers.BigNumber.from("500000000000000000000000"));
      expect(await engine.targetTs(63072000))    .to.equal(ethers.BigNumber.from("750000000000000000000000"));
      expect(await engine.targetTs(94608000))    .to.equal(ethers.BigNumber.from("875000000000000000000000"));
      expect(await engine.targetTs(126144000))   .to.equal(ethers.BigNumber.from("937500000000000000000000"));
      expect(await engine.targetTs(157680000))   .to.equal(ethers.BigNumber.from("968750000000000000000000"));
      expect(await engine.targetTs(315360000))   .to.equal(ethers.BigNumber.from("999023437500000000000000"));
      expect(await engine.targetTs(3153600000))  .to.equal(ethers.BigNumber.from("1000000000000000000000000"));
      expect(await engine.targetTs(31536000000)) .to.equal(ethers.BigNumber.from("1000000000000000000000000"));
    });

    it("check diff", async () => {
      expect(await engine.diffMul('31536000', ethers.utils.parseEther('100000'))).to.equal(ethers.BigNumber.from("100000000000000000000"));
      expect(await engine.diffMul('31536000', ethers.utils.parseEther('450000'))).to.equal(ethers.BigNumber.from("100000000000000000000"));
      expect(await engine.diffMul('31536000', ethers.utils.parseEther('490000'))).to.equal(ethers.BigNumber.from("4000000000000000000"));
      expect(await engine.diffMul('31536000', ethers.utils.parseEther('495000'))).to.equal(ethers.BigNumber.from("2000000000000000000"));
      expect(await engine.diffMul('31536000', ethers.utils.parseEther('500000'))).to.equal(ethers.BigNumber.from("1000000000000000000"));
      expect(await engine.diffMul('31536000', ethers.utils.parseEther('505000'))).to.equal(ethers.BigNumber.from("500000000000000000"));
      expect(await engine.diffMul('31536000', ethers.utils.parseEther('510000'))).to.equal(ethers.BigNumber.from("250000000000000000"));
      expect(await engine.diffMul('31536000', ethers.utils.parseEther('515000'))).to.equal(ethers.BigNumber.from("125000000000000000"));
      expect(await engine.diffMul('31536000', ethers.utils.parseEther('550000'))).to.equal(ethers.BigNumber.from("976562500000000"));
      expect(await engine.diffMul('31536000', ethers.utils.parseEther('600000'))).to.equal(ethers.BigNumber.from("0"));
    });

    it("check reward", async () => {
      console.log('reward', await engine.diffMul('1', '0x0365c59810c2d7436144'));
      console.log('reward', await engine.diffMul('14694', '322475952845815599403'));
    });
    // TODO test reward function specifically at multiple timesteps / ts
  });

  describe('rewards', () => {
    it("claim uncontested solution with reward", async () => {
      await deployBootstrapValidator();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      await (await engine
        .connect(deployer) // initial owner
        .setSolutionMineableRate(modelid, ethers.utils.parseEther('1'))
      ).wait();

      const cid = TESTCID;

      const commitment = await engine.generateCommitment(
        await validator1.getAddress(),
        taskid,
        cid
      );

      await (await engine
        .connect(validator1)
        .signalCommitment(commitment)).wait();

      await (await engine
        .connect(validator1)
        .submitSolution(taskid, cid)
      ).wait();

      // MIN_CLAIM_SOLUTION_TIME
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);

      await (await engine
        .connect(validator1)
        .claimSolution(taskid)
      ).wait();

      const validatorBalance = await baseToken.balanceOf(await validator1.getAddress());
      const treasuryBalance = await baseToken.balanceOf(await treasury.getAddress());
      const lpBalance = await baseToken.balanceOf(await lpreward.getAddress());

      expect(validatorBalance).to.equal(ethers.utils.parseUnits("79.99992", 18));
      expect(treasuryBalance).to.equal(ethers.utils.parseUnits("9.99999", 18));
      expect(lpBalance).to.equal(ethers.utils.parseUnits("9.99999", 18));
    });
  });
});
