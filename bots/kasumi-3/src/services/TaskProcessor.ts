import { TaskJob, MiningConfig, ModelConfig } from '../types';
import { BlockchainService } from './BlockchainService';
import { ModelHandlerFactory } from './ModelHandler';
import { JobQueue } from './JobQueue';
import { UserService } from './UserService';
import { GasAccountingService } from './GasAccountingService';
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
  private userService?: UserService;
  private gasAccounting?: GasAccountingService;

  constructor(
    blockchain: BlockchainService,
    miningConfig: MiningConfig,
    jobQueue: JobQueue,
    userService?: UserService,
    gasAccounting?: GasAccountingService
  ) {
    this.blockchain = blockchain;
    this.miningConfig = miningConfig;
    this.jobQueue = jobQueue;
    this.userService = userService;
    this.gasAccounting = gasAccounting;
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

      // Refund user if payment system is enabled
      if (this.userService) {
        const refunded = this.userService.refundTask(job.taskid);
        if (refunded) {
          log.info(`Refunded user for failed task ${job.taskid}`);
        }
      }

      throw error;
    }
  }

  /**
   * Refund a task (can be called manually for admin refunds)
   */
  refundTask(taskid: string): boolean {
    if (!this.userService) {
      log.warn('Cannot refund task: UserService not configured');
      return false;
    }

    return this.userService.refundTask(taskid);
  }

  /**
   * Submit a new task to the blockchain and add to queue
   * If userService is configured, charges the user's balance
   */
  async submitAndQueueTask(
    modelConfig: ModelConfig,
    input: Record<string, any>,
    additionalFee: bigint = 0n,
    metadata?: { chatId?: number; messageId?: number; telegramId?: number }
  ): Promise<{ taskid: string; job: TaskJob; estimatedCost?: bigint }> {
    log.info(`Submitting task for model ${modelConfig.name}`);

    let estimatedGasCost: bigint | undefined;
    let estimatedTotal: bigint | undefined;

    // If payment system is enabled, check balance and estimate costs
    if (this.userService && this.gasAccounting && metadata?.telegramId) {
      const telegramId = metadata.telegramId;

      // Get model fee from blockchain
      const model = await this.blockchain.getArbiusContract().models(modelConfig.id);
      const modelFee = model.fee + additionalFee;

      // Estimate gas cost for submitTask transaction
      const gasEstimate = 200_000n; // Approximate gas for submitTask
      estimatedGasCost = await this.gasAccounting.estimateGasCostInAius(
        gasEstimate,
        this.blockchain.getProvider()
      );

      estimatedTotal = modelFee + estimatedGasCost;

      // Check if user has sufficient balance
      const balance = this.userService.getBalance(telegramId);

      if (balance < estimatedTotal) {
        throw new Error(
          `Insufficient balance. Need ${ethers.formatEther(estimatedTotal)} AIUS ` +
          `(${ethers.formatEther(modelFee)} model fee + ${ethers.formatEther(estimatedGasCost)} estimated gas), ` +
          `but only have ${ethers.formatEther(balance)} AIUS`
        );
      }

      log.info(
        `User ${telegramId} balance check: ${ethers.formatEther(balance)} AIUS >= ` +
        `${ethers.formatEther(estimatedTotal)} AIUS (estimated)`
      );
    }

    // Submit task to blockchain
    const inputStr = JSON.stringify(input);
    const taskid = await this.blockchain.submitTask(modelConfig.id, inputStr, additionalFee);

    log.info(`Task submitted with ID: ${taskid}`);

    // If payment system enabled, charge user after successful submission
    if (this.userService && this.gasAccounting && metadata?.telegramId) {
      const telegramId = metadata.telegramId;

      // Get transaction receipt to calculate actual gas cost
      const txData = await this.blockchain.findTransactionByTaskId(taskid);
      if (txData?.txHash) {
        const receipt = await this.blockchain.getProvider().getTransactionReceipt(txData.txHash);
        if (receipt) {
          const gasData = await this.gasAccounting.calculateGasCostInAius(receipt);

          // Get model fee
          const model = await this.blockchain.getArbiusContract().models(modelConfig.id);
          const modelFee = model.fee + additionalFee;

          // Total cost = model fee + gas cost
          const totalCost = modelFee + gasData.gasCostAius;

          // Debit user balance
          const success = this.userService.debitBalance(
            telegramId,
            totalCost,
            taskid,
            gasData.gasCostAius,
            Number(gasData.gasUsed),
            gasData.gasPrice,
            gasData.aiusPerEth,
            txData.txHash
          );

          if (!success) {
            log.error(`Failed to debit user ${telegramId} after task submission!`);
            // Task is already submitted, so we continue but log the error
          } else {
            log.info(
              `Charged user ${telegramId}: ${ethers.formatEther(totalCost)} AIUS ` +
              `(${ethers.formatEther(modelFee)} model + ${ethers.formatEther(gasData.gasCostAius)} gas)`
            );
          }
        }
      }
    }

    // Add to job queue
    const job = await this.jobQueue.addJob({
      taskid,
      modelConfig,
      input,
      chatId: metadata?.chatId,
      messageId: metadata?.messageId,
    });

    return { taskid, job, estimatedCost: estimatedTotal };
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
