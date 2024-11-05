import { ethers, upgrades } from "hardhat";
import { V2EngineV3 as Engine } from '../typechain/V2EngineV3';
import * as fs from 'fs'
import Config from './config.json';


async function main() {
  const signers = await ethers.getSigners();
  const deployer   = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const EngineV3 = await ethers.getContractFactory("V2_EngineV3");
  const engine = await upgrades.upgradeProxy(Config.v2_engineAddress, EngineV3, {
    call: "initialize",
  });
  console.log("Engine upgraded");

  process.exit(0)
}

main();
