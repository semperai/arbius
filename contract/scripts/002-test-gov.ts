import { ethers, upgrades } from "hardhat";
import { BigNumber } from 'ethers';
import ProxyAdminArtifact from '@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol/ProxyAdmin.json';
import { EngineV1 as Engine } from '../typechain/EngineV1';
import * as fs from 'fs'
import Config from './config.json'


async function main() {
  const signers = await ethers.getSigners();
  const deployer   = signers[0];

  const Governor = await ethers.getContractFactory(
    "GovernorV1"
  );
  const governor = await upgrades.deployProxy(Governor, [
    Config.baseTokenAddress,
    Config.timelockAddress,
  ]);
  await governor.deployed();
  console.log("Governor deployed to:", governor.address);

  const Timelock = await ethers.getContractFactory(
    "TimelockV1"
  );
  const timelock = Timelock.attach(Config.timelockAddress);
  await (await timelock.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PROPOSER_ROLE")), governor.address)).wait();
  console.log('Timelock: Governor granted PROPOSER_ROLE');

  // SAVE CONFIG
  const configPath = __dirname + '/config.json';
  fs.writeFileSync(configPath, JSON.stringify({
    ...Config,
    governorAddress: governor.address,
  }, null, 2));

  console.log('Saved config to', configPath);
  process.exit(0)
}

main();

