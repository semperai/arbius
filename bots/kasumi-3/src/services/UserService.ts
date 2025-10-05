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
  ): { success: boolean; error?: string; user?: any; claimedDeposits?: { claimed: number; totalAmount: bigint } } {
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

      // Check for and claim any pending deposits for this wallet
      const claimed = this.claimPendingDeposits(telegramId, checksummedAddress);

      if (claimed.claimed > 0) {
        log.info(
          `Auto-claimed ${claimed.claimed} pending deposit(s) for user ${telegramId}: ` +
          `${ethers.formatEther(claimed.totalAmount)} AIUS`
        );
      }

      return { success: true, user, claimedDeposits: claimed };
    } catch (error: any) {
      log.error(`Failed to link wallet: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get available balance (total balance minus reserved)
   */
  getAvailableBalance(telegramId: number): bigint {
    const totalBalance = this.db.getBalance(telegramId);
    const reserved = this.db.getTotalReserved(telegramId);
    return totalBalance - reserved;
  }

  /**
   * Get total balance (not accounting for reservations)
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

  /**
   * Reserve balance for a transaction
   * Returns reservation ID if successful, null if insufficient balance
   */
  reserveBalance(telegramId: number, amount: bigint, expiresInMs: number = 300000): string | null {
    try {
      return this.db.transaction(() => {
        const availableBalance = this.getAvailableBalance(telegramId);

        if (availableBalance < amount) {
          log.warn(
            `Insufficient available balance for user ${telegramId}: ` +
            `available ${ethers.formatEther(availableBalance)} AIUS, needs ${ethers.formatEther(amount)} AIUS`
          );
          return null;
        }

        // Create unique reservation ID
        const reservationId = `res_${telegramId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        this.db.createReservation(reservationId, telegramId, amount, expiresInMs);

        log.info(
          `Reserved ${ethers.formatEther(amount)} AIUS for user ${telegramId} ` +
          `(reservation: ${reservationId}, expires in ${expiresInMs}ms)`
        );

        return reservationId;
      });
    } catch (error: any) {
      log.error(`Failed to reserve balance: ${error.message}`);
      return null;
    }
  }

  /**
   * Finalize a reservation by debiting the actual amount
   * This releases the reservation and charges the user
   */
  finalizeReservation(
    reservationId: string,
    actualAmount: bigint,
    taskid?: string,
    gasCostAius?: bigint,
    gasUsed?: number,
    gasPriceWei?: bigint,
    aiusEthRate?: bigint,
    txHash?: string
  ): boolean {
    try {
      return this.db.transaction(() => {
        const reservation = this.db.getReservation(reservationId);

        if (!reservation) {
          log.error(`Reservation not found: ${reservationId}`);
          return false;
        }

        // Check reservation hasn't expired
        if (Date.now() > reservation.expires_at) {
          log.error(`Reservation expired: ${reservationId}`);
          this.db.deleteReservation(reservationId);
          return false;
        }

        const reservedAmount = BigInt(reservation.reserved_amount);

        // Ensure actual amount doesn't exceed reserved amount
        if (actualAmount > reservedAmount) {
          log.error(
            `Actual amount ${ethers.formatEther(actualAmount)} exceeds ` +
            `reserved amount ${ethers.formatEther(reservedAmount)} for reservation ${reservationId}`
          );
          return false;
        }

        // Debit the actual amount
        const success = this.debitBalance(
          reservation.telegram_id,
          actualAmount,
          taskid,
          gasCostAius,
          gasUsed,
          gasPriceWei,
          aiusEthRate,
          txHash
        );

        if (success) {
          // Release the reservation
          this.db.deleteReservation(reservationId);
          log.info(`Finalized reservation ${reservationId}, charged ${ethers.formatEther(actualAmount)} AIUS`);
        }

        return success;
      });
    } catch (error: any) {
      log.error(`Failed to finalize reservation: ${error.message}`);
      return false;
    }
  }

  /**
   * Cancel a reservation and release the reserved balance
   */
  cancelReservation(reservationId: string): boolean {
    try {
      const reservation = this.db.getReservation(reservationId);

      if (!reservation) {
        log.warn(`Attempted to cancel non-existent reservation: ${reservationId}`);
        return false;
      }

      this.db.deleteReservation(reservationId);

      log.info(
        `Cancelled reservation ${reservationId}, ` +
        `released ${ethers.formatEther(BigInt(reservation.reserved_amount))} AIUS`
      );

      return true;
    } catch (error: any) {
      log.error(`Failed to cancel reservation: ${error.message}`);
      return false;
    }
  }

  /**
   * Clean up expired reservations (should be called periodically)
   */
  cleanupExpiredReservations(): number {
    const deleted = this.db.cleanupExpiredReservations();
    if (deleted > 0) {
      log.info(`Cleaned up ${deleted} expired balance reservations`);
    }
    return deleted;
  }

  /**
   * Store an unclaimed deposit for a wallet that isn't linked yet
   */
  storeUnclaimedDeposit(
    fromAddress: string,
    amount: bigint,
    txHash: string,
    blockNumber: number
  ): boolean {
    try {
      this.db.addUnclaimedDeposit({
        from_address: fromAddress,
        amount_aius: amount.toString(),
        tx_hash: txHash,
        block_number: blockNumber,
        timestamp: Date.now(),
      });

      log.info(
        `Stored unclaimed deposit: ${ethers.formatEther(amount)} AIUS from ${fromAddress} ` +
        `(tx: ${txHash})`
      );

      return true;
    } catch (error: any) {
      log.error(`Failed to store unclaimed deposit: ${error.message}`);
      return false;
    }
  }

  /**
   * Claim pending deposits for a newly linked wallet
   */
  claimPendingDeposits(telegramId: number, walletAddress: string): {
    claimed: number;
    totalAmount: bigint;
  } {
    try {
      return this.db.transaction(() => {
        const deposits = this.db.getUnclaimedDepositsByAddress(walletAddress);

        if (deposits.length === 0) {
          return { claimed: 0, totalAmount: 0n };
        }

        let totalAmount = 0n;

        for (const deposit of deposits) {
          const amount = BigInt(deposit.amount_aius);

          // Claim the deposit
          const claimed = this.db.claimDeposit(deposit.id, telegramId);

          if (claimed) {
            // Credit the user's balance
            this.creditBalance(
              telegramId,
              amount,
              deposit.tx_hash,
              deposit.from_address,
              deposit.block_number
            );

            totalAmount += amount;

            log.info(
              `Claimed deposit ${deposit.id}: ${ethers.formatEther(amount)} AIUS ` +
              `from ${deposit.from_address} for user ${telegramId}`
            );
          }
        }

        log.info(
          `Claimed ${deposits.length} pending deposit(s) for user ${telegramId}, ` +
          `total: ${ethers.formatEther(totalAmount)} AIUS`
        );

        return { claimed: deposits.length, totalAmount };
      });
    } catch (error: any) {
      log.error(`Failed to claim pending deposits: ${error.message}`);
      return { claimed: 0, totalAmount: 0n };
    }
  }

  /**
   * Get unclaimed deposits for a wallet address
   */
  getUnclaimedDeposits(walletAddress: string) {
    return this.db.getUnclaimedDepositsByAddress(walletAddress);
  }

  /**
   * Get all unclaimed deposits (admin function)
   */
  getAllUnclaimedDeposits() {
    return this.db.getAllUnclaimedDeposits();
  }
}
