import { ethers, upgrades } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

async function main() {
  // Read and parse the config.json file to get the contract addresses
  const configPath = path.resolve(__dirname, "./config.one.json");
  const configFile = fs.readFileSync(configPath, "utf-8");
  const Config = JSON.parse(configFile);

  const signers = await ethers.getSigners();
  const deployer = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);

  // deploy and upgrade engine
  const V2_EngineV1 = await ethers.getContractFactory("V2_EngineV1");
  const V2_EngineV2 = await ethers.getContractFactory("V2_EngineV2");
  const V2_EngineV3 = await ethers.getContractFactory("V2_EngineV3");
  const V2_EngineV4 = await ethers.getContractFactory("V2_EngineV4");

  let engine = await upgrades.deployProxy(V2_EngineV1, [
    Config.v4_baseTokenAddress,
    deployer.address, // deployer as treasury
  ]);
  await engine.deployed();
  console.log("Engine deployed to:", engine.address);

  engine = await upgrades.upgradeProxy(engine.address, V2_EngineV2);
  console.log("Engine upgraded to V2");

  engine = await upgrades.upgradeProxy(engine.address, V2_EngineV3, {
    call: "initialize",
  });
  console.log("Engine upgraded to V3");
  engine = await upgrades.upgradeProxy(engine.address, V2_EngineV4, {
    call: "initialize",
  });
  console.log("Engine upgraded to V4");

  // Deploy ve-contracts
  const VeNFTRender = await ethers.getContractFactory("VeNFTRender");
  const VotingEscrow = await ethers.getContractFactory("VotingEscrow");
  const VeStaking = await ethers.getContractFactory("VeStaking");

  const veNFTRender = await VeNFTRender.deploy();
  console.log("VeNFTRender deployed to:", veNFTRender.address);
  const votingEscrow = await VotingEscrow.deploy(
    Config.v4_baseTokenAddress,
    veNFTRender.address,
    ethers.constants.AddressZero // vestaking not deployed yet
  );
  console.log("VotingEscrow deployed to:", votingEscrow.address);
  const veStaking = await VeStaking.deploy(
    Config.v4_baseTokenAddress,
    votingEscrow.address
  );
  console.log("VeStaking deployed to:", veStaking.address);

  await (await votingEscrow.setVeStaking(veStaking.address)).wait();
  console.log("VeStaking set in VotingEscrow");

  await (await engine.setVeStaking(veStaking.address)).wait();
  console.log("VeStaking set in EngineV4");

  // Governance contracts
  const TimelockV1 = await ethers.getContractFactory("TimelockV1");
  const GovernorV1 = await ethers.getContractFactory("GovernorV1");

  const proposers = [deployer.address];
  const executors = [deployer.address];

  const timelock = await TimelockV1.deploy(
    0,
    proposers,
    executors,
    deployer.address
  );
  await timelock.deployed();
  console.log("Timelock deployed to:", timelock.address);

  const governor = await GovernorV1.deploy(
    votingEscrow.address,
    timelock.address
  );
  await governor.deployed();
  console.log("Governor deployed to:", governor.address);

  // Define the role constants
  const PROPOSER_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("PROPOSER_ROLE")
  );
  const EXECUTOR_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("EXECUTOR_ROLE")
  );

  // Grant roles to the governor
  await (await timelock.grantRole(PROPOSER_ROLE, governor.address)).wait();
  await (await timelock.grantRole(EXECUTOR_ROLE, governor.address)).wait();
  console.log("Governor roles granted");

  // SAVE CONFIG
  const oneConfigPath = __dirname + "/config.one.json";
  fs.writeFileSync(
    oneConfigPath,
    JSON.stringify(
      {
        v4_baseTokenAddress:    Config.v4_baseTokenAddress,
        v4_engineAddress:       engine.address,
        v4_veNFTRenderAddress:  veNFTRender.address,
        v4_votingEscrowAddress: votingEscrow.address,
        v4_veStakingAddress:    veStaking.address,
        v4_timelockAddress:     timelock.address,
        v4_governorAddress:     governor.address,
      },
      null,
      2
    )
  );
  console.log("Saved config to", oneConfigPath);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
