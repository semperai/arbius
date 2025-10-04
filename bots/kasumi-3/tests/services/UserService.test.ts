// Need real ethers for address validation
jest.unmock('ethers');

import { UserService } from '../../src/services/UserService';
import { DatabaseService } from '../../src/services/DatabaseService';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Suppress log output in tests
jest.mock('../../src/log', () => ({
  log: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('UserService', () => {
  let userService: UserService;
  let db: DatabaseService;
  let testDbPath: string;

  beforeEach(() => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kasumi-userservice-test-'));
    testDbPath = path.join(tmpDir, 'test.db');
    db = new DatabaseService(testDbPath);
    userService = new UserService(db);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      const dir = path.dirname(testDbPath);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  describe('linkWallet', () => {
    it('should link wallet successfully', () => {
      const result = userService.linkWallet(123, '0x0Ac10F130e534Eeb18DaD519aD193d229790Bd4b', 'testuser');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user!.telegram_id).toBe(123);
      expect(result.user!.wallet_address).toBe('0x0ac10f130e534eeb18dad519ad193d229790bd4b');
    });

    it('should reject invalid address', () => {
      const result = userService.linkWallet(123, 'invalid-address', 'testuser');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid Ethereum address');
    });

    it('should reject wallet already linked to another account', () => {
      const wallet = '0x0Ac10F130e534Eeb18DaD519aD193d229790Bd4b';

      userService.linkWallet(123, wallet, 'user1');
      const result = userService.linkWallet(456, wallet, 'user2');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already linked');
    });

    it('should allow relinking same user', () => {
      const wallet = '0x0Ac10F130e534Eeb18DaD519aD193d229790Bd4b';

      userService.linkWallet(123, wallet, 'user1');
      const result = userService.linkWallet(123, wallet, 'updateduser');

      expect(result.success).toBe(true);
    });

    it('should claim pending deposits when linking wallet', () => {
      const wallet = '0x0Ac10F130e534Eeb18DaD519aD193d229790Bd4b';

      // Create unclaimed deposit (use checksummed address to match linkWallet behavior)
      db.addUnclaimedDeposit({
        from_address: wallet, // Checksummed, not lowercase
        amount_aius: '1000000000000000000',
        tx_hash: '0xabc123',
        block_number: 12345,
        timestamp: Date.now(),
      });

      const result = userService.linkWallet(123, wallet, 'testuser');

      expect(result.success).toBe(true);
      expect(result.claimedDeposits).toBeDefined();
      expect(result.claimedDeposits!.claimed).toBe(1);
      expect(result.claimedDeposits!.totalAmount).toBe(1000000000000000000n);
    });
  });

  describe('Balance Management', () => {
    beforeEach(() => {
      userService.linkWallet(123, '0x0Ac10F130e534Eeb18DaD519aD193d229790Bd4b', 'testuser');
    });

    it('should get balance', () => {
      const balance = userService.getBalance(123);
      expect(balance).toBe(0n);
    });

    it('should credit balance', () => {
      const success = userService.creditBalance(
        123,
        BigInt('1000000000000000000'),
        '0xtxhash',
        '0xfrom',
        12345
      );

      expect(success).toBe(true);
      expect(userService.getBalance(123)).toBe(1000000000000000000n);
    });

    it('should debit balance', () => {
      userService.creditBalance(123, BigInt('2000000000000000000'), '0xtx1');

      const success = userService.debitBalance(
        123,
        BigInt('500000000000000000'),
        '0xtask123',
        BigInt('10000000000000000'),
        200000,
        BigInt('50000000000'),
        BigInt('100000000000000000000'),
        '0xtx2'
      );

      expect(success).toBe(true);
      expect(userService.getBalance(123)).toBe(1500000000000000000n);
    });

    it('should fail to debit insufficient balance', () => {
      userService.creditBalance(123, BigInt('100000000000000000'), '0xtx1');

      const success = userService.debitBalance(123, BigInt('200000000000000000'));

      expect(success).toBe(false);
      expect(userService.getBalance(123)).toBe(100000000000000000n); // Unchanged
    });

    it('should get available balance with reservations', () => {
      userService.creditBalance(123, BigInt('1000000000000000000'), '0xtx1');
      userService.reserveBalance(123, BigInt('300000000000000000'), 300000);

      const available = userService.getAvailableBalance(123);
      expect(available).toBe(700000000000000000n);
    });
  });

  describe('Balance Reservations', () => {
    beforeEach(() => {
      userService.linkWallet(123, '0x0Ac10F130e534Eeb18DaD519aD193d229790Bd4b', 'testuser');
      userService.creditBalance(123, BigInt('1000000000000000000'), '0xtx1');
    });

    it('should create reservation', () => {
      const reservationId = userService.reserveBalance(123, BigInt('500000000000000000'), 300000);

      expect(reservationId).toBeTruthy();
      expect(reservationId).toContain('res_123_');
    });

    it('should fail reservation with insufficient balance', () => {
      const reservationId = userService.reserveBalance(123, BigInt('2000000000000000000'), 300000);

      expect(reservationId).toBeNull();
    });

    it('should fail reservation when balance already reserved', () => {
      userService.reserveBalance(123, BigInt('800000000000000000'), 300000);
      const reservationId2 = userService.reserveBalance(123, BigInt('300000000000000000'), 300000);

      expect(reservationId2).toBeNull(); // Only 200 available
    });

    it('should finalize reservation', () => {
      const reservationId = userService.reserveBalance(123, BigInt('500000000000000000'), 300000)!;

      const success = userService.finalizeReservation(
        reservationId,
        BigInt('400000000000000000'), // Actual cost less than reserved
        '0xtask123',
        BigInt('10000000000000000'),
        200000,
        BigInt('50000000000'),
        BigInt('100000000000000000000'),
        '0xtx2'
      );

      expect(success).toBe(true);
      expect(userService.getBalance(123)).toBe(600000000000000000n); // 1000 - 400
      expect(userService.getAvailableBalance(123)).toBe(600000000000000000n); // No reservations
    });

    it('should fail to finalize with amount exceeding reservation', () => {
      const reservationId = userService.reserveBalance(123, BigInt('300000000000000000'), 300000)!;

      const success = userService.finalizeReservation(
        reservationId,
        BigInt('500000000000000000'), // Exceeds reservation
        '0xtask123'
      );

      expect(success).toBe(false);
    });

    it('should cancel reservation', () => {
      const reservationId = userService.reserveBalance(123, BigInt('500000000000000000'), 300000)!;

      const success = userService.cancelReservation(reservationId);

      expect(success).toBe(true);
      expect(userService.getAvailableBalance(123)).toBe(1000000000000000000n); // Fully available again
    });

    it('should cleanup expired reservations', async () => {
      userService.reserveBalance(123, BigInt('500000000000000000'), 100); // Expires in 100ms

      await new Promise(resolve => setTimeout(resolve, 150));

      const cleaned = userService.cleanupExpiredReservations();
      expect(cleaned).toBe(1);
      expect(userService.getAvailableBalance(123)).toBe(1000000000000000000n);
    });
  });

  describe('Refunds', () => {
    beforeEach(() => {
      userService.linkWallet(123, '0x0Ac10F130e534Eeb18DaD519aD193d229790Bd4b', 'testuser');
      userService.creditBalance(123, BigInt('1000000000000000000'), '0xtx1');
    });

    it('should refund failed task', () => {
      // Debit for a task
      userService.debitBalance(
        123,
        BigInt('100000000000000000'),
        '0xtask123',
        BigInt('1000000000000000'),
        200000,
        BigInt('50000000000'),
        BigInt('100000000000000000000'),
        '0xtx2'
      );

      expect(userService.getBalance(123)).toBe(900000000000000000n);

      // Refund the task
      const success = userService.refundTask('0xtask123');

      expect(success).toBe(true);
      expect(userService.getBalance(123)).toBe(1000000000000000000n); // Back to original
    });

    it('should not refund non-existent task', () => {
      const success = userService.refundTask('0xnonexistent');
      expect(success).toBe(false);
    });

    it('should not refund already refunded task', () => {
      userService.debitBalance(123, BigInt('100000000000000000'), '0xtask123');

      userService.refundTask('0xtask123');
      const secondRefund = userService.refundTask('0xtask123');

      expect(secondRefund).toBe(false);
    });
  });

  describe('Admin Functions', () => {
    beforeEach(() => {
      userService.linkWallet(123, '0x0Ac10F130e534Eeb18DaD519aD193d229790Bd4b', 'testuser');
    });

    it('should admin credit balance', () => {
      const success = userService.adminCredit(123, BigInt('1000000000000000000'), 'Test credit');

      expect(success).toBe(true);
      expect(userService.getBalance(123)).toBe(1000000000000000000n);
    });

    it('should store reason in taskid field', () => {
      userService.adminCredit(123, BigInt('1000000000000000000'), 'Compensation for bug');

      const history = userService.getTransactionHistory(123, 10);
      const adminTx = history.find(tx => tx.type === 'admin_credit');

      expect(adminTx).toBeDefined();
      expect(adminTx!.taskid).toBe('Compensation for bug');
    });
  });

  describe('Unclaimed Deposits', () => {
    it('should store unclaimed deposit', () => {
      const success = userService.storeUnclaimedDeposit(
        '0x0Ac10F130e534Eeb18DaD519aD193d229790Bd4b',
        BigInt('1000000000000000000'),
        '0xtxhash',
        12345
      );

      expect(success).toBe(true);

      const deposits = userService.getUnclaimedDeposits('0x0Ac10F130e534Eeb18DaD519aD193d229790Bd4b');
      expect(deposits).toHaveLength(1);
    });

    it('should claim pending deposits', () => {
      const wallet = '0x0Ac10F130e534Eeb18DaD519aD193d229790Bd4b';

      // Store unclaimed deposits
      userService.storeUnclaimedDeposit(wallet, BigInt('1000000000000000000'), '0xtx1', 12345);
      userService.storeUnclaimedDeposit(wallet, BigInt('500000000000000000'), '0xtx2', 12346);

      // Link wallet (which should claim deposits)
      userService.linkWallet(123, wallet, 'testuser');

      // Check balance was credited
      expect(userService.getBalance(123)).toBe(1500000000000000000n);

      // Check deposits are no longer unclaimed
      const remainingDeposits = userService.getUnclaimedDeposits(wallet);
      expect(remainingDeposits).toHaveLength(0);
    });

    it('should get all unclaimed deposits', () => {
      userService.storeUnclaimedDeposit('0x111', BigInt('1000000000000000000'), '0xtx1', 12345);
      userService.storeUnclaimedDeposit('0x222', BigInt('2000000000000000000'), '0xtx2', 12346);

      const allDeposits = userService.getAllUnclaimedDeposits();
      expect(allDeposits).toHaveLength(2);
    });
  });

  describe('Query Functions', () => {
    beforeEach(() => {
      const linkResult = userService.linkWallet(123, '0x0Ac10F130e534Eeb18DaD519aD193d229790Bd4b', 'testuser');
      if (!linkResult.success) {
        throw new Error(`Failed to link wallet in test setup: ${linkResult.error}`);
      }
      const creditResult = userService.creditBalance(123, BigInt('1000000000000000000'), '0xtx1');
      if (!creditResult) {
        throw new Error('Failed to credit balance in test setup');
      }
    });

    it('should get user', () => {
      const user = userService.getUser(123);

      expect(user).toBeDefined();
      expect(user!.telegram_id).toBe(123);
    });

    it('should get user by wallet', () => {
      const user = userService.getUserByWallet('0x0Ac10F130e534Eeb18DaD519aD193d229790Bd4b');

      expect(user).toBeDefined();
      expect(user!.telegram_id).toBe(123);
    });

    it('should get transaction history', () => {
      userService.debitBalance(123, BigInt('100000000000000000'), '0xtask1', undefined, undefined, undefined, undefined, '0xtxhash1');
      userService.debitBalance(123, BigInt('200000000000000000'), '0xtask2', undefined, undefined, undefined, undefined, '0xtxhash2');

      const history = userService.getTransactionHistory(123, 10);

      expect(history.length).toBeGreaterThanOrEqual(3); // initial credit + 2 debits
    });

    it('should limit transaction history', () => {
      // Create multiple transactions
      for (let i = 0; i < 10; i++) {
        userService.creditBalance(123, BigInt('100000000000000000'), `0xtx${i}`);
      }

      const history = userService.getTransactionHistory(123, 5);

      expect(history).toHaveLength(5);
    });

    it('should get stats', () => {
      const linkResult = userService.linkWallet(456, '0x030a697f3Addf83F5daB2e2E3CEB8fFEBE7F12ef', 'user2');
      if (!linkResult.success) {
        throw new Error(`Failed to link second wallet: ${linkResult.error}`);
      }
      userService.creditBalance(456, BigInt('500000000000000000'), '0xtx2');

      const stats = userService.getStats();

      expect(stats.total_users).toBe(2);
      expect(stats.users_with_balance).toBe(2);
    });
  });
});
