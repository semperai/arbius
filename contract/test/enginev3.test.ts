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

    const V2EngineV1 = await ethers.getContractFactory(
      "V2_EngineV1"
    );
    engine = (await upgrades.deployProxy(V2EngineV1, [
      baseToken.address,
      await treasury.getAddress(),
    ])) as V2EngineV1;

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


describe("EngineV3 Unit Tests", () => {
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
  let engine: V2EngineV3;

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
    ])) as V2EngineV1 as any;
    await engine.deployed();
    // console.log("Engine deployed to:", engine.address);
    
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV2) as V2EngineV2 as any;

    // console.log("Engine upgraded");
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV3, { call: "initialize" }) as V2EngineV3;

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

  async function bootstrapTaskParams(modelid: string, feeEth: string = '0') {
    return {
      version: BigNumber.from("0"),
      owner: await user1.getAddress(),
      model: modelid,
      fee: ethers.utils.parseEther(feeEth),
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

  async function deployBootstrapTask(modelid: string, submitter?: SignerWithAddress, feeEth?: string): Promise<string> {
    const taskParams = await bootstrapTaskParams(modelid, feeEth);
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
      const V2_EngineV3 = await ethers.getContractFactory('V2_EngineV3');
      await upgrades.validateUpgrade(V2_EngineV1, V2_EngineV2);
      await upgrades.validateUpgrade(V2_EngineV2, V2_EngineV3);
    });

    it("calls reinitializer to set new params", async() => {
      expect(await engine.minClaimSolutionTime()).to.equal(3600); // 60 minutes
      expect(await engine.minContestationVotePeriodTime()).to.equal(360); // 6 minutes
      expect(await engine.exitValidatorMinUnlockTime()).to.equal(259200); // 3 days
      expect(await engine.solutionRateLimit()).to.equal(ethers.utils.parseEther("1")); // 1 second required between solution submissions
      expect(await engine.taskOwnerRewardPercentage()).to.equal(ethers.utils.parseEther("0.1")); // 10%
      expect(await engine.contestationVoteExtensionTime()).to.equal(10); // 10 seconds

    });
  });

  describe("totalHeld tests", () => {
    it("changes totalHeld upon validator deposit and withdraw", async () => {
      expect(await engine.totalHeld()).to.equal(0);
      expect(await baseToken.balanceOf(engine.address)).to.equal(0);
      expect(await engine.getPsuedoTotalSupply()).to.equal(ethers.utils.parseEther('600000'));
      await deployBootstrapValidator();
      expect(await engine.totalHeld()).to.equal(ethers.utils.parseEther('2.4'));
      expect(await baseToken.balanceOf(engine.address)).to.equal(ethers.utils.parseEther('599992.4'));
      expect(await engine.getPsuedoTotalSupply()).to.equal(ethers.utils.parseEther('10'));

      await expect(engine
        .connect(validator1)
        .initiateValidatorWithdraw(ethers.utils.parseEther('2.4'))
      ).to.emit(engine, "ValidatorWithdrawInitiated");
      expect(await engine.totalHeld()).to.equal(ethers.utils.parseEther('2.4'));

      await ethers.provider.send("evm_increaseTime", [259200]);
      await ethers.provider.send("evm_mine", []);

      await expect(engine
        .connect(validator1)
        .validatorWithdraw(ethers.BigNumber.from('1'), await validator1.getAddress())
      ).to.emit(engine, "ValidatorWithdraw")
      .withArgs(
        await validator1.getAddress(),
        await validator1.getAddress(),
        ethers.BigNumber.from('1'),
        ethers.utils.parseEther('2.4'),
      );
      expect(await engine.totalHeld()).to.equal(ethers.utils.parseEther('0'));
    });

    it("totalHeld increases from submission fees, decreases with accrued fees withdrawal", async () => {
      await deployBootstrapValidator();

      expect(await engine.totalHeld()).to.equal(ethers.utils.parseEther('2.4'));

      // add 0.1 token to cover submission fee
      await (await baseToken
        .connect(deployer)
        .transfer(await validator1.getAddress(), ethers.utils.parseEther('0.1'))
      ).wait();

      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid, validator1, "0.1");
      expect(await engine.totalHeld()).to.equal(ethers.utils.parseEther('2.5'));

      const cid = TESTCID;

      const reward = await engine.getReward();
      const { staked: stakedBefore } = await engine.validators(await validator1.getAddress());

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

      const { staked: stakedAfter } = await engine.validators(await validator1.getAddress());
      expect(stakedBefore.sub(stakedAfter)).to.equal(ethers.utils.parseEther('0'));

      // MIN_CLAIM_SOLUTION_TIME
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);

      await expect(engine
        .connect(validator1)
        .claimSolution(taskid)
      ).to.emit(engine, 'SolutionClaimed')
      .withArgs(await validator1.getAddress(), taskid);

      const { staked: stakedFinal } = await engine.validators(await validator1.getAddress());

      expect(stakedFinal.sub(stakedBefore)).to.equal(reward);

      expect(await engine.accruedFees()).to.equal(ethers.utils.parseEther('0.01'));
      expect(await engine.totalHeld()).to.equal(ethers.utils.parseEther('2.41'));

      await engine.withdrawAccruedFees();
      expect(await engine.totalHeld()).to.equal(ethers.utils.parseEther('2.4'));
    });

    it("totalHeld increases from bulk submission", async () => {
      await deployBootstrapValidator();

      expect(await engine.totalHeld()).to.equal(ethers.utils.parseEther('2.4'));

      // add 0.3 token to cover submission fees
      await (await baseToken
        .connect(deployer)
        .transfer(await validator1.getAddress(), ethers.utils.parseEther('0.3'))
      ).wait();

      const modelid = await deployBootstrapModel();

      const taskParams = await bootstrapTaskParams(modelid, "0.1");
      const taskidReceipt = await (await engine
        .connect(validator1)
        .bulkSubmitTask(
          taskParams.version,
          taskParams.owner,
          taskParams.model,
          taskParams.fee,
          taskParams.input,
          3,
        )).wait();

      for (const event of taskidReceipt.events!.slice(0, 3)) {
        expect(event.event).to.eq("TaskSubmitted");
      }
    });

    it("successful contestation changes totalHeld", async () => {
      await deployBootstrapEngineSlashingReached();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      expect(await engine.totalHeld()).to.equal(ethers.utils.parseEther('0'));

      await (await engine
        .connect(deployer) // initial owner
        .setSolutionMineableRate(modelid, ethers.utils.parseEther('1'))
      ).wait();

      // send all validators 10 arbius
      for (const validator of [validator1, validator2, validator3, validator4]) {
        // have validators become validators
        await (await baseToken
          .connect(deployer)
          .transfer(await validator.getAddress(), ethers.utils.parseEther('2.4'))
        ).wait();
        await (await engine
          .connect(validator)
          .validatorDeposit(await validator.getAddress(), ethers.utils.parseEther('2.4'))
        ).wait();
      }

      expect(await engine.totalHeld()).to.equal(ethers.utils.parseEther('9.6'));

      const cid = TESTCID;

      const commitment = await engine.generateCommitment(
        await validator1.getAddress(),
        taskid,
        cid
      );

      // validator1 submits solution
      await (await engine
        .connect(validator1)
        .signalCommitment(commitment)).wait();

      await (await engine
        .connect(validator1)
        .submitSolution(taskid, cid)
      ).wait();

      // validator2 submits contestation
      await (await engine
        .connect(validator2)
        .submitContestation(taskid)
      ).wait();

      // validator3 and validator4 votes yes on contestation
      await (await engine
        .connect(validator3)
        .voteOnContestation(taskid, true)
      ).wait();
      await (await engine
        .connect(validator4)
        .voteOnContestation(taskid, true)
      ).wait();

      // contestation submission and voting do not change totalHeld
      expect(await engine.totalHeld()).to.equal(ethers.utils.parseEther('9.6'));

      for (const validator of [validator1, validator2, validator3, validator4]) {
        expect(await baseToken
          .balanceOf(await validator.getAddress())
        ).to.equal(ethers.utils.parseEther('0'));

        expect((await engine
          .validators(await validator.getAddress())).staked
        ).to.equal(ethers.utils.parseEther('2.10000'));
      }

      // CONTESTATION_VOTE_PERIOD_TIME
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 3)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0.15'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0.075'));
      expect(await baseToken.balanceOf(await validator4.getAddress())).to.equal(ethers.utils.parseEther('0.075'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10000'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator4.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));

      // contestation resolution changes the totalHeld, by the slash distributed tokens amounts (0.15 + 0.075 + 0.075)
      expect(await engine.totalHeld()).to.equal(ethers.utils.parseEther('9.3'));
    });

    it("failed contestation changes the totalHeld", async () => {
      await deployBootstrapEngineSlashingReached();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      await (await engine
        .connect(deployer) // initial owner
        .setSolutionMineableRate(modelid, ethers.utils.parseEther('1'))
      ).wait();

      // send all validators 10 arbius
      for (const validator of [validator1, validator2, validator3, validator4]) {
        // have validators become validators
        await (await baseToken
          .connect(deployer)
          .transfer(await validator.getAddress(), ethers.utils.parseEther('2.4'))
        ).wait();
        await (await engine
          .connect(validator)
          .validatorDeposit(await validator.getAddress(), ethers.utils.parseEther('2.4'))
        ).wait();
      }

      const cid = TESTCID;

      const commitment = await engine.generateCommitment(
        await validator1.getAddress(),
        taskid,
        cid
      );

      // validator1 submits solution
      await (await engine
        .connect(validator1)
        .signalCommitment(commitment)).wait();

      await (await engine
        .connect(validator1)
        .submitSolution(taskid, cid)
      ).wait();

      // validator2 submits contestation
      await (await engine
        .connect(validator2)
        .submitContestation(taskid)
      ).wait();

      // validator3 and validator4 votes no on contestation
      await (await engine
        .connect(validator3)
        .voteOnContestation(taskid, false)
      ).wait();
      await (await engine
        .connect(validator4)
        .voteOnContestation(taskid, false)
      ).wait();

      // contestation submission and voting do not change totalHeld
      expect(await engine.totalHeld()).to.equal(ethers.utils.parseEther('9.6'));

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator4.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10000'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10000'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10000'));
      expect((await engine.validators(await validator4.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10000'));

      // CONTESTATION_VOTE_PERIOD_TIME
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 3)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0.15'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0.075'));
      expect(await baseToken.balanceOf(await validator4.getAddress())).to.equal(ethers.utils.parseEther('0.075'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10000'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator4.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));

      // contestation resolution changes the totalHeld, by the slash distributed tokens amounts (0.15 + 0.075 + 0.075)
      expect(await engine.totalHeld()).to.equal(ethers.utils.parseEther('9.3'));
    });
  });

  describe("rate limiting, bulks", () => {
    it("solution submission rate limit", async () => {
      await deployBootstrapValidator();
      const modelid = await deployBootstrapModel();
      const cid = TESTCID;
      const submit = async () => {
        const taskid = await deployBootstrapTask(modelid);

        const commitment = await engine.generateCommitment(
          await validator1.getAddress(),
          taskid,
          cid
        );

        await (await engine
          .connect(validator1)
          .signalCommitment(commitment)).wait();

        return taskid;
      }

      const taskid = await submit();
      const taskid2 = await submit();

      await ethers.provider.send("evm_setAutomine", [false]);

      const response1 = await engine
        .connect(validator1)
        .submitSolution(taskid, cid);
      const response2 = await engine
        .connect(validator1)
        .submitSolution(taskid2, cid);

      await ethers.provider.send("evm_setAutomine", [true]);

      await ethers.provider.send("evm_mine", []);

      await expect(response1.wait()).to.be.not.reverted;
      await expect(response2.wait()).to.be.reverted;
    });

    it("bulk task, bulk solution", async () => {
      await deployBootstrapValidator();
      const modelid = await deployBootstrapModel();
      const taskParams = await bootstrapTaskParams(modelid);
      const cid = TESTCID;

      const prepareBulk = async (count: number) => {
        const receipt = await (await engine
          .connect(validator1)
          .bulkSubmitTask(
            taskParams.version,
            taskParams.owner,
            taskParams.model,
            taskParams.fee,
            taskParams.input,
            count,
          )).wait();

        const taskids = receipt.events!.filter(val => val.event === "TaskSubmitted").map((event) => event.args!.id);
        await Promise.all(taskids.map(async (taskid) => {
          const commitment = await engine.generateCommitment(
            await validator1.getAddress(),
            taskid,
            cid
          );

          await (await engine
            .connect(validator1)
            .signalCommitment(commitment)).wait();

          return taskid;
        }));

        return taskids;
      };

      const submitBulk = async (ids: string[]) => engine.connect(validator1).bulkSubmitSolution(ids, ids.map(() => cid));
      const bulks = await Promise.all([prepareBulk(5), prepareBulk(5)])

      await expect(submitBulk(bulks[0])).to.be.not.reverted;
      await expect(submitBulk(bulks[1])).to.be.reverted; // needs 5 seconds gap, we have 1

      // advance time
      await ethers.provider.send("evm_increaseTime", [5]);

      await expect(submitBulk(bulks[1])).to.be.not.reverted;
    });
  });

  describe("task owner fees", () => {
    it("task owner fees are collected", async () => {
      expect(await baseToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther('0'));

      await deployBootstrapValidator();

      // add 0.1 token to cover submission fee
      await (await baseToken
        .connect(deployer)
        .transfer(await validator1.getAddress(), ethers.utils.parseEther('0.1'))
      ).wait();

      expect(await baseToken.balanceOf(validator1.address)).to.equal(ethers.utils.parseEther('0.1'));

      const addr = await user1.getAddress();
      const fee = ethers.utils.parseEther('0.01');

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

      await (await engine
        .connect(deployer) // initial owner
        .setSolutionMineableRate(modelid, ethers.utils.parseEther('1'))
      ).wait();

      const taskParams = {
        version: BigNumber.from("0"),
        owner: await user1.getAddress(),
        model: modelid,
        fee: ethers.utils.parseEther("0.01"),
        input: TESTBUF, // normally this would be json but it doesnt matter for testing
        cid: TESTCID,
      };;
      const taskidReceipt = await (await engine
        .connect(validator1 ?? user1)
        .submitTask(
          taskParams.version,
          user2.address,
          taskParams.model,
          taskParams.fee,
          taskParams.input,
        )).wait();
      const taskSubmittedEvent = taskidReceipt.events![0];
      // @ts-ignore
      const { id: taskid } = taskSubmittedEvent.args;

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

      await expect(engine
        .connect(validator1)
        .claimSolution(taskid)
      ).to.emit(engine, 'SolutionClaimed')
      .withArgs(await validator1.getAddress(), taskid);

      // validator reward
      expect(await baseToken.balanceOf(validator1.address)).to.equal(ethers.utils.parseEther('80.088665333333333332'));
      // task fee
      expect(await baseToken.balanceOf(user1.address)).to.equal(ethers.utils.parseEther('0.01'));
      // model fee
      expect(await baseToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther('9.999833166666666667'));
    });

    it("successful contestation distributes task fees and rewards", async () => {
      await deployBootstrapEngineSlashingReached();

      expect(await baseToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther('0'));

      // send all validators 10 arbius
      for (const validator of [validator1, validator2, validator3, validator4]) {
        // have validators become validators
        await (await baseToken
          .connect(deployer)
          .transfer(await validator.getAddress(), ethers.utils.parseEther('2.4'))
        ).wait();
        await (await engine
          .connect(validator)
          .validatorDeposit(await validator.getAddress(), ethers.utils.parseEther('2.4'))
        ).wait();
      }

      // add 0.01 token to cover submission fee
      await (await baseToken
        .connect(deployer)
        .transfer(await validator1.getAddress(), ethers.utils.parseEther('0.01'))
      ).wait();

      expect(await baseToken.balanceOf(validator1.address)).to.equal(ethers.utils.parseEther('0.01'));

      const addr = await user1.getAddress();
      const fee = ethers.utils.parseEther('0.01');

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

      await (await engine
        .connect(deployer) // initial owner
        .setSolutionMineableRate(modelid, ethers.utils.parseEther('1'))
      ).wait();

      const taskParams = {
        version: BigNumber.from("0"),
        owner: await user1.getAddress(),
        model: modelid,
        fee: ethers.utils.parseEther("0.01"),
        input: TESTBUF, // normally this would be json but it doesnt matter for testing
        cid: TESTCID,
      };
      const taskidReceipt = await (await engine
        .connect(validator1 ?? user1)
        .submitTask(
          taskParams.version,
          user2.address,
          taskParams.model,
          taskParams.fee,
          taskParams.input,
        )).wait();
      const taskSubmittedEvent = taskidReceipt.events![0];
      // @ts-ignore
      const { id: taskid } = taskSubmittedEvent.args;

      const cid = TESTCID;

      const commitment = await engine.generateCommitment(
        await validator1.getAddress(),
        taskid,
        cid
      );

      // validator1 submits solution
      await (await engine
        .connect(validator1)
        .signalCommitment(commitment)).wait();

      await (await engine
        .connect(validator1)
        .submitSolution(taskid, cid)
      ).wait();

      // validator2 submits contestation
      await (await engine
        .connect(validator2)
        .submitContestation(taskid)
      ).wait();

      // validator3 and validator4 votes yes on contestation
      await (await engine
        .connect(validator3)
        .voteOnContestation(taskid, true)
      ).wait();
      await (await engine
        .connect(validator4)
        .voteOnContestation(taskid, true)
      ).wait();

      for (const validator of [validator1, validator2, validator3, validator4]) {
        expect(await baseToken
          .balanceOf(await validator.getAddress())
        ).to.equal(ethers.utils.parseEther('0'));

        expect((await engine
          .validators(await validator.getAddress())).staked
        ).to.equal(ethers.utils.parseEther('2.10000'));
      }

      // CONTESTATION_VOTE_PERIOD_TIME
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 3)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0.15'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0.075'));
      expect(await baseToken.balanceOf(await validator4.getAddress())).to.equal(ethers.utils.parseEther('0.075'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10000'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator4.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));

      // validator reward
      expect(await baseToken.balanceOf(validator1.address)).to.equal(ethers.utils.parseEther('0'));
      // model fee
      expect(await baseToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther('0.01'));
      // task fee
      expect(await baseToken.balanceOf(user1.address)).to.not.equal(ethers.utils.parseEther('0'));
    });

    it("failed contestation distributes task fees and rewards", async () => {
      await deployBootstrapEngineSlashingReached();

      expect(await baseToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther('0'));

      // send all validators 10 arbius
      for (const validator of [validator1, validator2, validator3, validator4]) {
        // have validators become validators
        await (await baseToken
          .connect(deployer)
          .transfer(await validator.getAddress(), ethers.utils.parseEther('2.4'))
        ).wait();
        await (await engine
          .connect(validator)
          .validatorDeposit(await validator.getAddress(), ethers.utils.parseEther('2.4'))
        ).wait();
      }

      // add 0.01 token to cover submission fee
      await (await baseToken
        .connect(deployer)
        .transfer(await validator1.getAddress(), ethers.utils.parseEther('0.01'))
      ).wait();

      expect(await baseToken.balanceOf(validator1.address)).to.equal(ethers.utils.parseEther('0.01'));

      const addr = await user1.getAddress();
      const fee = ethers.utils.parseEther('0.01');

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

      await (await engine
        .connect(deployer) // initial owner
        .setSolutionMineableRate(modelid, ethers.utils.parseEther('1'))
      ).wait();

      const taskParams = {
        version: BigNumber.from("0"),
        owner: await user1.getAddress(),
        model: modelid,
        fee: ethers.utils.parseEther("0.01"),
        input: TESTBUF, // normally this would be json but it doesnt matter for testing
        cid: TESTCID,
      };
      const taskidReceipt = await (await engine
        .connect(validator1 ?? user1)
        .submitTask(
          taskParams.version,
          user2.address,
          taskParams.model,
          taskParams.fee,
          taskParams.input,
        )).wait();
      const taskSubmittedEvent = taskidReceipt.events![0];
      // @ts-ignore
      const { id: taskid } = taskSubmittedEvent.args;

      const cid = TESTCID;

      const commitment = await engine.generateCommitment(
        await validator1.getAddress(),
        taskid,
        cid
      );

      // validator1 submits solution
      await (await engine
        .connect(validator1)
        .signalCommitment(commitment)).wait();

      await (await engine
        .connect(validator1)
        .submitSolution(taskid, cid)
      ).wait();

      // validator2 submits contestation
      await (await engine
        .connect(validator2)
        .submitContestation(taskid)
      ).wait();

      // validator3 and validator4 votes yes on contestation
      await (await engine
        .connect(validator3)
        .voteOnContestation(taskid, false)
      ).wait();
      await (await engine
        .connect(validator4)
        .voteOnContestation(taskid, false)
      ).wait();

      for (const validator of [validator1, validator2, validator3, validator4]) {
        expect(await baseToken
          .balanceOf(await validator.getAddress())
        ).to.equal(ethers.utils.parseEther('0'));

        expect((await engine
          .validators(await validator.getAddress())).staked
        ).to.equal(ethers.utils.parseEther('2.10000'));
      }

      // CONTESTATION_VOTE_PERIOD_TIME
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 3)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0.15'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0.0'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0.075'));
      expect(await baseToken.balanceOf(await validator4.getAddress())).to.equal(ethers.utils.parseEther('0.075'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.1'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator4.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));

      // validator reward
      expect(await baseToken.balanceOf(validator1.address)).to.equal(ethers.utils.parseEther('0.15'));
      // task fee
      expect(await baseToken.balanceOf(user1.address)).to.equal(ethers.utils.parseEther('0.01'));
      // model fee
      expect(await baseToken.balanceOf(user2.address)).to.not.equal(ethers.utils.parseEther('0'));
    });
  });

  // TODO
  // test all totalHeld interactions (deposit, withdraw, claim, contest, etc) ✅
  // test solution rate limit ✅
  // test bulk solution submission ✅
  // test update to solution submission ✅
  // test bulk task submission ✅
  // test update to task submission ✅
  // test claim sends correct rewards to task owner (as well as validator) ✅
  // test claim sends rewards correctly during contestation ❌
});
