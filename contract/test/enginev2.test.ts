import { ethers, upgrades } from "hardhat";
import { BigNumber } from 'ethers';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "./chai-setup";
import { Signer } from "ethers";
import { BaseTokenV1 as BaseToken } from "../typechain/BaseTokenV1";
import { EngineV1 } from "../typechain/V2_EngineV1";
import { EngineV2 } from "../typechain/V2_EngineV2";

const TESTCID = '0x1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8';
const TESTBUF = '0x746573740a';

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
  let engine: EngineV2;

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

    const EngineV1 = await ethers.getContractFactory(
      "V2_EngineV1"
    );
    const EngineV2 = await ethers.getContractFactory(
      "V2_EngineV2"
    );
    engine = (await upgrades.deployProxy(EngineV1, [
      baseToken.address,
      await treasury.getAddress(),
    ])) as EngineV1;
    await engine.deployed();
    // console.log("Engine deployed to:", engine.address);
    
    engine = await upgrades.upgradeProxy(engine.address, EngineV2) as EngineV2;
    // console.log("Engine upgraded");

    await (await engine
      .connect(deployer)
      .setSolutionStakeAmount(ethers.utils.parseEther('0.001'))
    ).wait();

    
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
      const EngineV1 = await ethers.getContractFactory('V2_EngineV1');
      const EngineV2 = await ethers.getContractFactory('V2_EngineV2');
      await upgrades.validateUpgrade(EngineV1, EngineV2);
    });

  });

  describe("admin", () => {
    it("set solution stake amount", async () => {
      await expect(engine
        .connect(deployer)
        .setSolutionStakeAmount(ethers.utils.parseEther('50'))
      ).to.emit(engine, 'SolutionStakeAmountChanged')
      .withArgs(ethers.utils.parseEther('50'));

      expect(await engine.solutionsStakeAmount()).to.equal(ethers.utils.parseEther('50'));
    });

    it("non owner cannot set solution stake amount", async () => {
      await expect(engine
        .connect(user1)
        .setSolutionStakeAmount(50)
      ).to.be.reverted;
    });
  });

  describe("task", () => {
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

      const { staked: stakedBefore } = await engine.validators(await validator1.getAddress());

      await expect(engine
        .connect(validator1)
        .submitSolution(taskid, cid)
      ).to.emit(engine, 'SolutionSubmitted')
      .withArgs(await validator1.getAddress(), taskid);

      const { staked: stakedAfter } = await engine.validators(await validator1.getAddress());

      expect(stakedBefore.sub(stakedAfter)).to.equal(ethers.utils.parseEther('0.001'));

      const solution = await engine.solutions(taskid);
      expect(solution.validator).to.equal(await validator1.getAddress());
      expect(solution.cid).to.equal(cid);

      const solutionStakeAmount = await engine.solutionsStake(taskid);
      expect(solutionStakeAmount).to.equal(ethers.utils.parseEther('0.001'));
    });

    it("claim uncontested solution", async () => {
      await deployBootstrapValidator();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

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

      expect(stakedBefore.sub(stakedAfter)).to.equal(ethers.utils.parseEther('0.001'));

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
    });

    it("failed contestation due to no other voters", async () => {
      await deployBootstrapValidator();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      for (const validator of [validator2, validator3]) {
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
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4').sub(ethers.utils.parseEther('0.001')));
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

    it("successful contestation with 1 other voter", async () => {
      await deployBootstrapValidator();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      // make 3 validators
      for (const validator of [validator2, validator3]) {
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

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4').sub(ethers.utils.parseEther('0.001')));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4').add(ethers.utils.parseEther('0.001')));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));
    });

    it("successful contestation with 1 other voter, contested validator can not submit other solutions until cooldown", async () => {
      await deployBootstrapValidator();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      // make 3 validators
      for (const validator of [validator2, validator3]) {
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

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0'));
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4').sub(ethers.utils.parseEther('0.001')));
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4').add(ethers.utils.parseEther('0.001')));
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4'));

      expect((await engine.lastContestationLossTime(await validator1.getAddress())).toNumber()).to.be.greaterThan(0);
      expect(engine.connect(validator1).claimSolution(taskid)).to.be.revertedWith('claimSolution cooldown after lost contestation');

      // validator1 submits another task and solution
      const taskid2 = await deployBootstrapTask(modelid, validator1);
      const commitment2 = await engine.generateCommitment(
        await validator1.getAddress(),
        taskid2,
        cid
      );
      await (await engine
        .connect(validator1)
        .signalCommitment(commitment2)).wait();

      await expect(engine
        .connect(validator1)
        .submitSolution(taskid2, cid)
      ).to.be.revertedWith('submitSolution cooldown after lost contestation');

      // wait the cooldown time
      await ethers.provider.send("evm_increaseTime", [40000]);
      await ethers.provider.send("evm_mine", []);

      await expect(engine
        .connect(validator1)
        .submitSolution(taskid2, cid)
      ).not.to.be.revertedWith('submitSolution cooldown after lost contestation');
    });

    it("failed contestation due to no other voters, slashing reached", async () => {
      await deployBootstrapEngineSlashingReached();
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

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
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10072').sub(ethers.utils.parseEther('0.001'))); // paid the contestation stake and solutionsStake
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10072')); // paid the contestation stake

      // CONTESTATION_VOTE_PERIOD_TIME
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      await (await engine
        .connect(validator1)
        .contestationVoteFinish(taskid, 3)
      ).wait();

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0.29928')); // contestation reward
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0')); // balance unchanged
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4')); // stake effectively unchanged
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10072')); // stake reduced by contestation amount
    });

    it("successful contestation with 1 other voter, slashing reached2", async () => {
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

      expect(await baseToken.balanceOf(await validator1.getAddress())).to.equal(ethers.utils.parseEther('0')); // balance unchanged
      expect(await baseToken.balanceOf(await validator2.getAddress())).to.equal(ethers.utils.parseEther('0.14964')); // contestation reward
      expect(await baseToken.balanceOf(await validator3.getAddress())).to.equal(ethers.utils.parseEther('0.14964')); // contestation reward
      expect((await engine.validators(await validator1.getAddress())).staked).to.equal(ethers.utils.parseEther('2.10072').sub(ethers.utils.parseEther('0.001'))); // contestation penalty and solution stake
      expect((await engine.validators(await validator2.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4').add(ethers.utils.parseEther('0.001'))); // staked contestation reward from solution stake
      expect((await engine.validators(await validator3.getAddress())).staked).to.equal(ethers.utils.parseEther('2.4')); // stake unchanged
    });
  });
});
