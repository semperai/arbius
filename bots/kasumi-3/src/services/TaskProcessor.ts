import { TaskJob, MiningConfig, ModelConfig } from '../types';
import { BlockchainService } from './BlockchainService';
import { ModelHandlerFactory } from './ModelHandler';
import { JobQueue } from './JobQueue';
import { UserService } from './UserService';
import { GasAccountingService } from './GasAccountingService';
import { REWARDS, GAS_ESTIMATION } from '../constants';
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
      this.jobQueue.updateJobStatus(job.id, 'processing', { progress: 'Checking blockchain...' });
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
      this.jobQueue.updateJobStatus(job.id, 'processing', { progress: 'Generating output...' });
      const cid = await handler.getCid(job.taskid, job.input);

      if (!cid) {
        throw new Error('Failed to generate CID');
      }

      log.info(`Generated CID ${cid} for task ${job.taskid}`);

      // Check again if someone else solved it while we were processing
      this.jobQueue.updateJobStatus(job.id, 'processing', { progress: 'Verifying solution...' });
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
      this.jobQueue.updateJobStatus(job.id, 'processing', { progress: 'Submitting commitment...' });
      await this.blockchain.submitSolution(job.taskid, cid);

      // Pin input to IPFS for reference
      this.jobQueue.updateJobStatus(job.id, 'processing', { progress: 'Uploading to IPFS...' });
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

      // Random reward system: 1 in X chance to win reward
      if (this.userService && job.chatId) {
        const rewardChance = parseInt(process.env.REWARD_CHANCE || String(REWARDS.CHANCE_DEFAULT));
        const rewardAmount = ethers.parseEther(process.env.REWARD_AMOUNT || REWARDS.AMOUNT_DEFAULT);

        const randomNum = Math.floor(Math.random() * rewardChance);
        if (randomNum === 0) {
          // Winner!
          const telegramId = (job as any).telegramId;
          if (telegramId) {
            const success = this.userService.adminCredit(
              telegramId,
              rewardAmount,
              `Lucky reward for task ${job.taskid}`
            );
            if (success) {
              log.info(`🎉 User ${telegramId} won ${ethers.formatEther(rewardAmount)} AIUS reward!`);
              this.jobQueue.updateJobStatus(job.id, 'completed', { cid, wonReward: true });
            }
          }
        }
      }
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
   * @param taskid - The task ID to refund
   * @returns true if refund was successful, false otherwise
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
   * @param modelConfig - The model configuration to use
   * @param input - Input parameters for the model
   * @param additionalFee - Additional fee to pay (default: 0)
   * @param metadata - Optional metadata (chatId, messageId, telegramId)
   * @returns Object containing taskid, job, and estimated cost
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
    let reservationId: string | null = null;

    // If payment system is enabled, reserve balance BEFORE blockchain submission
    if (this.userService && this.gasAccounting && metadata?.telegramId) {
      const telegramId = metadata.telegramId;

      // Get model fee from blockchain
      const model = await this.blockchain.getArbiusContract().models(modelConfig.id);
      const modelFee = model.fee + additionalFee;

      // Estimate gas cost for submitTask transaction
      estimatedGasCost = await this.gasAccounting.estimateGasCostInAius(
        GAS_ESTIMATION.SUBMIT_TASK_ESTIMATE,
        this.blockchain.getProvider()
      );

      estimatedTotal = modelFee + estimatedGasCost;

      // Type guard to ensure estimatedTotal is defined
      if (!estimatedTotal) {
        throw new Error('Failed to estimate total transaction cost');
      }

      // Reserve balance BEFORE submitting to blockchain
      // Reservation expires after configured timeout (enough time for blockchain tx)
      reservationId = this.userService.reserveBalance(telegramId, estimatedTotal, GAS_ESTIMATION.RESERVATION_TIMEOUT_MS);

      if (!reservationId) {
        const availableBalance = this.userService.getAvailableBalance(telegramId);
        throw new Error(
          `Insufficient balance. Need ${ethers.formatEther(estimatedTotal)} AIUS ` +
          `(${ethers.formatEther(modelFee)} model fee + ${ethers.formatEther(estimatedGasCost)} estimated gas), ` +
          `but only have ${ethers.formatEther(availableBalance)} AIUS available`
        );
      }

      log.info(
        `Reserved ${ethers.formatEther(estimatedTotal)} AIUS for user ${telegramId} ` +
        `(reservation: ${reservationId})`
      );
    }

    let taskid: string;

    try {
      // Submit task to blockchain
      const inputStr = JSON.stringify(input);
      taskid = await this.blockchain.submitTask(modelConfig.id, inputStr, additionalFee);

      log.info(`Task submitted with ID: ${taskid}`);
    } catch (error: any) {
      // Cancel reservation if blockchain submission fails
      if (reservationId && this.userService) {
        this.userService.cancelReservation(reservationId);
        log.info(`Cancelled reservation ${reservationId} due to blockchain submission failure`);
      }
      throw error;
    }

    // If payment system enabled, finalize the reservation with actual cost
    if (this.userService && this.gasAccounting && metadata?.telegramId && reservationId) {
      const telegramId = metadata.telegramId;

      try {
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

            // Finalize reservation with actual cost
            const success = this.userService.finalizeReservation(
              reservationId,
              totalCost,
              taskid,
              gasData.gasCostAius,
              Number(gasData.gasUsed),
              gasData.gasPrice,
              gasData.aiusPerEth,
              txData.txHash
            );

            if (!success) {
              log.error(
                `Failed to finalize reservation ${reservationId} for user ${telegramId}! ` +
                `Task ${taskid} was submitted but payment failed. Manual intervention required.`
              );
            } else {
              log.info(
                `Charged user ${telegramId}: ${ethers.formatEther(totalCost)} AIUS ` +
                `(${ethers.formatEther(modelFee)} model + ${ethers.formatEther(gasData.gasCostAius)} gas)`
              );
            }
          } else {
            log.error(`Could not get receipt for task ${taskid}, cancelling reservation`);
            this.userService.cancelReservation(reservationId);
          }
        } else {
          log.error(`Could not find transaction for task ${taskid}, cancelling reservation`);
          this.userService.cancelReservation(reservationId);
        }
      } catch (error: any) {
        log.error(`Error finalizing payment for task ${taskid}: ${error.message}`);
        // Keep reservation in place - it will expire automatically
      }
    }

    // Add to job queue
    const job = await this.jobQueue.addJob({
      taskid,
      modelConfig,
      input,
      chatId: metadata?.chatId,
      messageId: metadata?.messageId,
      telegramId: metadata?.telegramId,
    });

    return { taskid, job, estimatedCost: estimatedTotal };
  }

  /**
   * Process an existing task by taskid
   * @param taskid - The task ID to process
   * @param modelConfig - The model configuration to use
   * @param metadata - Optional metadata (chatId, messageId)
   * @returns The created job
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
