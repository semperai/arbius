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

  const Voter = await ethers.getContractFactory("Voter");

  // Deploy Voter
  const voter = await Voter.deploy(Config.v5_votingEscrowAddress);
  console.log("Voter deployed to:", voter.address);

  const votingEscrow = await ethers.getContractAt(
    "VotingEscrow",
    Config.v5_votingEscrowAddress
  );
  await (await votingEscrow.setVoter(voter.address)).wait();
  console.log("Voter set in VotingEscrow");

  const engineV5 = await ethers.getContractAt(
    "V2_EngineV5",
    Config.v5_engineAddress
  );
  await (await engineV5.setVoter(voter.address)).wait();
  console.log("Voter set in EngineV5");

  // Update config
  Config.v5_voterAddress = voter.address;
  fs.writeFileSync(configPath, JSON.stringify(Config, null, 2));
  console.log("Updated config");

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
