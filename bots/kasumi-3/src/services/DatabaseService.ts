import Database from 'better-sqlite3';
import { log } from '../log';
import path from 'path';
import fs from 'fs';

export interface User {
  telegram_id: number;
  telegram_username: string | null;
  wallet_address: string;
  balance_aius: string;
  linked_at: number;
  created_at: number;
}

export interface Transaction {
  id: number;
  telegram_id: number;
  type: 'deposit' | 'model_fee' | 'gas_cost' | 'refund' | 'admin_credit';
  amount_aius: string;
  gas_cost_aius: string | null;
  total_cost_aius: string | null;
  tx_hash: string | null;
  taskid: string | null;
  from_address: string | null;
  gas_used: number | null;
  gas_price_wei: string | null;
  aius_eth_rate: string | null;
  block_number: number | null;
  timestamp: number;
}

/**
 * Database service for managing users and transactions
 */
export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath: string) {
    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
    this.db.pragma('synchronous = NORMAL'); // Balance between safety and performance

    this.initializeTables();
    log.info(`Database initialized at ${dbPath}`);
  }

  private initializeTables(): void {
    // Create users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        telegram_id INTEGER PRIMARY KEY,
        telegram_username TEXT,
        wallet_address TEXT UNIQUE NOT NULL,
        balance_aius TEXT NOT NULL DEFAULT '0',
        linked_at INTEGER,
        created_at INTEGER NOT NULL
      )
    `);

    // Create transactions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('deposit', 'model_fee', 'gas_cost', 'refund', 'admin_credit')),
        amount_aius TEXT NOT NULL,
        gas_cost_aius TEXT,
        total_cost_aius TEXT,
        tx_hash TEXT UNIQUE,
        taskid TEXT,
        from_address TEXT,
        gas_used INTEGER,
        gas_price_wei TEXT,
        aius_eth_rate TEXT,
        block_number INTEGER,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
      )
    `);

    // Create indexes for performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_transactions_telegram_id ON transactions(telegram_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_transactions_taskid ON transactions(taskid);
      CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash);
      CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
    `);

    log.info('Database tables initialized');
  }

  /**
   * Get user by Telegram ID
   */
  getUser(telegramId: number): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE telegram_id = ?');
    return stmt.get(telegramId) as User | null;
  }

  /**
   * Get user by wallet address
   */
  getUserByWallet(walletAddress: string): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE wallet_address = ?');
    return stmt.get(walletAddress.toLowerCase()) as User | null;
  }

  /**
   * Create or update user
   */
  upsertUser(
    telegramId: number,
    walletAddress: string,
    telegramUsername?: string
  ): User {
    const now = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO users (telegram_id, telegram_username, wallet_address, balance_aius, linked_at, created_at)
      VALUES (?, ?, ?, '0', ?, ?)
      ON CONFLICT(telegram_id) DO UPDATE SET
        wallet_address = excluded.wallet_address,
        telegram_username = excluded.telegram_username,
        linked_at = excluded.linked_at
    `);

    stmt.run(telegramId, telegramUsername || null, walletAddress.toLowerCase(), now, now);

    return this.getUser(telegramId)!;
  }

  /**
   * Update user balance
   */
  updateBalance(telegramId: number, newBalance: string): void {
    const stmt = this.db.prepare('UPDATE users SET balance_aius = ? WHERE telegram_id = ?');
    stmt.run(newBalance, telegramId);
  }

  /**
   * Get user balance
   */
  getBalance(telegramId: number): bigint {
    const user = this.getUser(telegramId);
    return user ? BigInt(user.balance_aius) : 0n;
  }

  /**
   * Add transaction record
   */
  addTransaction(tx: Omit<Transaction, 'id'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO transactions (
        telegram_id, type, amount_aius, gas_cost_aius, total_cost_aius,
        tx_hash, taskid, from_address, gas_used, gas_price_wei,
        aius_eth_rate, block_number, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      tx.telegram_id,
      tx.type,
      tx.amount_aius,
      tx.gas_cost_aius,
      tx.total_cost_aius,
      tx.tx_hash,
      tx.taskid,
      tx.from_address,
      tx.gas_used,
      tx.gas_price_wei,
      tx.aius_eth_rate,
      tx.block_number,
      tx.timestamp
    );

    return result.lastInsertRowid as number;
  }

  /**
   * Get transactions for a user
   */
  getUserTransactions(telegramId: number, limit: number = 10): Transaction[] {
    const stmt = this.db.prepare(`
      SELECT * FROM transactions
      WHERE telegram_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    return stmt.all(telegramId, limit) as Transaction[];
  }

  /**
   * Get transaction by taskid
   */
  getTransactionByTaskId(taskid: string): Transaction | null {
    const stmt = this.db.prepare(`
      SELECT * FROM transactions
      WHERE taskid = ? AND type = 'model_fee'
    `);
    return stmt.get(taskid) as Transaction | null;
  }

  /**
   * Get transaction by tx_hash
   */
  getTransactionByHash(txHash: string): Transaction | null {
    const stmt = this.db.prepare('SELECT * FROM transactions WHERE tx_hash = ?');
    return stmt.get(txHash) as Transaction | null;
  }

  /**
   * Get all users with balances
   */
  getAllUsersWithBalance(): User[] {
    const stmt = this.db.prepare(`
      SELECT * FROM users
      WHERE CAST(balance_aius AS REAL) > 0
      ORDER BY CAST(balance_aius AS REAL) DESC
    `);
    return stmt.all() as User[];
  }

  /**
   * Get statistics
   */
  getStats(): {
    total_users: number;
    users_with_balance: number;
    total_deposits: string;
    total_spent: string;
    total_refunds: string;
    tasks_24h: number;
  } {
    const stats = {
      total_users: (this.db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count,
      users_with_balance: (this.db.prepare('SELECT COUNT(*) as count FROM users WHERE CAST(balance_aius AS REAL) > 0').get() as any).count,
      total_deposits: (this.db.prepare(`SELECT COALESCE(SUM(CAST(amount_aius AS REAL)), 0) as total FROM transactions WHERE type = 'deposit'`).get() as any).total.toString(),
      total_spent: (this.db.prepare(`SELECT COALESCE(SUM(CAST(total_cost_aius AS REAL)), 0) as total FROM transactions WHERE type = 'model_fee'`).get() as any).total.toString(),
      total_refunds: (this.db.prepare(`SELECT COALESCE(SUM(CAST(amount_aius AS REAL)), 0) as total FROM transactions WHERE type = 'refund'`).get() as any).total.toString(),
      tasks_24h: (this.db.prepare(`SELECT COUNT(*) as count FROM transactions WHERE type = 'model_fee' AND timestamp > ?`).get(Date.now() - 24 * 60 * 60 * 1000) as any).count,
    };

    return stats;
  }

  /**
   * Execute in transaction
   */
  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Get raw database instance (for advanced operations)
   */
  getDb(): Database.Database {
    return this.db;
  }
}
