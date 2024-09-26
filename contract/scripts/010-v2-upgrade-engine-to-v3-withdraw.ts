import { ethers, upgrades } from "hardhat";
import { V2EngineV3 as Engine } from '../typechain/V2EngineV3';
import { BaseTokenV1 as BaseToken } from '../typechain/BaseTokenV1';
import * as fs from 'fs'
import Config from './config.json';


async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const EngineV3Withdraw = await ethers.getContractFactory("V2_EngineV3_Withdraw");
  const engine = await upgrades.upgradeProxy(Config.v2_engineAddress, EngineV3Withdraw, {
    call: "initialize",
  });
  console.log("Engine upgraded");
  // console.log(`attaching engine to ${Config.v2_engineAddress}`);
  //cconst engine = await EngineV3Withdraw.attach(Config.v2_engineAddress);


  const treasury = await engine.treasury();
  console.log(`Treasury is ${treasury}`);

  const BaseToken = await ethers.getContractFactory("BaseTokenV1");
  // console.log(`attaching baseToken to ${Config.v2_baseTokenAddress}`);
  const baseToken = await BaseToken.attach(Config.v2_baseTokenAddress);

  {
    const balanceBeforeEngine = await baseToken.balanceOf(engine.address);
    console.log(`${balanceBeforeEngine} AIUS in engine`);
    const balanceBeforeTreasury = await baseToken.balanceOf(treasury);
    console.log(`${balanceBeforeTreasury} AIUS in treasury`);
  }

  const tx = await engine.withdrawAiusToTreasury();
  const receipt = await tx.wait();
  console.log(`Withdrew aius to treasury in ${receipt.transactionHash}`);

  {
    const balanceAfterEngine = await baseToken.balanceOf(engine.address);
    console.log(`${balanceAfterEngine} AIUS in engine after withdraw`);
    const balanceAfterTreasury = await baseToken.balanceOf(treasury);
    console.log(`${balanceAfterTreasury} AIUS in treasury after withdraw`);
  }

  process.exit(0)
}

main();
