import { ethers, upgrades } from "hardhat";
import * as hre from "hardhat"; // Import hre directly from Hardhat
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

async function main() {
  // get network name from hardhat runtime environment
  const networkName = hre.network.name;
  console.log("Network:", networkName);

  // Read and parse the config.json file to get the contract addresses
  let configPath = "";
  if (networkName === "arbsepolia") {
    configPath = path.resolve(__dirname, "./config.sepolia.json");
  } else if (networkName === "arbitrum") {
    configPath = path.resolve(__dirname, "./config.one.json");
  }
  const configFile = fs.readFileSync(configPath, "utf-8");
  const Config = JSON.parse(configFile);

  /* Deploy contracts */
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);

  const VeStaking = await ethers.getContractFactory("VeStaking");

  // Deploy VeStaking
  const veStaking = await VeStaking.deploy(Config.v5_baseTokenAddress, Config.v5_votingEscrowAddress);
  console.log("VeStaking deployed to:", veStaking.address);

  const votingEscrow = await ethers.getContractAt(
    "VotingEscrow",
    Config.v5_votingEscrowAddress
  );
  await (await votingEscrow.setVeStaking(veStaking.address)).wait();
  console.log("VeStaking set in VotingEscrow");

  const engineV5 = await ethers.getContractAt(
    "V2_EngineV5",
    Config.v5_engineAddress
  );
  await (await engineV5.setVeStaking(veStaking.address)).wait();
  console.log("VeStaking set in EngineV5");

  await (await veStaking.setEngine(engineV5.address)).wait();
  console.log("Engine set in VeStaking)");

  // Update config
  Config.v5_veStakingAddress = veStaking.address;
  fs.writeFileSync(configPath, JSON.stringify(Config, null, 2));
  console.log("Updated config");

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
