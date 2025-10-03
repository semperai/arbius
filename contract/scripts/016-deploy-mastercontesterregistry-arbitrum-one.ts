import { ethers } from "hardhat";
import * as hre from "hardhat";
import * as fs from 'fs';
import Config from './config.one.json';

async function main() {
  // get network name from hardhat runtime environment
  const networkName = hre.network.name;
  console.log("Network:", networkName);

  /* Deploy contracts */
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());


  // Load votingEscrow contract address from config
  const votingEscrowAddress = Config.v5_votingEscrowAddress;
  console.log("VotingEscrow address:", votingEscrowAddress);

  // Deploy MasterContesterRegistry
  const MasterContesterRegistry = await ethers.getContractFactory("MasterContesterRegistry");
  const masterContesterRegistry = await MasterContesterRegistry.deploy(votingEscrowAddress);
  await masterContesterRegistry.deployed();

  console.log("MasterContesterRegistry deployed to:", masterContesterRegistry.address);

  // Set master contester count to 1
  console.log("Setting master contester count to 1...");
  const setCountTx = await masterContesterRegistry.setMasterContesterCount(1);
  await setCountTx.wait();
  console.log("Master contester count set to 1");

  // Emergency add kasumi3 address as master contester
  const kasumi3Address = "0xAaf4e65d44FD4fE6ccD2DC3bEF2125EE6764a281";
  console.log("Adding kasumi3 as emergency master contester:", kasumi3Address);
  const addContesterTx = await masterContesterRegistry.emergencyAddMasterContester(kasumi3Address);
  await addContesterTx.wait();
  console.log("Kasumi3 added as master contester");

  // Update config file with new address
  const configPath = './scripts/config.one.json';
  const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  configData.v6_masterContesterRegistryAddress = masterContesterRegistry.address;
  fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
  console.log("Config updated with MasterContesterRegistry address");

  console.log("\nDeployment summary:");
  console.log("===================");
  console.log("MasterContesterRegistry:", masterContesterRegistry.address);
  console.log("Master contester count:", await masterContesterRegistry.masterContesterCount());
  console.log("Kasumi3 is master contester:", await masterContesterRegistry.isMasterContester(kasumi3Address));

  console.log("\nNext steps:");
  console.log("1. Verify contract on Arbiscan:");
  console.log(`   npx hardhat verify --network arbitrum ${masterContesterRegistry.address} ${votingEscrowAddress}`);

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
