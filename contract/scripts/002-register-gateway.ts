import { ethers } from "hardhat";
import { getL2Network, L1ToL2MessageStatus } from '@arbitrum/sdk';
import { AdminErc20Bridger } from '@arbitrum/sdk/dist/lib/assetBridger/erc20Bridger';
import * as fs from 'fs'
import Config from './config.json';
import 'dotenv/config';


async function main() {
  const walletPrivateKey = process.env.L1_PRIVATE_KEY!;

  const l1Provider = new ethers.providers.JsonRpcProvider(process.env.L1_PROVIDER_URL);
  const l1Wallet = new ethers.Wallet(walletPrivateKey, l1Provider);

  const l2Provider = new ethers.providers.JsonRpcProvider(process.env.L2_PROVIDER_URL);
  const l2Wallet = new ethers.Wallet(walletPrivateKey, l2Provider);
  
  const l2Network = await getL2Network(l2Provider);
  const l2Gateway = l2Network.tokenBridge.l2CustomGateway;

  /**
   * Register custom token on our custom gateway
   */
  const adminTokenBridger = new AdminErc20Bridger(l2Network);
  const registerTokenTx = await adminTokenBridger.registerCustomToken(
    Config.l1TokenAddress,
    Config.baseTokenAddress,
    l1Wallet,
    l2Provider,
  );
  
  const registerTokenRec = await registerTokenTx.wait();
  console.log(
    `Registering token txn confirmed on L1! 🙌 L1 receipt is: ${registerTokenRec.transactionHash}`,
  );
  
  /**
   * The L1 side is confirmed; now we listen and wait for the L2 side to be executed; we can do this by computing the expected txn hash of the L2 transaction.
   * To compute this txn hash, we need our message's "sequence numbers", unique identifiers of each L1 to L2 message.
   * We'll fetch them from the event logs with a helper method.
   */
  const l1ToL2Msgs = await registerTokenRec.getL1ToL2Messages(l2Provider);
  
  /**
   * In principle, a single L1 txn can trigger any number of L1-to-L2 messages (each with its own sequencer number).
   * In this case, the registerTokenOnL2 method created 2 L1-to-L2 messages;
   * - (1) one to set the L1 token to the Custom Gateway via the Router, and
   * - (2) another to set the L1 token to its L2 token address via the Generic-Custom Gateway
   * Here, We check if both messages are redeemed on L2
   */
  if(l1ToL2Msgs.length !== 2) {
    console.error('Should be 2 messages.');
    process.exit(1);
  }
  
  const setTokenTx = await l1ToL2Msgs[0].waitForStatus();
  if (setTokenTx.status !== L1ToL2MessageStatus.REDEEMED) {
    console.error('Set token not redeemed.');
    process.exit(1);
  }
  
  const setGateways = await l1ToL2Msgs[1].waitForStatus();
  if (setGateways.status !== L1ToL2MessageStatus.REDEEMED) {
    console.error('Set gateways not redeemed.');
    process.exit(1);
  }
  
  console.log(
    'Your custom token is now registered on our custom gateway 🥳  Go ahead and make the deposit!',
  );
  process.exit(0);
}

main();
