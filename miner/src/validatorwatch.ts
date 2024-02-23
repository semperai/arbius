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

async function main(vwatch: string) {
  // need extra for ethers
  log.debug("Setting max file listeners to 100 for ethers");
  process.setMaxListeners(100);

  
  arbius.on('TaskSubmitted', (
    taskid:  string,
    modelid: string,
    fee:     BigNumber,
    sender:  string,
    evt:     ethers.Event,
  ) => {
    if (vwatch === sender) {
      log.info('TaskSubmitted', taskid);
    }
  });

  arbius.on('SolutionSubmitted', (
    validator: string,
    taskid:    string,
    evt:       ethers.Event,
  ) => {
    if (vwatch === validator) {
      log.info('SolutionSubmitted', taskid);
    }
  });

  arbius.on('ContestationSubmitted', (
    validator: string,
    taskid:    string,
    evt:       ethers.Event,
  ) => {
    if (vwatch === validator) {
      log.info('ContestationSubmitted', taskid);
    }
  });

  arbius.on('ContestationVote', (
    validator: string,
    taskid:    string,
    yea:       boolean,
    evt:       ethers.Event,
  ) => {
    if (vwatch === validator) {
      log.info('ContestationVote', taskid, yea);
    }
  });

  while (true) {
    await sleep(1000);
  }
}

async function start(configPath: string, validator: string) {
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
    log.info(`Arbius Validator Watch ${rev.substring(0, 8)} starting`);
  } catch (e) {
    log.warn('Could not run "git rev-parse HEAD" do you have git in PATH?');
  }

  log.debug(`Logging to ${c.log_path}`);
  
  await initializeBlockchain();
  log.debug(`Loaded wallet (${wallet.address})`);

  await main(validator);
  process.exit(0);
}

if (process.argv.length < 3) {
  console.error('usage: yarn watch:validator MiningConfig.json VALIDATORADDRESS');
  process.exit(1);
}

start(process.argv[2], process.argv[3]);
