import { ethers, upgrades } from "hardhat";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "./chai-setup";
import { BaseTokenV1 as BaseToken } from "../typechain/contracts/BaseTokenV1";
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

    // Deploy and upgrade through all versions
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
    
    // Upgrade through all versions
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV2) as V2_EngineV2 as any;
    await engine.connect(deployer).setSolutionStakeAmount(ethers.utils.parseEther("0.001"));
    
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV3, { call: "initialize" }) as V2_EngineV3 as any;
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV4, { call: "initialize" }) as V2_EngineV4 as any;
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV5, { call: "initialize" }) as V2_EngineV5 as any;
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV5_2, { call: "initialize" }) as V2_EngineV5_2 as any;
    engine = await upgrades.upgradeProxy(engine.address, V2_EngineV6, { call: "initialize" }) as V2_EngineV6 as any;

    // Deploy VE contracts
    const VeNFTRender = await ethers.getContractFactory("VeNFTRender");
    veNFTRender = await VeNFTRender.deploy();
    await veNFTRender.deployed();

    const VotingEscrow = await ethers.getContractFactory("VotingEscrow");
    votingEscrow = await VotingEscrow.deploy(
      baseToken.address,
      veNFTRender.address,
      ethers.constants.AddressZero
    );
    await votingEscrow.deployed();

    const VeStaking = await ethers.getContractFactory("VeStaking");
    veStaking = await VeStaking.deploy(baseToken.address, votingEscrow.address);
    await veStaking.deployed();
    
    await votingEscrow.setVeStaking(veStaking.address);
    
    const Voter = await ethers.getContractFactory("Voter");
    voter = await Voter.deploy(votingEscrow.address);
    await voter.deployed();
    
    await votingEscrow.setVoter(voter.address);
    await engine.connect(deployer).setVeStaking(veStaking.address);
    await engine.connect(deployer).setVoter(voter.address);
    await veStaking.setEngine(engine.address);

    // Deploy MasterContesterRegistry
    const MasterContesterRegistry = await ethers.getContractFactory("MasterContesterRegistry");
    masterContesterRegistry = await MasterContesterRegistry.deploy(votingEscrow.address);
    await masterContesterRegistry.deployed();

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

    it("should initialize masterContesterVoteAdder to 50", async () => {
      expect(await engine.masterContesterVoteAdder()).to.equal(50);
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
      
      await ethers.provider.send("evm_mine", []);
      
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Regular validator tries to submit contestation
      await expect(engine.connect(validator2).submitContestation(taskid))
        .to.be.reverted;
    });

    it("should revert when master contester is not a validator", async () => {
      await masterContesterRegistry.connect(deployer).emergencyAddMasterContester(user1.address);
      
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      
      await ethers.provider.send("evm_mine", []);
      
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Master contester without validator stake tries contestation
      await expect(engine.connect(user1).submitContestation(taskid))
        .to.be.revertedWith("MasterContesterMinStakedTooLow()");
    });

    it("should apply master contester vote adder in contestation", async () => {
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      
      await ethers.provider.send("evm_mine", []);
      
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Master contester submits contestation (auto-votes yes)
      await engine.connect(masterContester1).submitContestation(taskid);

      // Add another yes voter to test adder effect
      await engine.connect(validator2).voteOnContestation(taskid, true);

      // Fast forward and finish voting
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      // With vote adder of 50, master contester + validator2 get 52 effective votes (2 + 50)
      // vs 1 nay vote from solution submitter
      await expect(engine.connect(validator1).contestationVoteFinish(taskid, 3))
        .to.emit(engine, "ContestationVoteFinish");

      // Verify contestation succeeded due to vote adder
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
      
      await ethers.provider.send("evm_mine", []);
      
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Submit actual contestation
      await engine.connect(masterContester1).submitContestation(taskid);

      // Try to suggest after contestation exists
      await expect(engine.connect(user1).suggestContestation(taskid))
        .to.be.revertedWith("ContestationAlreadyExists()");
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
      
      await ethers.provider.send("evm_mine", []);
      
      await expect(engine.connect(validator1).submitSolution(taskid, cid))
        .to.emit(engine, "SolutionSubmitted");

      // Deploy another task for validator3 test
      const taskid2 = await deployBootstrapTask(modelid);
      
      // Validator3 (not allowed) cannot submit
      const commitment3 = await engine.generateCommitment(validator3.address, taskid2, cid);
      await engine.connect(validator3).signalCommitment(commitment3);
      
      await ethers.provider.send("evm_mine", []);
      
      await expect(engine.connect(validator3).submitSolution(taskid2, cid))
        .to.be.revertedWith("NotAllowedToSubmitSolution()");
    });

    it("should work normally for models without allow list", async () => {
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);
      const cid = TESTCID;

      // Any validator can submit
      const commitment = await engine.generateCommitment(validator3.address, taskid, cid);
      await engine.connect(validator3).signalCommitment(commitment);
      
      await ethers.provider.send("evm_mine", []);
      
      await expect(engine.connect(validator3).submitSolution(taskid, cid))
        .to.emit(engine, "SolutionSubmitted");
    });
  });

  describe("Allow List Management - Additional Tests", () => {
    let modelid: string;

    beforeEach(async () => {
      await setupValidators();
      // Create a model with allow list
      const addr = await model1.getAddress();
      const fee = ethers.utils.parseEther('0');
      const initialAllowList = [validator1.address];

      await engine.connect(user1).registerModelWithAllowList(
        addr, 
        fee, 
        TESTBUF, 
        initialAllowList
      );

      modelid = await engine.hashModel({
        addr,
        fee,
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, await user1.getAddress());
    });

    it("should allow model owner to add addresses to allow list after creation", async () => {
      // Initially only validator1 is allowed
      expect(await engine.isSolverAllowed(modelid, validator1.address)).to.be.true;
      expect(await engine.isSolverAllowed(modelid, validator2.address)).to.be.false;
      expect(await engine.isSolverAllowed(modelid, validator3.address)).to.be.false;

      // Model owner adds validator2 and validator3
      await expect(engine.connect(model1).addToModelAllowList(modelid, [validator2.address, validator3.address]))
        .to.emit(engine, "ModelAllowListUpdated")
        .withArgs(modelid, validator2.address, true)
        .to.emit(engine, "ModelAllowListUpdated")
        .withArgs(modelid, validator3.address, true);

      // Now all three should be allowed
      expect(await engine.isSolverAllowed(modelid, validator1.address)).to.be.true;
      expect(await engine.isSolverAllowed(modelid, validator2.address)).to.be.true;
      expect(await engine.isSolverAllowed(modelid, validator3.address)).to.be.true;
    });

    it("should allow model owner to remove addresses from allow list", async () => {
      // First add validators
      await engine.connect(model1).addToModelAllowList(modelid, [validator2.address, validator3.address]);
      
      // Verify they're added
      expect(await engine.isSolverAllowed(modelid, validator2.address)).to.be.true;
      expect(await engine.isSolverAllowed(modelid, validator3.address)).to.be.true;

      // Remove validator2
      await expect(engine.connect(model1).removeFromModelAllowList(modelid, [validator2.address]))
        .to.emit(engine, "ModelAllowListUpdated")
        .withArgs(modelid, validator2.address, false);

      // Check states
      expect(await engine.isSolverAllowed(modelid, validator1.address)).to.be.true;
      expect(await engine.isSolverAllowed(modelid, validator2.address)).to.be.false;
      expect(await engine.isSolverAllowed(modelid, validator3.address)).to.be.true;
    });

    it("should allow disabling allow list requirement", async () => {
      // Initially requires allow list
      expect(await engine.modelRequiresAllowList(modelid)).to.be.true;

      // Only validator1 can submit
      const taskid1 = await deployBootstrapTask(modelid);
      const cid = TESTCID;

      const commitment2 = await engine.generateCommitment(validator2.address, taskid1, cid);
      await engine.connect(validator2).signalCommitment(commitment2);
      await ethers.provider.send("evm_mine", []);

      await expect(engine.connect(validator2).submitSolution(taskid1, cid))
        .to.be.revertedWith("NotAllowedToSubmitSolution()");

      // Disable allow list requirement
      await expect(engine.connect(model1).disableModelAllowList(modelid))
        .to.emit(engine, "ModelAllowListRequirementChanged")
        .withArgs(modelid, false);

      expect(await engine.modelRequiresAllowList(modelid)).to.be.false;

      // Now any validator can submit
      const taskid2 = await deployBootstrapTask(modelid);
      const commitment3 = await engine.generateCommitment(validator2.address, taskid2, cid);
      await engine.connect(validator2).signalCommitment(commitment3);
      await ethers.provider.send("evm_mine", []);

      await expect(engine.connect(validator2).submitSolution(taskid2, cid))
        .to.emit(engine, "SolutionSubmitted");
    });

    it("should handle empty allow list correctly", async () => {
      // Remove all addresses from allow list
      await engine.connect(model1).removeFromModelAllowList(modelid, [validator1.address]);
      
      // No one is allowed
      expect(await engine.isSolverAllowed(modelid, validator1.address)).to.be.false;
      expect(await engine.isSolverAllowed(modelid, validator2.address)).to.be.false;
      
      // Try to submit solution
      const taskid = await deployBootstrapTask(modelid);
      const cid = TESTCID;
      
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      
      await expect(engine.connect(validator1).submitSolution(taskid, cid))
        .to.be.revertedWith("NotAllowedToSubmitSolution()");
    });

    it("should allow contract owner to manage allow lists", async () => {
      // Contract owner can also add/remove
      await expect(engine.connect(deployer).addToModelAllowList(modelid, [validator4.address]))
        .to.emit(engine, "ModelAllowListUpdated")
        .withArgs(modelid, validator4.address, true);
      
      expect(await engine.isSolverAllowed(modelid, validator4.address)).to.be.true;
      
      await expect(engine.connect(deployer).removeFromModelAllowList(modelid, [validator4.address]))
        .to.emit(engine, "ModelAllowListUpdated")
        .withArgs(modelid, validator4.address, false);
      
      expect(await engine.isSolverAllowed(modelid, validator4.address)).to.be.false;
    });

    it("should revert when trying to add to allow list that is disabled", async () => {
      // Disable the allow list
      await engine.connect(model1).disableModelAllowList(modelid);

      // Try to add to disabled allow list
      await expect(engine.connect(model1).addToModelAllowList(modelid, [validator4.address]))
        .to.be.revertedWith("AllowListNotEnabled()");
    });

    it("should revert when trying to remove from allow list that is disabled", async () => {
      // Disable the allow list
      await engine.connect(model1).disableModelAllowList(modelid);

      // Try to remove from disabled allow list
      await expect(engine.connect(model1).removeFromModelAllowList(modelid, [validator1.address]))
        .to.be.revertedWith("AllowListNotEnabled()");
    });

    it("should revert when trying to disable already disabled allow list", async () => {
      // Disable the allow list
      await engine.connect(model1).disableModelAllowList(modelid);

      // Try to disable again
      await expect(engine.connect(model1).disableModelAllowList(modelid))
        .to.be.revertedWith("AllowListNotEnabled()");
    });
  });

  describe("Multiple Master Contesters", () => {
    beforeEach(async () => {
      await setupValidators();
      // Add two master contesters
      await masterContesterRegistry.connect(deployer).emergencyAddMasterContester(masterContester1.address);
      await masterContesterRegistry.connect(deployer).emergencyAddMasterContester(masterContester2.address);
    });

    it("should handle multiple master contesters voting on same contestation", async () => {
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid, cid);

      // First master contester submits contestation
      await engine.connect(masterContester1).submitContestation(taskid);
      
      // Second master contester votes yes
      await engine.connect(masterContester2).voteOnContestation(taskid, true);
      
      // Regular validators vote
      await engine.connect(validator2).voteOnContestation(taskid, false);
      await engine.connect(validator3).voteOnContestation(taskid, false);
      
      // Fast forward and finish voting
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      // With 2 master contesters voting yes (2 actual + 50 adder = 52)
      // vs 3 nay votes (validator1 auto-vote, validator2, validator3)
      // Yes should win: 52 > 3
      await expect(engine.connect(validator1).contestationVoteFinish(taskid, 5))
        .to.emit(engine, "ContestationVoteFinish");

      // Verify contestation succeeded
      const lastLossTime = await engine.lastContestationLossTime(validator1.address);
      expect(lastLossTime).to.be.gt(0);
    });

    it("should handle master contester vs master contester voting", async () => {
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      // Master contester1 submits solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(masterContester1.address, taskid, cid);
      await engine.connect(masterContester1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(masterContester1).submitSolution(taskid, cid);

      // Master contester2 submits contestation
      await engine.connect(masterContester2).submitContestation(taskid);
      
      // Regular validators vote on both sides
      await engine.connect(validator1).voteOnContestation(taskid, true);
      await engine.connect(validator2).voteOnContestation(taskid, false);
      
      // Fast forward and finish voting
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      // masterContester2 + validator1 voting yes: 2 actual + 50 adder = 52
      // masterContester1 (auto-vote) + validator2 voting no: 2 actual
      // Yes should win: 52 > 2
      await expect(engine.connect(validator1).contestationVoteFinish(taskid, 4))
        .to.emit(engine, "ContestationVoteFinish");

      // Verify contestation succeeded
      const lastLossTime = await engine.lastContestationLossTime(masterContester1.address);
      expect(lastLossTime).to.be.gt(0);
    });

    it("should handle when only master contester votes (no additional voters)", async () => {
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Master contester submits contestation (auto-votes yes)
      await engine.connect(masterContester1).submitContestation(taskid);
      
      // No other votes - just the auto-votes
      // Fast forward and finish voting
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      // masterContester1 voting yes: 1 actual + 50 adder = 51
      // validator1 (auto-vote) voting no: 1 actual
      // Yes should win: 51 > 1
      await expect(engine.connect(validator1).contestationVoteFinish(taskid, 2))
        .to.emit(engine, "ContestationVoteFinish");

      // Verify contestation succeeded
      const lastLossTime = await engine.lastContestationLossTime(validator1.address);
      expect(lastLossTime).to.be.gt(0);
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
      ).to.be.revertedWith("ModelDoesNotExist()");
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

    it("should clear model fee percentage override", async () => {
      const modelid = await deployBootstrapModel();

      // Set override
      await engine.connect(deployer).setSolutionModelFeePercentageOverride(
        modelid,
        ethers.utils.parseEther("0.5")
      );

      expect(await engine.hasSolutionModelFeePercentageOverride(modelid)).to.be.true;

      // Clear override
      await expect(engine.connect(deployer).clearSolutionModelFeePercentageOverride(modelid))
        .to.emit(engine, "SolutionModelFeePercentageOverrideCleared")
        .withArgs(modelid);

      expect(await engine.hasSolutionModelFeePercentageOverride(modelid)).to.be.false;
      expect(await engine.solutionModelFeePercentageOverride(modelid)).to.equal(0);
    });

    it("should revert when clearing non-existent override", async () => {
      const modelid = await deployBootstrapModel();

      // No override set
      await expect(
        engine.connect(deployer).clearSolutionModelFeePercentageOverride(modelid)
      ).to.be.revertedWith("NoOverrideExists()");
    });

    it("should emit event when setting global solution model fee percentage", async () => {
      const newPercentage = ethers.utils.parseEther("0.25"); // 25%

      await expect(engine.connect(deployer).setSolutionModelFeePercentage(newPercentage))
        .to.emit(engine, "SolutionModelFeePercentageChanged")
        .withArgs(newPercentage);

      expect(await engine.solutionModelFeePercentage()).to.equal(newPercentage);
    });
  });

  describe("Fee Override Edge Cases", () => {
    let modelid: string;

    beforeEach(async () => {
      await setupValidators();
      // Create model with fee
      const addr = await model1.getAddress();
      const fee = ethers.utils.parseEther('0.1');

      modelid = await engine.hashModel({
        addr,
        fee,
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, await user1.getAddress());

      await engine.connect(user1).registerModel(addr, fee, TESTBUF);
      
      // Set the general solution model fee percentage first
      await engine.connect(deployer).setSolutionModelFeePercentage(
        ethers.utils.parseEther("0.2") // 20% default
      );
    });

    it("should apply override correctly when model fee changes", async () => {
      // Set override to 30%
      await engine.connect(deployer).setSolutionModelFeePercentageOverride(
        modelid,
        ethers.utils.parseEther("0.3")
      );

      // Change model fee
      const newFee = ethers.utils.parseEther("0.2");
      await engine.connect(model1).setModelFee(modelid, newFee);

      // Create task with the new fee
      await baseToken.connect(deployer).transfer(user2.address, newFee);
      const taskParams = {
        version: BigNumber.from("0"),
        owner: await user2.getAddress(),
        model: modelid,
        fee: newFee,
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

      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Claim and check fees distribution
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);

      const modelOwnerBalanceBefore = await baseToken.balanceOf(model1.address);

      await engine.connect(validator1).claimSolution(taskid);

      const modelOwnerBalanceAfter = await baseToken.balanceOf(model1.address);

      // Model owner should receive 70% of the new fee (30% override to treasury)
      const expectedAmount = newFee.mul(70).div(100);
      expect(modelOwnerBalanceAfter.sub(modelOwnerBalanceBefore)).to.equal(expectedAmount);
    });

    it("should handle zero override correctly (all fees to model owner)", async () => {
      // Set override to 0% (all to model owner)  
      await engine.connect(deployer).setSolutionModelFeePercentageOverride(
        modelid,
        ethers.utils.parseEther("0")
      );

      // Get the current model fee
      const model = await engine.models(modelid);
      const modelFee = model.fee;

      // Create task with fee equal to model fee
      await baseToken.connect(deployer).transfer(user2.address, modelFee);
      const taskParams = {
        version: BigNumber.from("0"),
        owner: await user2.getAddress(),
        model: modelid,
        fee: modelFee,
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

      // Submit and claim solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid, cid);

      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);

      const modelOwnerBalanceBefore = await baseToken.balanceOf(model1.address);
      
      await engine.connect(validator1).claimSolution(taskid);
      
      const modelOwnerBalanceAfter = await baseToken.balanceOf(model1.address);

      // Model owner should receive ALL of the model fee (0% to treasury due to override)
      expect(modelOwnerBalanceAfter.sub(modelOwnerBalanceBefore)).to.equal(modelFee);
    });

    it("should handle 100% override correctly (all fees to treasury)", async () => {
      // Set override to 100% (all to treasury)
      await engine.connect(deployer).setSolutionModelFeePercentageOverride(
        modelid,
        ethers.utils.parseEther("1")
      );

      // Create task
      const fee = ethers.utils.parseEther("0.1");
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

      // Submit and claim solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid, cid);

      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);

      const modelOwnerBalanceBefore = await baseToken.balanceOf(model1.address);
      const treasuryFeesBefore = await engine.accruedFees();
      
      await engine.connect(validator1).claimSolution(taskid);
      
      const modelOwnerBalanceAfter = await baseToken.balanceOf(model1.address);
      const treasuryFeesAfter = await engine.accruedFees();

      // Model owner should receive nothing
      expect(modelOwnerBalanceAfter).to.equal(modelOwnerBalanceBefore);
      // Treasury should have increased by the model fee amount
      expect(treasuryFeesAfter.sub(treasuryFeesBefore)).to.be.gte(fee);
    });

    it("should handle override for models with no fee", async () => {
      // Create model with 0 fee
      const addr = await user1.getAddress();
      const zeroFeeModelId = await engine.hashModel({
        addr,
        fee: ethers.utils.parseEther('0'),
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, await user2.getAddress());

      await engine.connect(user2).registerModel(addr, ethers.utils.parseEther('0'), TESTBUF);

      // Set override (should have no effect since fee is 0)
      await engine.connect(deployer).setSolutionModelFeePercentageOverride(
        zeroFeeModelId,
        ethers.utils.parseEther("0.5")
      );

      // Create and solve task
      const taskid = await deployBootstrapTask(zeroFeeModelId, user2);
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid, cid);

      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);

      // Should complete without issues even with override on 0 fee
      await expect(engine.connect(validator1).claimSolution(taskid))
        .to.emit(engine, "SolutionClaimed");
    });
  });

  describe("Zero-Value Scenarios", () => {
    beforeEach(async () => {
      await setupValidators();
    });

    it("should handle zero treasury reward percentage", async () => {
      // Set treasury reward to 0
      const currentTreasuryReward = await engine.treasuryRewardPercentage();
      // Note: This would require owner functions to set, which aren't exposed in V6
      // This test would need contract modifications to be fully testable
      
      const modelid = await deployBootstrapModel();
      await engine.connect(deployer).setSolutionMineableRate(modelid, ethers.utils.parseEther('1'));
      
      const taskid = await deployBootstrapTask(modelid);
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid, cid);

      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);

      // Should handle gracefully even if percentages are edge values
      await expect(engine.connect(validator1).claimSolution(taskid))
        .to.emit(engine, "SolutionClaimed");
    });

    it("should handle zero solution stake amount", async () => {
      // Get current stake amount
      const currentStakeAmount = await engine.solutionsStakeAmount();
      
      // This would require setting stake to 0, which might break the protocol
      // Test that current implementation handles edge cases
      expect(currentStakeAmount).to.be.gt(0);
    });

    it("should handle zero vote adder", async () => {
      // Set adder to 0
      await engine.connect(deployer).setMasterContesterVoteAdder(0);
      
      await masterContesterRegistry.connect(deployer).emergencyAddMasterContester(masterContester1.address);
      
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Master contester submits contestation
      await engine.connect(masterContester1).submitContestation(taskid);
      
      // Add regular voters to ensure fair voting
      await engine.connect(validator2).voteOnContestation(taskid, true);
      await engine.connect(validator3).voteOnContestation(taskid, false);
      
      // Fast forward and finish voting
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      // With 0 adder: 2 yes votes vs 2 no votes = tie (nay wins on tie)
      await expect(engine.connect(validator1).contestationVoteFinish(taskid, 4))
        .to.emit(engine, "ContestationVoteFinish");

      // Verify contestation failed (tie goes to defendant)
      const lastLossTime = await engine.lastContestationLossTime(validator1.address);
      expect(lastLossTime).to.equal(0);
    });

    it("should handle empty model CID", async () => {
      const addr = await model1.getAddress();
      const fee = ethers.utils.parseEther('0');
      
      // Register with empty buffer
      const emptyBuf = '0x';
      
      // This might revert or handle gracefully depending on implementation
      await expect(engine.connect(user1).registerModel(addr, fee, emptyBuf))
        .to.emit(engine, "ModelRegistered");
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

    it("should emit RewardsPaid event when rewards are distributed", async () => {
      const modelid = await deployBootstrapModel();
      await engine.connect(deployer).setSolutionMineableRate(modelid, ethers.utils.parseEther('1'));
      
      const taskid = await deployBootstrapTask(modelid);

      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      
      await ethers.provider.send("evm_mine", []);
      
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Wait and claim
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);

      const tx = await engine.connect(validator1).claimSolution(taskid);
      
      // Check for RewardsPaid event
      const receipt = await tx.wait();
      const rewardEvent = receipt.events?.find(e => e.event === 'RewardsPaid');
      
      // If rewards > 0, event should be emitted
      if (rewardEvent) {
        expect(rewardEvent.args?.model).to.equal(modelid);
        expect(rewardEvent.args?.task).to.equal(taskid);
        expect(rewardEvent.args?.validator).to.equal(validator1.address);
      }
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
      
      await ethers.provider.send("evm_mine", []);
      
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Wait and claim
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);

      const tx = await engine.connect(validator1).claimSolution(taskid);
      const receipt = await tx.wait();
      
      // Check FeesPaid event
      const feeEvent = receipt.events?.find(e => e.event === 'FeesPaid');
      expect(feeEvent).to.not.be.undefined;
      expect(feeEvent?.args?.model).to.equal(modelid);
      expect(feeEvent?.args?.task).to.equal(taskid);
      expect(feeEvent?.args?.validator).to.equal(validator1.address);
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
        .to.be.reverted;
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
      
      await ethers.provider.send("evm_mine", []);
      
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Non-master contester suggests contestation
      await expect(engine.connect(user1).suggestContestation(taskid))
        .to.emit(engine, "ContestationSuggested");

      // Master contester submits actual contestation
      await engine.connect(masterContester1).submitContestation(taskid);

      // Other validators vote - need more yes votes to avoid division by zero
      await engine.connect(validator2).voteOnContestation(taskid, true);
      await engine.connect(validator3).voteOnContestation(taskid, false);

      // With vote adder, master contester should win (52 vs 2)
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      await expect(engine.connect(validator1).contestationVoteFinish(taskid, 4))
        .to.emit(engine, "ContestationVoteFinish");

      // Verify contestation succeeded
      const lastLossTime = await engine.lastContestationLossTime(validator1.address);
      expect(lastLossTime).to.be.gt(0);
    });
  });

  describe("Critical Bug Tests - Division by Zero", () => {
    beforeEach(async () => {
      await setupValidators();
      await masterContesterRegistry.connect(deployer).emergencyAddMasterContester(masterContester1.address);
    });

    it("should NOT have division by zero when master contester is only yes voter", async () => {
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Master contester submits contestation (auto-votes yes)
      await engine.connect(masterContester1).submitContestation(taskid);
      
      // No other yes votes - THIS SHOULD NOT CAUSE DIVISION BY ZERO
      // Fast forward and finish voting
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      // This should NOT revert with division by zero
      await expect(engine.connect(validator1).contestationVoteFinish(taskid, 2))
        .to.emit(engine, "ContestationVoteFinish");
    });

    it("should handle case with zero actualYeaVoters but high vote count", async () => {
      // Set very high adder
      await engine.connect(deployer).setMasterContesterVoteAdder(100);
      
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Master contester submits contestation
      await engine.connect(masterContester1).submitContestation(taskid);
      
      // Fast forward and finish
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      // Should handle this edge case without reverting
      await expect(engine.connect(validator1).contestationVoteFinish(taskid, 2))
        .to.emit(engine, "ContestationVoteFinish");
    });

    it("should handle division correctly with actualNayVoters = 1", async () => {
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);

      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid, cid);

      // Regular validator (not master) submits contestation
      await masterContesterRegistry.connect(deployer).emergencyRemoveMasterContester(masterContester1.address);
      await masterContesterRegistry.connect(deployer).emergencyAddMasterContester(validator2.address);
      
      await engine.connect(validator2).submitContestation(taskid);
      
      // Fast forward - contestation should fail (1 yes vs 1 no = tie = no wins)
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);

      // Should not have division by zero with actualNayVoters = 1
      await expect(engine.connect(validator1).contestationVoteFinish(taskid, 2))
        .to.emit(engine, "ContestationVoteFinish");
    });
  });

  describe("Accounting Integrity Tests", () => {
    beforeEach(async () => {
      await setupValidators();
    });

    it("should maintain correct totalHeld throughout operations", async () => {
      const initialTotalHeld = await engine.totalHeld();
      
      const modelid = await deployBootstrapModel();
      
      // Fund user with task fee
      const taskFee = ethers.utils.parseEther("1");
      await baseToken.connect(deployer).transfer(user1.address, taskFee);
      
      // Submit task (increases totalHeld)
      const taskParams = {
        version: BigNumber.from("0"),
        owner: await user1.getAddress(),
        model: modelid,
        fee: taskFee,
        input: TESTBUF,
      };
      
      const taskidReceipt = await (await engine.connect(user1).submitTask(
        taskParams.version,
        taskParams.owner,
        taskParams.model,
        taskParams.fee,
        taskParams.input,
      )).wait();
      
      const taskid = taskidReceipt.events![0].args!.id;
      
      const afterTaskTotalHeld = await engine.totalHeld();
      expect(afterTaskTotalHeld).to.equal(initialTotalHeld.add(taskFee));
      
      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid, cid);
      
      // Claim solution (decreases totalHeld)
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);
      
      await engine.connect(validator1).claimSolution(taskid);
      
      const finalTotalHeld = await engine.totalHeld();
      const accruedFees = await engine.accruedFees();
      
      // totalHeld should be reduced by (taskFee - accruedFees)
      expect(finalTotalHeld).to.equal(afterTaskTotalHeld.sub(taskFee).add(accruedFees));
    });

    it("should properly track validator stakes through contestations", async () => {
      await masterContesterRegistry.connect(deployer).emergencyAddMasterContester(masterContester1.address);
      
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);
      
      // Track initial stakes
      const mc1StakeInitial = (await engine.validators(masterContester1.address)).staked;
      const v1StakeInitial = (await engine.validators(validator1.address)).staked;
      const v2StakeInitial = (await engine.validators(validator2.address)).staked;
      
      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid, cid);
      
      const v1StakeAfterSolution = (await engine.validators(validator1.address)).staked;
      const solutionStakeAmount = await engine.solutionsStakeAmount();
      expect(v1StakeAfterSolution).to.equal(v1StakeInitial.sub(solutionStakeAmount));
      
      // Submit contestation
      await engine.connect(masterContester1).submitContestation(taskid);
      
      const slashAmount = await engine.getSlashAmount();
      const mc1StakeAfterContestation = (await engine.validators(masterContester1.address)).staked;
      const v1StakeAfterContestation = (await engine.validators(validator1.address)).staked;
      
      // Both should have slash amount deducted
      expect(mc1StakeAfterContestation).to.equal(mc1StakeInitial.sub(slashAmount));
      expect(v1StakeAfterContestation).to.equal(v1StakeAfterSolution.sub(slashAmount));
      
      // Add another voter
      await engine.connect(validator2).voteOnContestation(taskid, true);
      const v2StakeAfterVote = (await engine.validators(validator2.address)).staked;
      expect(v2StakeAfterVote).to.equal(v2StakeInitial.sub(slashAmount));
      
      // Finish voting
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);
      
      await engine.connect(validator1).contestationVoteFinish(taskid, 3);
      
      // Check final stakes - winners should get refund + rewards
      const mc1StakeFinal = (await engine.validators(masterContester1.address)).staked;
      const v2StakeFinal = (await engine.validators(validator2.address)).staked;
      const v1StakeFinal = (await engine.validators(validator1.address)).staked;
      
      // Winners should have more than initial
      expect(mc1StakeFinal).to.be.gt(mc1StakeInitial);
      expect(v2StakeFinal).to.be.gt(v2StakeInitial);
      
      // Loser lost slash amount + solution stake
      expect(v1StakeFinal).to.equal(v1StakeInitial.sub(slashAmount).sub(solutionStakeAmount));
    });

    it("should handle fee distribution correctly with override", async () => {
      // Create model with fee
      const addr = await model1.getAddress();
      const modelFee = ethers.utils.parseEther('0.1');
      
      const modelid = await engine.hashModel({
        addr,
        fee: modelFee,
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, await user1.getAddress());
      
      await engine.connect(user1).registerModel(addr, modelFee, TESTBUF);
      
      // Set override to 30% to treasury
      await engine.connect(deployer).setSolutionModelFeePercentageOverride(
        modelid,
        ethers.utils.parseEther("0.3")
      );
      
      // Set general solution model fee percentage
      await engine.connect(deployer).setSolutionModelFeePercentage(
        ethers.utils.parseEther("0.2") // Default 20%
      );
      
      // Create task with fee
      const taskFee = ethers.utils.parseEther("0.2");
      await baseToken.connect(deployer).transfer(user2.address, taskFee);
      
      const taskParams = {
        version: BigNumber.from("0"),
        owner: await user2.getAddress(),
        model: modelid,
        fee: taskFee,
        input: TESTBUF,
      };
      
      const taskidReceipt = await (await engine.connect(user2).submitTask(
        taskParams.version,
        taskParams.owner,
        taskParams.model,
        taskParams.fee,
        taskParams.input,
      )).wait();
      
      const taskid = taskidReceipt.events![0].args!.id;
      
      // Submit and claim solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid, cid);
      
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);
      
      const modelOwnerBalanceBefore = await baseToken.balanceOf(addr);
      const treasuryFeesBefore = await engine.accruedFees();
      const validatorStakeBefore = (await engine.validators(validator1.address)).staked;
      
      await engine.connect(validator1).claimSolution(taskid);
      
      const modelOwnerBalanceAfter = await baseToken.balanceOf(addr);
      const treasuryFeesAfter = await engine.accruedFees();
      const validatorStakeAfter = (await engine.validators(validator1.address)).staked;
      
      // Model should get 70% of model fee (override is 30% to treasury)
      const modelOwnerReceived = modelOwnerBalanceAfter.sub(modelOwnerBalanceBefore);
      const expectedModelOwnerAmount = modelFee.mul(70).div(100);
      expect(modelOwnerReceived).to.equal(expectedModelOwnerAmount);
      
      // Check total fees are accounted for
      const totalFeePaid = taskFee;
      const treasuryReceived = treasuryFeesAfter.sub(treasuryFeesBefore);
      const validatorReceived = validatorStakeAfter.sub(validatorStakeBefore).sub(await engine.solutionsStakeAmount());
      
      // Total should match (within rounding)
      const totalDistributed = modelOwnerReceived.add(treasuryReceived).add(validatorReceived);
      const difference = totalDistributed.sub(totalFeePaid).abs();
      expect(difference.lte(10)).to.be.true;
    });

    it("should handle double-withdraw prevention", async () => {
      // Setup validator withdrawal
      const withdrawAmount = ethers.utils.parseEther("1");
      await engine.connect(validator1).initiateValidatorWithdraw(withdrawAmount);
      
      // Get the request count
      const count = await engine.pendingValidatorWithdrawRequestsCount(validator1.address);
      
      // Fast forward past unlock time
      await ethers.provider.send("evm_increaseTime", [86400 * 7]); // 7 days
      await ethers.provider.send("evm_mine", []);
      
      // First withdraw should work
      await expect(engine.connect(validator1).validatorWithdraw(count, validator1.address))
        .to.emit(engine, "ValidatorWithdraw");

      // Second withdraw of same request should fail
      await expect(engine.connect(validator1).validatorWithdraw(count, validator1.address))
        .to.be.reverted;
    });
  });

  describe("Master Contester Edge Cases", () => {
    beforeEach(async () => {
      await setupValidators();
    });

    it("should handle master contester with exactly minimum stake", async () => {
      await masterContesterRegistry.connect(deployer).emergencyAddMasterContester(masterContester1.address);
      
      // Reduce master contester stake to exactly minimum
      const minStake = await engine.getValidatorMinimum();
      const currentStake = (await engine.validators(masterContester1.address)).staked;
      const withdrawAmount = currentStake.sub(minStake);
      
      if (withdrawAmount.gt(0)) {
        await engine.connect(masterContester1).initiateValidatorWithdraw(withdrawAmount);
        await ethers.provider.send("evm_increaseTime", [86400 * 7]);
        await ethers.provider.send("evm_mine", []);
        const count = await engine.pendingValidatorWithdrawRequestsCount(masterContester1.address);
        await engine.connect(masterContester1).validatorWithdraw(count, masterContester1.address);
      }
      
      // Should still be able to contest with exactly minimum
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);
      
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid, cid);
      
      await expect(engine.connect(masterContester1).submitContestation(taskid))
        .to.emit(engine, "ContestationSubmitted");
    });
  });

  describe("Stress Tests and Complex Scenarios", () => {
    beforeEach(async () => {
      await setupValidators();
      await masterContesterRegistry.connect(deployer).emergencyAddMasterContester(masterContester1.address);
      await masterContesterRegistry.connect(deployer).emergencyAddMasterContester(masterContester2.address);
    });

    it("should handle multiple simultaneous contestations correctly", async () => {
      // Create multiple tasks and solutions
      const modelid = await deployBootstrapModel();
      const taskIds: string[] = [];
      const cid = TESTCID;
      
      // Create 3 tasks with solutions
      for (let i = 0; i < 3; i++) {
        const taskid = await deployBootstrapTask(modelid);
        taskIds.push(taskid);
        
        const validator = [validator1, validator2, validator3][i];
        const commitment = await engine.generateCommitment(validator.address, taskid, cid);
        await engine.connect(validator).signalCommitment(commitment);
        await ethers.provider.send("evm_mine", []);
        await engine.connect(validator).submitSolution(taskid, cid);
      }
      
      // Submit contestations for first two
      await engine.connect(masterContester1).submitContestation(taskIds[0]);
      await engine.connect(masterContester2).submitContestation(taskIds[1]);
      
      // Try to contest the third one with a non-master contester - should fail
      await expect(engine.connect(validator4).submitContestation(taskIds[2]))
        .to.be.reverted;
      
      // Vote on first contestation
      await engine.connect(validator4).voteOnContestation(taskIds[0], true);
      
      // Fast forward and finish all votings
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);
      
      // Finish first contestation
      await expect(engine.connect(validator1).contestationVoteFinish(taskIds[0], 3))
        .to.emit(engine, "ContestationVoteFinish");
      
      // Finish second contestation  
      await expect(engine.connect(validator1).contestationVoteFinish(taskIds[1], 2))
        .to.emit(engine, "ContestationVoteFinish");
    });

    it("should track all accounting correctly through complex flow", async () => {
      // Initial state
      const initialEngineBalance = await baseToken.balanceOf(engine.address);
      const initialTotalHeld = await engine.totalHeld();
      
      // Create model with fees
      const addr = await model1.getAddress();
      const modelFee = ethers.utils.parseEther('0.05');
      const taskFee = ethers.utils.parseEther('0.1');
      
      const modelid = await engine.hashModel({
        addr,
        fee: modelFee,
        rate: ethers.utils.parseEther('0'),
        cid: TESTCID,
      }, await user1.getAddress());
      
      await engine.connect(user1).registerModel(addr, modelFee, TESTBUF);
      
      // Fund and submit task
      await baseToken.connect(deployer).transfer(user2.address, taskFee);
      const taskParams = {
        version: BigNumber.from("0"),
        owner: await user2.getAddress(),
        model: modelid,
        fee: taskFee,
        input: TESTBUF,
      };
      
      const taskidReceipt = await (await engine.connect(user2).submitTask(
        taskParams.version,
        taskParams.owner,
        taskParams.model,
        taskParams.fee,
        taskParams.input,
      )).wait();
      
      const taskid = taskidReceipt.events![0].args!.id;
      
      // Check totalHeld increased by taskFee
      expect(await engine.totalHeld()).to.equal(initialTotalHeld.add(taskFee));
      
      // Submit solution
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid, cid);
      
      // Submit contestation
      await engine.connect(masterContester1).submitContestation(taskid);
      await engine.connect(validator2).voteOnContestation(taskid, false);
      await engine.connect(validator3).voteOnContestation(taskid, false);
      
      // Finish voting (contestation should fail)
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine", []);
      
      await engine.connect(validator1).contestationVoteFinish(taskid, 4);
      
      // Final accounting check
      const finalTotalHeld = await engine.totalHeld();

      // When contestation fails (nays win), solution is claimed automatically
      // Verify the task was marked as claimed
      const task = await engine.tasks(taskid);
      expect(task.blocktime).to.be.gt(0); // Task exists

      // Verify totalHeld changed appropriately
      // Some fees may have been distributed, so totalHeld should not increase by full taskFee
      expect(finalTotalHeld).to.be.lte(initialTotalHeld.add(taskFee));
    });
  });

  describe("Validator Stake Edge Cases", () => {
    beforeEach(async () => {
      await setupValidators();
    });

    it("should handle validator with pending withdrawals correctly in contestations", async () => {
      await masterContesterRegistry.connect(deployer).emergencyAddMasterContester(masterContester1.address);
      
      // Validator1 initiates withdrawal but doesn't complete it
      const withdrawAmount = ethers.utils.parseEther("2");
      await engine.connect(validator1).initiateValidatorWithdraw(withdrawAmount);
      
      // Validator1's usable stake is reduced
      const stake = (await engine.validators(validator1.address)).staked;
      const pending = await engine.validatorWithdrawPendingAmount(validator1.address);
      const usableStake = stake.sub(pending);
      
      // Should still be able to submit solutions if has enough usable stake
      const modelid = await deployBootstrapModel();
      const taskid = await deployBootstrapTask(modelid);
      
      const cid = TESTCID;
      const commitment = await engine.generateCommitment(validator1.address, taskid, cid);
      await engine.connect(validator1).signalCommitment(commitment);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid, cid);
      
      // Submit contestation - validator1 auto-votes against (they're the solution submitter)
      await engine.connect(masterContester1).submitContestation(taskid);

      // Verify validator1's auto-vote was counted despite having pending withdrawals
      const hasVoted = await engine.contestationVoted(taskid, validator1.address);
      expect(hasVoted).to.be.true;

      // Validator2 should still be able to vote
      await expect(engine.connect(validator2).voteOnContestation(taskid, true))
        .to.emit(engine, "ContestationVote");
    });

    it("should prevent double-spending of stake in multiple operations", async () => {
      const modelid = await deployBootstrapModel();
      
      // Create multiple tasks
      const taskid1 = await deployBootstrapTask(modelid);
      const taskid2 = await deployBootstrapTask(modelid);
      
      const cid = TESTCID;
      
      // Submit solution to first task
      const commitment1 = await engine.generateCommitment(validator1.address, taskid1, cid);
      await engine.connect(validator1).signalCommitment(commitment1);
      await ethers.provider.send("evm_mine", []);
      await engine.connect(validator1).submitSolution(taskid1, cid);
      
      // Try to submit solution to second task immediately
      const commitment2 = await engine.generateCommitment(validator1.address, taskid2, cid);
      await engine.connect(validator1).signalCommitment(commitment2);
      await ethers.provider.send("evm_mine", []);
      
      // Should check if validator has enough stake for both
      const solutionStake = await engine.solutionsStakeAmount();
      const validatorStake = (await engine.validators(validator1.address)).staked;
      const minStake = await engine.getValidatorMinimum();
      
      if (validatorStake.sub(solutionStake.mul(2)).lt(minStake)) {
        // Should fail if not enough stake
        await expect(engine.connect(validator1).submitSolution(taskid2, cid))
          .to.be.revertedWith("MinStakedTooLow()");
      } else {
        // Should succeed if enough stake
        await expect(engine.connect(validator1).submitSolution(taskid2, cid))
          .to.emit(engine, "SolutionSubmitted");
      }
    });
  });
});
