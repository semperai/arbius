import { ethers, upgrades } from "hardhat";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "./chai-setup";
import { BaseTokenV1 as BaseToken } from "../typechain/contracts/BaseTokenV1";
import { V2_EngineV1 } from "../typechain/contracts/V2_EngineV1";
import { V2_EngineV2 } from "../typechain/contracts/V2_EngineV2";
import { V2_EngineV3 } from "../typechain/contracts/V2_EngineV3";
import { V2_EngineV4 } from "../typechain/contracts/V2_EngineV4";
import { V2_EngineV5 } from "../typechain/contracts/V2_EngineV5";
import { V2_EngineV5_2 } from "../typechain/contracts/V2_EngineV5_2";
import { V2_EngineV6 } from "../typechain/contracts/V2_EngineV6";
import { MasterContesterRegistry } from "../typechain/contracts/MasterContesterRegistry";
import { VeStaking } from "../typechain/contracts/ve/VeStaking";
import { VotingEscrow } from "../typechain/contracts/ve/VotingEscrow";
import { VeNFTRender } from "../typechain/contracts/ve/VeNFTRender";
import { Voter } from "../typechain/contracts/ve/Voter";

const TESTCID = '0x1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8';
const TESTBUF = '0x746573740a';

describe("EngineV6 Comprehensive Tests", () => {
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
    signers = await ethers.getSigners();
    deployer = signers[0];
    user1 = signers[1];
    user2 = signers[2];
    validator1 = signers[3];
    validator2 = signers[4];
    validator3 = signers[5];
    validator4 = signers[6];
    masterContester1 = signers[7];
    masterContester2 = signers[8];
    treasury = signers[9];
    model1 = signers[10];

    // Deploy BaseToken
    const BaseToken = await ethers.getContractFactory("BaseTokenV1");
    baseToken = (await upgrades.deployProxy(BaseToken, [
      await deployer.getAddress(),
      ethers.constants.AddressZero,
    ])) as BaseToken;
    await baseToken.deployed();

    // Deploy and upgrade through all versions - matching pattern from your file
    const V2_EngineV1 = await ethers.getContractFactory("V2_EngineV1");
    const V2_EngineV2 = await ethers.getContractFactory("V2_EngineV2");
    const V2_EngineV3 = await ethers.getContractFactory("V2_EngineV3");
    const V2_EngineV4 = await ethers.getContractFactory("V2_EngineV4");
    const V2_EngineV5 = await ethers.getContractFactory("V2_EngineV5");
    const V2_EngineV5_2 = await ethers.getContractFactory("V2_EngineV5_2");
    const V2_EngineV6 = await ethers.getContractFactory("V2_EngineV6");

    // Deploy V1 as proxy
    engine = (await upgrades.deployProxy(V2_EngineV1, [
      baseToken.address,
      await treasury.getAddress(),
    ])) as V2_EngineV1 as any;
    await engine.deployed();
    
    // Upgrade to V2
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV2) as V2_EngineV2 as any;
    
    // Set solution stake amount in V2
    await (
      await engine
        .connect(deployer)
        .setSolutionStakeAmount(ethers.utils.parseEther("0.001"))
    ).wait();
    
    // Upgrade to V3
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV3, {
      call: "initialize",
    }) as V2_EngineV3 as any;
    
    // Upgrade to V4
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV4, {
      call: "initialize",
    }) as V2_EngineV4 as any;
    
    // Upgrade to V5
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV5, {
      call: "initialize",
    }) as V2_EngineV5 as any;
    
    // Upgrade to V5_2
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV5_2, {
      call: "initialize",
    }) as V2_EngineV5_2 as any;
    
    // Upgrade to V6
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV6, {
      call: "initialize",
    }) as V2_EngineV6 as any;


    const VeNFTRender = await ethers.getContractFactory("VeNFTRender");
    veNFTRender = await VeNFTRender.deploy();
    await veNFTRender.deployed();

    const VotingEscrow = await ethers.getContractFactory("VotingEscrow");
    votingEscrow = await VotingEscrow.deploy(
      baseToken.address,
      veNFTRender.address,
      ethers.constants.AddressZero // veStaking will be set later
    );
    await votingEscrow.deployed();

    const VeStaking = await ethers.getContractFactory("VeStaking");
    veStaking = await VeStaking.deploy(baseToken.address, votingEscrow.address);
    await veStaking.deployed();
    
    // Set veStaking in VotingEscrow
    await votingEscrow.setVeStaking(veStaking.address);
    
    // Deploy Voter contract
    const Voter = await ethers.getContractFactory("Voter");
    voter = await Voter.deploy(votingEscrow.address);
    await voter.deployed();
    
    // Set voter in VotingEscrow
    await votingEscrow.setVoter(voter.address);

    // Set VE contracts in engine
    await engine.connect(deployer).setVeStaking(veStaking.address);
    await engine.connect(deployer).setVoter(voter.address);
    
    // Set engine in veStaking
    await veStaking.setEngine(engine.address);


    // Deploy the actual MasterContesterRegistry with zero address for VotingEscrow (for testing)
    const MasterContesterRegistry = await ethers.getContractFactory("MasterContesterRegistry");
    masterContesterRegistry = await MasterContesterRegistry.deploy(votingEscrow.address);
    await masterContesterRegistry.deployed();

    // Set the master contester registry
    await engine.connect(deployer).setMasterContesterRegistry(masterContesterRegistry.address);

    // Setup tokens
    await baseToken.connect(deployer).bridgeMint(await deployer.getAddress(), ethers.utils.parseEther("2000"));
    await baseToken.connect(deployer).transferOwnership(engine.address);

    // Setup approvals
    for (const signer of [validator1, validator2, validator3, validator4, masterContester1, masterContester2, user1, user2]) {
      await baseToken.connect(signer).approve(engine.address, ethers.constants.MaxUint256);
    }
  });

  // Helper functions
  async function deployBootstrapModel(): Promise<string> {
    const addr = await model1.getAddress();
    const fee = ethers.utils.parseEther('0');

    const modelid = await engine.hashModel({
      addr,
      fee,
      rate: ethers.utils.parseEther('0'),
      cid: TESTCID,
    }, await user1.getAddress());

    await engine.connect(user1).registerModel(addr, fee, TESTBUF);
    return modelid;
  }

  async function deployBootstrapTask(modelid: string, submitter?: SignerWithAddress): Promise<string> {
    const taskParams = {
      version: BigNumber.from("0"),
      owner: await user1.getAddress(),
      model: modelid,
      fee: ethers.utils.parseEther("0"),
      input: TESTBUF,
    };

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
    return taskSubmittedEvent.args!.id;
  }

  async function setupValidators(): Promise<void> {
    // Bridge tokens to engine to enable mining
    await baseToken.connect(deployer).bridgeMint(engine.address, ethers.utils.parseEther('597000'));

    // Setup validators with enough stake
    for (const validator of [validator1, validator2, validator3, validator4]) {
      await baseToken.connect(deployer).transfer(await validator.getAddress(), ethers.utils.parseEther('10'));
      await engine.connect(validator).validatorDeposit(await validator.getAddress(), ethers.utils.parseEther('10'));
    }

    // Setup master contesters as validators too
    for (const mc of [masterContester1, masterContester2]) {
      await baseToken.connect(deployer).transfer(await mc.getAddress(), ethers.utils.parseEther('10'));
      await engine.connect(mc).validatorDeposit(await mc.getAddress(), ethers.utils.parseEther('10'));
    }
  }

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

  describe("Master Contester Contestation", () => {
    beforeEach(async () => {
      await setupValidators();
      await masterContesterRegistry.connect(deployer).emergencyAddMasterContester(masterContester1.address);
    });

    it("should allow master contester to submit contestation", async () => {
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      
      // Mine a block to ensure commitment is in the past
      await ethers.provider.send("evm_mine", []);
      
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Master contester submits contestation
      await expect(engine.connect(masterContester1).submitContestation(taskid))
        .to.emit(engine, "ContestationSubmitted")
        .withArgs(masterContester1.address, taskid);
    });

    it("should revert when non-master contester tries to submit contestation", async () => {
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      
      // Mine a block to ensure commitment is in the past
      await ethers.provider.send("evm_mine", []);
      
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Regular validator tries to submit contestation
      await expect(engine.connect(validator2).submitContestation(taskid))
        .to.be.revertedWith("NotMasterContester()");
    });

    it("should revert when master contester is not a validator", async () => {
      await masterContesterRegistry.connect(deployer).emergencyAddMasterContester(user1.address);
      
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      
      // Mine a block to ensure commitment is in the past
      await ethers.provider.send("evm_mine", []);
      
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Master contester without validator stake tries contestation
      await expect(engine.connect(user1).submitContestation(taskid))
        .to.be.revertedWith("MasterContesterMinStakedTooLow()");
    });

    it("should apply master contester vote multiplier in contestation", async () => {
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      
      // Mine a block to ensure commitment is in the past
      await ethers.provider.send("evm_mine", []);
      
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Master contester submits contestation (auto-votes yes)
      await engine.connect(masterContester1).submitContestation(taskid);

      // Check that the vote multiplier is applied
      const yeaVotes = await engine.contestationVoteYeas(taskid, 0);
      expect(yeaVotes).to.equal(masterContester1.address);

      // Fast forward and finish voting
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      // With multiplier of 10, master contester gets 11 effective votes (1 + 10)
      // vs 1 nay vote from solution submitter
      await expect(engine.connect(validator1).contestationVoteFinish(taskid, 2))
        .to.emit(engine, "ContestationVoteFinish");

      // Verify contestation succeeded due to vote multiplier
      const lastLossTime = await engine.lastContestationLossTime(validator1.address);
      expect(lastLossTime).to.be.gt(0);
    });
  });

  describe("Suggest Contestation", () => {
    beforeEach(async () => {
      await setupValidators();
    });

    it("should allow anyone to suggest contestation", async () => {
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      
      // Mine a block to ensure commitment is in the past
      await ethers.provider.send("evm_mine", []);
      
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Anyone can suggest contestation
      await expect(engine.connect(user1).suggestContestation(taskid))
        .to.emit(engine, "ContestationSuggested")
        .withArgs(user1.address, taskid);
    });

    it("should revert suggest contestation when solution not found", async () => {
      const fakeTaskId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("fake"));
      
      await expect(engine.connect(user1).suggestContestation(fakeTaskId))
        .to.be.revertedWith("SolutionNotFound()");
    });

    it("should revert suggest contestation when contestation already exists", async () => {
      await masterContesterRegistry.connect(deployer).emergencyAddMasterContester(masterContester1.address);
      
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      
      // Mine a block to ensure commitment is in the past
      await ethers.provider.send("evm_mine", []);
      
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Submit actual contestation
      await engine.connect(masterContester1).submitContestation(taskid);

      // Try to suggest after contestation exists
      await expect(engine.connect(user1).suggestContestation(taskid))
        .to.be.revertedWith("ContestationAlreadyExists");
    });
  });

  describe("Model Allow Lists", () => {
    beforeEach(async () => {
      await setupValidators();
    });

    it("should register model with allow list", async () => {
      const addr = await model1.getAddress();
      const fee = ethers.utils.parseEther('0');
      const allowList = [validator1.address, validator2.address];

      await expect(engine.connect(user1).registerModelWithAllowList(
        addr, 
        fee, 
        TESTBUF, 
        allowList
      )).to.emit(engine, "ModelRegistered");

      // Get model id
      const modelid = await engine.hashModel({
        addr,
        fee,
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, await user1.getAddress());

      // Check allow list is set
      expect(await engine.modelRequiresAllowList(modelid)).to.be.true;
      expect(await engine.isSolverAllowed(modelid, validator1.address)).to.be.true;
      expect(await engine.isSolverAllowed(modelid, validator2.address)).to.be.true;
      expect(await engine.isSolverAllowed(modelid, validator3.address)).to.be.false;
    });

    it("should only allow whitelisted validators to submit solutions", async () => {
      const addr = await model1.getAddress();
      const fee = ethers.utils.parseEther('0');
      const allowList = [validator1.address, validator2.address];

      await engine.connect(user1).registerModelWithAllowList(
        addr, 
        fee, 
        TESTBUF, 
        allowList
      );

      const modelid = await engine.hashModel({
        addr,
        fee,
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, await user1.getAddress());

      const taskid = await deployBootstrapTask(modelid);
      const cid = TESTCID;

      // Validator1 (allowed) can submit
      const commitment1 = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment1);
      
      // Mine a block to ensure commitment is in the past
      await ethers.provider.send("evm_mine", []);
      
      await expect(engine.connect(validator1).submitSolution(taskid, cid))
        .to.emit(engine, "SolutionSubmitted");

      // Deploy another task for validator3 test
      const taskid2 = await deployBootstrapTask(modelid);
      
      // Validator3 (not allowed) cannot submit
      const commitment3 = await engine.generateCommitment(validator3.address, taskid2, cid);
      await engine.connect(validator3).signalCommitment(commitment3);
      
      // Mine a block to ensure commitment is in the past
      await ethers.provider.send("evm_mine", []);
      
      await expect(engine.connect(validator3).submitSolution(taskid2, cid))
        .to.be.revertedWith("NotAllowedToSubmitSolution");
    });

    it("should work normally for models without allow list", async () => {
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);
      const cid = TESTCID;

      // Any validator can submit
      const commitment = await engine.generateCommitment(validator3.address, taskid, cid);
      await engine.connect(validator3).signalCommitment(commitment);
      
      // Mine a block to ensure commitment is in the past
      await ethers.provider.send("evm_mine", []);
      
      await expect(engine.connect(validator3).submitSolution(taskid, cid))
        .to.emit(engine, "SolutionSubmitted");
    });
  });

  describe("Solution Model Fee Percentage Override", () => {
    it("should set model fee percentage override", async () => {
      const modelid = await deployBootstrapModel();
      
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
      ).to.be.revertedWith("ModelDoesNotExist");
    });

    it("should revert when percentage exceeds 100%", async () => {
      const modelid = await deployBootstrapModel();
      
      await expect(
        engine.connect(deployer).setSolutionModelFeePercentageOverride(
          modelid,
          ethers.utils.parseEther("1.1") // 110%
        )
      ).to.be.revertedWith("PercentageTooHigh()");
    });
  });

  describe("Direct Validator Staking for Rewards", () => {
    beforeEach(async () => {
      await setupValidators();
    });

    it("should stake rewards directly to validator instead of transferring", async () => {
      const modelid = await deployBootstrapModel();
      
      // Set solution mineable rate for rewards
      await engine.connect(deployer).setSolutionMineableRate(modelid, ethers.utils.parseEther('1'));
      
      const taskid = await deployBootstrapTask(modelid);

      // Submit and claim solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      
      // Mine a block to ensure commitment is in the past
      await ethers.provider.send("evm_mine", []);
      
      await engine.connect(validator1).submitSolution(taskid, cid);

      const stakedBefore = (await engine.validators(validator1.address)).staked;
      const balanceBefore = await baseToken.balanceOf(validator1.address);

      // Wait and claim
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);

      await expect(engine.connect(validator1).claimSolution(taskid))
        .to.emit(engine, "SolutionClaimed");

      const stakedAfter = (await engine.validators(validator1.address)).staked;
      const balanceAfter = await baseToken.balanceOf(validator1.address);

      // Verify rewards went to stake, not balance
      expect(stakedAfter).to.be.gt(stakedBefore);
      expect(balanceAfter).to.equal(balanceBefore); // Balance unchanged
    });

    it("should stake contestation rewards directly to validators", async () => {
      await masterContesterRegistry.connect(deployer).emergencyAddMasterContester(masterContester1.address);
      
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      
      // Mine a block to ensure commitment is in the past
      await ethers.provider.send("evm_mine", []);
      
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Submit contestation and vote
      await engine.connect(masterContester1).submitContestation(taskid);
      await engine.connect(validator2).voteOnContestation(taskid, true);

      const mc1StakeBefore = (await engine.validators(masterContester1.address)).staked;
      const v2StakeBefore = (await engine.validators(validator2.address)).staked;

      // Finish voting
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      await engine.connect(validator1).contestationVoteFinish(taskid, 3);

      const mc1StakeAfter = (await engine.validators(masterContester1.address)).staked;
      const v2StakeAfter = (await engine.validators(validator2.address)).staked;

      // Verify rewards went to stake
      expect(mc1StakeAfter).to.be.gt(mc1StakeBefore);
      expect(v2StakeAfter).to.be.gt(v2StakeBefore);
    });
  });

  describe("New Events", () => {
    beforeEach(async () => {
      await setupValidators();
    });

    it("should emit RewardsPaid event with model and task indexed", async () => {
      const modelid = await deployBootstrapModel();
      await engine.connect(deployer).setSolutionMineableRate(modelid, ethers.utils.parseEther('1'));
      
      const taskid = await deployBootstrapTask(modelid);

      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      
      // Mine a block to ensure commitment is in the past
      await ethers.provider.send("evm_mine", []);
      
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Wait and claim
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);

      await expect(engine.connect(validator1).claimSolution(taskid))
        .to.emit(engine, "RewardsPaid");
    });

    it("should emit FeesPaid event with model and task indexed", async () => {
      // Create model with fee
      const addr = await model1.getAddress();
      const modelFee = ethers.utils.parseEther('0.01');
      const taskFee = ethers.utils.parseEther('0.02');

      const modelid = await engine.hashModel({
        addr,
        fee: modelFee,
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, await user1.getAddress());

      await engine.connect(user1).registerModel(addr, modelFee, TESTBUF);

      // Fund user to pay fees
      await baseToken.connect(deployer).transfer(user1.address, taskFee);

      // Submit task with fee
      const taskParams = {
        version: BigNumber.from("0"),
        owner: await user1.getAddress(),
        model: modelid,
        fee: taskFee,
        input: TESTBUF,
      };

      const taskidReceipt = await (await engine
        .connect(user1)
        .submitTask(
          taskParams.version,
          taskParams.owner,
          taskParams.model,
          taskParams.fee,
          taskParams.input,
        )).wait();
      
      const taskid = taskidReceipt.events![0].args!.id;

      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      
      // Mine a block to ensure commitment is in the past
      await ethers.provider.send("evm_mine", []);
      
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Wait and claim
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);

      const tx = await engine.connect(validator1).claimSolution(taskid);
      
      // Check FeesPaid event
      await expect(tx)
        .to.emit(engine, "FeesPaid");
    });
  });

  describe("Model Ownership Functions", () => {
    it("should allow model owner to set model fee", async () => {
      const modelid = await deployBootstrapModel();
      const newFee = ethers.utils.parseEther("0.1");

      // model1 is the actual owner (set as addr in deployBootstrapModel)
      await expect(engine.connect(model1).setModelFee(modelid, newFee))
        .to.emit(engine, "ModelFeeChanged")
        .withArgs(modelid, newFee);

      const model = await engine.models(modelid);
      expect(model.fee).to.equal(newFee);
    });

    it("should allow model owner to change model address", async () => {
      const modelid = await deployBootstrapModel();
      const newAddr = user2.address;

      // model1 is the actual owner
      await expect(engine.connect(model1).setModelAddr(modelid, newAddr))
        .to.emit(engine, "ModelAddrChanged")
        .withArgs(modelid, newAddr);

      const model = await engine.models(modelid);
      expect(model.addr).to.equal(newAddr);
    });

    it("should allow contract owner to set model params", async () => {
      const modelid = await deployBootstrapModel();
      
      // Contract owner can also change model params
      await expect(engine.connect(deployer).setModelFee(modelid, ethers.utils.parseEther("0.2")))
        .to.emit(engine, "ModelFeeChanged");
    });

    it("should revert when non-owner tries to set model params", async () => {
      const modelid = await deployBootstrapModel();
      
      // user2 is neither model owner nor contract owner
      await expect(engine.connect(user2).setModelFee(modelid, ethers.utils.parseEther("0.1")))
        .to.be.revertedWith("NotModelOwner()");
    });
  });

  describe("Integration: Complete V6 Flow", () => {
    it("should handle complete flow with master contester and allow lists", async () => {
      await setupValidators();
      await masterContesterRegistry.connect(deployer).emergencyAddMasterContester(masterContester1.address);

      // Register model with allow list
      const addr = await model1.getAddress();
      const fee = ethers.utils.parseEther('0.01');
      const allowList = [validator1.address, validator2.address];

      await engine.connect(user1).registerModelWithAllowList(addr, fee, TESTBUF, allowList);

      const modelid = await engine.hashModel({
        addr,
        fee,
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, await user1.getAddress());

      // Set model rate and fee override
      await engine.connect(deployer).setSolutionMineableRate(modelid, ethers.utils.parseEther('1'));
      await engine.connect(deployer).setSolutionModelFeePercentageOverride(
        modelid,
        ethers.utils.parseEther("0.3") // 30% to treasury
      );

      // Submit task
      await baseToken.connect(deployer).transfer(user2.address, fee);
      const taskParams = {
        version: BigNumber.from("0"),
        owner: await user2.getAddress(),
        model: modelid,
        fee: fee,
        input: TESTBUF,
      };

      const taskidReceipt = await (await engine
        .connect(user2)
        .submitTask(
          taskParams.version,
          taskParams.owner,
          taskParams.model,
          taskParams.fee,
          taskParams.input,
        )).wait();
      
      const taskid = taskidReceipt.events![0].args!.id;

      // Whitelisted validator submits solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      
      // Mine a block to ensure commitment is in the past
      await ethers.provider.send("evm_mine", []);
      
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Non-master contester suggests contestation
      await expect(engine.connect(user1).suggestContestation(taskid))
        .to.emit(engine, "ContestationSuggested");

      // Master contester submits actual contestation
      await engine.connect(masterContester1).submitContestation(taskid);

      // Other validators vote
      await engine.connect(validator2).voteOnContestation(taskid, false);

      // With vote multiplier, master contester should win (11 vs 2)
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      await expect(engine.connect(validator1).contestationVoteFinish(taskid, 3))
        .to.emit(engine, "ContestationVoteFinish");

      // Verify contestation succeeded
      const lastLossTime = await engine.lastContestationLossTime(validator1.address);
      expect(lastLossTime).to.be.gt(0);
    });
  });
});
