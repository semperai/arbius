import { TaskJob, MiningConfig, ModelConfig } from '../types';
import { BlockchainService } from './BlockchainService';
import { ModelHandlerFactory } from './ModelHandler';
import { JobQueue } from './JobQueue';
import { log } from '../log';
import { pinFileToIPFS } from '../ipfs';
import { expretry } from '../utils';
import { ethers } from 'ethers';

/**
 * Processes tasks from the job queue
 */
export class TaskProcessor {
  private blockchain: BlockchainService;
  private miningConfig: MiningConfig;
  private jobQueue: JobQueue;

  constructor(
    blockchain: BlockchainService,
    miningConfig: MiningConfig,
    jobQueue: JobQueue
  ) {
    this.blockchain = blockchain;
    this.miningConfig = miningConfig;
    this.jobQueue = jobQueue;
  }

  /**
   * Process a single task job
   */
  async processTask(job: TaskJob): Promise<void> {
    log.info(`Processing task ${job.taskid} with model ${job.modelConfig.name}`);

    try {
      // Check if already solved
      const existingSolution = await this.blockchain.getSolution(job.taskid);
      if (existingSolution.validator !== ethers.ZeroAddress) {
        if (existingSolution.cid) {
          log.info(`Task ${job.taskid} already solved with CID ${existingSolution.cid}`);
          this.jobQueue.updateJobStatus(job.id, 'completed', { cid: existingSolution.cid });
          return;
        }
      }

      // Create model handler
      const handler = ModelHandlerFactory.createHandler(job.modelConfig, this.miningConfig);

      // Generate output and get CID
      log.debug(`Generating output for task ${job.taskid}`);
      const cid = await handler.getCid(job.taskid, job.input);

      if (!cid) {
        throw new Error('Failed to generate CID');
      }

      log.info(`Generated CID ${cid} for task ${job.taskid}`);

      // Check again if someone else solved it while we were processing
      const solutionCheck = await this.blockchain.getSolution(job.taskid);
      if (solutionCheck.validator !== ethers.ZeroAddress) {
        if (solutionCheck.cid !== cid) {
          log.warn(`Task ${job.taskid} was solved by another validator with different CID`);
          this.jobQueue.updateJobStatus(job.id, 'failed', {
            error: 'Task solved by another validator',
            cid,
          });
          return;
        } else {
          log.info(`Task ${job.taskid} was solved by another validator with same CID`);
          this.jobQueue.updateJobStatus(job.id, 'completed', { cid });
          return;
        }
      }

      // Submit solution to blockchain
      log.debug(`Submitting solution for task ${job.taskid}`);
      await this.blockchain.submitSolution(job.taskid, cid);

      // Pin input to IPFS for reference
      const inputStr = JSON.stringify(job.input);
      expretry('pinInputToIPFS', async () =>
        await pinFileToIPFS(
          this.miningConfig,
          Buffer.from(inputStr, 'utf-8'),
          `task-${job.taskid}.json`
        )
      ).then(inputCid => {
        if (inputCid) {
          log.debug(`Task input ${job.taskid} pinned with ${inputCid}`);
        }
      });

      log.info(`Successfully processed task ${job.taskid}`);
      this.jobQueue.updateJobStatus(job.id, 'completed', { cid });
    } catch (error: any) {
      log.error(`Failed to process task ${job.taskid}: ${error.message}`);
      this.jobQueue.updateJobStatus(job.id, 'failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Submit a new task to the blockchain and add to queue
   */
  async submitAndQueueTask(
    modelConfig: ModelConfig,
    input: Record<string, any>,
    additionalFee: bigint = 0n,
    metadata?: { chatId?: number; messageId?: number }
  ): Promise<{ taskid: string; job: TaskJob }> {
    log.info(`Submitting task for model ${modelConfig.name}`);

    // Submit task to blockchain
    const inputStr = JSON.stringify(input);
    const taskid = await this.blockchain.submitTask(modelConfig.id, inputStr, additionalFee);

    log.info(`Task submitted with ID: ${taskid}`);

    // Add to job queue
    const job = await this.jobQueue.addJob({
      taskid,
      modelConfig,
      input,
      chatId: metadata?.chatId,
      messageId: metadata?.messageId,
    });

    return { taskid, job };
  }

  /**
   * Process an existing task by taskid
   */
  async processExistingTask(
    taskid: string,
    modelConfig: ModelConfig,
    metadata?: { chatId?: number; messageId?: number }
  ): Promise<TaskJob> {
    log.info(`Processing existing task ${taskid}`);

    // Try to fetch input from blockchain
    const txData = await this.blockchain.findTransactionByTaskId(taskid);
    if (!txData) {
      throw new Error(`Could not find transaction data for task ${taskid}`);
    }

    const input = { prompt: txData.prompt };

    // Add to job queue
    const job = await this.jobQueue.addJob({
      taskid,
      modelConfig,
      input,
      chatId: metadata?.chatId,
      messageId: metadata?.messageId,
    });

    return job;
  }
}
