import { ethers, upgrades } from "hardhat";
import * as hre from "hardhat"; // Import hre directly from Hardhat
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

async function main() {
  // get network name from hardhat runtime environment
  const networkName = hre.network.name;
  console.log("Network:", networkName);

  /* Deploy contracts */
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);

  const StakingRewards = await ethers.getContractFactory("StakingRewards");

  let stakingToken: string = "";
  let rewardsToken: string = "";
  // Ethereum Mainnet
  if (networkName === "mainnet") {
    stakingToken = "0xCB37089fC6A6faFF231B96e000300a6994d7a625"; // UNI-V2
    rewardsToken = "0x8AFE4055Ebc86Bd2AFB3940c0095C9aca511d852"; // AIUS
  } else if (networkName === "sepolia") {
    stakingToken = "0x5919827b631D1a1Ab2Ed01Fbf06854968f438797"; // UNI-V2
    rewardsToken = "0xc4e93fEAA88638889ea85787D9ab7C751C87C29B"; // AIUS
  }

  const stakingRewards = await StakingRewards.deploy(rewardsToken, stakingToken);
  console.log("StakingRewards deployed to:", stakingRewards.address);

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
