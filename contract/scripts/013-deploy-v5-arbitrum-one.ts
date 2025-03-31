import { ethers, upgrades } from "hardhat";
import * as fs from 'fs'
import Config from './config.one.json';


async function main() {
  const signers = await ethers.getSigners();
  const deployer   = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());


  const result = await upgrades.forceImport(
    '0x9b51Ef044d3486A1fB0A2D55A6e0CeeAdd323E66',
    await ethers.getContractFactory("V2_EngineV4_1"),
    {
      kind: 'transparent',
    },
  );

  console.log(result);

  const EngineV5 = await ethers.getContractFactory("V2_EngineV5");
  const engine = await upgrades.upgradeProxy(Config.v4_engineAddress, EngineV5, {
    call: "initialize",
  });
  console.log("Engine upgraded");

  process.exit(0)
}

main();
