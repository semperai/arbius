import * as child_process from 'child_process';
import * as fs from 'fs';
import { initializeLogger, log } from './log';
import { c, initializeMiningConfig } from './mc';
import { ethers, BigNumber } from 'ethers';
import { base58, base64 } from '@scure/base';
import axios from 'axios';
import Config from './config.json';

import {
  Kandinsky2Model,
  getModelById,
  checkModelFilter,
  hydrateInput,
} from './models';

import { pinFileToIPFS, pinFilesToIPFS } from './ipfs';
import {
  sleep,
  now,
  taskid2Seed,
  expretry,
  generateCommitment,
} from './utils';

import {
  wallet,
  arbius,
  initializeBlockchain,
} from './blockchain';

import {
  MiningConfig,
  Model,
} from './types';


type Task = {
  taskid: string,
  modelid: string,
  fee: BigNumber,
  sender: string,
}
  


ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.DEBUG);

let ignoreValidators = new Set<string>();

let countTaskCreators = new Map<string, number>();

let lastRequestedTask = new Map<string, number>();

let verifyQueue: Task[] = [];

const EnabledModels = [
  {
    ...Kandinsky2Model,
    filters: [
      {
        minfee: ethers.utils.parseEther('0'),
        mintime: 0,
      },
    ],
    getfiles: async (m: Model, taskid: string, input: any) => {
      const url = c.ml.cog[Config.models.kandinsky2.id].url;
      const res = await axios.post(url, { input });

      if (! res) {
        throw new Error('unable to getfiles');
      }


      if (res.data.output.length != 1) {
        throw new Error('unable to getfiles -- data.output length not 1');
      }

      // slice off 
      // data:image/png;base64,
      const b64data = res.data.output[0];
      const data = b64data.replace(/^data:\w+\/\w+;base64,/, "");
      const buf = Buffer.from(data, 'base64');

      const path = 'out-1.png';
      fs.writeFileSync(`${__dirname}/../cache/${path}`, buf);

      return [path];
    },
  },
];

let alreadyProcessed = new Set<string>();
async function verifyTask(taskid: string) {
  if (alreadyProcessed.has(taskid)) {
    return;
  }
  alreadyProcessed.add(taskid);

  const {
    model:     taskModel,
    fee:       taskFee,
    owner:     taskOwner,
    blocktime: taskBlocktime,
    version:   taskVersion,
    cid:       taskCid,
  } = await expretry(async () => await arbius.tasks(taskid));

  if (ignoreValidators.has(taskOwner.toLowerCase())) {
    // log.debug(`Ignoring task ${taskid} from ${taskOwner}`);
    return;
  }

  console.log({
    taskModel,
    taskFee,
    taskOwner,
    taskBlocktime,
    taskVersion,
    taskCid,
  });

  const inputCid = base58.encode(Uint8Array.from(Buffer.from(taskCid.slice(2), 'hex')));
  const res = await expretry(async () => await axios.get(`https://ipfs.arbius.org/ipfs/${inputCid}`));
  if (res!.status !== 200) {
    log.error(`Task (${taskid}) input CID could not be retrieved (${res!.status})`);
    return;
  }

  const taskInputData = res!.data;
  console.log(taskInputData);

  const { owner } = await expretry(async () => await arbius.tasks(taskid));
  console.log({ owner });

  const m = getModelById(EnabledModels, taskModel);
  if (m === null) {
    log.error(`Task (${taskid}) could not find model (${taskModel})`);
    return;
  }
  console.log({ m });

  const {
    modelEnabled,
    modelTemplate,
    filterPassed,
  } = checkModelFilter(EnabledModels, {
    model: taskModel,
    now: now(),
    fee: taskFee,
    blocktime: taskBlocktime,
    owner: taskOwner,
  });

  const preprocessed_obj = taskInputData;

  const hydrated = hydrateInput(preprocessed_obj, modelTemplate);
  if (hydrated.err) {
    log.warn(`Task (${taskid}) hydration error ${hydrated.errmsg}`);
    return;
  }

  let input = hydrated.input;
  input.seed = taskid2Seed(taskid);
  console.log({ input });

  const cid = await m.getcid(c, m, taskid, input);
  if (!cid) {
    log.error(`Task (${taskid}) CID could not be generated`);
    return;
  }
  log.info(`CID ${cid} generated`);
}

let lastBlock = 0;
async function getRecentTasks(): Promise<Task[]> {
  let tasks: Task[] = [];

  const toBlock   = await wallet.provider.getBlockNumber(); 
  const fromBlock = (lastBlock === 0) ? toBlock - 10 : lastBlock;

  const events = await expretry(async () => await arbius.provider.getLogs({
    address: arbius.address,
    topics: [
      [
        arbius.interface.getEventTopic("TaskSubmitted"),
      ],
    ],
    fromBlock,
    toBlock,
  }));

  events!.map((event: ethers.providers.Log) => {
    const parsedLog = arbius.interface.parseLog(event);
    switch (parsedLog.name) {
      case "TaskSubmitted":
        tasks.push({
          taskid:  parsedLog.args.id,
          modelid: parsedLog.args.model,
          fee:     parsedLog.args.fee,
          sender:  parsedLog.args.sender,
        });
        break;
    }
  });

  lastBlock = toBlock-1;

  return tasks;
}

async function main() {
  // need extra for ethers
  log.debug("Setting max file listeners to 100 for ethers");
  process.setMaxListeners(100);

  setInterval(async () => {
    const tasks = await getRecentTasks();
    log.debug(`Got ${tasks.length} tasks`);
    for (const task of tasks) {
      const { taskid, modelid, sender } = task;

      if (ignoreValidators.has(sender.toLowerCase())) {
        continue;
      }

      if (modelid !== '0x98617a8cd4a11db63100ad44bea4e5e296aecfd78b2ef06aee3e364c7307f212') {
        continue;
      }


      if (countTaskCreators.has(sender)) {
        if (lastRequestedTask.get(sender)! > now() - 60) {
          countTaskCreators.set(sender, countTaskCreators.get(sender)! + 1);
        } else {
          // reset if more than 60 seconds between requests
          countTaskCreators.set(sender, 1);
        }

        if (countTaskCreators.get(sender)! > 10) {
          log.info(`Ignoring ${sender} due to high frequency of requests`);
          ignoreValidators.add(sender.toLowerCase());
        }
        lastRequestedTask.set(sender, now());
      } else {
        countTaskCreators.set(sender, 1);
        lastRequestedTask.set(sender, now());
      }

      if (ignoreValidators.has(sender.toLowerCase())) {
        // log.debug(`skipping ${sender}`);
      } else {
        log.debug(`${sender}(${countTaskCreators.get(sender)||0}) submitted task ${taskid} for model ${modelid}`);
        verifyQueue.push(task);
      }
    }
  }, 1000);

  setInterval(async () => {
    while (verifyQueue.length > 0) {
      const task = verifyQueue.pop();

      if (ignoreValidators.has(task!.sender.toLowerCase())) {
        continue;
      }

      await verifyTask(task!.taskid);
    }
  }, 1000);
    

  arbius.on('SolutionSubmitted', (
    validator: string,
    taskid:    string,
    evt:       ethers.Event,
  ) => {
    ignoreValidators.add(validator.toLowerCase());
  });

  const bufferTime = 60; // seconds

  setInterval(async () => {
    fs.writeFileSync('ignore.json', JSON.stringify(Array.from(ignoreValidators), null, 2));
    log.debug(`Wrote ignore.json`);
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
    log.info(`Arbius Public Watch ${rev.substring(0, 8)} starting`);
  } catch (e) {
    log.warn('Could not run "git rev-parse HEAD" do you have git in PATH?');
  }

  log.debug(`Logging to ${c.log_path}`);
  
  await initializeBlockchain();
  log.debug(`Loaded wallet (${wallet.address})`);

  const ignore = fs.readFileSync('ignore.json', 'utf8');
  const ignoreParsed = JSON.parse(ignore);
 
  ignoreValidators = new Set<string>();
  for (const addr of ignoreParsed) {
    ignoreValidators.add(addr.toLowerCase());
    log.debug(`loaded ${addr}`);
  }

  await main();
  process.exit(0);
}

if (process.argv.length < 3) {
  console.error('usage: yarn watch:public MiningConfig.json');
  process.exit(1);
}

start(process.argv[2]);
