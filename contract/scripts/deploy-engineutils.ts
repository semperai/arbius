import { ethers, upgrades } from "hardhat";
import { EngineUtilsV1 } from '../typechain/EngineUtilsV1';
import * as fs from 'fs'
import Config from './config.json';


async function main() {
  const signers = await ethers.getSigners();
  const deployer   = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const EngineUtilsV1 = await ethers.getContractFactory(
    "EngineUtilsV1"
  );
  const engineUtils = await EngineUtilsV1.deploy(
    Config.v2_engineAddress,
  );
  await engineUtils.deployed();
  console.log("EngineUtils deployed to:", engineUtils.address);
  process.exit(0)
}

main();
