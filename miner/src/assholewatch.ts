import * as child_process from "child_process";
import * as fs from "fs";
import { initializeLogger, log } from "./log";
import { c, initializeMiningConfig } from "./mc";
import { ethers, BigNumber } from "ethers";
import Config from "./config.json";

import { expretry, sleep, taskid2Seed } from "./utils";

import { MiningConfig } from "./types";

import { wallet, arbius, initializeBlockchain } from "./blockchain";
import { base58 } from "@scure/base";
import { getModelById, hydrateInput } from "./models";
ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.DEBUG);

class FIFOSet<T> {
  private maxCapacity: number;
  private set: Map<T, null>;
  private queue: T[];

  constructor(maxCapacity: number) {
    this.maxCapacity = maxCapacity;
    this.set = new Map<T, null>();
    this.queue = [];
  }

  add(element: T): boolean {
    if (this.set.has(element)) {
      // Element already exists, no need to add.
      return false;
    }

    if (this.queue.length >= this.maxCapacity) {
      // Remove the oldest element to make room for the new one.
      const oldestElement = this.queue.shift();
      if (oldestElement !== undefined) {
        this.set.delete(oldestElement);
      }
    }

    // Add the new element to the set and the queue.
    this.set.set(element, null);
    this.queue.push(element);
    return true;
  }

  contains(element: T): boolean {
    return this.set.has(element);
  }

  remove(element: T): boolean {
    if (!this.set.has(element)) {
      return false;
    }

    this.set.delete(element);
    this.queue = this.queue.filter((e) => e !== element);
    return true;
  }

  size(): number {
    return this.queue.length;
  }
}
const fifoSet = new FIFOSet<string>(10000);

async function main() {
  // need extra for ethers
  log.debug("Setting max file listeners to 100 for ethers");
  process.setMaxListeners(100);

  let solutionMap: Map<string, string[]> = new Map();
  let shortSolutionMap: Map<string, string[]> = new Map();

  arbius.on(
    "SolutionSubmitted",
    async (validator: string, taskid: string, evt: ethers.Event) => {
      // get task info by taskid
      const task = await arbius.tasks(taskid);
      // get task timestamp
      const taskBlockTime = task.blocktime.toNumber();
      const taskInputContentCid = task.cid;
      // get solution info by taskid
      const solution = await arbius.solutions(taskid);
      // get solution timestamp
      const solutionBlockTime = solution.blocktime.toNumber();
      const txHash = evt.transactionHash;
      const cid = solution.cid;

      // convert taskInputContentCid to ipfs cid
      // remove the leading 0x, then base58 encode the cid in hex format
      // NOTE: you can try access the file by https://ipfs.arbius.org/ipfs/${ipfsCid}
      // then use this json input file to generate the final input, like this one
      // {
      //   "input": {
      //   "prompt": "fast purple car",
      //       "seed": 1220633117823742,
      //       "width":768,
      //       "height":768
      //  }
      // }
      // or search for getcid function in miner/src/index.ts
      // const m = getModelById(EnabledModels, model);
      // const cid = await m.getcid(c, m, taskid, input);

      const taskInputIpfsCid = base58
        .encode(Buffer.from(taskInputContentCid.substring(2), "hex"))
        .toString();
      const seed = taskid2Seed(taskid);

      // convert cid to ipfs cid
      // remove the leading 0x, then base58 encode the cid in hex format
      // NOTE: you can try access the file by https://ipfs.arbius.org/ipfs/${ipfsCid}
      const ipfsCid = base58
        .encode(Buffer.from(cid.substring(2), "hex"))
        .toString();

      if (fifoSet.contains(cid)) {
        log.warn(
          `Duplicate solution for task ${taskid} by ${validator}, cid ${cid}, ipfsCid ${ipfsCid}, taskInputIpfsCid: ${taskInputIpfsCid}, seed: ${seed}, tx ${txHash}`
        );
      }
      fifoSet.add(cid);
      // if time spend is less than 3 seconds, log the taskid and txhash
      if (solutionBlockTime - taskBlockTime < 4) {
        log.warn(
          `Short solution for task ${taskid} by ${validator}, cid ${cid}, ipfsCid ${ipfsCid}, taskInputIpfsCid: ${taskInputIpfsCid}, seed: ${seed}, tx ${txHash}`
        );
      }
    }
  );

  while (true) {
    await sleep(1);
  }
}

async function start(configPath: string) {
  try {
    const mconf = JSON.parse(fs.readFileSync(configPath, "utf8"));
    initializeMiningConfig(mconf);
  } catch (e) {
    console.error(`unable to parse ${configPath}`);
    process.exit(1);
  }

  initializeLogger(c.log_path);

  try {
    const rev = child_process.execSync("git rev-parse HEAD").toString().trim();
    log.info(`Arbius Solution Watch ${rev.substring(0, 8)} starting`);
  } catch (e) {
    log.warn('Could not run "git rev-parse HEAD" do you have git in PATH?');
  }

  log.debug(`Logging to ${c.log_path}`);

  await initializeBlockchain();
  log.debug(`Loaded wallet (${wallet.address})`);

  await main();
  process.exit(0);
}

if (process.argv.length < 3) {
  console.error("usage: yarn watch:solution MiningConfig.json");
  process.exit(1);
}

start(process.argv[2]);
