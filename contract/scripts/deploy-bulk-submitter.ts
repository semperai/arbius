import { ethers, upgrades } from "hardhat";
import { EngineV1 as Engine } from '../typechain/EngineV1';
import * as fs from 'fs'
import Config from './config.local.json';


async function main() {
  const signers = await ethers.getSigners();
  const deployer   = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const BulkSubmitTask = await ethers.getContractFactory(
    "BulkSubmitTask"
  );
  const bulkSubmitTask = await BulkSubmitTask.deploy(
    Config.v2_engineAddress,
    Config.v2_baseTokenAddress,
  );
  await bulkSubmitTask.deployed();
  console.log("BulkSubmitTask deployed to:", bulkSubmitTask.address);
  process.exit(0)
}

main();
