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

  // Deploy veNFTRender
  const VeNFTRender = await ethers.getContractFactory("VeNFTRender");

  const veNFTRender = await VeNFTRender.deploy();
  console.log("VeNFTRender deployed to:", veNFTRender.address);

  // Update artProxy address in VotingEscrow
  const votingEscrow = await ethers.getContractAt(
    "VotingEscrow",
    Config.votingEscrowAddress
  );
  await votingEscrow.setArtProxy(veNFTRender.address);
  console.log("VeNFTRender updated in VotingEscrow");

  // Update config
  Config.veNFTRenderAddress = veNFTRender.address;
  fs.writeFileSync(configPath, JSON.stringify(Config, null, 2));
  console.log("Updated config");

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
