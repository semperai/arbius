import { ethers, upgrades } from "hardhat";
import { EngineV2 as Engine } from '../typechain/EngineV2';
import * as fs from 'fs'
import Config from './config.json';


async function main() {
  const signers = await ethers.getSigners();
  const deployer   = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const EngineV2 = await ethers.getContractFactory("EngineV2");
  const engine = await upgrades.upgradeProxy(Config.engineAddress, EngineV2);
  console.log("Engine upgraded");

  const startTime = 1707876523 + (24*60*60*2);
  console.log('new start time', new Date(startTime * 1000).toString());

  await (await engine
    .connect(deployer)
    .setStartBlockTime(startTime)
  ).wait();
  console.log('Start block time pushed forward 2 days');

  await (await engine
    .connect(deployer)
    .setSolutionStakeAmount(ethers.utils.parseEther('0.001'))
  ).wait();
  console.log('Solution stake amount set to 0.001');

  process.exit(0)
}

main();
