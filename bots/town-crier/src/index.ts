import * as dotenv from 'dotenv';
dotenv.config();
import * as fs from 'fs';
import { ILogObj, Logger } from 'tslog';
import { Telegraf, Telegram, Input } from 'telegraf';
import { message } from 'telegraf/filters';
import { Contract, Wallet, ethers } from 'ethers';
import ArbiusAbi from './abis/arbius.json';
import axios from 'axios';
import { initializeLogger, log } from './log';
import {
  expretry,
  cidify,
  now,
} from './utils';

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);
const arbius = new Contract(process.env.ARBIUS_ADDRESS!, ArbiusAbi, provider);
const channel = process.env.TELEGRAM_CHANNEL!;

const bot = new Telegraf(process.env.BOT_TOKEN!)


async function main() {
  await initializeLogger('log.txt', 0);
  log.info('town-crier is starting');


  bot.on(message('text'), async (ctx) => {
    const text = ctx.message.text.trim();
    const chatId = ctx.message.chat.id;
    if (ctx.message.chat.type !== 'supergroup') {
      ctx.reply('I am only available in supergroups');
      return;
    }
    if (text === '/start') {
      ctx.reply('I am a bot that will notify you about new events on the Arbius network');
      return;
    }
  });

  bot.launch(() => {
    log.info("Telegram bot launched");

    const filter = arbius.filters.TaskSubmitted
    const events = arbius.queryFilter(filter, 'latest');

    arbius.on('TaskSubmitted', (
      taskid:  string,
      modelid: string,
      fee:     bigint,
      sender:  string,
    ) => {
      if (Math.random() < 0.1) {
        const msg = `Task submitted by ${sender} for model ${modelid} with fee ${fee}\n\nhttps://arbius.ai/task/${taskid}`;
        bot.telegram.sendMessage(channel, msg);
        log.info(msg);
      }
    });

    arbius.on('ContestationSubmitted', (
      validator: string,
      taskid:    string,
    ) => {
      const msg = `Contestation submitted by ${validator} for task ${taskid}\n\nhttps://arbius.ai/task/${taskid}`;
      bot.telegram.sendMessage(channel, msg);
      log.info(msg);
    });
  });
  
  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'))
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

if (process.argv.length < 2) {
  console.error('usage: yarn start:dev');
  process.exit(1);
}

main();
