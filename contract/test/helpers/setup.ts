import { ethers, upgrades } from "hardhat";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BaseTokenV1 as BaseToken } from "../../typechain/contracts/BaseTokenV1";
import { V2_EngineV6 } from "../../typechain/contracts/V2_EngineV6";
import { MasterContesterRegistry } from "../../typechain/contracts/MasterContesterRegistry";
import { VeStaking } from "../../typechain/contracts/ve/VeStaking";
import { VotingEscrow } from "../../typechain/contracts/ve/VotingEscrow";
import { VeNFTRender } from "../../typechain/contracts/ve/VeNFTRender";
import { Voter } from "../../typechain/contracts/ve/Voter";

export const TESTCID = '0x1220f4ad8a3bd3189da2ad909ee41148d6893d8c629c410f7f2c7e3fae75aade79c8';
export const TESTBUF = '0x746573740a';

export interface TestSetup {
  signers: SignerWithAddress[];
  deployer: SignerWithAddress;
  user1: SignerWithAddress;
  user2: SignerWithAddress;
  validator1: SignerWithAddress;
  validator2: SignerWithAddress;
  validator3: SignerWithAddress;
  validator4: SignerWithAddress;
  masterContester1: SignerWithAddress;
  masterContester2: SignerWithAddress;
  treasury: SignerWithAddress;
  model1: SignerWithAddress;
  baseToken: BaseToken;
  engine: V2_EngineV6;
  masterContesterRegistry: MasterContesterRegistry;
  veStaking: VeStaking;
  votingEscrow: VotingEscrow;
  veNFTRender: VeNFTRender;
  voter: Voter;
}

export async function setupTest(): Promise<TestSetup> {
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const user1 = signers[1];
  const user2 = signers[2];
  const validator1 = signers[3];
  const validator2 = signers[4];
  const validator3 = signers[5];
  const validator4 = signers[6];
  const masterContester1 = signers[7];
  const masterContester2 = signers[8];
  const treasury = signers[9];
  const model1 = signers[10];

  // Deploy BaseToken
  const BaseToken = await ethers.getContractFactory("BaseTokenV1");
  const baseToken = (await upgrades.deployProxy(BaseToken, [
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
  let engine = (await upgrades.deployProxy(V2_EngineV1, [
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
  engine = await upgrades.upgradeProxy(engine.address, V2_EngineV6, { call: "initialize" }) as V2_EngineV6;

  // Deploy VE contracts
  const VeNFTRender = await ethers.getContractFactory("VeNFTRender");
  const veNFTRender = await VeNFTRender.deploy();
  await veNFTRender.deployed();

  const VotingEscrow = await ethers.getContractFactory("VotingEscrow");
  const votingEscrow = await VotingEscrow.deploy(
    baseToken.address,
    veNFTRender.address,
    ethers.constants.AddressZero
  );
  await votingEscrow.deployed();

  const VeStaking = await ethers.getContractFactory("VeStaking");
  const veStaking = await VeStaking.deploy(baseToken.address, votingEscrow.address);
  await veStaking.deployed();
  
  await votingEscrow.setVeStaking(veStaking.address);
  
  const Voter = await ethers.getContractFactory("Voter");
  const voter = await Voter.deploy(votingEscrow.address);
  await voter.deployed();
  
  await votingEscrow.setVoter(voter.address);
  await engine.connect(deployer).setVeStaking(veStaking.address);
  await engine.connect(deployer).setVoter(voter.address);
  await veStaking.setEngine(engine.address);

  // Deploy MasterContesterRegistry
  const MasterContesterRegistry = await ethers.getContractFactory("MasterContesterRegistry");
  const masterContesterRegistry = await MasterContesterRegistry.deploy(votingEscrow.address);
  await masterContesterRegistry.deployed();

  await engine.connect(deployer).setMasterContesterRegistry(masterContesterRegistry.address);

  // Setup tokens
  await baseToken.connect(deployer).bridgeMint(await deployer.getAddress(), ethers.utils.parseEther("2000"));
  await baseToken.connect(deployer).transferOwnership(engine.address);

  // Setup approvals
  for (const signer of [validator1, validator2, validator3, validator4, masterContester1, masterContester2, user1, user2]) {
    await baseToken.connect(signer).approve(engine.address, ethers.constants.MaxUint256);
  }

  return {
    signers,
    deployer,
    user1,
    user2,
    validator1,
    validator2,
    validator3,
    validator4,
    masterContester1,
    masterContester2,
    treasury,
    model1,
    baseToken,
    engine,
    masterContesterRegistry,
    veStaking,
    votingEscrow,
    veNFTRender,
    voter
  };
}

export async function deployBootstrapModel(engine: V2_EngineV6, model1: SignerWithAddress, user1: SignerWithAddress): Promise<string> {
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

export async function deployBootstrapTask(
  engine: V2_EngineV6, 
  modelid: string, 
  user1: SignerWithAddress,
  submitter?: SignerWithAddress
): Promise<string> {
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

export async function setupValidators(
  baseToken: BaseToken,
  engine: V2_EngineV6,
  deployer: SignerWithAddress,
  validators: SignerWithAddress[],
  masterContesters: SignerWithAddress[]
): Promise<void> {
  // Bridge tokens to engine to enable mining
  await baseToken.connect(deployer).bridgeMint(engine.address, ethers.utils.parseEther('597000'));

  // Setup validators with enough stake
  for (const validator of validators) {
    await baseToken.connect(deployer).transfer(await validator.getAddress(), ethers.utils.parseEther('10'));
    await engine.connect(validator).validatorDeposit(await validator.getAddress(), ethers.utils.parseEther('10'));
  }

  // Setup master contesters as validators too
  for (const mc of masterContesters) {
    await baseToken.connect(deployer).transfer(await mc.getAddress(), ethers.utils.parseEther('10'));
    await engine.connect(mc).validatorDeposit(await mc.getAddress(), ethers.utils.parseEther('10'));
  }
}
