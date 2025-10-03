import { ethers, upgrades } from "hardhat";
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

  // Load addresses from config
  const engineAddress = Config.v5_engineAddress;
  const masterContesterRegistryAddress = (Config as any).v6_masterContesterRegistryAddress;

  if (!masterContesterRegistryAddress) {
    throw new Error("MasterContesterRegistry address not found in config. Run script 016 first.");
  }

  console.log("Engine address:", engineAddress);
  console.log("MasterContesterRegistry address:", masterContesterRegistryAddress);

  // Perform V6 upgrade
  console.log("\nUpgrading to V2_EngineV6...");
  const EngineV6 = await ethers.getContractFactory("V2_EngineV6");
  const engine = await upgrades.upgradeProxy(engineAddress, EngineV6, {
    call: "initialize",
  });
  await engine.deployed();
  console.log("Engine upgraded to V6");

  // Call setMasterContesterRegistry
  console.log("\nSetting MasterContesterRegistry...");
  const setRegistryTx = await engine.setMasterContesterRegistry(masterContesterRegistryAddress);
  await setRegistryTx.wait();
  console.log("MasterContesterRegistry set");

  // Update config file
  const configPath = './scripts/config.one.json';
  const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  configData.v6_engineAddress = engine.address;
  fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
  console.log("Config updated with V6 engine address");

  console.log("\nUpgrade summary:");
  console.log("================");
  console.log("Engine V6 address:", engine.address);
  console.log("MasterContesterRegistry:", await engine.masterContesterRegistry());
  console.log("Start block time:", await engine.startBlockTime());
  console.log("Contract paused:", await engine.paused());

  console.log("\nNext steps:");
  console.log("1. Verify contract on Arbiscan:");
  console.log(`   npx hardhat verify --network arbitrum ${engine.address}`);
  console.log("2. Unpause the contract:");
  console.log(`   Call unpause() on the engine contract`);

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
