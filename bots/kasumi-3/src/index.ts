import * as dotenv from 'dotenv';
dotenv.config();
import * as fs from 'fs';
import { ILogObj, Logger } from 'tslog';
import { Telegraf, Telegram, Input } from 'telegraf';
import { message } from 'telegraf/filters';
import { Contract, Wallet, ethers } from 'ethers';
import ArbiusAbi from './abis/arbius.json';
import ArbiusRouterAbi from './abis/arbiusRouter.json';
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
const arbiusRouter = new Contract(process.env.ARBIUS_ROUTER_ADDRESS!, ArbiusRouterAbi, wallet);
const token = new Contract(process.env.TOKEN_ADDRESS!, ERC20Abi, wallet);

const bot = new Telegraf(process.env.BOT_TOKEN!)


const QwenModel = {
  id:       modelId,
  template: QwenTemplate,
  getfiles: async (m: any, taskid: string, input: any) => {
    const url = "https://api.replicate.com/v1/models/qwen/qwen-image/predictions";
    input.disable_safety_checker = true;

    let res = null;
    try {
      res = await axios.post(url, { input }, {
        headers: {
          'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN!}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait',
        },
        timeout: 10 * 60 * 1000,
      });
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

    const imgurl = res.data.output[0];
    let datares = null;
    try {
      datares = await axios.get(imgurl, {
        responseType: 'arraybuffer',
        timeout: 10 * 60 * 1000,
      });
    } catch (e) {
      console.error(e);
    }

    if (! datares) {
      throw new Error('unable to get image data');
    }

    if (datares.status != 200) {
      throw new Error(`unable to get image data -- status ${datares.status}`);
    }

    if (! datares.data) {
      throw new Error('unable to get image data -- no data');
    }

    const buf = Buffer.from(datares.data, 'utf-8');

    const path = 'out-1.webp';
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

async function findTransactionByTaskId(taskid: string): Promise<{ txHash: string, prompt: string } | null> {
  try {
    // Create filter for TaskSubmitted event with specific taskid
    const filter = arbius.filters.TaskSubmitted(taskid);

    // Get current block and search last 10,000 blocks
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 10000);

    log.debug(`Searching for taskid ${taskid} from block ${fromBlock} to ${currentBlock}`);

    // Query logs
    const logs = await arbius.queryFilter(filter, fromBlock, currentBlock);

    if (logs.length === 0) {
      log.warn(`No TaskSubmitted event found for taskid: ${taskid}`);
      return null;
    }

    // Get the transaction hash from the log
    const txHash = logs[0].transactionHash;
    log.debug(`Found transaction hash: ${txHash}`);

    // Fetch the full transaction
    const tx = await provider.getTransaction(txHash);
    if (!tx || !tx.data) {
      log.error(`Could not fetch transaction data for hash: ${txHash}`);
      return null;
    }

    // Decode the transaction data using the router's interface
    try {
      const decodedData = arbiusRouter.interface.parseTransaction({ data: tx.data });

      if (decodedData?.name !== 'submitTask') {
        log.error(`Transaction is not a submitTask call: ${decodedData?.name}`);
        return null;
      }

      // Extract the input_ parameter (5th argument, index 4)
      const inputBytes = decodedData.args[4]; // This is the bytes calldata input_

      // Convert from hex to string
      const inputString = ethers.toUtf8String(inputBytes);

      // Parse the JSON to get the prompt
      const inputJson = JSON.parse(inputString);
      const prompt = inputJson.prompt;

      log.debug(`Successfully extracted prompt: ${prompt}`);

      return { txHash, prompt };
    } catch (decodeError) {
      log.error(`Failed to decode transaction data: ${decodeError}`);
      return null;
    }
  } catch (error) {
    log.error(`Error finding transaction by taskid: ${error}`);
    return null;
  }
}


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

  // sleep to avoid issue with nonce
  await new Promise((r) => setTimeout(r, 1 * 1000));

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

async function submitQwenTask(prompt: string) {
  const input = JSON.stringify({prompt});
  const bytes = ethers.hexlify(ethers.toUtf8Bytes(input));

  const modelFee = (await arbius.models(modelId)).fee;
  log.debug('Model Fee:', ethers.formatEther(modelFee));

  // TODO add task fee
  const fee = modelFee;

  const tx = await arbiusRouter.submitTask(
    0,
    wallet.address,
    modelId,
    fee,
    bytes,
    0, // ipfs incentive
    200_000, // gas limit
  );
  const receipt = await tx.wait();
  log.info(`submitTask txHash: ${tx.hash}`);

  let taskid = null;
  for (const ev of receipt.logs) {
    try {
      const d = arbius.interface.parseLog(ev);
      if (d && d.name == 'TaskSubmitted') {
        taskid = d.args[0];
      }
    } catch (e) {
      // ignore
    }
  }
  console.log(`taskid: ${taskid}`);

  expretry('submitQwenTask pinfile', async () => await pinFileToIPFS(
    c,
    Buffer.from(input, 'utf-8'),
    `task-${taskid}.json`,
  )).then((cid) => {
    log.debug(`Task input ${taskid} pinned with ${cid}`);
  });

  return taskid;
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
    log.info('tx:', tx.hash);
  }

  if (validatorStaked.staked < validatorMinimum) {
    log.info('Validator has not staked enough');

    const tx = await arbius.validatorDeposit(wallet.address, balance);
    const receipt = await tx.wait();
    log.info('tx:', tx.hash);
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



  bot.start((ctx) => {
    ctx.reply(`Hello! I am Kasumi-3, a playful AI assistant. I can perform inference using Arbius. Type /help for more information.`);
  });

  bot.help((ctx) => {
    ctx.reply(`Available commands:

  /generate <prompt> - Submit a task and wait for the generated image
  /submit <prompt> - Just submit a task and get the taskID
  /process <taskid> - Process an existing task by its taskID
  /kasumi - Show Kasumi-3's wallet status

  Examples:
  - /generate a beautiful sunset over mountains
  - /submit a cat playing piano
  - /process 0x1234...abcd`);
  });

  bot.on(message('text'), async (ctx) => {
    if (now() - startupTime < 3) {
      log.debug('Ignoring message because bot is still starting up');
      return;
    }

    log.debug(ctx.message);

    const text = ctx.message.text.trim();

    log.debug(`User: ${text}`);


    if (text.startsWith('/kasumi')) {
      const staked = ethers.formatEther(
        (await expretry('kasumi staked', async () => await arbius.validators(wallet.address))).staked
      );

      const arbiusBalance = ethers.formatEther(
        await expretry('kasumi arbius balance', async () => await token.balanceOf(wallet.address))
      );
      const etherBalance = ethers.formatEther((await expretry('kasumi ether balance', async () => await provider.getBalance(wallet.address))) || 0);

      const response = `Kasumi-3's address: ${wallet.address}\n\nKasumi-3 has a balance of:\n\n${arbiusBalance} AIUS\n${etherBalance} ETH\n${staked} AIUS Staked`;

      ctx.reply(response);
      return;
    } else if (text.startsWith('/generate')) {
      const prompt = ctx.message.text.split(' ').slice(1).join(' ');
      if (prompt === '') {
        ctx.reply('Please provide a prompt');
        return;
      }

      let responseCtx;
      try {
        responseCtx = await ctx.replyWithPhoto(Input.fromURL('https://arbius.ai/mining-icon.png'), {
          caption: `Beep boop beep!`,
        });
      } catch (e) {
        log.error(`failed to reply with photo: ${e}`);
        return;
      }

      const taskid = await submitQwenTask(prompt);
      log.debug(`taskid: ${taskid}`);

      const taskUrl = `https://arbius.ai/task/${taskid}`;
      if (taskid) {
        try {
          bot.telegram.editMessageCaption(
            responseCtx.chat.id,
            responseCtx.message_id,
            undefined,
            taskUrl,
          );
        } catch (e) {
          log.error(`failed to edit message caption: ${e}`);
          return;
        }
      }

      let cid: string | null = null;
      try {
        cid = await verifyTask({
          taskid,
          taskInputData: {
            prompt,
          },
        });
      } catch (e) {
        log.error(`failed to verify task: ${e}`);
        return;
      }

      if (cid) {
        const imageUrl = `https://ipfs.arbius.org/ipfs/${cidify(cid!)}/out-1.webp`;
        log.info(`Image URL: ${imageUrl}`);

        try {
          const resp = await axios.get(imageUrl, { timeout: 30 * 1000 });
        } catch (e) {
          log.error(`failed to get image from ipfs: ${e}`);
          return;
        }

        try {
          responseCtx = await ctx.replyWithPhoto(Input.fromURL(imageUrl), {
            caption: imageUrl,
          });
        } catch (e) {
          log.error(`failed to respond: ${e}`);
          return;
        }
      }
    }
  else if (text.startsWith('/submit')) {
    const prompt = ctx.message.text.split(' ').slice(1).join(' ');
    if (prompt === '') {
      ctx.reply('Please provide a prompt. Usage: /submit <your prompt>');
      return;
    }

    // Send initial processing message
    ctx.reply('⏳ Submitting task to Arbius...');

    const taskid = await submitQwenTask(prompt);

    if (taskid) {
      const taskUrl = `https://arbius.ai/task/${taskid}`;
      const message = `✅ Task submitted successfully!\n\nTaskID: \`${taskid}\`\nPrompt: "${prompt}"\n\nView on Arbius: ${taskUrl}\n\nYou can process this task later using:\n/process ${taskid}`;

      ctx.reply(message, {
        parse_mode: 'Markdown',
      });

      console.log(`Task submitted - TaskID: ${taskid}, Prompt: "${prompt}"`);
    } else {
      ctx.reply('❌ Failed to submit task. Please check the logs for details.');
    }

    return;
  }
    else if (text.startsWith('/process')) {
      const taskid = text.split(' ').slice(1)[0];
      if (!taskid) {
        ctx.reply('Please provide a taskid');
        return;
      }

      let responseCtx;
      try {
        responseCtx = await ctx.replyWithPhoto(Input.fromURL('https://arbius.ai/mining-icon.png'), {
          caption: `Processing task: ${taskid}`,
        });
      } catch (e) {
        log.error(`failed to reply with photo: ${e}`);
        return;
      }

      // Fetch transaction and decode prompt
      const txData = await findTransactionByTaskId(taskid);

      if (!txData) {
        log.error(`Could not find transaction data for taskid: ${taskid}`);
        ctx.reply(`❌ Could not find task ${taskid}. It may be too old or not yet confirmed.`);
        return;
      }

      const { txHash, prompt } = txData;
      log.info(`Found task ${taskid} in tx ${txHash} with prompt: ${prompt}`);

      // Update the message to show we found the task
      try {
        bot.telegram.editMessageCaption(
          responseCtx.chat.id,
          responseCtx.message_id,
          undefined,
          `Found task ${taskid}\nPrompt: "${prompt}"\nProcessing...`,
        );
      } catch (e) {
        log.error(`failed to edit message caption: ${e}`);
      }

      let cid: string | null = null;
      try {
        cid = await verifyTask({
          taskid,
          taskInputData: {
            prompt,
          },
        });
      } catch (e) {
        log.error(`failed to verify task: ${e}`);
        ctx.reply(`❌ Failed to verify task ${taskid}`);
        return;
      }

      if (cid) {
        const imageUrl = `https://ipfs.arbius.org/ipfs/${cidify(cid!)}/out-1.webp`;
        log.info(`Image URL: ${imageUrl}`);

        try {
          const resp = await axios.get(imageUrl, { timeout: 30 * 1000 });
        } catch (e) {
          log.error(`failed to get image from ipfs: ${e}`);
          ctx.reply(`❌ Generated image but could not retrieve from IPFS`);
          return;
        }

        try {
          responseCtx = await ctx.replyWithPhoto(Input.fromURL(imageUrl), {
            caption: `✅ Task ${taskid} processed\nPrompt: "${prompt}"\nImage: ${imageUrl}`,
          });
        } catch (e) {
          log.error(`failed to respond: ${e}`);
          return;
        }
      } else {
        ctx.reply(`❌ Could not generate CID for task ${taskid}`);
      }
    }
    else {
      // do not respond if not generating
      return;
    }
  });

  bot.launch(() => {
    startupTime = now();
    log.info("Telegram bot launched");
  });

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'))
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

if (process.argv.length < 3) {
  console.error('usage: yarn start:dev MiningConfig.json');
  process.exit(1);
}

main(process.argv[2]);
