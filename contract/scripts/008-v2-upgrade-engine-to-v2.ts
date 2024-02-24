import { ethers, upgrades } from "hardhat";
import { EngineV2 as Engine } from '../typechain/EngineV2';
import * as fs from 'fs'
import Config from './config.json';


async function main() {
  const signers = await ethers.getSigners();
  const deployer   = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const EngineV2 = await ethers.getContractFactory("V2_EngineV2");
  const engine = await upgrades.upgradeProxy(Config.v2_engineAddress, EngineV2);
  console.log("Engine upgraded");

  // 600_000 * (0.5^(5.95/365)) give close to expected supply
  const startTime = ((+new Date() / 1000)|0) - (24*60*60*5.95);
  console.log('new start time', new Date(startTime * 1000).toString());

  await (await engine
    .connect(deployer)
    .setStartBlockTime(startTime)
  ).wait();
  console.log('Start block time set to 5.95 days ago');

  await (await engine
    .connect(deployer)
    .setSolutionStakeAmount(ethers.utils.parseEther('0.001'))
  ).wait();
  console.log('Solution stake amount set to 0.001');

  process.exit(0)
}

main();
