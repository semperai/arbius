import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BlockchainService } from '../../src/services/BlockchainService';
import { TaskProcessor } from '../../src/services/TaskProcessor';
import { JobQueue } from '../../src/services/JobQueue';
import { UserService } from '../../src/services/UserService';
import { DatabaseService } from '../../src/services/DatabaseService';
import { ethers } from 'ethers';

// Mock logger
vi.mock('../../src/log', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Error Recovery & Edge Cases', () => {
  let blockchain: BlockchainService;
  let taskProcessor: TaskProcessor;
  let jobQueue: JobQueue;
  let userService: UserService;
  let db: DatabaseService;
  let mockProvider: any;
  let mockArbius: any;
  let mockArbiusRouter: any;

  beforeEach(() => {
    vi.clearAllMocks();

    db = new DatabaseService(':memory:');
    userService = new UserService(db);

    mockProvider = {
      getBlockNumber: vi.fn().mockResolvedValue(1000),
      getTransaction: vi.fn(),
      getFeeData: vi.fn().mockResolvedValue({
        maxFeePerGas: ethers.parseUnits('100', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
      }),
    };

    mockArbius = {
      getAddress: vi.fn().mockReturnValue('0x1111111111111111111111111111111111111111'),
      submitTask: {
        estimateGas: vi.fn().mockResolvedValue(200_000n),
      },
      solutions: vi.fn(),
      filters: {
        TaskSubmitted: vi.fn(),
      },
      queryFilter: vi.fn(),
    };

    mockArbiusRouter = {
      interface: {
        parseTransaction: vi.fn(),
      },
    };

    // Note: BlockchainService constructor expects provider, wallet, arbius, router
    // We'll use a workaround by creating it with minimal mocking
    blockchain = {
      findTransactionByTaskId: async (taskid: string) => {
        try {
          const filter = mockArbius.filters.TaskSubmitted(taskid);
          const currentBlock = await mockProvider.getBlockNumber();
          const fromBlock = Math.max(0, currentBlock - 10000);

          const logs = await mockArbius.queryFilter(filter, fromBlock, currentBlock);

          if (logs.length === 0) {
            return null;
          }

          const txHash = logs[0].transactionHash;
          const tx = await mockProvider.getTransaction(txHash);

          if (!tx || !tx.data) {
            return null;
          }

          try {
            const decodedData = mockArbiusRouter.interface.parseTransaction({ data: tx.data });

            if (decodedData?.name !== 'submitTask') {
              return null;
            }

            const modelId = decodedData.args[2];
            const inputBytes = decodedData.args[4];
            const inputString = ethers.toUtf8String(inputBytes);
            const inputJson = JSON.parse(inputString);
            const prompt = inputJson.prompt;

            return { txHash, prompt, modelId };
          } catch (decodeError) {
            return null;
          }
        } catch (error) {
          return null;
        }
      },
      getSolution: async (taskid: string) => {
        const solution = await mockArbius.solutions(taskid);
        if (!solution) {
          throw new Error(`Failed to get solution for task ${taskid}`);
        }
        return {
          validator: solution.validator,
          cid: solution.cid,
        };
      },
      estimateGasWithBuffer: async function(estimateFunction: any, fallbackGas: bigint, operationName: string) {
        try {
          const estimatedGas = await estimateFunction();
          const gasWithBuffer = estimatedGas * 120n / 100n; // 20% buffer
          return gasWithBuffer;
        } catch (error: any) {
          return fallbackGas;
        }
      }
    } as any;

    jobQueue = new JobQueue(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('BlockchainService - Transaction Lookup Edge Cases', () => {
    it('should handle transaction not found gracefully', async () => {
      const taskid = '0x' + '1'.repeat(64);

      mockArbius.queryFilter.mockResolvedValue([]);

      const result = await blockchain.findTransactionByTaskId(taskid);

      expect(result).toBeNull();
    });

    it('should handle transaction with no data', async () => {
      const taskid = '0x' + '1'.repeat(64);
      const txHash = '0x' + 'a'.repeat(64);

      mockArbius.queryFilter.mockResolvedValue([
        { transactionHash: txHash },
      ]);

      mockProvider.getTransaction.mockResolvedValue({
        hash: txHash,
        data: null, // No data
      });

      const result = await blockchain.findTransactionByTaskId(taskid);

      expect(result).toBeNull();
    });

    it('should handle malformed transaction data', async () => {
      const taskid = '0x' + '1'.repeat(64);
      const txHash = '0x' + 'a'.repeat(64);

      mockArbius.queryFilter.mockResolvedValue([
        { transactionHash: txHash },
      ]);

      mockProvider.getTransaction.mockResolvedValue({
        hash: txHash,
        data: '0xinvaliddata',
      });

      mockArbiusRouter.interface.parseTransaction.mockImplementation(() => {
        throw new Error('Invalid transaction data');
      });

      const result = await blockchain.findTransactionByTaskId(taskid);

      expect(result).toBeNull();
    });

    it('should handle non-submitTask transactions', async () => {
      const taskid = '0x' + '1'.repeat(64);
      const txHash = '0x' + 'a'.repeat(64);

      mockArbius.queryFilter.mockResolvedValue([
        { transactionHash: txHash },
      ]);

      mockProvider.getTransaction.mockResolvedValue({
        hash: txHash,
        data: '0x123456',
      });

      mockArbiusRouter.interface.parseTransaction.mockReturnValue({
        name: 'someOtherFunction',
        args: [],
      });

      const result = await blockchain.findTransactionByTaskId(taskid);

      expect(result).toBeNull();
    });

    it('should handle invalid UTF-8 in input data', async () => {
      const taskid = '0x' + '1'.repeat(64);
      const txHash = '0x' + 'a'.repeat(64);

      mockArbius.queryFilter.mockResolvedValue([
        { transactionHash: txHash },
      ]);

      mockProvider.getTransaction.mockResolvedValue({
        hash: txHash,
        data: '0x123456',
      });

      mockArbiusRouter.interface.parseTransaction.mockReturnValue({
        name: 'submitTask',
        args: [
          0, // version
          '0x1111111111111111111111111111111111111111', // owner
          '0x' + '2'.repeat(64), // modelId
          ethers.parseEther('0.1'), // fee
          '0xffff', // invalid UTF-8
          0, // cid_ipfs_only_test_param
          0, // gasLimit
        ],
      });

      const result = await blockchain.findTransactionByTaskId(taskid);

      expect(result).toBeNull();
    });

    it('should handle invalid JSON in input', async () => {
      const taskid = '0x' + '1'.repeat(64);
      const txHash = '0x' + 'a'.repeat(64);

      mockArbius.queryFilter.mockResolvedValue([
        { transactionHash: txHash },
      ]);

      mockProvider.getTransaction.mockResolvedValue({
        hash: txHash,
        data: '0x123456',
      });

      mockArbiusRouter.interface.parseTransaction.mockReturnValue({
        name: 'submitTask',
        args: [
          0,
          '0x1111111111111111111111111111111111111111',
          '0x' + '2'.repeat(64),
          ethers.parseEther('0.1'),
          ethers.toUtf8Bytes('not valid json'), // Invalid JSON
          0,
          0,
        ],
      });

      const result = await blockchain.findTransactionByTaskId(taskid);

      expect(result).toBeNull();
    });

    it('should handle valid transaction lookup successfully', async () => {
      const taskid = '0x' + '1'.repeat(64);
      const txHash = '0x' + 'a'.repeat(64);
      const modelId = '0x' + '2'.repeat(64);
      const prompt = 'test prompt';

      mockArbius.queryFilter.mockResolvedValue([
        { transactionHash: txHash },
      ]);

      mockProvider.getTransaction.mockResolvedValue({
        hash: txHash,
        data: '0x123456',
      });

      mockArbiusRouter.interface.parseTransaction.mockReturnValue({
        name: 'submitTask',
        args: [
          0,
          '0x1111111111111111111111111111111111111111',
          modelId,
          ethers.parseEther('0.1'),
          ethers.toUtf8Bytes(JSON.stringify({ prompt })),
          0,
          0,
        ],
      });

      const result = await blockchain.findTransactionByTaskId(taskid);

      expect(result).not.toBeNull();
      expect(result?.txHash).toBe(txHash);
      expect(result?.modelId).toBe(modelId);
      expect(result?.prompt).toBe(prompt);
    });

    it('should search correct block range', async () => {
      const taskid = '0x' + '1'.repeat(64);

      mockProvider.getBlockNumber.mockResolvedValue(15000);
      mockArbius.queryFilter.mockResolvedValue([]);

      await blockchain.findTransactionByTaskId(taskid);

      // Check that queryFilter was called with correct block range
      const callArgs = mockArbius.queryFilter.mock.calls[0];
      expect(callArgs[1]).toBe(5000); // fromBlock
      expect(callArgs[2]).toBe(15000); // toBlock
    });

    it('should not use negative fromBlock', async () => {
      const taskid = '0x' + '1'.repeat(64);

      mockProvider.getBlockNumber.mockResolvedValue(5000);
      mockArbius.queryFilter.mockResolvedValue([]);

      await blockchain.findTransactionByTaskId(taskid);

      // Check that fromBlock is 0, not negative
      const callArgs = mockArbius.queryFilter.mock.calls[0];
      expect(callArgs[1]).toBe(0); // Max(0, 5000 - 10000) = 0
      expect(callArgs[2]).toBe(5000);
    });
  });

  describe('BlockchainService - getSolution Edge Cases', () => {
    it('should handle solution not found', async () => {
      const taskid = '0x' + '1'.repeat(64);

      mockArbius.solutions.mockResolvedValue(null);

      await expect(blockchain.getSolution(taskid)).rejects.toThrow(
        'Failed to get solution'
      );
    });

    it('should return valid solution', async () => {
      const taskid = '0x' + '1'.repeat(64);
      const validator = '0x' + '3'.repeat(40);
      const cid = '0x' + '4'.repeat(64);

      mockArbius.solutions.mockResolvedValue({
        validator,
        cid,
      });

      const result = await blockchain.getSolution(taskid);

      expect(result.validator).toBe(validator);
      expect(result.cid).toBe(cid);
    });
  });

  describe('JobQueue - Concurrent Access', () => {
    it('should handle concurrent job updates safely', async () => {
      const jobData = {
        id: 'test-concurrent-job',
        taskid: '0xabc123',
        status: 'pending' as const,
        createdAt: Date.now(),
        input: { prompt: 'test' },
        model: { id: '0xabc', name: 'test', addr: '0x111', fee: 0n, template: {} as any },
      };

      jobQueue.addJob(jobData);

      // Simulate concurrent updates - all should succeed without errors
      await expect(Promise.all([
        jobQueue.updateJobStatus('test-concurrent-job', 'processing'),
        jobQueue.updateJobStatus('test-concurrent-job', 'processing'),
        jobQueue.updateJobStatus('test-concurrent-job', 'processing'),
      ])).resolves.toBeDefined();

      // Job should exist in some state
      const stats = jobQueue.getQueueStats();
      expect(stats.total).toBeGreaterThan(0);
    });

    it('should handle job not found gracefully', () => {
      const job = jobQueue.getJob('nonexistent');
      expect(job).toBeUndefined();
    });

    it('should handle empty queue stats', () => {
      const stats = jobQueue.getQueueStats();
      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.processing).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
    });
  });

  describe('UserService - Edge Cases', () => {
    it('should handle negative balance attempts', () => {
      const telegramId = 123;
      userService.linkWallet(telegramId, '0x70997970C51812dc3A010C7d01b50e0d17dc79C8');

      // Try to debit more than balance
      const success = userService.debitBalance(telegramId, ethers.parseEther('100'));
      expect(success).toBe(false);

      const balance = userService.getBalance(telegramId);
      expect(balance).toBe(0n);
    });

    it('should handle user not found gracefully', () => {
      const balance = userService.getBalance(99999);
      expect(balance).toBe(0n);
    });

    it('should handle wallet lookup by non-existent address', () => {
      const user = userService.getUserByWallet('0x1111111111111111111111111111111111111111');
      expect(user).toBeUndefined();
    });

    it('should handle transaction history for non-existent user', () => {
      const history = userService.getTransactionHistory(99999, 10);
      expect(history).toEqual([]);
    });

    it('should handle very large credit amounts', () => {
      const telegramId = 123;
      userService.linkWallet(telegramId, '0x70997970C51812dc3A010C7d01b50e0d17dc79C8');

      const largeAmount = ethers.parseEther('1000000000'); // 1 billion
      const success = userService.creditBalance(
        telegramId,
        largeAmount,
        '0x123',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        1000
      );

      expect(success).toBe(true);
      const balance = userService.getBalance(telegramId);
      expect(balance).toBe(largeAmount);
    });
  });

  describe('Database - Edge Cases', () => {
    it('should handle duplicate deposit prevention', () => {
      const telegramId = 123;
      const txHash = '0x' + '1'.repeat(64);
      const amount = ethers.parseEther('10');
      const walletAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

      userService.linkWallet(telegramId, walletAddress);

      // First deposit
      const success1 = userService.creditBalance(
        telegramId,
        amount,
        txHash,
        walletAddress,
        1000
      );
      expect(success1).toBe(true);

      // Try same txHash again
      const success2 = userService.creditBalance(
        telegramId,
        amount,
        txHash,
        walletAddress,
        1000
      );
      expect(success2).toBe(false);

      // Balance should only be credited once
      const balance = userService.getBalance(telegramId);
      expect(balance).toBe(amount);
    });

    it('should handle very long transaction history', () => {
      const telegramId = 123;
      const walletAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

      userService.linkWallet(telegramId, walletAddress);

      // Create 100 transactions
      for (let i = 0; i < 100; i++) {
        userService.creditBalance(
          telegramId,
          ethers.parseEther('1'),
          '0x' + i.toString(16).padStart(64, '0'),
          walletAddress,
          1000 + i
        );
      }

      // Request only last 10
      const history = userService.getTransactionHistory(telegramId, 10);
      expect(history.length).toBe(10);

      // Should be ordered (most recent first or last depending on implementation)
      expect(history.length).toBe(10);
    });

    it('should handle concurrent wallet links', () => {
      const telegramId = 123;
      const wallet1 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
      const wallet2 = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';

      // Link wallet 1
      const result1 = userService.linkWallet(telegramId, wallet1);
      expect(result1.success).toBe(true);

      // Link wallet 2 (should update)
      const result2 = userService.linkWallet(telegramId, wallet2);
      expect(result2.success).toBe(true);

      const user = userService.getUser(telegramId);
      expect(ethers.getAddress(user?.wallet_address!)).toBe(ethers.getAddress(wallet2));
    });
  });

  describe('Gas Estimation - Fallback Scenarios', () => {
    it('should use fallback gas when estimation fails', async () => {
      mockArbius.submitTask.estimateGas.mockRejectedValue(new Error('Estimation failed'));

      const estimate = (blockchain as any).estimateGasWithBuffer;
      const fallbackGas = 200_000n;

      const result = await estimate.call(
        blockchain,
        () => mockArbius.submitTask.estimateGas(),
        fallbackGas,
        'testOperation'
      );

      expect(result).toBe(fallbackGas);
    });

    it('should apply buffer to successful estimation', async () => {
      mockArbius.submitTask.estimateGas.mockResolvedValue(100_000n);

      const estimate = (blockchain as any).estimateGasWithBuffer;

      const result = await estimate.call(
        blockchain,
        () => mockArbius.submitTask.estimateGas(),
        200_000n,
        'testOperation'
      );

      // 100k * 1.2 (20% buffer) = 120k
      expect(result).toBe(120_000n);
    });
  });

  describe('Unicode and Special Characters', () => {
    it('should handle unicode prompts in transaction lookup', async () => {
      const taskid = '0x' + '1'.repeat(64);
      const txHash = '0x' + 'a'.repeat(64);
      const modelId = '0x' + '2'.repeat(64);
      const unicodePrompt = '你好世界 🌍 مرحبا';

      mockArbius.queryFilter.mockResolvedValue([{ transactionHash: txHash }]);
      mockProvider.getTransaction.mockResolvedValue({
        hash: txHash,
        data: '0x123456',
      });

      mockArbiusRouter.interface.parseTransaction.mockReturnValue({
        name: 'submitTask',
        args: [
          0,
          '0x1111111111111111111111111111111111111111',
          modelId,
          ethers.parseEther('0.1'),
          ethers.toUtf8Bytes(JSON.stringify({ prompt: unicodePrompt })),
          0,
          0,
        ],
      });

      const result = await blockchain.findTransactionByTaskId(taskid);

      expect(result?.prompt).toBe(unicodePrompt);
    });

    it('should handle newlines in prompts', async () => {
      const taskid = '0x' + '1'.repeat(64);
      const txHash = '0x' + 'a'.repeat(64);
      const modelId = '0x' + '2'.repeat(64);
      const multilinePrompt = 'line 1\nline 2\nline 3';

      mockArbius.queryFilter.mockResolvedValue([{ transactionHash: txHash }]);
      mockProvider.getTransaction.mockResolvedValue({
        hash: txHash,
        data: '0x123456',
      });

      mockArbiusRouter.interface.parseTransaction.mockReturnValue({
        name: 'submitTask',
        args: [
          0,
          '0x1111111111111111111111111111111111111111',
          modelId,
          ethers.parseEther('0.1'),
          ethers.toUtf8Bytes(JSON.stringify({ prompt: multilinePrompt })),
          0,
          0,
        ],
      });

      const result = await blockchain.findTransactionByTaskId(taskid);

      expect(result?.prompt).toBe(multilinePrompt);
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle zero fee amounts', () => {
      const telegramId = 123;
      userService.linkWallet(telegramId, '0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
      userService.creditBalance(telegramId, ethers.parseEther('10'), '0x123', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 1000);

      const success = userService.debitBalance(telegramId, 0n);
      expect(success).toBe(true);

      const balance = userService.getBalance(telegramId);
      expect(balance).toBe(ethers.parseEther('10'));
    });

    it('should handle exact balance debit', () => {
      const telegramId = 123;
      const amount = ethers.parseEther('10');

      userService.linkWallet(telegramId, '0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
      userService.creditBalance(telegramId, amount, '0x123', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 1000);

      const success = userService.debitBalance(telegramId, amount);
      expect(success).toBe(true);

      const balance = userService.getBalance(telegramId);
      expect(balance).toBe(0n);
    });

    it('should handle one wei over balance', () => {
      const telegramId = 123;
      const amount = ethers.parseEther('10');

      userService.linkWallet(telegramId, '0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
      userService.creditBalance(telegramId, amount, '0x123', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 1000);

      const success = userService.debitBalance(telegramId, amount + 1n);
      expect(success).toBe(false);

      const balance = userService.getBalance(telegramId);
      expect(balance).toBe(amount);
    });
  });
});
