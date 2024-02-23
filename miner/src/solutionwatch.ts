import * as child_process from 'child_process';
import * as fs from 'fs';
import { initializeLogger, log } from './log';
import { c, initializeMiningConfig } from './mc';
import { ethers, BigNumber } from 'ethers';
import Config from './config.json';

import { sleep } from './utils';

import { MiningConfig } from './types';

import {
  wallet,
  arbius,
  initializeBlockchain,
} from './blockchain';

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.DEBUG);

async function main() {
  // need extra for ethers
  log.debug("Setting max file listeners to 100 for ethers");
  process.setMaxListeners(100);

  
  let totalSolutions = 0;
  let shortSolutions = 0;
  let solutionMap: Map<string, string[]> = new Map();
  let shortSolutionMap: Map<string, string[]> = new Map();

  arbius.on('SolutionSubmitted', (
    validator: string,
    taskid:    string,
    evt:       ethers.Event,
  ) => {
    ++totalSolutions;
    ++shortSolutions;

    if (solutionMap.has(validator)) {
      solutionMap.get(validator)!.push(taskid);
    } else {
      solutionMap.set(validator, [taskid]);
    }

    if (shortSolutionMap.has(validator)) {
      shortSolutionMap.get(validator)!.push(taskid);
    } else {
      shortSolutionMap.set(validator, [taskid]);
    }
  });

  const bufferTime = 60; // seconds

  setInterval(async () => {
    // iterate over shortSolutionMap
    let sorted = Array.from(shortSolutionMap.entries()).sort((a, b) => {
        return a[1].length - b[1].length;
    });

    log.debug('=====');
    log.debug(`Total Solutions: ${totalSolutions}`);
    log.debug(`Short Solutions: ${shortSolutions}`);
    log.debug(`Solutions per second: ${shortSolutions / bufferTime}`);
    for (let o of sorted) {
      log.debug(o[0], o[1].length);
    }

    shortSolutions = 0;
    shortSolutionMap.clear();
  }, bufferTime * 1000);

  while (true) {
    await sleep(1);
  }
}

async function start(configPath: string) {
  try {
    const mconf = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    initializeMiningConfig(mconf);
  } catch (e) {
    console.error(`unable to parse ${configPath}`);
    process.exit(1);
  }

  initializeLogger(c.log_path);

  try {
    const rev = child_process.execSync('git rev-parse HEAD').toString().trim();
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
  console.error('usage: yarn watch:solution MiningConfig.json');
  process.exit(1);
}

start(process.argv[2]);
