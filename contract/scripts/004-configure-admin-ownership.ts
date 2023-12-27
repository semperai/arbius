import { ethers, upgrades } from "hardhat";
import ProxyAdminArtifact from '@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol/ProxyAdmin.json';
import * as fs from 'fs'
import Config from './config.json';


async function main() {
  const signers = await ethers.getSigners();
  const deployer   = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const admin = new ethers.Contract(Config.proxyAdminAddress, ProxyAdminArtifact.abi, deployer);
  await (await admin.transferOwnership(Config.timelockAddress)).wait();
  console.log('Transferred ProxyAdmin to TimeLock');
}

main();
