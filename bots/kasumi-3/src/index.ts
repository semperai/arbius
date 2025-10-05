import * as dotenv from 'dotenv';
dotenv.config();

import { Telegraf } from 'telegraf';
import { ethers } from 'ethers';

import { initializeLogger, log } from './log';
import { initializeIpfsClient } from './ipfs';
import { ConfigLoader, loadModelsConfig } from './config';
import { ModelRegistry } from './services/ModelRegistry';
import { BlockchainService } from './services/BlockchainService';
import { JobQueue } from './services/JobQueue';
import { TaskProcessor } from './services/TaskProcessor';
import { TaskJob } from './types';
import { initializePaymentSystem } from './initPaymentSystem';
import { JOB_QUEUE, TIMEOUTS } from './constants';
import { Kasumi3Bot } from './bot/Kasumi3Bot';
import * as path from 'path';

/**
 * Main entry point for Kasumi-3 Bot
 */
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
  const maxConcurrent = parseInt(process.env.JOB_MAX_CONCURRENT || String(JOB_QUEUE.MAX_CONCURRENT_DEFAULT));
  const jobTimeoutMs = parseInt(process.env.JOB_TIMEOUT_MS || String(TIMEOUTS.JOB_PROCESSING));

  // Initialize bot first (needed for payment system)
  const bot = new Telegraf(ConfigLoader.getEnvVar('BOT_TOKEN'));

  // Initialize payment system
  const paymentSystem = initializePaymentSystem({
    dbPath: path.join(__dirname, '../data/kasumi3.db'),
    ethMainnetRpc: process.env.ETH_MAINNET_RPC || 'https://eth.llamarpc.com',
    botWalletAddress: blockchain.getWalletAddress(),
    tokenAddress: ConfigLoader.getEnvVar('TOKEN_ADDRESS'),
    adminTelegramIds: process.env.ADMIN_TELEGRAM_IDS?.split(',').map(Number) || [],
  }, bot, blockchain);

  // Start deposit monitoring
  await paymentSystem.depositMonitor.start();

  const taskProcessor = new TaskProcessor(
    blockchain,
    miningConfig,
    null as any,
    paymentSystem.userService,
    paymentSystem.gasAccounting
  );
  const jobQueue = new JobQueue(maxConcurrent, async (job: TaskJob) => {
    try {
      await taskProcessor.processTask(job);
    } catch (err: any) {
      log.error(`Failed to process job ${job.id}: ${err.message}`);
    }
  }, jobTimeoutMs);

  // Set the job queue in task processor
  (taskProcessor as any).jobQueue = jobQueue;

  // Initialize bot wrapper with payment system
  const kasumiBot = new Kasumi3Bot(
    bot,
    blockchain,
    modelRegistry,
    jobQueue,
    taskProcessor,
    miningConfig,
    paymentSystem.userService
  );

  await kasumiBot.launch();
  log.info('Kasumi-3 is ready!');
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
