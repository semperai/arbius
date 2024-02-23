import { ethers, upgrades } from "hardhat";
import { getL2Network } from '@arbitrum/sdk';
import * as fs from 'fs'
import Config from './config.json';
import 'dotenv/config';


async function main() {
  const signers = await ethers.getSigners();
  const deployer   = signers[0];

  const walletPrivateKey = process.env.L2_PRIVATE_KEY!;
  const l2Provider = new ethers.providers.JsonRpcProvider(process.env.L2_PROVIDER_URL);
  const l2Wallet = new ethers.Wallet(walletPrivateKey, l2Provider);
  
  const l2Network = await getL2Network(l2Provider);
  const l2Gateway = l2Network.tokenBridge.l2CustomGateway;

  console.log("Deploying contracts with the account:", l2Wallet.address);
  console.log("Account balance:", (await l2Wallet.getBalance()).toString());

  console.log('Deploying the L2Token to L2:');
  console.log('L2 Gateway:', l2Gateway);
  console.log('L1 Token Address:', Config.l1TokenAddress);


  console.log('Deploying the L2Token to L2:');
  const L2Token = await ethers.getContractFactory('BaseTokenV1');
  const l2Token = await upgrades.deployProxy(L2Token, [
    // deployer.address,
    // deployer.address,
    l2Gateway,
    Config.l1TokenAddress,
  ]);
  // console.log(l2Token);

  await l2Token.deployed();
  console.log(`L2Token is deployed to L2 at ${l2Token.address}`);

  // SAVE CONFIG
  const configPath = __dirname + '/config.json';
  fs.writeFileSync(configPath, JSON.stringify({
    l1TokenAddress: Config.l1TokenAddress,
    baseTokenAddress: l2Token.address,
  }, null, 2));
  console.log('Saved config to', configPath);
  process.exit(0)
}

main();
