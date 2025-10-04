import { Contract, ethers } from 'ethers';
import { DatabaseService } from './DatabaseService';
import { UserService } from './UserService';
import { log } from '../log';
import ERC20Abi from '../abis/erc20.json';

/**
 * Monitors AIUS token transfers to bot wallet and credits user balances
 */
export class DepositMonitor {
  private provider: ethers.FallbackProvider;
  private tokenContract: Contract;
  private userService: UserService;
  private botWalletAddress: string;
  private isRunning: boolean = false;
  private pollInterval: number;
  private lastProcessedBlock: number = 0;

  constructor(
    provider: ethers.FallbackProvider,
    tokenAddress: string,
    botWalletAddress: string,
    userService: UserService,
    pollInterval: number = 12000 // 12 seconds (Arbitrum block time)
  ) {
    this.provider = provider;
    this.tokenContract = new Contract(tokenAddress, ERC20Abi, provider);
    this.botWalletAddress = botWalletAddress;
    this.userService = userService;
    this.pollInterval = pollInterval;
  }

  /**
   * Start monitoring deposits
   */
  async start(fromBlock?: number): Promise<void> {
    if (this.isRunning) {
      log.warn('DepositMonitor already running');
      return;
    }

    this.isRunning = true;

    // Get starting block
    if (fromBlock) {
      this.lastProcessedBlock = fromBlock;
    } else {
      this.lastProcessedBlock = await this.provider.getBlockNumber();
    }

    log.info(
      `DepositMonitor started, watching for transfers to ${this.botWalletAddress} ` +
      `from block ${this.lastProcessedBlock}`
    );

    // Start polling
    this.poll();
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.isRunning = false;
    log.info('DepositMonitor stopped');
  }

  /**
   * Poll for new deposits
   */
  private async poll(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.checkForDeposits();
      } catch (error: any) {
        log.error(`DepositMonitor error: ${error.message}`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, this.pollInterval));
    }
  }

  /**
   * Check for new deposits in recent blocks
   */
  private async checkForDeposits(): Promise<void> {
    try {
      const currentBlock = await this.provider.getBlockNumber();

      // Skip if no new blocks
      if (currentBlock <= this.lastProcessedBlock) {
        return;
      }

      // Query transfer events
      const filter = this.tokenContract.filters.Transfer(null, this.botWalletAddress);
      const events = await this.tokenContract.queryFilter(
        filter,
        this.lastProcessedBlock + 1,
        currentBlock
      );

      if (events.length > 0) {
        log.info(`Found ${events.length} deposit(s) in blocks ${this.lastProcessedBlock + 1}-${currentBlock}`);
      }

      // Process each deposit
      for (const event of events) {
        await this.processDeposit(event);
      }

      this.lastProcessedBlock = currentBlock;
    } catch (error: any) {
      log.error(`Failed to check deposits: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process a single deposit event
   */
  private async processDeposit(event: any): Promise<void> {
    try {
      const from = event.args[0];
      const to = event.args[1];
      const amount = event.args[2] as bigint;
      const txHash = event.transactionHash;
      const blockNumber = event.blockNumber;

      log.info(
        `Deposit detected: ${ethers.formatEther(amount)} AIUS from ${from} ` +
        `(tx: ${txHash}, block: ${blockNumber})`
      );

      // Check if already processed (check both regular transactions and unclaimed deposits)
      const db = (this.userService as any).db;
      if (db.depositExists(txHash)) {
        log.debug(`Deposit ${txHash} already processed, skipping`);
        return;
      }

      // Find user by wallet address
      const user = this.userService.getUserByWallet(from);

      if (!user) {
        log.warn(
          `Deposit from unlinked wallet ${from}. ` +
          `Amount: ${ethers.formatEther(amount)} AIUS. ` +
          `User must link wallet first to claim.`
        );

        // Store unclaimed deposit for later claiming
        this.userService.storeUnclaimedDeposit(from, amount, txHash, blockNumber);
        return;
      }

      // Credit user balance
      const success = this.userService.creditBalance(
        user.telegram_id,
        amount,
        txHash,
        from,
        blockNumber
      );

      if (success) {
        log.info(
          `Credited ${ethers.formatEther(amount)} AIUS to user ${user.telegram_id} ` +
          `(@${user.telegram_username || 'unknown'})`
        );

        // TODO: Send Telegram notification to user
      } else {
        log.error(`Failed to credit deposit for user ${user.telegram_id}`);
      }
    } catch (error: any) {
      log.error(`Failed to process deposit: ${error.message}`);
    }
  }

  /**
   * Get last processed block
   */
  getLastProcessedBlock(): number {
    return this.lastProcessedBlock;
  }

  /**
   * Manually process deposits in a block range (useful for catching up)
   */
  async processBlockRange(fromBlock: number, toBlock: number): Promise<void> {
    log.info(`Manually processing deposits from block ${fromBlock} to ${toBlock}`);

    const filter = this.tokenContract.filters.Transfer(null, this.botWalletAddress);
    const events = await this.tokenContract.queryFilter(filter, fromBlock, toBlock);

    log.info(`Found ${events.length} deposit(s) in block range`);

    for (const event of events) {
      await this.processDeposit(event);
    }

    this.lastProcessedBlock = Math.max(this.lastProcessedBlock, toBlock);
  }
}
