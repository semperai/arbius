import { ethers, upgrades } from "hardhat";
import * as hre from "hardhat"; // Import hre directly from Hardhat
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

async function main() {
  // Read and parse the config.json file to get the contract addresses
  const configPath = path.resolve(__dirname, "./config.sepolia.json");
  const configFile = fs.readFileSync(configPath, "utf-8");
  const Config = JSON.parse(configFile);

  /* Deploy contracts */
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  console.log("Deploying contracts with account:", deployer.address);

  // Deploy faucet
  const TestnetFaucet = await ethers.getContractFactory("TestnetFaucet");
  const testnetFaucet = await TestnetFaucet.deploy(Config.v2_baseTokenAddress);
  console.log("TestnetFaucet deployed to:", testnetFaucet.address);

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
