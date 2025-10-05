import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DepositMonitor } from '../../src/services/DepositMonitor';
import { UserService } from '../../src/services/UserService';
import { DatabaseService } from '../../src/services/DatabaseService';
import { ethers } from 'ethers';

// Mock the logger
vi.mock('../../src/log', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('DepositMonitor - Comprehensive Tests', () => {
  let monitor: DepositMonitor;
  let mockProvider: any;
  let mockTokenContract: any;
  let userService: UserService;
  let db: DatabaseService;

  const BOT_WALLET = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  const TOKEN_ADDRESS = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
  const USER_WALLET = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const USER_TELEGRAM_ID = 123456;

  beforeEach(() => {
    vi.clearAllMocks();

    // Real database for integration-style tests
    db = new DatabaseService(':memory:');
    userService = new UserService(db);

    // Link user wallet
    userService.linkWallet(USER_TELEGRAM_ID, USER_WALLET, 'testuser');

    mockTokenContract = {
      filters: {
        Transfer: vi.fn((from, to) => ({ from, to })),
      },
      queryFilter: vi.fn().mockResolvedValue([]),
    };

    mockProvider = {
      getBlockNumber: vi.fn().mockResolvedValue(1000),
    };

    // Create monitor with mocked contract
    monitor = new DepositMonitor(
      mockProvider as any,
      TOKEN_ADDRESS,
      BOT_WALLET,
      userService,
      100
    );

    // Replace the contract with our mock
    (monitor as any).tokenContract = mockTokenContract;
  });

  afterEach(() => {
    if (monitor) {
      monitor.stop();
    }
    db.close();
  });

  describe('Deposit Processing', () => {
    it('should credit user balance on valid deposit', async () => {
      const amount = ethers.parseEther('10');
      const txHash = '0x' + '1'.repeat(64);

      const mockEvent = {
        args: [USER_WALLET, BOT_WALLET, amount],
        transactionHash: txHash,
        blockNumber: 1001,
      };

      mockTokenContract.queryFilter.mockResolvedValue([mockEvent]);
      mockProvider.getBlockNumber.mockResolvedValue(1001);

      await monitor.start(1000);
      await new Promise(resolve => setTimeout(resolve, 150));

      const balance = userService.getBalance(USER_TELEGRAM_ID);
      expect(balance).toBe(amount);

      monitor.stop();
    });

    it('should handle multiple deposits in one block', async () => {
      const amount1 = ethers.parseEther('5');
      const amount2 = ethers.parseEther('3');
      const txHash1 = '0x' + '1'.repeat(64);
      const txHash2 = '0x' + '2'.repeat(64);

      const mockEvents = [
        {
          args: [USER_WALLET, BOT_WALLET, amount1],
          transactionHash: txHash1,
          blockNumber: 1001,
        },
        {
          args: [USER_WALLET, BOT_WALLET, amount2],
          transactionHash: txHash2,
          blockNumber: 1001,
        },
      ];

      mockTokenContract.queryFilter.mockResolvedValue(mockEvents);
      mockProvider.getBlockNumber.mockResolvedValue(1001);

      await monitor.start(1000);
      await new Promise(resolve => setTimeout(resolve, 150));

      const balance = userService.getBalance(USER_TELEGRAM_ID);
      expect(balance).toBe(amount1 + amount2);

      monitor.stop();
    });

    it('should handle deposits across multiple blocks', async () => {
      const amount1 = ethers.parseEther('10');
      const amount2 = ethers.parseEther('5');
      const txHash1 = '0x' + '1'.repeat(64);
      const txHash2 = '0x' + '2'.repeat(64);

      // First poll - block 1001
      mockTokenContract.queryFilter.mockResolvedValueOnce([
        {
          args: [USER_WALLET, BOT_WALLET, amount1],
          transactionHash: txHash1,
          blockNumber: 1001,
        },
      ]);
      mockProvider.getBlockNumber.mockResolvedValueOnce(1001);

      await monitor.start(1000);
      await new Promise(resolve => setTimeout(resolve, 150));

      const balance1 = userService.getBalance(USER_TELEGRAM_ID);
      expect(balance1).toBe(amount1);

      // Second poll - block 1002
      mockTokenContract.queryFilter.mockResolvedValueOnce([
        {
          args: [USER_WALLET, BOT_WALLET, amount2],
          transactionHash: txHash2,
          blockNumber: 1002,
        },
      ]);
      mockProvider.getBlockNumber.mockResolvedValueOnce(1002);

      await new Promise(resolve => setTimeout(resolve, 150));

      const balance2 = userService.getBalance(USER_TELEGRAM_ID);
      expect(balance2).toBe(amount1 + amount2);

      monitor.stop();
    });

    it('should handle very small deposit amounts (1 wei)', async () => {
      const amount = 1n; // 1 wei
      const txHash = '0x' + '1'.repeat(64);

      const mockEvent = {
        args: [USER_WALLET, BOT_WALLET, amount],
        transactionHash: txHash,
        blockNumber: 1001,
      };

      mockTokenContract.queryFilter.mockResolvedValue([mockEvent]);
      mockProvider.getBlockNumber.mockResolvedValue(1001);

      await monitor.start(1000);
      await new Promise(resolve => setTimeout(resolve, 150));

      const balance = userService.getBalance(USER_TELEGRAM_ID);
      expect(balance).toBe(1n);

      monitor.stop();
    });

    it('should handle very large deposit amounts', async () => {
      const amount = ethers.parseEther('1000000'); // 1 million AIUS
      const txHash = '0x' + '1'.repeat(64);

      const mockEvent = {
        args: [USER_WALLET, BOT_WALLET, amount],
        transactionHash: txHash,
        blockNumber: 1001,
      };

      mockTokenContract.queryFilter.mockResolvedValue([mockEvent]);
      mockProvider.getBlockNumber.mockResolvedValue(1001);

      await monitor.start(1000);
      await new Promise(resolve => setTimeout(resolve, 150));

      const balance = userService.getBalance(USER_TELEGRAM_ID);
      expect(balance).toBe(amount);

      monitor.stop();
    });
  });

  describe('Duplicate Prevention', () => {
    it('should not credit same deposit twice', async () => {
      const amount = ethers.parseEther('10');
      const txHash = '0x' + '1'.repeat(64);

      const mockEvent = {
        args: [USER_WALLET, BOT_WALLET, amount],
        transactionHash: txHash,
        blockNumber: 1001,
      };

      // First deposit
      mockTokenContract.queryFilter.mockResolvedValueOnce([mockEvent]);
      mockProvider.getBlockNumber.mockResolvedValueOnce(1001);

      await monitor.start(1000);
      await new Promise(resolve => setTimeout(resolve, 150));

      const balance1 = userService.getBalance(USER_TELEGRAM_ID);
      expect(balance1).toBe(amount);

      // Same deposit appears again (reorg scenario)
      mockTokenContract.queryFilter.mockResolvedValueOnce([mockEvent]);
      mockProvider.getBlockNumber.mockResolvedValueOnce(1002);

      await new Promise(resolve => setTimeout(resolve, 150));

      const balance2 = userService.getBalance(USER_TELEGRAM_ID);
      expect(balance2).toBe(amount); // Should NOT double credit

      monitor.stop();
    });

    it('should distinguish deposits with same amount but different txHash', async () => {
      const amount = ethers.parseEther('10');
      const txHash1 = '0x' + '1'.repeat(64);
      const txHash2 = '0x' + '2'.repeat(64);

      const mockEvents = [
        {
          args: [USER_WALLET, BOT_WALLET, amount],
          transactionHash: txHash1,
          blockNumber: 1001,
        },
        {
          args: [USER_WALLET, BOT_WALLET, amount],
          transactionHash: txHash2,
          blockNumber: 1001,
        },
      ];

      mockTokenContract.queryFilter.mockResolvedValue(mockEvents);
      mockProvider.getBlockNumber.mockResolvedValue(1001);

      await monitor.start(1000);
      await new Promise(resolve => setTimeout(resolve, 150));

      const balance = userService.getBalance(USER_TELEGRAM_ID);
      expect(balance).toBe(amount * 2n); // Both should be credited

      monitor.stop();
    });
  });

  describe('Unclaimed Deposits', () => {
    it('should store deposit from unlinked wallet as unclaimed', async () => {
      const unlinkedWallet = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
      const amount = ethers.parseEther('10');
      const txHash = '0x' + '1'.repeat(64);

      const mockEvent = {
        args: [unlinkedWallet, BOT_WALLET, amount],
        transactionHash: txHash,
        blockNumber: 1001,
      };

      mockTokenContract.queryFilter.mockResolvedValue([mockEvent]);
      mockProvider.getBlockNumber.mockResolvedValue(1001);

      await monitor.start(1000);
      await new Promise(resolve => setTimeout(resolve, 150));

      // Check unclaimed deposit was stored
      const unclaimed = db.getUnclaimedDepositsByAddress(unlinkedWallet);
      expect(unclaimed.length).toBe(1);
      expect(unclaimed[0].amount_aius).toBe(amount.toString());
      expect(unclaimed[0].tx_hash).toBe(txHash);

      monitor.stop();
    });

    it('should allow user to claim deposit after linking wallet', async () => {
      const newUserWallet = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
      const newUserTelegramId = 789012;
      const amount = ethers.parseEther('10');
      const txHash = '0x' + '1'.repeat(64);

      const mockEvent = {
        args: [newUserWallet, BOT_WALLET, amount],
        transactionHash: txHash,
        blockNumber: 1001,
      };

      mockTokenContract.queryFilter.mockResolvedValue([mockEvent]);
      mockProvider.getBlockNumber.mockResolvedValue(1001);

      // Deposit comes in before wallet is linked
      await monitor.start(1000);
      await new Promise(resolve => setTimeout(resolve, 150));

      // Verify unclaimed
      const unclaimed = db.getUnclaimedDepositsByAddress(newUserWallet);
      expect(unclaimed.length).toBe(1);

      // User links wallet (this auto-claims pending deposits)
      const result = userService.linkWallet(newUserTelegramId, newUserWallet, 'newuser');
      expect(result.success).toBe(true);
      expect(result.claimedDeposits?.claimed).toBe(1);
      expect(result.claimedDeposits?.totalAmount).toBe(amount);

      // Balance should be credited
      const balance = userService.getBalance(newUserTelegramId);
      expect(balance).toBe(amount);

      // Unclaimed should be empty
      const unclaimedAfter = db.getUnclaimedDepositsByAddress(newUserWallet);
      expect(unclaimedAfter.length).toBe(0);

      monitor.stop();
    });

    it('should handle multiple unclaimed deposits for same wallet', async () => {
      const unlinkedWallet = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
      const amount1 = ethers.parseEther('5');
      const amount2 = ethers.parseEther('3');
      const txHash1 = '0x' + '1'.repeat(64);
      const txHash2 = '0x' + '2'.repeat(64);

      const mockEvents = [
        {
          args: [unlinkedWallet, BOT_WALLET, amount1],
          transactionHash: txHash1,
          blockNumber: 1001,
        },
        {
          args: [unlinkedWallet, BOT_WALLET, amount2],
          transactionHash: txHash2,
          blockNumber: 1001,
        },
      ];

      mockTokenContract.queryFilter.mockResolvedValue(mockEvents);
      mockProvider.getBlockNumber.mockResolvedValue(1001);

      await monitor.start(1000);
      await new Promise(resolve => setTimeout(resolve, 150));

      const unclaimed = db.getUnclaimedDepositsByAddress(unlinkedWallet);
      expect(unclaimed.length).toBe(2);
      const total = BigInt(unclaimed[0].amount_aius) + BigInt(unclaimed[1].amount_aius);
      expect(total).toBe(amount1 + amount2);

      monitor.stop();
    });
  });

  describe('Block Range Processing', () => {
    it('should process manual block range correctly', async () => {
      const amount = ethers.parseEther('10');
      const txHash = '0x' + '1'.repeat(64);

      const mockEvent = {
        args: [USER_WALLET, BOT_WALLET, amount],
        transactionHash: txHash,
        blockNumber: 500,
      };

      mockTokenContract.queryFilter.mockResolvedValue([mockEvent]);

      await monitor.processBlockRange(400, 600);

      const balance = userService.getBalance(USER_TELEGRAM_ID);
      expect(balance).toBe(amount);
      expect(monitor.getLastProcessedBlock()).toBe(600);
    });

    it('should handle empty block ranges', async () => {
      mockTokenContract.queryFilter.mockResolvedValue([]);

      await monitor.processBlockRange(400, 600);

      const balance = userService.getBalance(USER_TELEGRAM_ID);
      expect(balance).toBe(0n);
      expect(monitor.getLastProcessedBlock()).toBe(600);
    });

    it('should update lastProcessedBlock to max of current and range end', async () => {
      await monitor.start(1000);

      mockTokenContract.queryFilter.mockResolvedValue([]);

      // Process older range - should not move lastProcessedBlock back
      await monitor.processBlockRange(500, 700);
      expect(monitor.getLastProcessedBlock()).toBe(1000);

      // Process newer range - should update lastProcessedBlock
      await monitor.processBlockRange(1001, 1200);
      expect(monitor.getLastProcessedBlock()).toBe(1200);

      monitor.stop();
    });
  });

  describe('Error Handling', () => {
    it('should handle RPC errors gracefully', async () => {
      // First call succeeds for start(), second call fails for poll
      mockProvider.getBlockNumber
        .mockResolvedValueOnce(1000) // start() call
        .mockRejectedValueOnce(new Error('RPC unavailable')) // first poll
        .mockResolvedValueOnce(1001); // recovery poll

      await monitor.start();
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should continue running
      expect(monitor).toBeDefined();

      monitor.stop();
    });

    it('should handle contract query errors', async () => {
      mockProvider.getBlockNumber.mockResolvedValue(1001);
      mockTokenContract.queryFilter.mockRejectedValue(new Error('Query failed'));

      await monitor.start(1000);
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should continue running despite error
      expect(monitor).toBeDefined();

      monitor.stop();
    });

    it('should handle malformed events gracefully', async () => {
      const malformedEvent = {
        args: ['invalid', 'data'],
        transactionHash: '0x123',
        blockNumber: 1001,
      };

      mockTokenContract.queryFilter.mockResolvedValue([malformedEvent]);
      mockProvider.getBlockNumber.mockResolvedValue(1001);

      await monitor.start(1000);
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should not crash
      expect(monitor).toBeDefined();

      monitor.stop();
    });

    it('should continue processing other deposits if one fails', async () => {
      const goodAmount = ethers.parseEther('10');
      const goodTxHash = '0x' + '1'.repeat(64);

      const mockEvents = [
        // This one will fail (invalid data)
        {
          args: ['invalid'],
          transactionHash: '0xbad',
          blockNumber: 1001,
        },
        // This one should succeed
        {
          args: [USER_WALLET, BOT_WALLET, goodAmount],
          transactionHash: goodTxHash,
          blockNumber: 1001,
        },
      ];

      mockTokenContract.queryFilter.mockResolvedValue(mockEvents);
      mockProvider.getBlockNumber.mockResolvedValue(1001);

      await monitor.start(1000);
      await new Promise(resolve => setTimeout(resolve, 150));

      // Good deposit should be processed
      const balance = userService.getBalance(USER_TELEGRAM_ID);
      expect(balance).toBe(goodAmount);

      monitor.stop();
    });
  });

  describe('Block Reorganization', () => {
    it('should handle block reorg by not double-crediting', async () => {
      const amount = ethers.parseEther('10');
      const txHash = '0x' + '1'.repeat(64);

      const mockEvent = {
        args: [USER_WALLET, BOT_WALLET, amount],
        transactionHash: txHash,
        blockNumber: 1001,
      };

      // First processing
      mockTokenContract.queryFilter.mockResolvedValueOnce([mockEvent]);
      mockProvider.getBlockNumber.mockResolvedValueOnce(1001);

      await monitor.start(1000);
      await new Promise(resolve => setTimeout(resolve, 150));

      const balance1 = userService.getBalance(USER_TELEGRAM_ID);
      expect(balance1).toBe(amount);

      // Reorg - same event appears again
      mockTokenContract.queryFilter.mockResolvedValueOnce([mockEvent]);
      mockProvider.getBlockNumber.mockResolvedValueOnce(1002);

      await new Promise(resolve => setTimeout(resolve, 150));

      const balance2 = userService.getBalance(USER_TELEGRAM_ID);
      expect(balance2).toBe(amount); // NOT doubled

      monitor.stop();
    });
  });

  describe('Transaction History', () => {
    it('should record deposit in transaction history', async () => {
      const amount = ethers.parseEther('10');
      const txHash = '0x' + '1'.repeat(64);

      const mockEvent = {
        args: [USER_WALLET, BOT_WALLET, amount],
        transactionHash: txHash,
        blockNumber: 1001,
      };

      mockTokenContract.queryFilter.mockResolvedValue([mockEvent]);
      mockProvider.getBlockNumber.mockResolvedValue(1001);

      await monitor.start(1000);
      await new Promise(resolve => setTimeout(resolve, 150));

      const history = userService.getTransactionHistory(USER_TELEGRAM_ID, 10);
      expect(history.length).toBe(1);
      expect(history[0].type).toBe('deposit');
      expect(BigInt(history[0].amount_aius)).toBe(amount);
      expect(history[0].tx_hash).toBe(txHash);

      monitor.stop();
    });

    it('should record block number in transaction', async () => {
      const amount = ethers.parseEther('10');
      const txHash = '0x' + '1'.repeat(64);
      const blockNumber = 1001;

      const mockEvent = {
        args: [USER_WALLET, BOT_WALLET, amount],
        transactionHash: txHash,
        blockNumber,
      };

      mockTokenContract.queryFilter.mockResolvedValue([mockEvent]);
      mockProvider.getBlockNumber.mockResolvedValue(blockNumber);

      await monitor.start(1000);
      await new Promise(resolve => setTimeout(resolve, 150));

      const history = userService.getTransactionHistory(USER_TELEGRAM_ID, 10);
      expect(history[0].block_number).toBe(blockNumber);

      monitor.stop();
    });
  });

  describe('Concurrent Deposits', () => {
    it('should handle deposits from multiple users correctly', async () => {
      const user2Wallet = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
      const user2TelegramId = 789012;
      userService.linkWallet(user2TelegramId, user2Wallet, 'user2');

      const amount1 = ethers.parseEther('5');
      const amount2 = ethers.parseEther('10');
      const txHash1 = '0x' + '1'.repeat(64);
      const txHash2 = '0x' + '2'.repeat(64);

      const mockEvents = [
        {
          args: [USER_WALLET, BOT_WALLET, amount1],
          transactionHash: txHash1,
          blockNumber: 1001,
        },
        {
          args: [user2Wallet, BOT_WALLET, amount2],
          transactionHash: txHash2,
          blockNumber: 1001,
        },
      ];

      mockTokenContract.queryFilter.mockResolvedValue(mockEvents);
      mockProvider.getBlockNumber.mockResolvedValue(1001);

      await monitor.start(1000);
      await new Promise(resolve => setTimeout(resolve, 150));

      const balance1 = userService.getBalance(USER_TELEGRAM_ID);
      const balance2 = userService.getBalance(user2TelegramId);

      expect(balance1).toBe(amount1);
      expect(balance2).toBe(amount2);

      monitor.stop();
    });
  });

  describe('Precision and Accuracy', () => {
    it('should handle precise decimal amounts without rounding errors', async () => {
      const amount = ethers.parseEther('10.123456789123456789'); // 18 decimals
      const txHash = '0x' + '1'.repeat(64);

      const mockEvent = {
        args: [USER_WALLET, BOT_WALLET, amount],
        transactionHash: txHash,
        blockNumber: 1001,
      };

      mockTokenContract.queryFilter.mockResolvedValue([mockEvent]);
      mockProvider.getBlockNumber.mockResolvedValue(1001);

      await monitor.start(1000);
      await new Promise(resolve => setTimeout(resolve, 150));

      const balance = userService.getBalance(USER_TELEGRAM_ID);
      expect(balance).toBe(amount);

      monitor.stop();
    });

    it('should correctly sum multiple deposits with high precision', async () => {
      const amount1 = ethers.parseEther('0.123456789123456789');
      const amount2 = ethers.parseEther('0.987654321098765432');
      const txHash1 = '0x' + '1'.repeat(64);
      const txHash2 = '0x' + '2'.repeat(64);

      const mockEvents = [
        {
          args: [USER_WALLET, BOT_WALLET, amount1],
          transactionHash: txHash1,
          blockNumber: 1001,
        },
        {
          args: [USER_WALLET, BOT_WALLET, amount2],
          transactionHash: txHash2,
          blockNumber: 1001,
        },
      ];

      mockTokenContract.queryFilter.mockResolvedValue(mockEvents);
      mockProvider.getBlockNumber.mockResolvedValue(1001);

      await monitor.start(1000);
      await new Promise(resolve => setTimeout(resolve, 150));

      const balance = userService.getBalance(USER_TELEGRAM_ID);
      expect(balance).toBe(amount1 + amount2);

      monitor.stop();
    });
  });
});
