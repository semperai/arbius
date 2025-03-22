import * as dotenv from 'dotenv';
dotenv.config();
import * as fs from 'fs';
import { ILogObj, Logger } from 'tslog';
import { Telegraf, Telegram, Input } from 'telegraf';
import { message } from 'telegraf/filters';
import { Contract, Wallet, ethers } from 'ethers';
import ArbiusAbi from './abis/arbius.json';
import ERC20Abi from './abis/erc20.json';
import { base58, base64 } from '@scure/base';
import axios from 'axios';
import { initializeLogger, log } from './log';
import {
  hydrateInput,
  taskid2Seed,
  expretry,
  generateCommitment,
  cidify,
  now,
} from './utils';
import { initializeIpfsClient, pinFileToIPFS, pinFilesToIPFS } from './ipfs';
import QwenTemplate from "./templates/qwen_sepolia.json"

let c: any; // MiningConfig;

const modelId = process.env.MODEL_ID!;

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);
const wallet = new Wallet(process.env.PRIVATE_KEY!, provider);
const arbius = new Contract(process.env.ARBIUS_ADDRESS!, ArbiusAbi, wallet);
const token = new Contract(process.env.TOKEN_ADDRESS!, ERC20Abi, wallet);

const QwenModel = {
  id:       modelId,
  template: QwenTemplate,
  getfiles: async (m: any, taskid: string, input: any) => {
    const url = c.ml.cog[modelId].url;

    let res = null;
    try {
      res = await axios.post(url, { input });
    } catch (e) {
      log.error('error occurred during post');
      console.error(e);
    }

    if (! res) {
      throw new Error('unable to getfiles');
    }


    if (res.data.output.length != 1) {
      throw new Error('unable to getfiles -- data.output length not 1');
    }

    const data = res.data.output[0];
    const buf = Buffer.from(data, 'utf-8');

    const path = 'out-1.txt';
    fs.writeFileSync(`${__dirname}/../cache/${path}`, buf);

    return [path];
  },
  getcid: async (
    c: any,
    model: any,
    taskid: string,
    input: any
  ) => {
    const paths = await expretry('getfiles', async () => await model.getfiles(model, taskid, input));
    if (! paths) {
      throw new Error('cannot get paths');
    }
    // TODO calculate cid and pin async
    const cid58 = await expretry('getcid pinfiles', async () => await pinFilesToIPFS(c, taskid, paths));
    log.debug(`Pinned files to ipfs: ${cid58}`);
    if (! cid58) {
      throw new Error('cannot pin files to retrieve cid');
    }
    const cid = '0x'+Buffer.from(base58.decode(cid58)).toString('hex');
    return cid;
  },
};

async function verifyTask({
  taskid,
  taskInputData,
}: {
  taskid: string;
  taskInputData: any;
}): Promise<string | null> {
  const hydrated = hydrateInput(taskInputData, QwenModel.template);
  if (hydrated.err) {
    log.warn(`Task (${taskid}) hydration error ${hydrated.errmsg}`);
    return null;
  }

  hydrated.input.seed = taskid2Seed(taskid);

  const cid = await QwenModel.getcid(
    c,
    QwenModel,
    taskid,
    hydrated.input
  );
  if (!cid) {
    log.error(`Task (${taskid}) CID could not be generated`);
    return null;
  }
  log.info(`CID ${cid} generated`);

  {
    const solution = await expretry('solutions', async () => arbius.solutions(taskid));
    if (solution.validator != ethers.ZeroAddress) {
      if (solution.cid != cid) {
        log.error(`Task ${taskid} already solved with different CID`);
        return null;
      } else {
        log.info(`Task ${taskid} already solved`);
        return cid;
      }
    }
    log.debug(`Task ${taskid} not solved yet, attempting...`);
  }

  const commitment = generateCommitment(wallet.address, taskid, cid);
  log.debug(`Commitment ${commitment} generated`);
  try {
    const tx = await arbius.signalCommitment(commitment, {
      gasLimit: 450_000,
    });
    log.info(`signalCommitment txHash: ${tx.hash}`);
  } catch (e) {
    log.warn(`signalCommitment failed: ${e}`);
    return cid;
  }

  try {
    const tx = await arbius.submitSolution(taskid, cid, {
      gasLimit: 500_000,
    });
    const receipt = await tx.wait();
    log.info(`submitSolution txHash: ${receipt.hash}`);
  } catch (e) {
    log.warn(`submitSolution failed: ${e}`);
    return cid;
  }
  
  return cid;
}

async function bootupChecks() {
  log.info(`Wallet address: ${wallet.address}`);
  const balance = await token.balanceOf(wallet.address);
  log.info(`Arbius balance: ${ethers.formatEther(balance)}`);

  const validatorMinimum = await arbius.getValidatorMinimum();
  log.info('Validator Minimum Stake:', ethers.formatEther(validatorMinimum));

  const validatorStaked = await arbius.validators(wallet.address);
  log.info('Validator Staked:', ethers.formatEther(validatorStaked.staked));

  const allowance = await token.allowance(wallet.address, process.env.ARBIUS_ADDRESS!);
  log.info('Allowance:', ethers.formatEther(allowance));
  if (allowance < balance) {
    log.info('Approving Arbius to spend tokens');
    const tx = await token.approve(process.env.ARBIUS_ADDRESS!, ethers.MaxUint256);
    const receipt = await tx.wait();
    log.info('tx:', receipt.transactionHash);
  }

  if (validatorStaked.staked < validatorMinimum) {
    log.info('Validator has not staked enough');

    const tx = await arbius.validatorDeposit(wallet.address, balance);
    const receipt = await tx.wait();
    log.info('tx:', receipt.transactionHash);
  }
}

let startupTime = now();
let lastMessageTime = 0;

async function main(configPath: string) {
  await initializeLogger('log.txt', 0);
  log.info('kasumi-3 is starting');


  try {
    const mconf = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    c = mconf;
  } catch (e) {
    console.error(`unable to parse ${configPath}`);
    process.exit(1);
  }
  await initializeIpfsClient(c);

  await bootupChecks();

  const filter = arbius.filters.TaskSubmitted(null, c.modelId, null, null);

  arbius.on('TaskSubmitted', async (taskid, modelId_, fee, sender, event) => {
    log.info(`Task ${taskid} submitted by ${sender}`);
    console.log('TaskSubmitted', taskid, modelId_, fee, sender);

    if (modelId_ != modelId) {
      console.error(`Task ${taskid} modelId ${modelId_} does not match ${modelId}`);
      return;
    }

    // sleep for 1 second to allow the task to be processed
    await new Promise(resolve => setTimeout(resolve, 5000));

    const txid = event.log.transactionHash;
    const tx = await expretry('get_transaction', async () => await event.log.getTransaction());
    if (! tx) {
      throw new Error('unable to retrieve tx');
    }
    const parsed = arbius.interface.parseTransaction(tx);
    let preprocessed_str = '';
    let preprocessed_obj = {};
    try {
      preprocessed_str = Buffer.from(parsed!.args.input_.substring(2), 'hex').toString();
      preprocessed_obj = JSON.parse(preprocessed_str);
    } catch (e) {
      console.error(`Task (${taskid}) request was unable to be parsed`);
      return;
    }

    try {
      const cid = await verifyTask({
        taskid,
        taskInputData: preprocessed_obj,
      });
    } catch (e) {
      log.error(`failed to verify task: ${e}`);
      return;
    }
  });
}

if (process.argv.length < 3) {
  console.error('usage: yarn start:listener MiningConfig.json');
  process.exit(1);
}

main(process.argv[2]);
