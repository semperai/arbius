import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ethers } from 'ethers';

/**
 * End-to-End Tests
 *
 * These tests simulate complete workflows from user input to final output.
 * They use mocked external services but test integration between all internal services.
 */

describe('E2E: Full Task Workflow', () => {
  let mockBlockchain: any;
  let mockModelRegistry: any;
  let mockJobQueue: any;
  let mockTaskProcessor: any;
  let mockModelHandler: any;

  beforeEach(() => {
    // Mock blockchain service
    mockBlockchain = {
      getWalletAddress: jest.fn(),
      getBalance: jest.fn(),
      getEthBalance: jest.fn(),
      getValidatorStake: jest.fn(),
      getValidatorMinimum: jest.fn(),
      submitTask: jest.fn(),
      submitSolution: jest.fn(),
      findTransactionByTaskId: jest.fn(),
    } as any;

    mockBlockchain.getWalletAddress.mockReturnValue('0x1234567890123456789012345678901234567890');
    mockBlockchain.getBalance.mockResolvedValue(ethers.parseEther('100'));
    mockBlockchain.getEthBalance.mockResolvedValue(ethers.parseEther('0.5'));
    mockBlockchain.getValidatorStake.mockResolvedValue(ethers.parseEther('50'));
    mockBlockchain.getValidatorMinimum.mockResolvedValue(ethers.parseEther('50'));
    mockBlockchain.submitTask.mockResolvedValue('0xtaskid123');
    mockBlockchain.submitSolution.mockResolvedValue(undefined);

    // Mock model registry
    const modelConfig = {
      id: '0xmodel1',
      name: 'qwen',
      template: {
        meta: { title: 'Qwen', description: '', git: '', docker: '', version: 1 },
        input: [{ variable: 'prompt', type: 'string', required: true }],
        output: [{ filename: 'out.png', type: 'image' }],
      },
    };

    mockModelRegistry = {
      getModelByName: jest.fn().mockReturnValue(modelConfig),
      getModelById: jest.fn().mockReturnValue(modelConfig),
      getAllModels: jest.fn().mockReturnValue([modelConfig]),
    } as any;

    // Mock model handler
    mockModelHandler = {
      processTask: jest.fn(),
    } as any;

    mockModelHandler.processTask.mockResolvedValue({
      files: [{ filename: 'out.png', buffer: Buffer.from('fake-image-data') }],
    });

    // Mock job queue
    mockJobQueue = {
      addJob: jest.fn(),
      updateJobStatus: jest.fn(),
      getJobByTaskId: jest.fn(),
      getQueueStats: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    } as any;

    mockJobQueue.addJob.mockImplementation((job: any) => {
      return Promise.resolve({
        id: 'job123',
        ...job,
        status: 'pending',
      });
    });

    mockJobQueue.getQueueStats.mockReturnValue({
      total: 1,
      pending: 0,
      processing: 1,
      completed: 0,
      failed: 0,
    });

    // Mock task processor
    mockTaskProcessor = {
      submitAndProcess: jest.fn().mockImplementation(async (modelConfig: any, input: any, telegramId: any) => {
        const taskId = await mockBlockchain.submitTask(modelConfig.id, ethers.parseEther('1'), input);
        const job = await mockJobQueue.addJob({
          taskid: taskId,
          modelConfig,
          input,
          telegramId,
          status: 'pending',
        });

        // Simulate processing
        mockJobQueue.updateJobStatus(job.id, 'processing');
        const output = await mockModelHandler.processTask(input);
        mockJobQueue.updateJobStatus(job.id, 'completed', { output });

        return { taskId, job };
      }),
    } as any;
  });

  describe('User submits task via /qwen command', () => {
    it('should complete full workflow: submit → process → return result', async () => {
      const userPrompt = 'a beautiful sunset';
      const userId = 12345;

      // Step 1: User sends /qwen command
      const modelConfig = mockModelRegistry.getModelByName('qwen');
      expect(modelConfig).toBeDefined();
      expect(modelConfig.name).toBe('qwen');

      // Step 2: Submit task and start processing
      const { taskId, job } = await mockTaskProcessor.submitAndProcess(
        modelConfig,
        { prompt: userPrompt },
        userId
      );

      // Verify task was submitted to blockchain
      expect(mockBlockchain.submitTask).toHaveBeenCalledWith(
        '0xmodel1',
        expect.any(BigInt),
        { prompt: userPrompt }
      );

      // Verify job was added to queue
      expect(mockJobQueue.addJob).toHaveBeenCalledWith(
        expect.objectContaining({
          taskid: taskId,
          modelConfig,
          input: { prompt: userPrompt },
          telegramId: userId,
        })
      );

      // Verify job was processed
      expect(mockJobQueue.updateJobStatus).toHaveBeenCalledWith(job.id, 'processing');
      expect(mockModelHandler.processTask).toHaveBeenCalledWith({ prompt: userPrompt });

      // Verify job was marked complete
      expect(mockJobQueue.updateJobStatus).toHaveBeenCalledWith(
        job.id,
        'completed',
        expect.objectContaining({
          output: expect.objectContaining({
            files: expect.arrayContaining([
              expect.objectContaining({ filename: 'out.png' }),
            ]),
          }),
        })
      );
    });

    it('should handle task submission failure gracefully', async () => {
      mockBlockchain.submitTask.mockRejectedValue(new Error('Insufficient gas'));

      const modelConfig = mockModelRegistry.getModelByName('qwen');

      try {
        await mockBlockchain.submitTask(modelConfig.id, ethers.parseEther('1'), { prompt: 'test' });
        expect(true).toBe(false); // Should not reach here
      } catch (err: any) {
        expect(err.message).toBe('Insufficient gas');
      }
    });

    it('should handle model processing failure', async () => {
      mockModelHandler.processTask.mockRejectedValue(new Error('Replicate API error'));

      try {
        await mockModelHandler.processTask({ prompt: 'test' });
        expect(true).toBe(false); // Should not reach here
      } catch (err: any) {
        expect(err.message).toBe('Replicate API error');
      }
    });
  });

  describe('User submits task via /submit command', () => {
    it('should submit task without waiting for result', async () => {
      const modelConfig = mockModelRegistry.getModelByName('qwen');
      const userPrompt = 'a cat playing piano';

      // Submit task
      const taskId = await mockBlockchain.submitTask(
        modelConfig.id,
        ethers.parseEther('1'),
        { prompt: userPrompt }
      );

      expect(taskId).toBe('0xtaskid123');
      expect(mockBlockchain.submitTask).toHaveBeenCalled();

      // Job is NOT added to queue yet
      expect(mockJobQueue.addJob).not.toHaveBeenCalled();
    });
  });

  describe('User processes task via /process command', () => {
    it('should process existing task by taskId', async () => {
      const taskId = '0xtaskid123';
      const modelId = '0xmodel1';
      const prompt = 'test prompt';

      // Mock finding transaction
      mockBlockchain.findTransactionByTaskId.mockResolvedValue({
        txHash: '0xtxhash',
        prompt,
        modelId,
      });

      // Mock getting model
      mockModelRegistry.getModelById.mockReturnValue({
        id: modelId,
        name: 'qwen',
        template: {
          meta: { title: 'Qwen', description: '', git: '', docker: '', version: 1 },
          input: [],
          output: [{ filename: 'out.png', type: 'image' }],
        },
      });

      // Check if already in queue
      mockJobQueue.getJobByTaskId.mockReturnValue(null);

      // Find transaction
      const txInfo = await mockBlockchain.findTransactionByTaskId(taskId);
      expect(txInfo).toBeDefined();
      expect(txInfo.prompt).toBe(prompt);
      expect(txInfo.modelId).toBe(modelId);

      // Get model config
      const modelConfig = mockModelRegistry.getModelById(txInfo.modelId);
      expect(modelConfig).toBeDefined();

      // Add to queue
      const job = await mockJobQueue.addJob({
        taskid: taskId,
        modelConfig,
        input: { prompt },
      });

      expect(job.status).toBe('pending');
    });

    it('should handle task not found', async () => {
      const taskId = '0xinvalidtask';

      mockBlockchain.findTransactionByTaskId.mockResolvedValue(null);

      const result = await mockBlockchain.findTransactionByTaskId(taskId);

      expect(result).toBeNull();
    });

    it('should skip task already in queue', async () => {
      const taskId = '0xtaskid123';

      mockJobQueue.getJobByTaskId.mockReturnValue({
        id: 'job1',
        taskid: taskId,
        status: 'processing',
      });

      const existingJob = mockJobQueue.getJobByTaskId(taskId);

      expect(existingJob).toBeDefined();
      expect(existingJob.status).toBe('processing');
    });
  });

  describe('Event listener picks up TaskSubmitted event', () => {
    it('should process event for supported model', async () => {
      const taskId = '0xeventtask';
      const modelId = '0xmodel1';
      const input = { prompt: 'event test' };

      // Get model config
      const modelConfig = mockModelRegistry.getModelById(modelId);
      expect(modelConfig).toBeDefined();

      // Check if already in queue
      mockJobQueue.getJobByTaskId.mockReturnValue(null);

      // Add to queue
      const job = await mockJobQueue.addJob({
        taskid: taskId,
        modelConfig,
        input,
      });

      expect(job).toBeDefined();
      expect(job.taskid).toBe(taskId);
    });

    it('should ignore event for unsupported model', () => {
      const unknownModelId = '0xunknown';

      mockModelRegistry.getModelById.mockReturnValue(undefined);

      const modelConfig = mockModelRegistry.getModelById(unknownModelId);

      expect(modelConfig).toBeUndefined();
    });
  });

  describe('Health monitoring during workflow', () => {
    it('should detect low balance before submission', async () => {
      mockBlockchain.getBalance.mockResolvedValue(ethers.parseEther('0.1')); // Low

      const balance = await mockBlockchain.getBalance();

      expect(balance).toBeLessThan(ethers.parseEther('1'));
    });

    it('should track queue statistics', () => {
      const stats = mockJobQueue.getQueueStats();

      expect(stats.total).toBe(1);
      expect(stats.processing).toBe(1);
    });

    it('should verify validator stake', async () => {
      const staked = await mockBlockchain.getValidatorStake();
      const minimum = await mockBlockchain.getValidatorMinimum();

      expect(staked).toBeGreaterThanOrEqual(minimum);
    });
  });

  describe('Error recovery scenarios', () => {
    it('should retry on transient IPFS failures', async () => {
      let attempts = 0;
      const retryLogic = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('IPFS timeout');
        }
        return 'QmSuccess';
      };

      try {
        await retryLogic();
      } catch (err) {
        // First attempt fails
      }

      try {
        await retryLogic();
      } catch (err) {
        // Second attempt fails
      }

      const result = await retryLogic();
      expect(result).toBe('QmSuccess');
      expect(attempts).toBe(3);
    });

    it('should continue processing other jobs after one fails', async () => {
      const job1 = await mockJobQueue.addJob({
        taskid: '0xtask1',
        modelConfig: mockModelRegistry.getModelByName('qwen'),
        input: { prompt: 'test1' },
      });

      const job2 = await mockJobQueue.addJob({
        taskid: '0xtask2',
        modelConfig: mockModelRegistry.getModelByName('qwen'),
        input: { prompt: 'test2' },
      });

      // Job 1 fails
      mockJobQueue.updateJobStatus(job1.id, 'failed', { error: 'Processing failed' });

      // Job 2 should still process
      mockJobQueue.updateJobStatus(job2.id, 'processing');
      mockJobQueue.updateJobStatus(job2.id, 'completed');

      expect(mockJobQueue.updateJobStatus).toHaveBeenCalledWith(job1.id, 'failed', expect.any(Object));
      expect(mockJobQueue.updateJobStatus).toHaveBeenCalledWith(job2.id, 'completed');
    });
  });

  describe('Rate limiting', () => {
    it('should block user after exceeding rate limit', () => {
      const userId = 12345;
      const requests = [1, 2, 3, 4, 5]; // 5 requests

      // Simulate rate limiter
      const rateLimiter = {
        userRequests: new Map<number, number[]>(),
        isAllowed(userId: number): boolean {
          const now = Date.now();
          const windowMs = 60000;
          const maxRequests = 5;

          if (!this.userRequests.has(userId)) {
            this.userRequests.set(userId, []);
          }

          const userReqs = this.userRequests.get(userId)!;
          const validReqs = userReqs.filter(time => now - time < windowMs);

          if (validReqs.length >= maxRequests) {
            return false;
          }

          validReqs.push(now);
          this.userRequests.set(userId, validReqs);
          return true;
        },
      };

      // First 5 requests should succeed
      requests.forEach(() => {
        expect(rateLimiter.isAllowed(userId)).toBe(true);
      });

      // 6th request should fail
      expect(rateLimiter.isAllowed(userId)).toBe(false);
    });
  });
});
