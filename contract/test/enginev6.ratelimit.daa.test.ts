import { ethers, upgrades } from "hardhat";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "./chai-setup";
import { BaseTokenV1 as BaseToken } from "../typechain/BaseTokenV1";
import { V2_EngineV6 } from "../typechain/V2_EngineV6";
import { MasterContesterRegistry } from "../typechain/MasterContesterRegistry";

const TESTCID = '0x1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8';
const TESTBUF = '0x746573740a';

describe("EngineV6 Rate Limiting and DAA Tests", () => {
  let signers: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let user1: SignerWithAddress;
  let validator1: SignerWithAddress;
  let validator2: SignerWithAddress;
  let validator3: SignerWithAddress;
  let validator4: SignerWithAddress;
  let treasury: SignerWithAddress;

  let baseToken: BaseToken;
  let engine: V2_EngineV6;
  let masterContesterRegistry: MasterContesterRegistry;

  beforeEach("Deploy and initialize", async () => {
    signers = await ethers.getSigners();
    deployer = signers[0];
    user1 = signers[1];
    validator1 = signers[2];
    validator2 = signers[3];
    validator3 = signers[4];
    validator4 = signers[5];
    treasury = signers[6];

    const BaseToken = await ethers.getContractFactory("BaseTokenV1");
    baseToken = (await upgrades.deployProxy(BaseToken, [
      await deployer.getAddress(),
      ethers.constants.AddressZero,
    ])) as BaseToken;
    await baseToken.deployed();

    // Deploy and upgrade through all versions to V6
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
    ])) as any;
    await engine.deployed();

    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV2) as any;
    await engine.connect(deployer).setSolutionStakeAmount(ethers.utils.parseEther("0.001"));

    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV3, { call: "initialize" }) as any;
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV4, { call: "initialize" }) as any;
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV5, { call: "initialize" }) as any;
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV5_2, { call: "initialize" }) as any;
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV6, { call: "initialize" }) as V2_EngineV6;

    // Deploy MasterContesterRegistry for V6
    const MasterContesterRegistryFactory = await ethers.getContractFactory("MasterContesterRegistry");
    masterContesterRegistry = await MasterContesterRegistryFactory.deploy(
      ethers.constants.AddressZero
    );
    await masterContesterRegistry.deployed();

    await engine.connect(deployer).setMasterContesterRegistry(masterContesterRegistry.address);

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

  async function deployBootstrapValidator(): Promise<string> {
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
      input: TESTBUF,
      cid: TESTCID,
    };
  }

  async function deployBootstrapTask(modelid: string): Promise<string> {
    const taskParams = await bootstrapTaskParams(modelid);
    const taskidReceipt = await (await engine
      .connect(validator1)
      .submitTask(
        taskParams.version,
        taskParams.owner,
        taskParams.model,
        taskParams.fee,
        taskParams.input,
      )).wait();
    const taskSubmittedEvent = taskidReceipt.events![0];
    const { id: taskid } = taskSubmittedEvent.args!;
    return taskid;
  }

  describe("Solution Rate Limiting", () => {
    it("should enforce solution submission rate limit", async () => {
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

    it("should handle bulk solution rate limiting", async () => {
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

  describe("DAA (Difficulty Adjustment Algorithm) V6", () => {
    it("should calculate targetTs correctly (V6 uses doubled emission schedule)", async () => {
      // V6 doubled the emission schedule: exp2(t/(60*60*24*365*2)) instead of exp2(t/(60*60*24*365))
      // This means emission milestones take 2x longer to reach
      expect(await engine.targetTs(0 * 31536000)).to.equal(ethers.BigNumber.from("0"));

      // Test that targetTs is monotonically increasing in early years
      const target1 = await engine.targetTs(1 * 31536000);
      const target2 = await engine.targetTs(2 * 31536000);
      const target4 = await engine.targetTs(4 * 31536000);

      // Should always increase with time
      expect(target1).to.be.gt(0);
      expect(target2).to.be.gt(target1);
      expect(target4).to.be.gt(target2);

      // At very long time (>3153600000 seconds = ~100 years), should cap
      const targetMax = await engine.targetTs(4000000000);
      // targetTs caps at STARTING_ENGINE_TOKEN_AMOUNT per contract code
      expect(targetMax).to.be.lte(ethers.utils.parseEther("600000")); // Max is STARTING_ENGINE_TOKEN_AMOUNT
    });

    it("should calculate difficulty multiplier correctly", async () => {
      const t1 = 31536000;  // 1 year
      const t2 = 63072000;  // 2 years

      // When actual supply is well below target, difficulty multiplier is capped at 100
      expect(await engine.diffMul(t1, ethers.utils.parseEther('50000'))).to.equal(ethers.BigNumber.from("100000000000000000000"));

      // When supply exceeds max significantly, rewards are 0
      expect(await engine.diffMul(t1, ethers.utils.parseEther('250000'))).to.equal(ethers.BigNumber.from("0"));
      expect(await engine.diffMul(t1, ethers.utils.parseEther('300000'))).to.equal(ethers.BigNumber.from("0"));

      // Test basic properties: diffMul should be bounded
      const diff_low = await engine.diffMul(t1, ethers.utils.parseEther('100000'));
      const diff_high = await engine.diffMul(t1, ethers.utils.parseEther('290000'));

      // Low supply should have higher difficulty multiplier
      expect(diff_low).to.be.gte(diff_high);

      // Both should be positive (unless supply exceeds max)
      expect(diff_low).to.be.gt(0);
      expect(diff_high).to.be.gte(0);
    });

    it("should calculate rewards correctly", async () => {
      // max emission supply on engine 300_000
      // reward = (((300000 - ts) * BASE_REWARD) * diffMul(t, ts)) / 300000 / 1e18
      const t1 = 31536000;  // 1 year
      const t2 = 63072000;  // 2 years

      // When supply is low (50k), there's lots of tokens left to mine
      // and difficulty is maxed at 100x, so rewards are very high
      const reward_50k = await engine.reward(t1, ethers.utils.parseEther('50000'));
      expect(reward_50k).to.be.gt(ethers.utils.parseEther('50')); // Should be significant

      // When supply is moderate (100k), rewards decrease
      const reward_100k = await engine.reward(t1, ethers.utils.parseEther('100000'));
      expect(reward_100k).to.be.gt(0);
      expect(reward_100k).to.be.lt(reward_50k);

      // When supply approaches target at year 2 (150k), rewards are moderate
      const reward_150k = await engine.reward(t2, ethers.utils.parseEther('150000'));
      expect(reward_150k).to.be.gt(0);
      expect(reward_150k).to.be.lt(reward_100k);

      // At or above max supply, rewards should be 0
      expect(await engine.reward(t1, ethers.utils.parseEther('250000'))).to.equal(ethers.BigNumber.from("0"));
      expect(await engine.reward(t1, ethers.utils.parseEther('300000'))).to.equal(ethers.BigNumber.from("0"));

      // Reward should decrease as supply increases (at same time)
      const reward_140k = await engine.reward(t2, ethers.utils.parseEther('140000'));
      const reward_145k = await engine.reward(t2, ethers.utils.parseEther('145000'));
      const reward_155k = await engine.reward(t2, ethers.utils.parseEther('155000'));

      expect(reward_140k).to.be.gt(reward_145k);
      expect(reward_145k).to.be.gt(reward_150k);
      expect(reward_150k).to.be.gt(reward_155k);
    });
  });
});
