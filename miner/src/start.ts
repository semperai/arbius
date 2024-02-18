import * as child_process from 'child_process';
import * as fs from 'fs';
import { initializeLogger, log } from './log';
import { c, initializeMiningConfig } from './mc';
import { initializeDatabase } from './db';
import { initializeML } from './ml';
import { initializeBlockchain, wallet } from './blockchain';
import { initializeRPC } from './rpc';
import { main } from './index';

async function start(configPath: string) {
  try {
    const mconf = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    initializeMiningConfig(mconf);
  } catch (e) {
    console.error(`unable to parse ${configPath}`);
    process.exit(1);
  }

  initializeLogger(c.log_path);
  if (c.evilmode) {
    for (let i=0; i<20; ++i) {
      log.warn('YOU HAVE EVIL MODE ENABLED, YOU WILL BE SLASHED');
      log.warn('KILL YOUR MINER IMMEDIATELY IF NOT ON TESTNET');
    }
  }

  try {
    const rev = child_process.execSync('git rev-parse HEAD').toString().trim();
    log.info(`Arbius Miner ${rev.substring(0, 8)} starting`);
  } catch (e) {
    log.warn('Could not run "git rev-parse HEAD" do you have git in PATH?');
  }

  log.debug(`Logging to ${c.log_path}`);
  
  await initializeDatabase(c);
  log.debug(`Database loaded from ${c.db_path}`);

  await initializeML(c);
  log.debug(`ML initialized`);
  
  await initializeBlockchain();
  log.debug(`Loaded wallet (${wallet.address})`);

  await initializeRPC();
  log.debug(`RPC initialized`);

  await main();
  process.exit(0);
}

if (process.argv.length < 3) {
  console.error('usage: yarn start MiningConfig.json');
  process.exit(1);
}

start(process.argv[2]);
