import { ethers, upgrades } from "hardhat";
import * as fs from 'fs'
import Config from './config.one.json';


async function main() {
  const signers = await ethers.getSigners();
  const deployer   = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const EngineV4_1 = await ethers.getContractFactory("V2_EngineV4_1");
  const engine = await upgrades.upgradeProxy(Config.v4_engineAddress, EngineV4_1, {
    call: "initialize",
  });
  console.log("Engine upgraded");

  process.exit(0)
}

main();
