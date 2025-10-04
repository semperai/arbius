import { DatabaseService } from '../../src/services/DatabaseService';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('DatabaseService', () => {
  let db: DatabaseService;
  let testDbPath: string;

  beforeEach(() => {
    // Create a temporary database for each test
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kasumi-test-'));
    testDbPath = path.join(tmpDir, 'test.db');
    db = new DatabaseService(testDbPath);
  });

  afterEach(() => {
    // Clean up
    db.close();
    if (fs.existsSync(testDbPath)) {
      const dir = path.dirname(testDbPath);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  describe('User Management', () => {
    describe('upsertUser', () => {
      it('should create new user', () => {
        const user = db.upsertUser(123, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'testuser');

        expect(user.telegram_id).toBe(123);
        expect(user.wallet_address).toBe('0x742d35cc6634c0532925a3b844bc9e7595f0beb'); // Stored as lowercase
        expect(user.telegram_username).toBe('testuser');
        expect(user.balance_aius).toBe('0');
      });

      it('should update existing user', () => {
        db.upsertUser(123, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'testuser');
        const updated = db.upsertUser(123, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'newusername');

        expect(updated.telegram_username).toBe('newusername');
      });

      it('should handle user without username', () => {
        const user = db.upsertUser(123, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

        expect(user.telegram_username).toBeNull();
      });
    });

    describe('getUser', () => {
      it('should return user by telegram ID', () => {
        db.upsertUser(123, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'testuser');
        const user = db.getUser(123);

        expect(user).toBeDefined();
        expect(user!.telegram_id).toBe(123);
      });

      it('should return null for non-existent user', () => {
        const user = db.getUser(999);
        expect(user).toBeUndefined();
      });
    });

    describe('getUserByWallet', () => {
      it('should return user by wallet address', () => {
        const wallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
        db.upsertUser(123, wallet, 'testuser');

        const user = db.getUserByWallet(wallet);

        expect(user).toBeDefined();
        expect(user!.wallet_address).toBe(wallet.toLowerCase()); // Stored as lowercase
      });

      it('should return null for non-existent wallet', () => {
        const user = db.getUserByWallet('0x0000000000000000000000000000000000000000');
        expect(user).toBeUndefined();
      });
    });

    describe('Balance Management', () => {
      beforeEach(() => {
        db.upsertUser(123, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'testuser');
      });

      it('should get initial balance', () => {
        const balance = db.getBalance(123);
        expect(balance).toBe(0n);
      });

      it('should update balance', () => {
        db.updateBalance(123, '1000000000000000000'); // 1 AIUS
        const balance = db.getBalance(123);
        expect(balance).toBe(1000000000000000000n);
      });

      it('should return 0 for non-existent user', () => {
        const balance = db.getBalance(999);
        expect(balance).toBe(0n);
      });
    });
  });

  describe('Transaction Management', () => {
    beforeEach(() => {
      db.upsertUser(123, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'testuser');
    });

    it('should add deposit transaction', () => {
      db.addTransaction({
        telegram_id: 123,
        type: 'deposit',
        amount_aius: '1000000000000000000',
        gas_cost_aius: null,
        total_cost_aius: null,
        tx_hash: '0xabc123',
        taskid: null,
        from_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        gas_used: null,
        gas_price_wei: null,
        aius_eth_rate: null,
        block_number: 12345,
        timestamp: Date.now(),
      });

      const transactions = db.getUserTransactions(123, 10);
      expect(transactions).toHaveLength(1);
      expect(transactions[0].type).toBe('deposit');
      expect(transactions[0].amount_aius).toBe('1000000000000000000');
    });

    it('should add model fee transaction with gas', () => {
      db.addTransaction({
        telegram_id: 123,
        type: 'model_fee',
        amount_aius: '100000000000000000', // 0.1 AIUS
        gas_cost_aius: '1000000000000000', // 0.001 AIUS
        total_cost_aius: '101000000000000000', // 0.101 AIUS
        tx_hash: '0xdef456',
        taskid: '0xtask123',
        from_address: null,
        gas_used: 200000,
        gas_price_wei: '50000000000',
        aius_eth_rate: '100000000000000000000',
        block_number: null,
        timestamp: Date.now(),
      });

      const transactions = db.getUserTransactions(123, 10);
      expect(transactions).toHaveLength(1);
      expect(transactions[0].type).toBe('model_fee');
      expect(transactions[0].taskid).toBe('0xtask123');
    });

    it('should get transaction by taskid', () => {
      db.addTransaction({
        telegram_id: 123,
        type: 'model_fee',
        amount_aius: '100000000000000000',
        gas_cost_aius: null,
        total_cost_aius: null,
        tx_hash: null,
        taskid: '0xtask123',
        from_address: null,
        gas_used: null,
        gas_price_wei: null,
        aius_eth_rate: null,
        block_number: null,
        timestamp: Date.now(),
      });

      const tx = db.getTransactionByTaskId('0xtask123');
      expect(tx).toBeDefined();
      expect(tx!.taskid).toBe('0xtask123');
    });

    it('should limit transaction history', () => {
      // Add 5 transactions
      for (let i = 0; i < 5; i++) {
        db.addTransaction({
          telegram_id: 123,
          type: 'deposit',
          amount_aius: '1000000000000000000',
          gas_cost_aius: null,
          total_cost_aius: null,
          tx_hash: `0xtx${i}`,
          taskid: null,
          from_address: null,
          gas_used: null,
          gas_price_wei: null,
          aius_eth_rate: null,
          block_number: null,
          timestamp: Date.now(),
        });
      }

      const transactions = db.getUserTransactions(123, 3);
      expect(transactions).toHaveLength(3);
    });
  });

  describe('Balance Reservations', () => {
    beforeEach(() => {
      db.upsertUser(123, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'testuser');
      db.updateBalance(123, '1000000000000000000'); // 1 AIUS
    });

    it('should create reservation', () => {
      db.createReservation('res_123', 123, BigInt('500000000000000000'), 300000);

      const reservation = db.getReservation('res_123');
      expect(reservation).toBeDefined();
      expect(reservation!.telegram_id).toBe(123);
      expect(reservation!.reserved_amount).toBe('500000000000000000');
    });

    it('should get total reserved amount', () => {
      db.createReservation('res_1', 123, BigInt('300000000000000000'), 300000);
      db.createReservation('res_2', 123, BigInt('200000000000000000'), 300000);

      const total = db.getTotalReserved(123);
      expect(total).toBe(BigInt('500000000000000000'));
    });

    it('should delete reservation', () => {
      db.createReservation('res_123', 123, BigInt('500000000000000000'), 300000);

      db.deleteReservation('res_123');

      const reservation = db.getReservation('res_123');
      expect(reservation).toBeNull();
    });

    it('should cleanup expired reservations', async () => {
      // Create reservation that expires in 100ms
      db.createReservation('res_expired', 123, BigInt('500000000000000000'), 100);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      const cleaned = db.cleanupExpiredReservations();
      expect(cleaned).toBe(1);

      const reservation = db.getReservation('res_expired');
      expect(reservation).toBeNull();
    });
  });

  describe('Unclaimed Deposits', () => {
    it('should add unclaimed deposit', () => {
      db.addUnclaimedDeposit({
        from_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        amount_aius: '1000000000000000000',
        tx_hash: '0xabc123',
        block_number: 12345,
        timestamp: Date.now(),
      });

      const deposits = db.getUnclaimedDepositsByAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
      expect(deposits).toHaveLength(1);
      expect(deposits[0].amount_aius).toBe('1000000000000000000');
      expect(deposits[0].claimed).toBe(0); // SQLite stores false as 0
    });

    it('should claim deposit', () => {
      db.upsertUser(123, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'testuser');

      db.addUnclaimedDeposit({
        from_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        amount_aius: '1000000000000000000',
        tx_hash: '0xabc123',
        block_number: 12345,
        timestamp: Date.now(),
      });

      const deposits = db.getUnclaimedDepositsByAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
      const depositId = deposits[0].id;

      db.claimDeposit(depositId, 123);

      const claimedDeposits = db.getUnclaimedDepositsByAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
      expect(claimedDeposits).toHaveLength(0); // Should be empty since it's claimed
    });

    it('should get all unclaimed deposits', () => {
      db.addUnclaimedDeposit({
        from_address: '0x111',
        amount_aius: '1000000000000000000',
        tx_hash: '0xtx1',
        block_number: 12345,
        timestamp: Date.now(),
      });

      db.addUnclaimedDeposit({
        from_address: '0x222',
        amount_aius: '2000000000000000000',
        tx_hash: '0xtx2',
        block_number: 12346,
        timestamp: Date.now(),
      });

      const allDeposits = db.getAllUnclaimedDeposits();
      expect(allDeposits).toHaveLength(2);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      db.upsertUser(123, '0x111', 'user1');
      db.upsertUser(456, '0x222', 'user2');
      db.updateBalance(123, '1000000000000000000');
    });

    it('should get stats', () => {
      db.addTransaction({
        telegram_id: 123,
        type: 'deposit',
        amount_aius: '1000000000000000000',
        gas_cost_aius: null,
        total_cost_aius: null,
        tx_hash: '0xabc',
        taskid: null,
        from_address: null,
        gas_used: null,
        gas_price_wei: null,
        aius_eth_rate: null,
        block_number: null,
        timestamp: Date.now(),
      });

      db.addTransaction({
        telegram_id: 123,
        type: 'model_fee',
        amount_aius: '100000000000000000',
        gas_cost_aius: null,
        total_cost_aius: '100000000000000000', // This is what getStats uses
        tx_hash: null,
        taskid: null,
        from_address: null,
        gas_used: null,
        gas_price_wei: null,
        aius_eth_rate: null,
        block_number: null,
        timestamp: Date.now(),
      });

      const stats = db.getStats();

      expect(stats.total_users).toBe(2);
      expect(stats.users_with_balance).toBe(1);
      expect(stats.total_deposits).toBe('1000000000000000000');
      expect(stats.total_spent).toBe('100000000000000000');
    });
  });

  describe('Transactions', () => {
    it('should execute transaction successfully', () => {
      const result = db.transaction(() => {
        db.upsertUser(123, '0x111', 'user1');
        db.updateBalance(123, '1000000000000000000');
        return true;
      });

      expect(result).toBe(true);
      expect(db.getBalance(123)).toBe(1000000000000000000n);
    });

    it('should rollback on error', () => {
      db.upsertUser(123, '0x111', 'user1');

      try {
        db.transaction(() => {
          db.updateBalance(123, '1000000000000000000');
          throw new Error('Test error');
        });
      } catch (e) {
        // Expected
      }

      // Balance should still be 0 due to rollback
      expect(db.getBalance(123)).toBe(0n);
    });
  });

  describe('Database Lifecycle', () => {
    it('should close database', () => {
      expect(() => db.close()).not.toThrow();
    });

    it('should create directory if not exists', () => {
      const newDir = path.join(os.tmpdir(), 'kasumi-test-newdir-' + Date.now());
      const newDbPath = path.join(newDir, 'subdir', 'test.db');

      const newDb = new DatabaseService(newDbPath);

      expect(fs.existsSync(newDbPath)).toBe(true);

      newDb.close();
      fs.rmSync(newDir, { recursive: true, force: true });
    });
  });
});
