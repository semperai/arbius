import { ethers, upgrades } from "hardhat";
import { EngineUtilsV1 } from '../typechain/EngineUtilsV1';
import * as fs from 'fs'
import Config from './config.json';


async function main() {
  const signers = await ethers.getSigners();
  const deployer   = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const IsMiner = await ethers.getContractFactory(
    "IsMiner"
  );
  const isMiner = await IsMiner.deploy(
    Config.v2_engineAddress,
  );
  await isMiner.deployed();
  console.log("IsMiner deployed to:", isMiner.address);
  process.exit(0)
}

main();
