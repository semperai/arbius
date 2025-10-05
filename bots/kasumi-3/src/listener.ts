import * as dotenv from 'dotenv';
dotenv.config();

import { ethers } from 'ethers';
import { initializeLogger, log } from './log';
import { initializeIpfsClient } from './ipfs';
import { ConfigLoader, loadModelsConfig } from './config';
import { ModelRegistry } from './services/ModelRegistry';
import { BlockchainService } from './services/BlockchainService';
import { JobQueue } from './services/JobQueue';
import { TaskProcessor } from './services/TaskProcessor';
import { TaskJob } from './types';

/**
 * Kasumi-3 Listener - Listens for TaskSubmitted events and processes them
 */
class Kasumi3Listener {
  private blockchain: BlockchainService;
  private modelRegistry: ModelRegistry;
  private jobQueue: JobQueue;
  private taskProcessor: TaskProcessor;
  private miningConfig: any;

  constructor(
    blockchain: BlockchainService,
    modelRegistry: ModelRegistry,
    jobQueue: JobQueue,
    taskProcessor: TaskProcessor,
    miningConfig: any
  ) {
    this.blockchain = blockchain;
    this.modelRegistry = modelRegistry;
    this.jobQueue = jobQueue;
    this.taskProcessor = taskProcessor;
    this.miningConfig = miningConfig;
  }

  async start(): Promise<void> {
    const contract = this.blockchain.getArbiusContract();

    log.info('Starting event listener...');

    // Listen for TaskSubmitted events for all registered models
    const models = this.modelRegistry.getAllModels();
    log.info(`Listening for ${models.length} models`);

    contract.on('TaskSubmitted', async (taskid, modelId, fee, sender, event) => {
      try {
        await this.handleTaskSubmitted(taskid, modelId, fee, sender, event);
      } catch (err: any) {
        log.error(`Error handling TaskSubmitted event: ${err.message}`);
      }
    });

    log.info('Event listener started successfully');
  }

  private async handleTaskSubmitted(
    taskid: string,
    modelId: string,
    fee: bigint,
    sender: string,
    event: any
  ): Promise<void> {
    log.info(`Task ${taskid} submitted by ${sender} for model ${modelId}`);

    // Check if we support this model
    const modelConfig = this.modelRegistry.getModelById(modelId);
    if (!modelConfig) {
      log.debug(`Ignoring task ${taskid} - unsupported model ${modelId}`);
      return;
    }

    // Check if already in queue
    if (this.jobQueue.getJobByTaskId(taskid)) {
      log.warn(`Task ${taskid} already in queue, skipping`);
      return;
    }

    // Wait a bit to allow the transaction to be confirmed
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
      // Fetch transaction to get input data
      const txHash = event.log.transactionHash;
      const tx = await this.blockchain.getProvider().getTransaction(txHash);

      if (!tx) {
        log.error(`Could not fetch transaction ${txHash}`);
        return;
      }

      // Parse transaction to get input
      const contract = this.blockchain.getArbiusContract();
      const parsed = contract.interface.parseTransaction({ data: tx.data });

      if (!parsed) {
        log.error(`Could not parse transaction ${txHash}`);
        return;
      }

      let input: Record<string, any>;
      try {
        const inputStr = Buffer.from(parsed.args.input_.substring(2), 'hex').toString();
        input = JSON.parse(inputStr);
      } catch (e) {
        log.error(`Failed to parse task input for ${taskid}: ${e}`);
        return;
      }

      log.info(`Processing task ${taskid} with model ${modelConfig.name}`);

      // Add to queue
      await this.jobQueue.addJob({
        taskid,
        modelConfig,
        input,
      });

      log.info(`Task ${taskid} added to queue`);
    } catch (err: any) {
      log.error(`Failed to process TaskSubmitted event for ${taskid}: ${err.message}`);
    }
  }
}

async function main() {
  const configPath = process.argv[2] || 'MiningConfig.json';
  const modelsConfigPath = process.argv[3] || 'ModelsConfig.json';

  await initializeLogger('log.txt', 0);
  log.info('Kasumi-3 Listener is starting...');

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

  // Initialize job queue and task processor
  const jobQueue = new JobQueue(3); // max 3 concurrent jobs
  const taskProcessor = new TaskProcessor(blockchain, miningConfig, jobQueue);

  // Set up job processor
  const queueWithProcessor = new JobQueue(3, async (job: TaskJob) => {
    try {
      await taskProcessor.processTask(job);
    } catch (err: any) {
      log.error(`Failed to process job ${job.id}: ${err.message}`);
    }
  });

  // Initialize and start listener
  const listener = new Kasumi3Listener(
    blockchain,
    modelRegistry,
    queueWithProcessor,
    taskProcessor,
    miningConfig
  );

  await listener.start();

  // Periodic cleanup of old jobs
  setInterval(() => {
    queueWithProcessor.clearOldJobs(24 * 60 * 60 * 1000); // 24 hours
  }, 60 * 60 * 1000); // every hour

  log.info('Kasumi-3 Listener is ready!');
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
