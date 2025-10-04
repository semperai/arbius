import * as dotenv from 'dotenv';
dotenv.config();

import { Telegraf, Input } from 'telegraf';
import { message } from 'telegraf/filters';
import { ethers } from 'ethers';
import axios from 'axios';

import { initializeLogger, log } from './log';
import { initializeIpfsClient } from './ipfs';
import { now, cidify, expretry } from './utils';
import { ConfigLoader, loadModelsConfig } from './config';
import { ModelRegistry } from './services/ModelRegistry';
import { BlockchainService } from './services/BlockchainService';
import { JobQueue } from './services/JobQueue';
import { TaskProcessor } from './services/TaskProcessor';
import { RateLimiter } from './services/RateLimiter';
import { HealthCheckServer } from './services/HealthCheckServer';
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
  private rateLimiter: RateLimiter;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private healthCheckServer: HealthCheckServer | null = null;

  constructor(
    botToken: string,
    blockchain: BlockchainService,
    modelRegistry: ModelRegistry,
    jobQueue: JobQueue,
    taskProcessor: TaskProcessor,
    miningConfig: any,
    rateLimitConfig?: { maxRequests: number; windowMs: number }
  ) {
    this.bot = new Telegraf(botToken);
    this.blockchain = blockchain;
    this.modelRegistry = modelRegistry;
    this.jobQueue = jobQueue;
    this.taskProcessor = taskProcessor;
    this.miningConfig = miningConfig;
    this.startupTime = now();
    this.rateLimiter = new RateLimiter(
      rateLimitConfig || {
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5'),
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Rate limiting middleware
    this.bot.use(async (ctx, next) => {
      const userId = ctx.from?.id;
      if (!userId) {
        return next();
      }

      if (!this.rateLimiter.checkLimit(userId)) {
        const resetTime = this.rateLimiter.getResetTime(userId);
        log.debug(`User ${userId} rate limited, ${resetTime}s until reset`);
        await ctx.reply(
          `⏱️ Rate limit exceeded. Please wait ${resetTime} seconds before trying again.\n\n` +
          `Limit: 5 requests per minute`
        );
        return;
      }

      return next();
    });
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
        `  /status - Show bot health and diagnostics\n` +
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

    this.bot.command('status', async ctx => {
      try {
        // Get blockchain info
        const address = this.blockchain.getWalletAddress();
        const arbiusBalance = await this.blockchain.getBalance();
        const ethBalance = await this.blockchain.getEthBalance();
        const validatorStaked = await this.blockchain.getValidatorStake();
        const validatorMinimum = await this.blockchain.getValidatorMinimum();

        // Get queue stats
        const queueStats = this.jobQueue.getQueueStats();

        // Get rate limiter stats
        const rateLimiterStats = this.rateLimiter.getStats();

        // Calculate uptime
        const uptimeSeconds = now() - this.startupTime;
        const uptimeMinutes = Math.floor(uptimeSeconds / 60);
        const uptimeHours = Math.floor(uptimeMinutes / 60);

        // Check health indicators
        const hasEnoughGas = ethBalance > ethers.parseEther('0.01'); // 0.01 ETH minimum
        const hasEnoughAius = arbiusBalance > ethers.parseEther('1'); // 1 AIUS minimum
        const isStakedEnough = validatorStaked >= validatorMinimum;
        const queueHealthy = queueStats.processing < 10; // Less than 10 processing

        const healthStatus = hasEnoughGas && hasEnoughAius && isStakedEnough && queueHealthy
          ? '✅ Healthy'
          : '⚠️ Needs Attention';

        const warnings = [];
        if (!hasEnoughGas) warnings.push('⚠️ Low ETH (need gas for transactions)');
        if (!hasEnoughAius) warnings.push('⚠️ Low AIUS balance');
        if (!isStakedEnough) warnings.push('⚠️ Not staked enough for validation');
        if (!queueHealthy) warnings.push('⚠️ High queue processing load');

        const warningsText = warnings.length > 0 ? '\n\n' + warnings.join('\n') : '';

        ctx.reply(
          `🔍 Kasumi-3 Status\n\n` +
          `${healthStatus}\n\n` +
          `**Wallet**\n` +
          `Address: \`${address.slice(0, 10)}...${address.slice(-8)}\`\n` +
          `AIUS: ${ethers.formatEther(arbiusBalance)} ${hasEnoughAius ? '✅' : '⚠️'}\n` +
          `ETH: ${ethers.formatEther(ethBalance)} ${hasEnoughGas ? '✅' : '⚠️'}\n` +
          `Staked: ${ethers.formatEther(validatorStaked)} / ${ethers.formatEther(validatorMinimum)} ${isStakedEnough ? '✅' : '⚠️'}\n\n` +
          `**Job Queue**\n` +
          `Total: ${queueStats.total}\n` +
          `Pending: ${queueStats.pending}\n` +
          `Processing: ${queueStats.processing} ${queueHealthy ? '✅' : '⚠️'}\n` +
          `Completed: ${queueStats.completed}\n` +
          `Failed: ${queueStats.failed}\n\n` +
          `**System**\n` +
          `Uptime: ${uptimeHours}h ${uptimeMinutes % 60}m\n` +
          `Active Users: ${rateLimiterStats.activeUsers}\n` +
          `Models: ${this.modelRegistry.getAllModels().length}\n` +
          `Rate Limit: ${rateLimiterStats.config.maxRequests} req/${rateLimiterStats.config.windowMs / 1000}s` +
          warningsText,
          { parse_mode: 'Markdown' }
        );
      } catch (err: any) {
        log.error(`Error in /status command: ${err.message}`);
        ctx.reply('❌ Failed to fetch status');
      }
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
      log.debug(`Failed to send initial photo, using text fallback: ${e}`);
      responseCtx = await ctx.reply(`🔄 Processing with ${modelConfig.template.meta.title}...`);
    }

    try {
      // Submit task and add to queue
      const { taskid, job } = await this.taskProcessor.submitAndQueueTask(
        modelConfig,
        { prompt },
        0n,
        {
          chatId: ctx.chat.id,
          messageId: responseCtx?.message_id,
          telegramId: ctx.from?.id
        }
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
          log.warn(`Failed to update message caption: ${e}`);
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

      // Find the model by ID extracted from transaction
      const modelConfig = this.modelRegistry.getModelById(txData.modelId);
      if (!modelConfig) {
        ctx.reply(`❌ Unknown model ID: ${txData.modelId}. This model is not registered.`);
        return;
      }

      if (responseCtx) {
        try {
          await this.bot.telegram.editMessageCaption(
            responseCtx.chat.id,
            responseCtx.message_id,
            undefined,
            `⏳ Found task! Processing...`
          );
        } catch (e) {
          log.warn(`Failed to update message caption: ${e}`);
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
    const maxWaitTime = parseInt(process.env.JOB_WAIT_TIMEOUT_MS || '900000'); // 15 minutes default

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        cleanup();
        ctx.reply(`⏰ Task is taking longer than expected. Check back later with /queue`);
        resolve();
      }, maxWaitTime);

      const onStatusChange = async (updatedJob: TaskJob) => {
        if (updatedJob.id !== job.id) return;

        if (updatedJob.status === 'completed' && updatedJob.cid) {
          cleanup();
          await this.sendCompletedResult(ctx, responseCtx, updatedJob);
          resolve();
        } else if (updatedJob.status === 'failed') {
          cleanup();
          ctx.reply(`❌ Task failed: ${updatedJob.error || 'Unknown error'}`);
          resolve();
        }
      };

      const cleanup = () => {
        clearTimeout(timeout);
        this.jobQueue.off('jobStatusChange', onStatusChange);
      };

      this.jobQueue.on('jobStatusChange', onStatusChange);

      // Check if job is already completed (race condition)
      const currentJob = this.jobQueue.getJob(job.id);
      if (currentJob) {
        if (currentJob.status === 'completed' && currentJob.cid) {
          cleanup();
          this.sendCompletedResult(ctx, responseCtx, currentJob).then(resolve);
        } else if (currentJob.status === 'failed') {
          cleanup();
          ctx.reply(`❌ Task failed: ${currentJob.error || 'Unknown error'}`);
          resolve();
        }
      }
    });
  }

  private async sendCompletedResult(ctx: any, responseCtx: any, job: TaskJob): Promise<void> {
    const outputType = job.modelConfig.template.output[0].type;
    const outputFilename = job.modelConfig.template.output[0].filename;
    const fileUrl = `https://ipfs.arbius.org/ipfs/${cidify(job.cid!)}/${outputFilename}`;

    log.info(`Task completed: ${fileUrl}`);

    try {
      // Verify the file is accessible with retry logic
      const verifyFile = async () => {
        const response = await axios.get(fileUrl, { timeout: 60 * 1000 });
        return response;
      };

      const fileResponse = await expretry('verifyIPFSFile', verifyFile, 3, 2);

      if (!fileResponse) {
        throw new Error('Failed to verify file accessibility after retries');
      }

      const caption = `✅ Task ${job.taskid} completed\nView: ${fileUrl}`;

      if (outputType === 'image') {
        await ctx.replyWithPhoto(Input.fromURL(fileUrl), { caption });
      } else if (outputType === 'video') {
        await ctx.replyWithVideo(Input.fromURL(fileUrl), { caption });
      } else if (outputType === 'audio') {
        await ctx.replyWithAudio(Input.fromURL(fileUrl), { caption });
      } else if (outputType === 'text') {
        const text = fileResponse.data;
        ctx.reply(`✅ Task ${job.taskid} completed\n\n${text.substring(0, 4000)}`);
      } else {
        // Unknown type - send as document
        await ctx.replyWithDocument(Input.fromURL(fileUrl), { caption });
      }
    } catch (err: any) {
      log.error(`Failed to send result via Telegram: ${err.message}`);
      // Fallback to link if Telegram upload fails
      ctx.reply(`✅ Task completed but couldn't upload to Telegram.\n\nDownload: ${fileUrl}`);
    }
  }

  async launch(): Promise<void> {
    await this.bot.launch();
    this.startupTime = now();
    log.info('Telegram bot launched successfully');

    // Start health check server if port is configured
    const healthCheckPort = parseInt(process.env.HEALTH_CHECK_PORT || '0');
    if (healthCheckPort > 0) {
      this.healthCheckServer = new HealthCheckServer(
        healthCheckPort,
        this.blockchain,
        this.jobQueue,
        this.startupTime
      );
      await this.healthCheckServer.start();
    }

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      log.info(`Received ${signal}, shutting down gracefully...`);
      await this.shutdown();
      this.bot.stop(signal);
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));

    // Periodic cleanup of old jobs
    this.cleanupInterval = setInterval(() => {
      this.jobQueue.clearOldJobs(24 * 60 * 60 * 1000); // 24 hours
    }, 60 * 60 * 1000); // every hour
  }

  async shutdown(): Promise<void> {
    log.info('Shutting down bot services...');

    // Shutdown health check server
    if (this.healthCheckServer) {
      await this.healthCheckServer.shutdown();
      this.healthCheckServer = null;
    }

    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Shutdown job queue
    this.jobQueue.shutdown();

    // Shutdown rate limiter
    this.rateLimiter.shutdown();

    log.info('Bot services shut down successfully');
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
  const maxConcurrent = parseInt(process.env.JOB_MAX_CONCURRENT || '3');
  const jobTimeoutMs = parseInt(process.env.JOB_TIMEOUT_MS || '900000');

  const taskProcessor = new TaskProcessor(blockchain, miningConfig, null as any);
  const jobQueue = new JobQueue(maxConcurrent, async (job: TaskJob) => {
    try {
      await taskProcessor.processTask(job);
    } catch (err: any) {
      log.error(`Failed to process job ${job.id}: ${err.message}`);
    }
  }, jobTimeoutMs);

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
