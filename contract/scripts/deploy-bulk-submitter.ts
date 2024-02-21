import { ethers, upgrades } from "hardhat";
import { EngineV1 as Engine } from '../typechain/EngineV1';
import * as fs from 'fs'
import Config from './config.json';


async function main() {
  const signers = await ethers.getSigners();
  const deployer   = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const BulkSubmitter = await ethers.getContractFactory(
    "BulkSubmitter"
  );
  const bulkSubmitter = await BulkSubmitter.deploy(
    Config.engineAddress,
    Config.baseTokenAddress,
    Config.models.kandinsky2.id,
    ethers.utils.hexlify(ethers.utils.toUtf8Bytes(JSON.stringify({prompt: "nothing"}))),
    '0x0000000000000000000000000000000000496e20476f64205765205472757374',
  );
  await bulkSubmitter.deployed();
  console.log("BulkSubmitter deployed to:", bulkSubmitter.address);
  process.exit(0)
}

main();
