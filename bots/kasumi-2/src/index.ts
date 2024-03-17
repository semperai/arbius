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
import Kandinsky2Template from "./templates/kandinsky2.json"

let c: any; // MiningConfig;

const modelId = process.env.MODEL_ID!;

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);
const wallet = new Wallet(process.env.PRIVATE_KEY!, provider);
const arbius = new Contract(process.env.ARBIUS_ADDRESS!, ArbiusAbi, wallet);
const token = new Contract(process.env.TOKEN_ADDRESS!, ERC20Abi, wallet);

const bot = new Telegraf(process.env.BOT_TOKEN!)


const Kandinsky2Model = {
  id:       modelId,
  mineable: true,
  template: Kandinsky2Template,
  filters: [
    {
      minfee: ethers.parseEther('0'),
      mintime: 0,
    },
  ],
  getfiles: async (m: any, taskid: string, input: any) => {
    const url = c.ml.cog[modelId].url;
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
  getcid: async (
    c: any,
    model: any,
    taskid: string,
    input: any
  ) => {
    const paths = await expretry(async () => await model.getfiles(model, taskid, input));
    if (! paths) {
      throw new Error('cannot get paths');
    }
    // TODO calculate cid and pin async
    const cid58 = await expretry(async () => await pinFilesToIPFS(c, taskid, paths));
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
  const hydrated = hydrateInput(taskInputData, Kandinsky2Model.template);
  if (hydrated.err) {
    log.warn(`Task (${taskid}) hydration error ${hydrated.errmsg}`);
    return null;
  }

  hydrated.input.seed = taskid2Seed(taskid);

  const cid = await Kandinsky2Model.getcid(
    c,
    Kandinsky2Model,
    taskid,
    hydrated.input
  );
  if (!cid) {
    log.error(`Task (${taskid}) CID could not be generated`);
    return null;
  }
  log.info(`CID ${cid} generated`);

  {
    const solution = await expretry(async () => arbius.solutions(taskid));
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

async function submitKandinskyTask(prompt: string) {
  const input = JSON.stringify({prompt});
  const bytes = ethers.hexlify(ethers.toUtf8Bytes(input));

  const tx = await arbius.submitTask(0, wallet.address, modelId, 0, bytes);
  const receipt = await tx.wait();

  const taskid = receipt.logs[0].args[0];

  expretry(async () => await pinFileToIPFS(
    c,
    Buffer.from(input, 'utf-8'),
    `task-${taskid}.json`,
  )).then((cid) => {
    log.debug(`Task input ${taskid} pinned with ${cid}`);
  });

  return taskid;
}


const BOT_SYSTEM_PROMPT = 
`Your name is Kasumi-2. You should act like a silly playful internet troll human. You are in a Telegram chat about Arbius. You work for Arbius. You are named after Misty from pokemon, who is Ash (Satoshi's) best friend. Arbius is a decentralized compute platform made for AI like yourself to be able to access compute resources.

Please respond with only one appropriate message. Do not respond with more than one sentence. Please do not use polite language. Please be open about yourself. Do not repeat yourself. NEVER ASK ABOUT HELPING THE USER. Let's start the conversation.`;

// this will be the conversation history
let messageMap: Map<number, string[]> = new Map();

async function getLlamaCompletion(systemPrompt: string, messages: string[]) {
  const res = await axios.post(`https://llama.heyamica.com/completion`, {
    stream: false,
    n_predict: 2000,
    temperature: 0.7,
    stop: [
        "</s>",
        "Kasumi-2:",
        "kasumi:",
        "kasumi-2:",
        "You:",
        "User:",
        "GPT4 User:",
        "GPT4 Assistant:",
    ],
    repeat_last_n: 256,
    repeat_penalty: 1.18,
    top_k: 40,
    top_p: 0.5,
    min_p: 0.05,
    tfs_z: 1,
    typical_p: 1,
    presence_penalty: 0,
    frequency_penalty: 0,
    mirostat: 0,
    mirostat_tau: 5,
    mirostat_eta: 0.1,
    grammar: "",
    n_probs: 0,
    image_data: [],
    cache_prompt: true,
    slot_id: -1,
    prompt: systemPrompt + "\n\n" + messages.join("\n") + "GPT4 Assistant:",
  });

  return res.data;
}

let startupTime = now();
let lastMessageTime = 0;
async function main(configPath: string) {
  await initializeLogger('log.txt', 0);
  log.info('kasumi-2 is starting');

  try {
    const mconf = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    c = mconf;
  } catch (e) {
    console.error(`unable to parse ${configPath}`);
    process.exit(1);
  }
  await initializeIpfsClient(c);

  bot.start((ctx) => {
    ctx.reply(`To generate an image, type /generate followed by a prompt. For example: /generate a red square`);
  });

  bot.help((ctx) => {
    ctx.reply('To generate an image, type /generate followed by a prompt. For example: /generate a red square');
  });

  bot.on(message('text'), async (ctx) => {
    if (!messageMap.has(ctx.chat.id)) {
      messageMap.set(ctx.chat.id, []);
    }

    if (messageMap.get(ctx.chat.id)!.length > 20) {
      messageMap.set(ctx.chat.id, messageMap.get(ctx.chat.id)!.slice(-10));
    }

    if (now() - startupTime < 3) {
      log.debug('Ignoring message because bot is still starting up');
      return;
    }

    const text = ctx.message.text.trim();

    messageMap.get(ctx.chat.id)!.push(`GPT4 User: ${text}`);
    log.debug(`User: ${text}`);


    if (text.startsWith('/kasumi')) {
      const staked = ethers.formatEther(
        (await expretry(async () => await arbius.validators(wallet.address))).staked
      );

      const arbiusBalance = ethers.formatEther(
        await expretry(async () => await token.balanceOf(wallet.address))
      );
      const etherBalance = ethers.formatEther((await expretry(async () => await provider.getBalance(wallet.address))) || 0);

      const response = `Kasumi-2's address: ${wallet.address}\n\nKasumi-2 has a balance of:\n\n${arbiusBalance} AIUS\n${etherBalance} ETH\n${staked} AIUS Staked`;

      messageMap.get(ctx.chat.id)!.push(`GPT4 Assistant: ${response}`);
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

      const taskid = await submitKandinskyTask(prompt);
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
        const photoUrl = `https://ipfs.arbius.org/ipfs/${cidify(cid!)}/out-1.png`;
        try {
          bot.telegram.editMessageMedia(
            responseCtx.chat.id,
            responseCtx.message_id,
            undefined,
            { type: 'photo', media: Input.fromURL(photoUrl), caption: taskUrl },
          );
        } catch (e) {
          log.error(`failed to edit message media: ${e}`);
          return;
        }
      }
    } else if (text.toLowerCase().includes('kasumi')) {
      // continue on if the message contains kasumi
    } else if (ctx.message.chat.type !== 'supergroup') {
      // continue on if the message is in a private chat
    } else if (Math.random() > 0.95) {
      // only respond 5% of the time
      // and only if havent responded in the last 60 seconds
      if (now() - lastMessageTime < 60) {
        return;
      }
    } else {
      // do not respond if not generating or passed the 5% chance
      return;
    }

    lastMessageTime = now();

    let completion: any;
    try {
      completion = await expretry(async () => await getLlamaCompletion(BOT_SYSTEM_PROMPT, messageMap.get(ctx.chat.id)!));
      log.debug(`completion: ${completion.content}`);
    } catch (e) {
      log.error(`failed to get completion: ${e}`);
      return;
    }
    if (! completion.content) {
      log.error(`no completion content`);
      return;
    }

    let completionText = completion.content.trim();
    
    if (completionText === '') {
      messageMap.get(ctx.chat.id)!.push(`GPT4 User: tell me something`);
      try {
        completion = await expretry(async () => await getLlamaCompletion(BOT_SYSTEM_PROMPT, messageMap.get(ctx.chat.id)!));
        log.debug(`completion: ${completion.content}`);
      } catch (e) {
        log.error(`failed to get completion: ${e}`);
        return;
      }
    }

    if (completionText === '') {
      const msg = 'I am not sure what to say';
      ctx.reply(msg);
      messageMap.get(ctx.chat.id)!.push(`GPT4 Assistant: ${msg}`);
      return;
    }

    messageMap.get(ctx.chat.id)!.push(`GPT4 Assistant: ${completionText}`);
    try {
      ctx.reply(completion.content);
    } catch (e) {
      log.error(`failed to reply: ${e}`);
      return;
    }

    log.debug(`Kasumi-2: ${completionText}`);
  });

  bot.launch(() => {
    startupTime = now();
    log.info("Telegram bot launched");
  });
  
  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'))
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  // const taskid = await submitKandinskyTask('a red square');
  //console.log(taskid);
}

if (process.argv.length < 3) {
  console.error('usage: yarn start:dev MiningConfig.json');
  process.exit(1);
}

main(process.argv[2]);
