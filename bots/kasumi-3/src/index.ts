import * as dotenv from 'dotenv';
dotenv.config();

import { Telegraf, Input } from 'telegraf';
import { message } from 'telegraf/filters';
import { ethers } from 'ethers';
import axios from 'axios';

import { initializeLogger, log } from './log';
import { initializeIpfsClient } from './ipfs';
import { now, cidify } from './utils';
import { ConfigLoader, loadModelsConfig } from './config';
import { ModelRegistry } from './services/ModelRegistry';
import { BlockchainService } from './services/BlockchainService';
import { JobQueue } from './services/JobQueue';
import { TaskProcessor } from './services/TaskProcessor';
import { TaskJob } from './types';

/**
 * Kasumi-3 Bot - Multi-model Telegram bot for Arbius network
 */
class Kasumi3Bot {
  private bot: Telegraf;
  private blockchain: BlockchainService;
  private modelRegistry: ModelRegistry;
  private jobQueue: JobQueue;
  private taskProcessor: TaskProcessor;
  private miningConfig: any;
  private startupTime: number;

  constructor(
    botToken: string,
    blockchain: BlockchainService,
    modelRegistry: ModelRegistry,
    jobQueue: JobQueue,
    taskProcessor: TaskProcessor,
    miningConfig: any
  ) {
    this.bot = new Telegraf(botToken);
    this.blockchain = blockchain;
    this.modelRegistry = modelRegistry;
    this.jobQueue = jobQueue;
    this.taskProcessor = taskProcessor;
    this.miningConfig = miningConfig;
    this.startupTime = now();

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.bot.start(ctx => {
      ctx.reply(
        `Hello! I am Kasumi-3, an AI inference bot powered by Arbius.\n\n` +
        `Available models:\n${this.getModelList()}\n\n` +
        `Type /help for more information.`
      );
    });

    this.bot.help(ctx => {
      const models = this.modelRegistry.getModelNames();
      const modelCommands = models.map(name => `  /${name} <prompt> - Generate using ${name}`).join('\n');

      ctx.reply(
        `Available commands:\n\n` +
        modelCommands + `\n\n` +
        `  /submit <model> <prompt> - Submit task without waiting\n` +
        `  /process <taskid> - Process an existing task\n` +
        `  /kasumi - Show Kasumi-3's wallet status\n` +
        `  /queue - Show job queue status\n\n` +
        `Examples:\n` +
        `  /qwen a beautiful sunset over mountains\n` +
        `  /wai anime girl with blue hair\n` +
        `  /submit qwen a cat playing piano\n` +
        `  /process 0x1234...abcd`
      );
    });

    this.bot.command('kasumi', async ctx => {
      try {
        const staked = ethers.formatEther(await this.blockchain.getValidatorStake());
        const arbiusBalance = ethers.formatEther(await this.blockchain.getBalance());
        const etherBalance = ethers.formatEther(await this.blockchain.getEthBalance());
        const address = this.blockchain.getWalletAddress();

        ctx.reply(
          `Kasumi-3's address: ${address}\n\n` +
          `Balances:\n` +
          `${arbiusBalance} AIUS\n` +
          `${etherBalance} ETH\n` +
          `${staked} AIUS Staked`
        );
      } catch (err) {
        log.error(`Error in /kasumi command: ${err}`);
        ctx.reply('❌ Failed to fetch wallet status');
      }
    });

    this.bot.command('queue', async ctx => {
      const stats = this.jobQueue.getQueueStats();
      ctx.reply(
        `📊 Queue Status:\n\n` +
        `Total jobs: ${stats.total}\n` +
        `Pending: ${stats.pending}\n` +
        `Processing: ${stats.processing}\n` +
        `Completed: ${stats.completed}\n` +
        `Failed: ${stats.failed}`
      );
    });

    this.bot.command('submit', async ctx => {
      await this.handleSubmit(ctx);
    });

    this.bot.command('process', async ctx => {
      await this.handleProcess(ctx);
    });

    // Handle text messages for dynamic model commands
    this.bot.on(message('text'), async ctx => {
      if (now() - this.startupTime < 3) {
        log.debug('Ignoring message - bot still starting up');
        return;
      }

      const text = ctx.message.text.trim();
      log.debug(`User message: ${text}`);

      // Check if it's a model command
      if (text.startsWith('/')) {
        const parts = text.split(' ');
        const commandName = parts[0].substring(1).toLowerCase();
        const prompt = parts.slice(1).join(' ');

        // Check if this is a model command
        const modelConfig = this.modelRegistry.getModelByName(commandName);
        if (modelConfig) {
          await this.handleModelCommand(ctx, modelConfig, prompt);
          return;
        }
      }
    });
  }

  private getModelList(): string {
    return this.modelRegistry
      .getAllModels()
      .map(m => `  /${m.name} - ${m.template.meta.title}`)
      .join('\n');
  }

  private async handleModelCommand(ctx: any, modelConfig: any, prompt: string): Promise<void> {
    if (!prompt) {
      ctx.reply(`Please provide a prompt. Usage: /${modelConfig.name} <your prompt>`);
      return;
    }

    log.info(`Generating with model ${modelConfig.name}: ${prompt}`);

    let responseCtx;
    try {
      responseCtx = await ctx.replyWithPhoto(Input.fromURL('https://arbius.ai/mining-icon.png'), {
        caption: `🔄 Processing with ${modelConfig.template.meta.title}...`,
      });
    } catch (e) {
      log.error(`Failed to send initial photo: ${e}`);
      ctx.reply(`🔄 Processing with ${modelConfig.template.meta.title}...`);
    }

    try {
      // Submit task and add to queue
      const { taskid, job } = await this.taskProcessor.submitAndQueueTask(
        modelConfig,
        { prompt },
        0n,
        { chatId: ctx.chat.id, messageId: responseCtx?.message_id }
      );

      const taskUrl = `https://arbius.ai/task/${taskid}`;

      // Update message with task URL
      if (responseCtx) {
        try {
          await this.bot.telegram.editMessageCaption(
            responseCtx.chat.id,
            responseCtx.message_id,
            undefined,
            `⏳ Task submitted: ${taskUrl}`
          );
        } catch (e) {
          log.error(`Failed to update message: ${e}`);
        }
      }

      // Wait for job to complete
      await this.waitForJobCompletion(job, ctx, responseCtx);
    } catch (err: any) {
      log.error(`Error in model command: ${err.message}`);
      ctx.reply(`❌ Failed to process request: ${err.message}`);
    }
  }

  private async handleSubmit(ctx: any): Promise<void> {
    const parts = ctx.message.text.split(' ');
    if (parts.length < 3) {
      ctx.reply('Usage: /submit <model> <prompt>');
      return;
    }

    const modelName = parts[1].toLowerCase();
    const prompt = parts.slice(2).join(' ');

    const modelConfig = this.modelRegistry.getModelByName(modelName);
    if (!modelConfig) {
      ctx.reply(`❌ Unknown model: ${modelName}\n\nAvailable models:\n${this.getModelList()}`);
      return;
    }

    try {
      ctx.reply('⏳ Submitting task...');

      const { taskid } = await this.taskProcessor.submitAndQueueTask(
        modelConfig,
        { prompt },
        0n
      );

      const taskUrl = `https://arbius.ai/task/${taskid}`;
      ctx.reply(
        `✅ Task submitted!\n\n` +
        `TaskID: \`${taskid}\`\n` +
        `Model: ${modelConfig.template.meta.title}\n` +
        `Prompt: "${prompt}"\n\n` +
        `View on Arbius: ${taskUrl}\n\n` +
        `Process later with:\n/process ${taskid}`,
        { parse_mode: 'Markdown' }
      );
    } catch (err: any) {
      log.error(`Error in /submit: ${err.message}`);
      ctx.reply(`❌ Failed to submit task: ${err.message}`);
    }
  }

  private async handleProcess(ctx: any): Promise<void> {
    const parts = ctx.message.text.split(' ');
    if (parts.length < 2) {
      ctx.reply('Usage: /process <taskid>');
      return;
    }

    const taskid = parts[1];

    try {
      // Check if already in queue
      let job = this.jobQueue.getJobByTaskId(taskid);
      if (job) {
        ctx.reply(`⏳ Task ${taskid} is already in the queue (status: ${job.status})`);
        return;
      }

      let responseCtx;
      try {
        responseCtx = await ctx.replyWithPhoto(Input.fromURL('https://arbius.ai/mining-icon.png'), {
          caption: `🔍 Looking up task ${taskid}...`,
        });
      } catch (e) {
        ctx.reply(`🔍 Looking up task ${taskid}...`);
      }

      // Fetch transaction to get model and input
      const txData = await this.blockchain.findTransactionByTaskId(taskid);
      if (!txData) {
        ctx.reply(`❌ Could not find task ${taskid}. It may be too old or not yet confirmed.`);
        return;
      }

      // Try to determine which model this is for (for now, default to first model)
      const models = this.modelRegistry.getAllModels();
      const modelConfig = models[0]; // TODO: extract model ID from transaction

      if (responseCtx) {
        try {
          await this.bot.telegram.editMessageCaption(
            responseCtx.chat.id,
            responseCtx.message_id,
            undefined,
            `⏳ Found task! Processing...`
          );
        } catch (e) {
          log.error(`Failed to update message: ${e}`);
        }
      }

      job = await this.taskProcessor.processExistingTask(taskid, modelConfig, {
        chatId: ctx.chat.id,
        messageId: responseCtx?.message_id,
      });

      await this.waitForJobCompletion(job, ctx, responseCtx);
    } catch (err: any) {
      log.error(`Error in /process: ${err.message}`);
      ctx.reply(`❌ Failed to process task: ${err.message}`);
    }
  }

  private async waitForJobCompletion(job: TaskJob, ctx: any, responseCtx?: any): Promise<void> {
    // Poll for job completion
    const maxWaitTime = 15 * 60 * 1000; // 15 minutes
    const pollInterval = 5000; // 5 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const currentJob = this.jobQueue.getJob(job.id);
      if (!currentJob) {
        log.warn(`Job ${job.id} disappeared from queue`);
        break;
      }

      if (currentJob.status === 'completed' && currentJob.cid) {
        await this.sendCompletedResult(ctx, responseCtx, currentJob);
        return;
      }

      if (currentJob.status === 'failed') {
        ctx.reply(`❌ Task failed: ${currentJob.error || 'Unknown error'}`);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    ctx.reply(`⏰ Task is taking longer than expected. Check back later with /queue`);
  }

  private async sendCompletedResult(ctx: any, responseCtx: any, job: TaskJob): Promise<void> {
    const outputType = job.modelConfig.template.output[0].type;
    const outputFilename = job.modelConfig.template.output[0].filename;
    const imageUrl = `https://ipfs.arbius.org/ipfs/${cidify(job.cid!)}/${outputFilename}`;

    log.info(`Task completed: ${imageUrl}`);

    try {
      // Verify the file is accessible
      await axios.get(imageUrl, { timeout: 30 * 1000 });

      if (outputType === 'image') {
        await ctx.replyWithPhoto(Input.fromURL(imageUrl), {
          caption: `✅ Task ${job.taskid} completed\nView: ${imageUrl}`,
        });
      } else if (outputType === 'text') {
        const response = await axios.get(imageUrl, { timeout: 30 * 1000 });
        const text = response.data;
        ctx.reply(`✅ Task ${job.taskid} completed\n\n${text.substring(0, 4000)}`);
      } else {
        ctx.reply(`✅ Task ${job.taskid} completed\nResult: ${imageUrl}`);
      }
    } catch (err) {
      log.error(`Failed to fetch result from IPFS: ${err}`);
      ctx.reply(`✅ Task completed but couldn't fetch result.\nIPFS: ${imageUrl}`);
    }
  }

  async launch(): Promise<void> {
    await this.bot.launch();
    this.startupTime = now();
    log.info('Telegram bot launched successfully');

    // Graceful shutdown
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));

    // Periodic cleanup of old jobs
    setInterval(() => {
      this.jobQueue.clearOldJobs(24 * 60 * 60 * 1000); // 24 hours
    }, 60 * 60 * 1000); // every hour
  }
}

async function main() {
  const configPath = process.argv[2] || 'MiningConfig.json';
  const modelsConfigPath = process.argv[3] || 'ModelsConfig.json';

  await initializeLogger('log.txt', 0);
  log.info('Kasumi-3 is starting...');

  // Load configuration
  const configLoader = new ConfigLoader(configPath);
  const miningConfig = configLoader.getMiningConfig();
  const modelsConfig = loadModelsConfig(modelsConfigPath);

  // Initialize IPFS
  await initializeIpfsClient(miningConfig);

  // Initialize blockchain service
  const blockchain = new BlockchainService(
    ConfigLoader.getEnvVar('RPC_URL'),
    ConfigLoader.getEnvVar('PRIVATE_KEY'),
    ConfigLoader.getEnvVar('ARBIUS_ADDRESS'),
    ConfigLoader.getEnvVar('ARBIUS_ROUTER_ADDRESS'),
    ConfigLoader.getEnvVar('TOKEN_ADDRESS')
  );

  // Perform startup checks
  log.info(`Wallet address: ${blockchain.getWalletAddress()}`);
  const balance = await blockchain.getBalance();
  log.info(`Balance: ${ethers.formatEther(balance)} AIUS`);

  const validatorMinimum = await blockchain.getValidatorMinimum();
  log.info(`Validator minimum: ${ethers.formatEther(validatorMinimum)} AIUS`);

  const validatorStaked = await blockchain.getValidatorStake();
  log.info(`Validator staked: ${ethers.formatEther(validatorStaked)} AIUS`);

  // Ensure approvals and staking
  await blockchain.ensureApproval();
  await blockchain.ensureValidatorStake();

  // Initialize model registry
  const modelRegistry = new ModelRegistry();
  modelRegistry.loadModelsFromConfig(modelsConfig.models);

  log.info(`Registered ${modelRegistry.getAllModels().length} models`);

  // Initialize job queue with processor callback
  const taskProcessor = new TaskProcessor(blockchain, miningConfig, null as any);
  const jobQueue = new JobQueue(3, async (job: TaskJob) => {
    try {
      await taskProcessor.processTask(job);
    } catch (err) {
      log.error(`Failed to process job ${job.id}: ${err}`);
    }
  });

  // Set the job queue in task processor
  (taskProcessor as any).jobQueue = jobQueue;

  // Initialize bot
  const bot = new Kasumi3Bot(
    ConfigLoader.getEnvVar('BOT_TOKEN'),
    blockchain,
    modelRegistry,
    jobQueue,
    taskProcessor,
    miningConfig
  );

  await bot.launch();
  log.info('Kasumi-3 is ready!');
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
