import { ethers, upgrades } from "hardhat";
import { BigNumber } from 'ethers';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "./chai-setup";
import { Signer } from "ethers";
import { BaseTokenV1 as BaseToken } from "../typechain/BaseTokenV1";
import { EngineV1 as Engine } from "../typechain/EngineV1";

const TESTCID = '0x1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8';
const TESTBUF = '0x746573740a';

describe("Engine Unit Tests", () => {
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
    validator4 = signers[6];
    treasury   = signers[7];
    model1     = signers[8];
    lpreward   = signers[9];

    const BaseToken = await ethers.getContractFactory(
      "BaseTokenV1"
    );
    baseToken = (await upgrades.deployProxy(BaseToken, [
      await deployer.getAddress(),
      ethers.constants.AddressZero,
    ])) as BaseToken;
    await baseToken.deployed();
    // console.log("BaseToken deployed to:", baseToken.address);

    const Engine = await ethers.getContractFactory(
      "EngineV1"
    );
    engine = (await upgrades.deployProxy(Engine, [
      baseToken.address,
      await treasury.getAddress(),
    ])) as Engine;
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

  async function deployBootstrapTask(modelid: string): Promise<string> {
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

  describe("initialization", () => {
    it("it should be impossible to initialize contract after deploy", async () => {
      await expect(baseToken.initialize(ethers.constants.AddressZero, ethers.constants.AddressZero)).to.be.reverted;
    });
  });

  describe("meta", () => {
    it("get name", async () => {
      expect(await baseToken.name()).to.equal("Arbius");
    });
    it("get symbol", async () => {
      expect(await baseToken.symbol()).to.equal("AIUS");
    });
  });


  describe("validator", () => {
    it("become validator", async () => {
      await (await baseToken
        .connect(deployer)
        .transfer(await validator1.getAddress(), ethers.utils.parseEther('2.4'))
      ).wait();

      await expect(engine
        .connect(validator1)
        .validatorDeposit(await validator1.getAddress(), ethers.utils.parseEther('2.4'))
      ).to.emit(engine, "ValidatorDeposit")
      .withArgs(
        await validator1.getAddress(),
        await validator1.getAddress(),
        ethers.utils.parseEther('2.4'),
      );

      const validator = await engine.validators(await validator1.getAddress());
      expect(validator.addr).to.equal(await validator1.getAddress());
      expect(validator.staked).to.equal(ethers.utils.parseEther("2.4"));
    });

    it("exit validator", async () => {
      await (await baseToken
        .connect(deployer)
        .transfer(await validator1.getAddress(), ethers.utils.parseEther('2.4'))
      ).wait();

      await (await engine
        .connect(validator1)
        .validatorDeposit(await validator1.getAddress(), ethers.utils.parseEther('2.4'))
      ).wait();

      await expect(engine
        .connect(validator1)
        .initiateValidatorWithdraw(ethers.utils.parseEther('2.4'))
      ).to.emit(engine, "ValidatorWithdrawInitiated");

      await ethers.provider.send("evm_increaseTime", [86400]);
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

      const validator = await engine.validators(await validator1.getAddress());
      expect(validator.staked).to.equal(ethers.utils.parseEther("0"));

      expect(await baseToken
        .balanceOf(await validator1.getAddress())
      ).to.equal(ethers.utils.parseEther("2.4"));
    });

    it("cannot solve task while exiting", async () => {
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      await (await baseToken
        .connect(deployer)
        .transfer(await validator1.getAddress(), ethers.utils.parseEther('2.4'))
      ).wait();

      await (await engine
        .connect(validator1)
        .validatorDeposit(await validator1.getAddress(), ethers.utils.parseEther('2.4'))
      ).wait();

      await expect(engine
        .connect(validator1)
        .initiateValidatorWithdraw(ethers.utils.parseEther('2.4'))
      ).to.emit(engine, "ValidatorWithdrawInitiated");

      const cid = TESTCID;
      const commitment = await engine.generateCommitment(
        await validator1.getAddress(),
        taskid,
        cid
      );

      await (await engine
        .connect(validator1)
        .signalCommitment(commitment)).wait();

      await expect(engine
        .connect(validator1)
        .submitSolution(taskid, cid)
      ).to.be.revertedWith('min staked too low');
    });

    it("signal support", async () => {
      await (await baseToken
        .connect(deployer)
        .transfer(await validator1.getAddress(), ethers.utils.parseEther('2.4'))
      ).wait();

      const validator = await deployBootstrapValidator();
      const modelid = await deployBootstrapModel();

      await expect(engine
        .connect(validator1)
        .signalSupport(modelid, true)
      ).to.emit(engine, "SignalSupport")
      .withArgs(await validator1.getAddress(), modelid, true);
    });
  });

  describe("admin", () => {
    it("add mineable model", async () => {
      const modelid = await deployBootstrapModel();
      const rate = ethers.utils.parseEther('1');
      await expect(engine
        .connect(deployer) // initial owner
        .setSolutionMineableRate(modelid, rate)
      ).to.emit(engine, 'SolutionMineableRateChange')
      .withArgs(modelid, rate);
    });
  });

  describe("model", () => {
    it("register model", async () => {
      const addr = await user1.getAddress();
      const fee = ethers.utils.parseEther('0');

      const modelid = await engine.hashModel({
        addr,
        fee,
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, await user1.getAddress());

      await expect(engine
        .connect(user1)
        .registerModel(addr, fee, TESTBUF)
      ).to.emit(engine, "ModelRegistered")
      .withArgs(modelid);

      const model = await engine.models(modelid);

      expect(model.addr).to.equal(addr);
      expect(model.fee).to.equal(fee);
      expect(model.cid).to.equal(TESTCID);
    });
  });

  describe("task", () => {
    it("submit test bootstrap task", async () => {
      const modelid = await deployBootstrapModel();
      const model = await engine.models(modelid);
      const taskParams = await bootstrapTaskParams(modelid);
      const taskid = await deployBootstrapTask(modelid);

      const task = await engine.tasks(taskid);

      expect(task.version).to.equal(taskParams.version);
      expect(task.owner).to.equal(taskParams.owner);
      expect(task.model).to.equal(taskParams.model);
      // expect(task.blocktime).to.equal(taskParams.blocktime);
      expect(task.fee).to.equal(taskParams.fee);
      expect(task.cid).to.equal(TESTCID); 
    });

    it("retract test bootstrap task", async () => {
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      // MIN_RETRACTION_WAIT
      await ethers.provider.send("evm_increaseTime", [10010]);
      await ethers.provider.send("evm_mine", []);

      await expect(engine
        .connect(user1)
        .retractTask(taskid)
      ).to.emit(engine, 'TaskRetracted')
      .withArgs(taskid);
    });

    it("submit solution commitment", async () => {
      await deployBootstrapValidator();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      const cid = TESTCID;

      const commitment = await engine.generateCommitment(
        await validator1.getAddress(),
        taskid,
        cid
      );

      await expect(engine
        .connect(validator1)
        .signalCommitment(commitment)
      ).to.emit(engine, 'SignalCommitment')
      .withArgs(await validator1.getAddress(), commitment);

      const commitmentLookup = await engine.commitments(commitment);
      expect(commitmentLookup.toNumber()).to.be.above(1);
    });
    // TODO check commitment can not be made within same tx as solution

    it("submit uncontested solution", async () => {
      await deployBootstrapValidator();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      const cid = TESTCID;

      const commitment = await engine.generateCommitment(
        await validator1.getAddress(),
        taskid,
        cid
      );

      await (await engine
        .connect(validator1)
        .signalCommitment(commitment)).wait();

      await expect(engine
        .connect(validator1)
        .submitSolution(taskid, cid)
      ).to.emit(engine, 'SolutionSubmitted')
      .withArgs(await validator1.getAddress(), taskid);

      const solution = await engine.solutions(taskid);
      expect(solution.validator).to.equal(await validator1.getAddress());
      expect(solution.cid).to.equal(cid);
    });

    it("claim uncontested solution", async () => {
      await deployBootstrapValidator();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

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
    });

    it("claim uncontested solution with fees going to model creator and solver", async () => {
      await deployBootstrapValidator();

      const addr = await model1.getAddress();
      const fee = ethers.utils.parseEther("3");
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

      // send user some tokens for fees
      await (await baseToken
        .connect(deployer)
        .transfer(await user1.getAddress(), ethers.utils.parseEther('4'))
      ).wait();
      await (await baseToken
        .connect(user1)
        .approve(engine.address, ethers.utils.parseEther('4'))
      ).wait();


      const taskidReceipt = await (await engine
        .connect(user1)
        .submitTask(
          '0',
          await user1.getAddress(),
          modelid,
          ethers.utils.parseEther('4'),
          TESTCID,
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

      await (await engine
        .connect(validator1)
        .claimSolution(taskid)
      ).wait();

      expect(await baseToken.balanceOf(await user1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await model1.getAddress())).to.equal(ethers.utils.parseEther('3'));
      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0.9'));
      expect(await engine.accruedFees()).to.equal(ethers.utils.parseEther('0.1'));
    });
  });

  // TODO test claiming without waiting
  // TODO test claiming twice fails

  // test task cannot be claimed before MIN_CLAIM_SOLUTION_TIME

  describe('contestation before slashing', () => {
    it("cannot contest nonexistent task", async () => {
      await deployBootstrapValidator();

      await expect(
        engine
        .connect(validator1)
        .submitContestation(ethers.constants.HashZero)
      ).to.be.reverted;
    });

    it("cannot contest task without solution", async () => {
      await deployBootstrapValidator();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      await expect(
        engine
        .connect(validator1)
        .submitContestation(taskid)
      ).to.be.revertedWith('solution does not exist');
    });

    it("cannot contest as non validator", async () => {
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

      await expect(
        engine
        .connect(validator2)
        .submitContestation(ethers.constants.HashZero)
      ).to.be.reverted;
    });

    // TODO cannot contest outside of contestation time range

    it("contest blocks claim", async () => {
      await deployBootstrapEngineSlashingNotReached();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      await (await engine
        .connect(deployer) // initial owner
        .setSolutionMineableRate(modelid, ethers.utils.parseEther('1'))
      ).wait();

      for (const validator of [validator1, validator2]) {
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

      await (await engine
        .connect(validator1)
        .signalCommitment(commitment)).wait();

      await (await engine
        .connect(validator1)
        .submitSolution(taskid, cid)
      ).wait();

      // contest!!!
      await (await engine
        .connect(validator2)
        .submitContestation(taskid)
      ).wait();

      // MIN_CLAIM_SOLUTION_TIME
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        engine
        .connect(validator1)
        .claimSolution(taskid)
      ).to.be.reverted;
    });

    it("cannot finish contestation before vote period", async () => {
      await deployBootstrapEngineSlashingNotReached();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      await (await engine
        .connect(deployer) // initial owner
        .setSolutionMineableRate(modelid, ethers.utils.parseEther('1'))
      ).wait();

      for (const validator of [validator1, validator2]) {
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

      await (await engine
        .connect(validator1)
        .signalCommitment(commitment)).wait();

      await (await engine
        .connect(validator1)
        .submitSolution(taskid, cid)
      ).wait();

      // contest!!!
      await (await engine
        .connect(validator2)
        .submitContestation(taskid)
      ).wait();

      // we do not wait here..

      await expect(
        engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 2)
      ).to.be.reverted;
    });

    it("successful contestation with 1 other voter", async () => {
      await deployBootstrapEngineSlashingNotReached();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      await (await engine
        .connect(deployer) // initial owner
        .setSolutionMineableRate(modelid, ethers.utils.parseEther('1'))
      ).wait();

      // make 3 validators
      for (const validator of [validator1, validator2, validator3]) {
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

      // validator3 votes yes on contestation
      await (await engine
        .connect(validator3)
        .voteOnContestation(taskid, true)
      ).wait();


      // CONTESTATION_VOTE_PERIOD_TIME
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 3)
      ).to.emit(engine, "ContestationVoteFinish")
      .withArgs(taskid, 0, 3);

      const finish_start_index = (await engine.contestations(taskid)).finish_start_index;
      expect(finish_start_index).to.equal(3);
    });

    it("successful contestation with 1 other voter results in fee refund to submitter", async () => {
      await deployBootstrapEngineSlashingNotReached();
      const modelid = await deployBootstrapModel();

      const taskParams = await bootstrapTaskParams(modelid);

      // have user receive token to pay fee
      await (await baseToken
        .connect(deployer)
        .transfer(await user1.getAddress(), ethers.utils.parseEther('1'))
      ).wait();

      await (await baseToken
        .connect(user1)
        .approve(engine.address, ethers.utils.parseEther('1'))
      ).wait();

      expect(await baseToken.balanceOf(await user1.getAddress())).to.equal(ethers.utils.parseEther('1'));

      const taskidReceipt = await (await engine
        .connect(user1)
        .submitTask(
          '0',
          await user1.getAddress(),
          modelid,
          ethers.utils.parseEther('1'),
          TESTCID,
        )).wait();
      const taskSubmittedEvent = taskidReceipt.events![0];
      // @ts-ignore
      const { id: taskid } = taskSubmittedEvent.args;

      expect(await baseToken.balanceOf(await user1.getAddress())).to.equal(ethers.utils.parseEther('0'));

      await (await engine
        .connect(deployer) // initial owner
        .setSolutionMineableRate(modelid, ethers.utils.parseEther('1'))
      ).wait();

      for (const validator of [validator1, validator2, validator3]) {
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

      // validator3 votes yes on contestation
      await (await engine
        .connect(validator3)
        .voteOnContestation(taskid, true)
      ).wait();


      // CONTESTATION_VOTE_PERIOD_TIME
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 3)
      ).wait();

      expect(await baseToken.balanceOf(await user1.getAddress())).to.equal(ethers.utils.parseEther('1'));
    });

    it("failed contestation due to no other voters", async () => {
      await deployBootstrapEngineSlashingNotReached();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      await (await engine
        .connect(deployer) // initial owner
        .setSolutionMineableRate(modelid, ethers.utils.parseEther('1'))
      ).wait();


      for (const validator of [validator1, validator2, validator3]) {
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

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));

      // CONTESTATION_VOTE_PERIOD_TIME
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 3)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
    });

    it("failed contestation results in fee going to original solver", async () => {
      await deployBootstrapEngineSlashingNotReached();
      const modelid = await deployBootstrapModel();

      await (await engine
        .connect(deployer) // initial owner
        .setSolutionMineableRate(modelid, ethers.utils.parseEther('1'))
      ).wait();


      // have user receive token to pay fee
      await (await baseToken
        .connect(deployer)
        .transfer(await user1.getAddress(), ethers.utils.parseEther('1'))
      ).wait();

      await (await baseToken
        .connect(user1)
        .approve(engine.address, ethers.utils.parseEther('1'))
      ).wait();

      expect(await baseToken.balanceOf(await user1.getAddress())).to.equal(ethers.utils.parseEther('1'));

      const taskidReceipt = await (await engine
        .connect(user1)
        .submitTask(
          '0',
          await user1.getAddress(),
          modelid,
          ethers.utils.parseEther('1'),
          TESTCID,
        )).wait();
      const taskSubmittedEvent = taskidReceipt.events![0];
      // @ts-ignore
      const { id: taskid } = taskSubmittedEvent.args;

      expect(await baseToken.balanceOf(await user1.getAddress())).to.equal(ethers.utils.parseEther('0'));

      for (const validator of [validator1, validator2, validator3]) {
        // send all validators 10 arbius
        await (await baseToken
          .connect(deployer)
          .transfer(await validator.getAddress(), ethers.utils.parseEther('2.4'))
        ).wait();
        // have validators become validators
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

      // CONTESTATION_VOTE_PERIOD_TIME
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 3)
      ).wait();

      // 1 for winning + 1-10% for task fee
      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0.9'));

      expect(await engine.accruedFees()).to.equal(ethers.utils.parseEther('0.1'));
    });

    it("failed contestation due to 2 voters", async () => {
      await deployBootstrapEngineSlashingNotReached();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      await (await engine
        .connect(deployer) // initial owner
        .setSolutionMineableRate(modelid, ethers.utils.parseEther('1'))
      ).wait();

      // send all validators 10 arbius
      for (const validator of [validator1, validator2, validator3]) {
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

      // validator3 votes no on contestation
      await (await engine
        .connect(validator3)
        .voteOnContestation(taskid, false)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));

      // CONTESTATION_VOTE_PERIOD_TIME
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 3)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
    });

    it("failed contestation due to 3 voters", async () => {
      await deployBootstrapEngineSlashingNotReached();
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

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator4.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator4.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));

      // CONTESTATION_VOTE_PERIOD_TIME
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 3)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator4.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator4.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
    });

    it("successful contestation with 1 other voters with params set", async () => {
      await deployBootstrapEngineSlashingNotReached();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      await (await engine
        .connect(deployer) // initial owner
        .setSolutionMineableRate(modelid, ethers.utils.parseEther('1'))
      ).wait();

      // send all validators 10 arbius
      for (const validator of [validator1, validator2, validator3]) {
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

      // validator3 votes yes on contestation
      await (await engine
        .connect(validator3)
        .voteOnContestation(taskid, true)
      ).wait();

      for (const validator of [validator1, validator2, validator3]) {
        expect(await baseToken
          .balanceOf(await validator.getAddress())
        ).to.equal(ethers.utils.parseEther('0'));
        expect((await engine
          .validators(await validator1.getAddress())).staked
        ).to.equal(ethers.utils.parseEther('2.4'));
      }

      // CONTESTATION_VOTE_PERIOD_TIME
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 3)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
    });

    it("successful contestation with 2 other voters with params set", async () => {
      await deployBootstrapEngineSlashingNotReached();
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
        ).to.equal(ethers.utils.parseEther('2.4'));
      }

      // CONTESTATION_VOTE_PERIOD_TIME
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 3)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator4.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator4.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
    });

    it("successful contestation with 2 other voters with multiple iterations", async () => {
      await deployBootstrapEngineSlashingNotReached();
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
          .balanceOf(await validator1.getAddress())
        ).to.equal(ethers.utils.parseEther('0'));
        expect((await engine
          .validators(await validator1.getAddress())).staked
        ).to.equal(ethers.utils.parseEther('2.4'));
      }

      // CONTESTATION_VOTE_PERIOD_TIME
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      expect((await engine.contestations(taskid)).finish_start_index).to.equal(0);

      // first iteration
      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 1)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator4.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator4.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));

      expect((await engine.contestations(taskid)).finish_start_index).to.equal(1);

      // second iteration
      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 1)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator4.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator4.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));

      expect((await engine.contestations(taskid)).finish_start_index).to.equal(2);

      // third iteration
      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 1)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator4.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator4.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));

      expect((await engine.contestations(taskid)).finish_start_index).to.equal(3);

      // fourth iteration (does nothing)
      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 1)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator4.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator4.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));

      expect((await engine.contestations(taskid)).finish_start_index).to.equal(4);
    });
  });

  describe('contestation with slahing reached', () => {
    it("cannot contest nonexistent task", async () => {
      await deployBootstrapValidator();

      await expect(
        engine
        .connect(validator1)
        .submitContestation(ethers.constants.HashZero)
      ).to.be.reverted;
    });

    it("cannot contest task without solution", async () => {
      await deployBootstrapValidator();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      await expect(
        engine
        .connect(validator1)
        .submitContestation(taskid)
      ).to.be.revertedWith('solution does not exist');
    });

    it("cannot contest as non validator", async () => {
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

      await expect(
        engine
        .connect(validator2)
        .submitContestation(ethers.constants.HashZero)
      ).to.be.reverted;
    });

    // TODO cannot contest outside of contestation time range

    it("contest blocks claim", async () => {
      await deployBootstrapEngineSlashingReached();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      await (await engine
        .connect(deployer) // initial owner
        .setSolutionMineableRate(modelid, ethers.utils.parseEther('1'))
      ).wait();

      for (const validator of [validator1, validator2]) {
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

      await (await engine
        .connect(validator1)
        .signalCommitment(commitment)).wait();

      await (await engine
        .connect(validator1)
        .submitSolution(taskid, cid)
      ).wait();

      // contest!!!
      await (await engine
        .connect(validator2)
        .submitContestation(taskid)
      ).wait();

      // MIN_CLAIM_SOLUTION_TIME
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        engine
        .connect(validator1)
        .claimSolution(taskid)
      ).to.be.reverted;
    });

    it("cannot finish contestation before vote period", async () => {
      await deployBootstrapEngineSlashingReached();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      await (await engine
        .connect(deployer) // initial owner
        .setSolutionMineableRate(modelid, ethers.utils.parseEther('1'))
      ).wait();

      for (const validator of [validator1, validator2]) {
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

      await (await engine
        .connect(validator1)
        .signalCommitment(commitment)).wait();

      await (await engine
        .connect(validator1)
        .submitSolution(taskid, cid)
      ).wait();

      // contest!!!
      await (await engine
        .connect(validator2)
        .submitContestation(taskid)
      ).wait();

      // we do not wait here..

      await expect(
        engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 2)
      ).to.be.reverted;
    });

    it("successful contestation with 1 other voter", async () => {
      await deployBootstrapEngineSlashingReached();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      await (await engine
        .connect(deployer) // initial owner
        .setSolutionMineableRate(modelid, ethers.utils.parseEther('1'))
      ).wait();

      // make 3 validators
      for (const validator of [validator1, validator2, validator3]) {
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

      // validator3 votes yes on contestation
      await (await engine
        .connect(validator3)
        .voteOnContestation(taskid, true)
      ).wait();


      // CONTESTATION_VOTE_PERIOD_TIME
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 3)
      ).to.emit(engine, "ContestationVoteFinish")
      .withArgs(taskid, 0, 3);

      const finish_start_index = (await engine.contestations(taskid)).finish_start_index;
      expect(finish_start_index).to.equal(3);
    });

    it("successful contestation with 1 other voter results in fee refund to submitter", async () => {
      await deployBootstrapEngineSlashingReached();
      const modelid = await deployBootstrapModel();

      const taskParams = await bootstrapTaskParams(modelid);

      // have user receive token to pay fee
      await (await baseToken
        .connect(deployer)
        .transfer(await user1.getAddress(), ethers.utils.parseEther('1'))
      ).wait();

      await (await baseToken
        .connect(user1)
        .approve(engine.address, ethers.utils.parseEther('1'))
      ).wait();

      expect(await baseToken.balanceOf(await user1.getAddress())).to.equal(ethers.utils.parseEther('1'));

      const taskidReceipt = await (await engine
        .connect(user1)
        .submitTask(
          '0',
          await user1.getAddress(),
          modelid,
          ethers.utils.parseEther('1'),
          TESTCID,
        )).wait();
      const taskSubmittedEvent = taskidReceipt.events![0];
      // @ts-ignore
      const { id: taskid } = taskSubmittedEvent.args;

      expect(await baseToken.balanceOf(await user1.getAddress())).to.equal(ethers.utils.parseEther('0'));

      await (await engine
        .connect(deployer) // initial owner
        .setSolutionMineableRate(modelid, ethers.utils.parseEther('1'))
      ).wait();

      for (const validator of [validator1, validator2, validator3]) {
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

      // validator3 votes yes on contestation
      await (await engine
        .connect(validator3)
        .voteOnContestation(taskid, true)
      ).wait();


      // CONTESTATION_VOTE_PERIOD_TIME
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 3)
      ).wait();

      expect(await baseToken.balanceOf(await user1.getAddress())).to.equal(ethers.utils.parseEther('1'));
    });

    it("failed contestation due to no other voters", async () => {
      await deployBootstrapEngineSlashingReached();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      await (await engine
        .connect(deployer) // initial owner
        .setSolutionMineableRate(modelid, ethers.utils.parseEther('1'))
      ).wait();


      for (const validator of [validator1, validator2, validator3]) {
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

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10072'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10072'));

      // CONTESTATION_VOTE_PERIOD_TIME
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 3)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0.29928'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10072'));
    });

    it("failed contestation results in fee going to original solver", async () => {
      await deployBootstrapEngineSlashingReached();
      const modelid = await deployBootstrapModel();

      await (await engine
        .connect(deployer) // initial owner
        .setSolutionMineableRate(modelid, ethers.utils.parseEther('1'))
      ).wait();


      // have user receive token to pay fee
      await (await baseToken
        .connect(deployer)
        .transfer(await user1.getAddress(), ethers.utils.parseEther('1'))
      ).wait();

      await (await baseToken
        .connect(user1)
        .approve(engine.address, ethers.utils.parseEther('1'))
      ).wait();

      expect(await baseToken.balanceOf(await user1.getAddress())).to.equal(ethers.utils.parseEther('1'));

      const taskidReceipt = await (await engine
        .connect(user1)
        .submitTask(
          '0',
          await user1.getAddress(),
          modelid,
          ethers.utils.parseEther('1'),
          TESTCID,
        )).wait();
      const taskSubmittedEvent = taskidReceipt.events![0];
      // @ts-ignore
      const { id: taskid } = taskSubmittedEvent.args;

      expect(await baseToken.balanceOf(await user1.getAddress())).to.equal(ethers.utils.parseEther('0'));

      for (const validator of [validator1, validator2, validator3]) {
        // send all validators 10 arbius
        await (await baseToken
          .connect(deployer)
          .transfer(await validator.getAddress(), ethers.utils.parseEther('2.4'))
        ).wait();
        // have validators become validators
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

      // CONTESTATION_VOTE_PERIOD_TIME
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 3)
      ).wait();

      // 1 for winning + 1-10% for task fee
      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('1.19918'));

      expect(await engine.accruedFees()).to.equal(ethers.utils.parseEther('0.1'));
    });

    it("failed contestation due to 2 voters", async () => {
      await deployBootstrapEngineSlashingReached();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      await (await engine
        .connect(deployer) // initial owner
        .setSolutionMineableRate(modelid, ethers.utils.parseEther('1'))
      ).wait();

      // send all validators 10 arbius
      for (const validator of [validator1, validator2, validator3]) {
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

      // validator3 votes no on contestation
      await (await engine
        .connect(validator3)
        .voteOnContestation(taskid, false)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10072'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10072'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10072'));

      // CONTESTATION_VOTE_PERIOD_TIME
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 3)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0.14964'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0.14964'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10072'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
    });

    it("failed contestation due to 3 voters", async () => {
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

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator4.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10096'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10096'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10096'));
      expect((await engine.validators(await validator4.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10096'));

      // CONTESTATION_VOTE_PERIOD_TIME
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 3)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0.14952'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0.07476'));
      expect(await baseToken.balanceOf(await validator4.getAddress())).to.equal(ethers.utils.parseEther('0.07476'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10096'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator4.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
    });

    it("successful contestation with 1 other voters with params set", async () => {
      await deployBootstrapEngineSlashingReached();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      await (await engine
        .connect(deployer) // initial owner
        .setSolutionMineableRate(modelid, ethers.utils.parseEther('1'))
      ).wait();

      // send all validators 10 arbius
      for (const validator of [validator1, validator2, validator3]) {
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

      // validator3 votes yes on contestation
      await (await engine
        .connect(validator3)
        .voteOnContestation(taskid, true)
      ).wait();

      for (const validator of [validator1, validator2, validator3]) {
        expect(await baseToken
          .balanceOf(await validator.getAddress())
        ).to.equal(ethers.utils.parseEther('0'));
        expect((await engine
          .validators(await validator1.getAddress())).staked
        ).to.equal(ethers.utils.parseEther('2.10072'));
      }

      // CONTESTATION_VOTE_PERIOD_TIME
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 3)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0.14964'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0.14964'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10072'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
    });

    it("successful contestation with 2 other voters with params set", async () => {
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
        ).to.equal(ethers.utils.parseEther('2.10096'));
      }

      // CONTESTATION_VOTE_PERIOD_TIME
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 3)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0.14952'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0.07476'));
      expect(await baseToken.balanceOf(await validator4.getAddress())).to.equal(ethers.utils.parseEther('0.07476'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10096'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator4.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
    });

    it("successful contestation with 2 other voters with multiple iterations", async () => {
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
          .balanceOf(await validator1.getAddress())
        ).to.equal(ethers.utils.parseEther('0'));
        expect((await engine
          .validators(await validator1.getAddress())).staked
        ).to.equal(ethers.utils.parseEther('2.10096'));
      }

      // CONTESTATION_VOTE_PERIOD_TIME
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      expect((await engine.contestations(taskid)).finish_start_index).to.equal(0);

      // first iteration
      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 1)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0.14952'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator4.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10096'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10096'));
      expect((await engine.validators(await validator4.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10096'));

      expect((await engine.contestations(taskid)).finish_start_index).to.equal(1);

      // second iteration
      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 1)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0.14952'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0.07476'));
      expect(await baseToken.balanceOf(await validator4.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10096'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator4.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10096'));

      expect((await engine.contestations(taskid)).finish_start_index).to.equal(2);

      // third iteration
      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 1)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0.14952'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0.07476'));
      expect(await baseToken.balanceOf(await validator4.getAddress())).to.equal(ethers.utils.parseEther('0.07476'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10096'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator4.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));

      expect((await engine.contestations(taskid)).finish_start_index).to.equal(3);

      // fourth iteration (does nothing)
      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 1)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0.14952'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0.07476'));
      expect(await baseToken.balanceOf(await validator4.getAddress())).to.equal(ethers.utils.parseEther('0.07476'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10096'));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
      expect((await engine.validators(await validator4.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));

      expect((await engine.contestations(taskid)).finish_start_index).to.equal(4);
    });
  });
});
