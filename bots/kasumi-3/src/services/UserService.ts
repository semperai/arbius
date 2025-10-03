import { DatabaseService } from './DatabaseService';
import { log } from '../log';
import { ethers } from 'ethers';

/**
 * Service for managing user balances and wallet linking
 */
export class UserService {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  /**
   * Link wallet to Telegram account
   */
  linkWallet(
    telegramId: number,
    walletAddress: string,
    telegramUsername?: string
  ): { success: boolean; error?: string; user?: any } {
    try {
      // Validate address
      if (!ethers.isAddress(walletAddress)) {
        return { success: false, error: 'Invalid Ethereum address' };
      }

      // Checksum address
      const checksummedAddress = ethers.getAddress(walletAddress);

      // Check if wallet is already linked to another account
      const existingUser = this.db.getUserByWallet(checksummedAddress);
      if (existingUser && existingUser.telegram_id !== telegramId) {
        return {
          success: false,
          error: `Wallet already linked to another account`,
        };
      }

      // Create or update user
      const user = this.db.upsertUser(telegramId, checksummedAddress, telegramUsername);

      log.info(`Wallet linked: telegramId=${telegramId}, wallet=${checksummedAddress}`);

      return { success: true, user };
    } catch (error: any) {
      log.error(`Failed to link wallet: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user balance
   */
  getBalance(telegramId: number): bigint {
    return this.db.getBalance(telegramId);
  }

  /**
   * Credit user balance
   */
  creditBalance(
    telegramId: number,
    amount: bigint,
    txHash: string,
    fromAddress?: string,
    blockNumber?: number
  ): boolean {
    try {
      return this.db.transaction(() => {
        const currentBalance = this.db.getBalance(telegramId);
        const newBalance = currentBalance + amount;

        this.db.updateBalance(telegramId, newBalance.toString());

        // Record transaction
        this.db.addTransaction({
          telegram_id: telegramId,
          type: 'deposit',
          amount_aius: amount.toString(),
          gas_cost_aius: null,
          total_cost_aius: null,
          tx_hash: txHash,
          taskid: null,
          from_address: fromAddress || null,
          gas_used: null,
          gas_price_wei: null,
          aius_eth_rate: null,
          block_number: blockNumber || null,
          timestamp: Date.now(),
        });

        log.info(
          `Credited ${ethers.formatEther(amount)} AIUS to user ${telegramId}. ` +
          `New balance: ${ethers.formatEther(newBalance)} AIUS`
        );

        return true;
      });
    } catch (error: any) {
      log.error(`Failed to credit balance: ${error.message}`);
      return false;
    }
  }

  /**
   * Debit user balance (returns false if insufficient funds)
   */
  debitBalance(
    telegramId: number,
    amount: bigint,
    taskid?: string,
    gasCostAius?: bigint,
    gasUsed?: number,
    gasPriceWei?: bigint,
    aiusEthRate?: bigint,
    txHash?: string
  ): boolean {
    try {
      return this.db.transaction(() => {
        const currentBalance = this.db.getBalance(telegramId);

        if (currentBalance < amount) {
          log.warn(
            `Insufficient balance for user ${telegramId}: ` +
            `has ${ethers.formatEther(currentBalance)} AIUS, needs ${ethers.formatEther(amount)} AIUS`
          );
          return false;
        }

        const newBalance = currentBalance - amount;
        this.db.updateBalance(telegramId, newBalance.toString());

        // Calculate model fee (total - gas)
        const modelFee = gasCostAius ? amount - gasCostAius : amount;

        // Record transaction
        this.db.addTransaction({
          telegram_id: telegramId,
          type: 'model_fee',
          amount_aius: modelFee.toString(),
          gas_cost_aius: gasCostAius?.toString() || null,
          total_cost_aius: amount.toString(),
          tx_hash: txHash || null,
          taskid: taskid || null,
          from_address: null,
          gas_used: gasUsed || null,
          gas_price_wei: gasPriceWei?.toString() || null,
          aius_eth_rate: aiusEthRate?.toString() || null,
          block_number: null,
          timestamp: Date.now(),
        });

        log.info(
          `Debited ${ethers.formatEther(amount)} AIUS from user ${telegramId}. ` +
          `New balance: ${ethers.formatEther(newBalance)} AIUS`
        );

        return true;
      });
    } catch (error: any) {
      log.error(`Failed to debit balance: ${error.message}`);
      return false;
    }
  }

  /**
   * Refund user for failed task
   */
  refundTask(taskid: string): boolean {
    try {
      return this.db.transaction(() => {
        // Find original transaction
        const transaction = this.db.getTransactionByTaskId(taskid);

        if (!transaction) {
          log.warn(`No transaction found for taskid: ${taskid}`);
          return false;
        }

        // Check if already refunded
        const transactions = this.db.getUserTransactions(transaction.telegram_id, 1000);
        const alreadyRefunded = transactions.some(
          tx => tx.taskid === taskid && tx.type === 'refund'
        );

        if (alreadyRefunded) {
          log.warn(`Task ${taskid} already refunded`);
          return false;
        }

        // Refund the total cost (model fee + gas)
        const refundAmount = BigInt(transaction.total_cost_aius || transaction.amount_aius);
        const currentBalance = this.db.getBalance(transaction.telegram_id);
        const newBalance = currentBalance + refundAmount;

        this.db.updateBalance(transaction.telegram_id, newBalance.toString());

        // Record refund transaction
        this.db.addTransaction({
          telegram_id: transaction.telegram_id,
          type: 'refund',
          amount_aius: refundAmount.toString(),
          gas_cost_aius: null,
          total_cost_aius: null,
          tx_hash: null,
          taskid: taskid,
          from_address: null,
          gas_used: null,
          gas_price_wei: null,
          aius_eth_rate: null,
          block_number: null,
          timestamp: Date.now(),
        });

        log.info(
          `Refunded ${ethers.formatEther(refundAmount)} AIUS for failed task ${taskid} ` +
          `to user ${transaction.telegram_id}. New balance: ${ethers.formatEther(newBalance)} AIUS`
        );

        return true;
      });
    } catch (error: any) {
      log.error(`Failed to refund task: ${error.message}`);
      return false;
    }
  }

  /**
   * Admin credit (manual)
   */
  adminCredit(
    telegramId: number,
    amount: bigint,
    reason: string
  ): boolean {
    try {
      return this.db.transaction(() => {
        const currentBalance = this.db.getBalance(telegramId);
        const newBalance = currentBalance + amount;

        this.db.updateBalance(telegramId, newBalance.toString());

        this.db.addTransaction({
          telegram_id: telegramId,
          type: 'admin_credit',
          amount_aius: amount.toString(),
          gas_cost_aius: null,
          total_cost_aius: null,
          tx_hash: null,
          taskid: reason, // Store reason in taskid field
          from_address: null,
          gas_used: null,
          gas_price_wei: null,
          aius_eth_rate: null,
          block_number: null,
          timestamp: Date.now(),
        });

        log.info(
          `Admin credited ${ethers.formatEther(amount)} AIUS to user ${telegramId}. ` +
          `Reason: ${reason}. New balance: ${ethers.formatEther(newBalance)} AIUS`
        );

        return true;
      });
    } catch (error: any) {
      log.error(`Failed admin credit: ${error.message}`);
      return false;
    }
  }

  /**
   * Get user info
   */
  getUser(telegramId: number) {
    return this.db.getUser(telegramId);
  }

  /**
   * Get user by wallet
   */
  getUserByWallet(walletAddress: string) {
    return this.db.getUserByWallet(walletAddress);
  }

  /**
   * Get transaction history
   */
  getTransactionHistory(telegramId: number, limit: number = 10) {
    return this.db.getUserTransactions(telegramId, limit);
  }

  /**
   * Get system statistics
   */
  getStats() {
    return this.db.getStats();
  }
}
