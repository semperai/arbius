import * as child_process from 'child_process';
import * as fs from 'fs';
import { initializeLogger, log } from './log';
import { c, initializeMiningConfig } from './mc';
import { ethers } from 'ethers';
import Config from './config.json';
import { sleep } from './utils';
import {
  arbius,
  initializeBlockchain,
} from './blockchain';


ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.DEBUG);

async function main(taskidWatch?: string) {
  // need extra for ethers
  log.debug("Setting max file listeners to 100 for ethers");
  process.setMaxListeners(100);

  arbius.on('ContestationSubmitted', (
    validator: string,
    taskid:    string,
    evt:       ethers.Event,
  ) => {
    if (!taskidWatch || taskid  == taskidWatch) {
      log.info('ContestationSubmitted', validator, taskid);
      // log.debug(evt);
    }
  });

  arbius.on('ContestationVote', (
    validator: string,
    taskid:    string,
    yea:       boolean,
    evt:       ethers.Event,
  ) => {
    if (!taskidWatch || taskid  == taskidWatch) {
      log.info('ContestationVote', validator, taskid, yea);
      // log.debug(evt);
    }
  });

  arbius.on('ContestationVoteFinish', (
    taskid:    string,
    start_idx: number,
    end_idx:   number,
    evt:       ethers.Event,
  ) => {
    if (!taskidWatch || taskid  == taskidWatch) {
      // log.info('ContestationVoteFinish', taskid, start_idx, end_idx);
      // log.debug(evt);
    }
  });


  while (true) {
    await sleep(1000);
  }
}

async function start(configPath: string, taskid?: string) {
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
    log.info(`Arbius Vote Watch ${rev.substring(0, 8)} starting`);
  } catch (e) {
    log.warn('Could not run "git rev-parse HEAD" do you have git in PATH?');
  }

  log.debug(`Logging to ${c.log_path}`);
  
  await initializeBlockchain();

  await main(taskid);
  process.exit(0);
}

if (process.argv.length < 3) {
  console.error('usage: yarn watch:vote MiningConfig.json [taskid]');
  process.exit(1);
}

start(process.argv[2], process.argv[3]);
