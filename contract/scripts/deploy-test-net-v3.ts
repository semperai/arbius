import { ethers, upgrades } from "hardhat";
import { getL2Network } from '@arbitrum/sdk';
import { V2EngineV2 as EngineV2 } from '../typechain/V2EngineV2';
import { V2EngineV3 as EngineV3 } from '../typechain/V2EngineV3';
import * as fs from 'fs'
import Config from './config.testnet.json';
import 'dotenv/config';


async function main() {
  const signers = await ethers.getSigners();
  const deployer   = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);

  const EngineV3 = await ethers.getContractFactory("V2_EngineV3");

  const engine = await upgrades.upgradeProxy(Config.v2_engineAddress, EngineV3) as EngineV3;
  console.log("Engine upgraded");

  /*
  await (await engine
    .connect(deployer)
    .setStartBlockTime(startTime)
  ).wait();
  console.log(`Start block time set to ${new Date((startTime) * 1000).toString()}`);
  */

  process.exit(0)
}

main();
