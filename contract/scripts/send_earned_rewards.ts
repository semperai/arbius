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

  const signers = await ethers.getSigners();
  const deployer = signers[0];

  console.log('Deployer:', deployer.address);

  const Token = await ethers.getContractFactory("BaseTokenV1");
  const token = await Token.attach(Config.v5_baseTokenAddress);

  console.log('Token:', token.address);

  const votingEscrow = await ethers.getContractAt(
    "VotingEscrow",
    Config.v5_votingEscrowAddress
  );

  console.log('VotingEscrow:', votingEscrow.address);

  const rewardsCSV = fs.readFileSync(path.resolve(__dirname, "./earned_rewards_veaius_snapshot.csv"), "utf-8");

  let totalToDistribute = BigInt(0);
  for (const line of rewardsCSV.split('\n')) {
    if (!line) continue;
    const tokenId = BigInt(line.split(',')[0]);
    const earned = BigInt(Number(line.split(',')[1]));
    const manuallyClaimed = BigInt(Number(line.split(',')[4]));
    const diff = BigInt(Number(line.split(',')[7]));
    const leftToDistribute = BigInt(Number(line.split(',')[10]));

    if (leftToDistribute <= 0) continue;

    totalToDistribute += leftToDistribute;

    if (tokenId < BigInt(617)) continue;

    // console.log('');
    // console.log('Token ID:', tokenId);
    // console.log('Earned:', earned);
    // console.log('Manually Claimed:', manuallyClaimed);
    // console.log('Diff:', diff);
    // console.log('Left to Distribute:', leftToDistribute);


    const owner = await votingEscrow.ownerOf(tokenId);
    console.log(`${tokenId}\t${owner}\t${ethers.utils.formatEther(leftToDistribute)}`);
    const tx = await token.transfer(owner, leftToDistribute);
    const receipt = await tx.wait();
    console.log('Transaction hash:', receipt.transactionHash);
  }

  console.log('');
  console.log('Total to distribute:', ethers.utils.formatEther(totalToDistribute));


  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
