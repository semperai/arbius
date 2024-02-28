import { readFileSync, writeFileSync } from "fs";
import { ethers } from "ethers";
import { expretry } from './utils';
import { initializeLogger, log } from "./log";
import { initializeMiningConfig, c } from "./mc";
import { initializeBlockchain, wallet, arbius } from "./blockchain";

async function main(configPath: string, unclaimedSrc?: string) {
  try {
    const mconf = JSON.parse(readFileSync(configPath, "utf8"));
    initializeMiningConfig(mconf);
  } catch (e) {
    console.error(`unable to parse ${configPath}`);
    process.exit(1);
  }

  let unclaimedPath = unclaimedSrc || 'unclaimed.json';

  let taskids: any;
  try {
    taskids = JSON.parse(readFileSync(unclaimedPath, "utf8"));
  } catch (e) {
    console.error(`unable to parse ${unclaimedSrc}`);
    process.exit(1);
  }

  initializeLogger(null);

  await initializeBlockchain();

  for (let taskid of taskids) {
    log.debug(`Attempting to claim ${taskid}`);

    const tx = await expretry(async () => await arbius.claimSolution(taskid));
    const receipt = await tx.wait();
    log.info(`Claimed ${taskid} in ${receipt.transactionHash}`);

  }

}

if (process.argv.length < 3) {
  log.error("usage: yarn bulk:claim MiningConfig.json [unclaimed.json]");
  process.exit(1);
}

main(process.argv[2], process.argv[3]);
