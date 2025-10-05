import { vi } from 'vitest';
import { TaskProcessor } from '../../src/services/TaskProcessor';
import { BlockchainService } from '../../src/services/BlockchainService';
import { JobQueue } from '../../src/services/JobQueue';
import { UserService } from '../../src/services/UserService';
import { GasAccountingService } from '../../src/services/GasAccountingService';
import { ModelHandlerFactory } from '../../src/services/ModelHandler';
import { ethers } from 'ethers';

// Mock dependencies
vi.mock('../../src/log', () => ({
  log: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  initializeLogger: vi.fn(),
}));
vi.mock('../../src/services/ModelHandler');
vi.mock('../../src/ipfs');

describe('TaskProcessor', () => {
  let taskProcessor: TaskProcessor;
  let mockBlockchain: vi.Mocked<BlockchainService>;
  let mockJobQueue: vi.Mocked<JobQueue>;
  let mockUserService: vi.Mocked<UserService>;
  let mockGasAccounting: vi.Mocked<GasAccountingService>;
  let mockModelHandler: any;

  const mockMiningConfig: any = {
    replicateApiKey: 'test-key',
    ipfsGateways: ['https://gateway1.com', 'https://gateway2.com'],
    log_path: './test.log',
    db_path: './test.db',
    stake_buffer_percent: 10,
    stake_buffer_topup_percent: 5,
    models: [],
    rpc_url: 'http://test-rpc.com',
    private_key: '0x1234',
    arbius_address: '0xarbius',
    arbius_router_address: '0xrouter',
    token_address: '0xtoken',
  };

  const mockModelConfig: any = {
    id: '0xmodel123',
    name: 'test-model',
    template: {
      meta: { title: 'Test Model', description: '', git: '', docker: '', version: 1 },
      input: [{
        variable: 'prompt',
        type: 'string' as const,
        required: true,
        default: '',
        description: 'Test prompt',
      }],
      output: [],
    },
  };

  beforeEach(() => {
    // Mock BlockchainService
    mockBlockchain = {
      getSolution: vi.fn(),
      submitSolution: vi.fn(),
      submitTask: vi.fn(),
      getArbiusContract: vi.fn(),
      getProvider: vi.fn(),
      findTransactionByTaskId: vi.fn(),
    } as any;

    // Mock JobQueue
    mockJobQueue = {
      addJob: vi.fn(),
      updateJobStatus: vi.fn(),
    } as any;

    // Mock UserService
    mockUserService = {
      reserveBalance: vi.fn(),
      cancelReservation: vi.fn(),
      finalizeReservation: vi.fn(),
      getAvailableBalance: vi.fn(),
      refundTask: vi.fn(),
      adminCredit: vi.fn(),
    } as any;

    // Mock GasAccountingService
    mockGasAccounting = {
      estimateGasCostInAius: vi.fn(),
      calculateGasCostInAius: vi.fn(),
    } as any;

    // Mock ModelHandler
    mockModelHandler = {
      getCid: vi.fn(),
    };

    (ModelHandlerFactory.createHandler as vi.Mock) = vi.fn().mockReturnValue(mockModelHandler);

    taskProcessor = new TaskProcessor(
      mockBlockchain,
      mockMiningConfig,
      mockJobQueue
    );
  });

  describe('processTask', () => {
    const mockJob = {
      id: 'job-123',
      taskid: '0xtask123',
      modelConfig: mockModelConfig,
      input: { prompt: 'test prompt' },
      status: 'pending' as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    it('should skip if task already solved', async () => {
      mockBlockchain.getSolution.mockResolvedValue({
        validator: '0xvalidator',
        cid: '0xcid123',
      });

      await taskProcessor.processTask(mockJob);

      expect(mockJobQueue.updateJobStatus).toHaveBeenCalledWith(
        'job-123',
        'completed',
        { cid: '0xcid123' }
      );
      expect(mockModelHandler.getCid).not.toHaveBeenCalled();
    });

    it('should process task and submit solution', async () => {
      mockBlockchain.getSolution
        .mockResolvedValueOnce({ validator: ethers.ZeroAddress, cid: '' } as any)
        .mockResolvedValueOnce({ validator: ethers.ZeroAddress, cid: '' } as any);

      mockModelHandler.getCid.mockResolvedValue('0xnewcid');
      mockBlockchain.submitSolution.mockResolvedValue(undefined);

      await taskProcessor.processTask(mockJob);

      expect(mockModelHandler.getCid).toHaveBeenCalledWith('0xtask123', mockJob.input);
      expect(mockBlockchain.submitSolution).toHaveBeenCalledWith('0xtask123', '0xnewcid');
      expect(mockJobQueue.updateJobStatus).toHaveBeenCalledWith(
        'job-123',
        'completed',
        { cid: '0xnewcid' }
      );
    });

    it('should handle case where another validator solved with different CID', async () => {
      mockBlockchain.getSolution
        .mockResolvedValueOnce({ validator: ethers.ZeroAddress, cid: '' } as any)
        .mockResolvedValueOnce({ validator: '0xother', cid: '0xothercid' });

      mockModelHandler.getCid.mockResolvedValue('0xmycid');

      await taskProcessor.processTask(mockJob);

      expect(mockJobQueue.updateJobStatus).toHaveBeenCalledWith(
        'job-123',
        'failed',
        { error: 'Task solved by another validator', cid: '0xmycid' }
      );
      expect(mockBlockchain.submitSolution).not.toHaveBeenCalled();
    });

    it('should handle case where another validator solved with same CID', async () => {
      mockBlockchain.getSolution
        .mockResolvedValueOnce({ validator: ethers.ZeroAddress, cid: '' } as any)
        .mockResolvedValueOnce({ validator: '0xother', cid: '0xsamecid' });

      mockModelHandler.getCid.mockResolvedValue('0xsamecid');

      await taskProcessor.processTask(mockJob);

      expect(mockJobQueue.updateJobStatus).toHaveBeenCalledWith(
        'job-123',
        'completed',
        { cid: '0xsamecid' }
      );
      expect(mockBlockchain.submitSolution).not.toHaveBeenCalled();
    });

    it('should throw error if CID generation fails', async () => {
      mockBlockchain.getSolution.mockResolvedValue({ validator: ethers.ZeroAddress, cid: '' } as any);
      mockModelHandler.getCid.mockResolvedValue(null);

      await expect(taskProcessor.processTask(mockJob)).rejects.toThrow('Failed to generate CID');

      expect(mockJobQueue.updateJobStatus).toHaveBeenCalledWith(
        'job-123',
        'failed',
        expect.objectContaining({ error: expect.any(String) })
      );
    });

    it('should mark job as failed and throw on error', async () => {
      mockBlockchain.getSolution.mockRejectedValue(new Error('Blockchain error'));

      await expect(taskProcessor.processTask(mockJob)).rejects.toThrow('Blockchain error');

      expect(mockJobQueue.updateJobStatus).toHaveBeenCalledWith(
        'job-123',
        'failed',
        { error: 'Blockchain error' }
      );
    });

    it('should refund user on task failure when userService is configured', async () => {
      const processorWithUser = new TaskProcessor(
        mockBlockchain,
        mockMiningConfig,
        mockJobQueue,
        mockUserService
      );

      mockBlockchain.getSolution.mockRejectedValue(new Error('Task failed'));
      mockUserService.refundTask.mockReturnValue(true);

      await expect(processorWithUser.processTask(mockJob)).rejects.toThrow('Task failed');

      expect(mockUserService.refundTask).toHaveBeenCalledWith('0xtask123');
    });

    it('should award random reward when user wins', async () => {
      const processorWithUser = new TaskProcessor(
        mockBlockchain,
        mockMiningConfig,
        mockJobQueue,
        mockUserService
      );

      const jobWithChat = {
        ...mockJob,
        chatId: 123,
        telegramId: 456,
      };

      // Mock winning condition (Math.random returns 0, which equals 0 after floor)
      vi.spyOn(Math, 'random').mockReturnValue(0);

      process.env.REWARD_CHANCE = '20';
      process.env.REWARD_AMOUNT = '1';

      mockBlockchain.getSolution
        .mockResolvedValueOnce({ validator: ethers.ZeroAddress, cid: '' } as any)
        .mockResolvedValueOnce({ validator: ethers.ZeroAddress, cid: '' } as any);

      mockModelHandler.getCid.mockResolvedValue('0xnewcid');
      mockBlockchain.submitSolution.mockResolvedValue(undefined);
      mockUserService.adminCredit.mockReturnValue(true);

      await processorWithUser.processTask(jobWithChat);

      expect(mockUserService.adminCredit).toHaveBeenCalledWith(
        456,
        ethers.parseEther('1'),
        'Lucky reward for task 0xtask123'
      );
      expect(mockJobQueue.updateJobStatus).toHaveBeenCalledWith(
        'job-123',
        'completed',
        { cid: '0xnewcid', wonReward: true }
      );
    });

    it('should not award reward when user does not win', async () => {
      const processorWithUser = new TaskProcessor(
        mockBlockchain,
        mockMiningConfig,
        mockJobQueue,
        mockUserService
      );

      const jobWithChat = {
        ...mockJob,
        chatId: 123,
        telegramId: 456,
      };

      // Mock losing condition (Math.random returns value that doesn't equal 0 after floor)
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      process.env.REWARD_CHANCE = '20';
      process.env.REWARD_AMOUNT = '1';

      mockBlockchain.getSolution
        .mockResolvedValueOnce({ validator: ethers.ZeroAddress, cid: '' } as any)
        .mockResolvedValueOnce({ validator: ethers.ZeroAddress, cid: '' } as any);

      mockModelHandler.getCid.mockResolvedValue('0xnewcid');
      mockBlockchain.submitSolution.mockResolvedValue(undefined);

      await processorWithUser.processTask(jobWithChat);

      expect(mockUserService.adminCredit).not.toHaveBeenCalled();
      expect(mockJobQueue.updateJobStatus).toHaveBeenCalledWith(
        'job-123',
        'completed',
        { cid: '0xnewcid' }
      );
    });

    it('should not award reward when job has no chatId', async () => {
      const processorWithUser = new TaskProcessor(
        mockBlockchain,
        mockMiningConfig,
        mockJobQueue,
        mockUserService
      );

      // Mock winning condition
      vi.spyOn(Math, 'random').mockReturnValue(0);

      mockBlockchain.getSolution
        .mockResolvedValueOnce({ validator: ethers.ZeroAddress, cid: '' } as any)
        .mockResolvedValueOnce({ validator: ethers.ZeroAddress, cid: '' } as any);

      mockModelHandler.getCid.mockResolvedValue('0xnewcid');
      mockBlockchain.submitSolution.mockResolvedValue(undefined);

      await processorWithUser.processTask(mockJob);

      expect(mockUserService.adminCredit).not.toHaveBeenCalled();
    });

    it('should handle different reward chances correctly', async () => {
      const processorWithUser = new TaskProcessor(
        mockBlockchain,
        mockMiningConfig,
        mockJobQueue,
        mockUserService
      );

      const jobWithChat = {
        ...mockJob,
        chatId: 123,
        telegramId: 456,
      };

      // Test with 1 in 10 chance
      process.env.REWARD_CHANCE = '10';
      process.env.REWARD_AMOUNT = '5';

      // Mock winning condition for 1 in 10
      vi.spyOn(Math, 'random').mockReturnValue(0);

      mockBlockchain.getSolution
        .mockResolvedValueOnce({ validator: ethers.ZeroAddress, cid: '' } as any)
        .mockResolvedValueOnce({ validator: ethers.ZeroAddress, cid: '' } as any);

      mockModelHandler.getCid.mockResolvedValue('0xnewcid');
      mockBlockchain.submitSolution.mockResolvedValue(undefined);
      mockUserService.adminCredit.mockReturnValue(true);

      await processorWithUser.processTask(jobWithChat);

      expect(mockUserService.adminCredit).toHaveBeenCalledWith(
        456,
        ethers.parseEther('5'),
        'Lucky reward for task 0xtask123'
      );
    });
  });

  describe('refundTask', () => {
    it('should refund task when userService is configured', () => {
      const processorWithUser = new TaskProcessor(
        mockBlockchain,
        mockMiningConfig,
        mockJobQueue,
        mockUserService
      );

      mockUserService.refundTask.mockReturnValue(true);

      const result = processorWithUser.refundTask('0xtask123');

      expect(result).toBe(true);
      expect(mockUserService.refundTask).toHaveBeenCalledWith('0xtask123');
    });

    it('should return false when userService not configured', () => {
      const result = taskProcessor.refundTask('0xtask123');
      expect(result).toBe(false);
    });
  });

  describe('submitAndQueueTask', () => {
    it('should submit task without payment system', async () => {
      mockBlockchain.submitTask.mockResolvedValue('0xnewtask');
      mockJobQueue.addJob.mockResolvedValue({
        id: 'job-new',
        taskid: '0xnewtask',
        modelConfig: mockModelConfig,
        input: { prompt: 'test' },
        status: 'pending',
        createdAt: Date.now(),
      });

      const result = await taskProcessor.submitAndQueueTask(
        mockModelConfig,
        { prompt: 'test prompt' }
      );

      expect(result.taskid).toBe('0xnewtask');
      expect(result.job.id).toBe('job-new');
      expect(mockBlockchain.submitTask).toHaveBeenCalledWith(
        '0xmodel123',
        JSON.stringify({ prompt: 'test prompt' }),
        0n
      );
      expect(mockJobQueue.addJob).toHaveBeenCalled();
    });

    it('should reserve balance and submit task with payment system', async () => {
      const processorWithPayment = new TaskProcessor(
        mockBlockchain,
        mockMiningConfig,
        mockJobQueue,
        mockUserService,
        mockGasAccounting
      );

      const mockContract = {
        models: vi.fn(),
      };
      mockContract.models.mockResolvedValue({ fee: BigInt('1000000000000000000') });
      mockBlockchain.getArbiusContract.mockReturnValue(mockContract as any);
      mockBlockchain.getProvider.mockReturnValue({} as any);
      mockGasAccounting.estimateGasCostInAius.mockResolvedValue(BigInt('10000000000000000'));
      mockUserService.reserveBalance.mockReturnValue('res_123');
      mockBlockchain.submitTask.mockResolvedValue('0xnewtask');
      mockBlockchain.findTransactionByTaskId.mockResolvedValue({
        txHash: '0xtxhash',
        prompt: 'test',
        modelId: '0xmodel1',
      });
      mockBlockchain.getProvider.mockReturnValue({
        getTransactionReceipt: vi.fn().mockResolvedValue({
          gasUsed: 150000n,
          gasPrice: 50000000000n,
        }),
      } as any);
      mockGasAccounting.calculateGasCostInAius.mockResolvedValue({
        gasCostAius: BigInt('8000000000000000'),
        gasCostWei: BigInt('400000000000000'),
        gasUsed: 150000n,
        gasPrice: 50000000000n,
        aiusPerEth: BigInt('100000000000000000000'),
      });
      mockUserService.finalizeReservation.mockReturnValue(true);
      mockJobQueue.addJob.mockResolvedValue({
        id: 'job-paid',
        taskid: '0xnewtask',
        modelConfig: mockModelConfig,
        input: { prompt: 'test' },
        status: 'pending',
        createdAt: Date.now(),
      });

      const result = await processorWithPayment.submitAndQueueTask(
        mockModelConfig,
        { prompt: 'paid task' },
        0n,
        { telegramId: 123, chatId: 456, messageId: 789 }
      );

      expect(mockUserService.reserveBalance).toHaveBeenCalled();
      expect(mockBlockchain.submitTask).toHaveBeenCalled();
      expect(mockUserService.finalizeReservation).toHaveBeenCalled();
      expect(result.taskid).toBe('0xnewtask');
      expect(result.estimatedCost).toBeDefined();
    });

    it('should cancel reservation if blockchain submission fails', async () => {
      const processorWithPayment = new TaskProcessor(
        mockBlockchain,
        mockMiningConfig,
        mockJobQueue,
        mockUserService,
        mockGasAccounting
      );

      const mockContract = {
        models: vi.fn(),
      };
      mockContract.models.mockResolvedValue({ fee: BigInt('1000000000000000000') });
      mockBlockchain.getArbiusContract.mockReturnValue(mockContract as any);
      mockBlockchain.getProvider.mockReturnValue({} as any);
      mockGasAccounting.estimateGasCostInAius.mockResolvedValue(BigInt('10000000000000000'));
      mockUserService.reserveBalance.mockReturnValue('res_123');
      mockBlockchain.submitTask.mockRejectedValue(new Error('Blockchain error'));

      await expect(
        processorWithPayment.submitAndQueueTask(
          mockModelConfig,
          { prompt: 'test' },
          0n,
          { telegramId: 123 }
        )
      ).rejects.toThrow('Blockchain error');

      expect(mockUserService.cancelReservation).toHaveBeenCalledWith('res_123');
    });

    it('should throw if insufficient balance', async () => {
      const processorWithPayment = new TaskProcessor(
        mockBlockchain,
        mockMiningConfig,
        mockJobQueue,
        mockUserService,
        mockGasAccounting
      );

      const mockContract = {
        models: vi.fn(),
      };
      mockContract.models.mockResolvedValue({ fee: BigInt('1000000000000000000') });
      mockBlockchain.getArbiusContract.mockReturnValue(mockContract as any);
      mockBlockchain.getProvider.mockReturnValue({} as any);
      mockGasAccounting.estimateGasCostInAius.mockResolvedValue(BigInt('10000000000000000'));
      mockUserService.reserveBalance.mockReturnValue(null); // Insufficient balance
      mockUserService.getAvailableBalance.mockReturnValue(BigInt('100000000000000000'));

      await expect(
        processorWithPayment.submitAndQueueTask(
          mockModelConfig,
          { prompt: 'test' },
          0n,
          { telegramId: 123 }
        )
      ).rejects.toThrow('Insufficient balance');
    });
  });

  describe('processExistingTask', () => {
    it('should process existing task from blockchain', async () => {
      mockBlockchain.findTransactionByTaskId.mockResolvedValue({
        txHash: '0xtxhash',
        prompt: 'existing prompt',
        modelId: '0xmodel1',
      });
      mockJobQueue.addJob.mockResolvedValue({
        id: 'job-existing',
        taskid: '0xexistingtask',
        modelConfig: mockModelConfig,
        input: { prompt: 'existing prompt' },
        status: 'pending',
        createdAt: Date.now(),
      });

      const result = await taskProcessor.processExistingTask(
        '0xexistingtask',
        mockModelConfig,
        { chatId: 123, messageId: 456 }
      );

      expect(result.id).toBe('job-existing');
      expect(mockJobQueue.addJob).toHaveBeenCalledWith({
        taskid: '0xexistingtask',
        modelConfig: mockModelConfig,
        input: { prompt: 'existing prompt' },
        chatId: 123,
        messageId: 456,
      });
    });

    it('should throw if transaction not found', async () => {
      mockBlockchain.findTransactionByTaskId.mockResolvedValue(null);

      await expect(
        taskProcessor.processExistingTask('0xnonexistent', mockModelConfig)
      ).rejects.toThrow('Could not find transaction data');
    });
  });
});
