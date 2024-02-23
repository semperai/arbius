import { ethers } from "hardhat";
import { getL2Network } from '@arbitrum/sdk';
import * as fs from 'fs'
import 'dotenv/config';


async function main() {
  const walletPrivateKey = process.env.L1_PRIVATE_KEY!;

  const l1Provider = new ethers.providers.JsonRpcProvider(process.env.L1_PROVIDER_URL);
  const l2Provider = new ethers.providers.JsonRpcProvider(process.env.L2_PROVIDER_URL);
  const l1Wallet = new ethers.Wallet(walletPrivateKey, l1Provider);

  const l2Network = await getL2Network(l2Provider);
  const l1Gateway = l2Network.tokenBridge.l1CustomGateway;
  const l1Router = l2Network.tokenBridge.l1GatewayRouter;

  console.log("Deploying contracts with the account:", l1Wallet.address);
  console.log("Account balance:", (await l1Wallet.getBalance()).toString());

  console.log('Deploying the L1Token to L1:');
  console.log('L1 Gateway:', l1Gateway);
  console.log('L1 Router:', l1Router);
  console.log('Initial Supply:', 1000000);
  
  const L1Token = await ethers.getContractFactory('L1Token', l1Wallet);
  const l1Token = await L1Token.deploy(
    // uncomment these for testing deploy
    // deployer.address,
    // deployer.address,
    l1Gateway,
    l1Router,
    1_000_000,
  );

  await l1Token.deployed();
  console.log(`L1Token is deployed to L1 at ${l1Token.address}`);

  /**
   * Get the deployer token balance
   */
  const tokenBalance = await l1Token.balanceOf(l1Wallet.address);
  console.log(`Initial token balance of deployer: ${tokenBalance}`);

  // SAVE CONFIG
  const configPath = __dirname + '/config.json';
  fs.writeFileSync(configPath, JSON.stringify({
    l1TokenAddress: l1Token.address,
  }, null, 2));
  console.log('Saved config to', configPath);
  process.exit(0)
}

main();
