import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import { ModelRegistry } from '../../src/services/ModelRegistry';
import { JobQueue } from '../../src/services/JobQueue';
import { TaskProcessor } from '../../src/services/TaskProcessor';
import { ModelConfig, MiningConfig } from '../../src/types';

// Mock blockchain service
// @ts-ignore - Mock service for testing
const createMockBlockchainService = (): any => ({
  // @ts-ignore
  getWalletAddress: jest.fn().mockReturnValue('0x1234567890123456789012345678901234567890'),
  // @ts-ignore
  getBalance: jest.fn().mockResolvedValue(1000000000000000000n),
  // @ts-ignore
  getValidatorStake: jest.fn().mockResolvedValue(500000000000000000n),
  // @ts-ignore
  submitTask: jest.fn().mockResolvedValue('0xmocktaskid123'),
  // @ts-ignore
  submitSolution: jest.fn().mockResolvedValue(undefined),
  // @ts-ignore
  signalCommitment: jest.fn().mockResolvedValue(undefined),
  // @ts-ignore
  getSolution: jest.fn().mockResolvedValue({
    validator: '0x0000000000000000000000000000000000000000',
    cid: '',
  }),
  // @ts-ignore
  findTransactionByTaskId: jest.fn().mockResolvedValue({
    txHash: '0xtxhash',
    prompt: 'test prompt',
  }),
  getArbiusContract: jest.fn(),
  getProvider: jest.fn(),
  // @ts-ignore
  ensureApproval: jest.fn().mockResolvedValue(undefined),
  // @ts-ignore
  ensureValidatorStake: jest.fn().mockResolvedValue(undefined),
  // @ts-ignore
  getValidatorMinimum: jest.fn().mockResolvedValue(100000000000000000n),
  // @ts-ignore
  getEthBalance: jest.fn().mockResolvedValue(1000000000000000000n),
});

// Mock mining config
const mockMiningConfig: MiningConfig = {
  log_path: 'log.txt',
  db_path: 'db.sqlite',
  stake_buffer_percent: 20,
  stake_buffer_topup_percent: 1,
  evilmode: false,
  read_only: false,
  cache_path: 'test-cache',
  blockchain: {
    rpc_url: 'https://test.rpc',
  },
  rpc: {
    host: 'localhost',
    port: 8335,
  },
  ml: {
    strategy: 'replicate',
    replicate: {
      api_token: 'test-token',
    },
  },
  ipfs: {
    strategy: 'pinata',
    pinata: {
      jwt: 'test-jwt',
    },
  },
};

describe('Integration: End-to-End Workflow', () => {
  let modelRegistry: ModelRegistry;
  let jobQueue: JobQueue;
  let taskProcessor: TaskProcessor;
  let mockBlockchain: any;

  beforeAll(() => {
    modelRegistry = new ModelRegistry();
    mockBlockchain = createMockBlockchainService();
  });

  describe('Model Registration and Discovery', () => {
    it('should register and retrieve models', () => {
      const testModel: ModelConfig = {
        id: '0xtest123',
        name: 'test-model',
        template: {
          meta: {
            title: 'Test Model',
            description: 'A test model',
            git: '',
            docker: '',
            version: 1,
          },
          input: [
            {
              variable: 'prompt',
              type: 'string',
              required: true,
              default: '',
              description: 'Input prompt',
            },
          ],
          output: [
            {
              filename: 'out-1.txt',
              type: 'text',
            },
          ],
        },
        replicateModel: 'test/model',
      };

      modelRegistry.registerModel(testModel);

      // Test retrieval by ID
      const byId = modelRegistry.getModelById('0xtest123');
      expect(byId).toBeDefined();
      expect(byId?.name).toBe('test-model');

      // Test retrieval by name
      const byName = modelRegistry.getModelByName('test-model');
      expect(byName).toBeDefined();
      expect(byName?.id).toBe('0xtest123');

      // Test case insensitivity
      const byNameUpper = modelRegistry.getModelByName('TEST-MODEL');
      expect(byNameUpper).toBeDefined();
    });

    it('should list all models', () => {
      const allModels = modelRegistry.getAllModels();
      expect(allModels.length).toBeGreaterThan(0);

      const names = modelRegistry.getModelNames();
      expect(names).toContain('test-model');
    });
  });

  describe('Job Queue Workflow', () => {
    it('should queue and process jobs sequentially', async () => {
      const processedJobs: string[] = [];
      const mockProcessor = jest.fn().mockImplementation(async (job: any) => {
        processedJobs.push(job.taskid);
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      const queue = new JobQueue(1, mockProcessor as any);

      // Add multiple jobs
      await queue.addJob({
        taskid: '0x111',
        modelConfig: modelRegistry.getAllModels()[0],
        input: { prompt: 'test 1' },
      });

      await queue.addJob({
        taskid: '0x222',
        modelConfig: modelRegistry.getAllModels()[0],
        input: { prompt: 'test 2' },
      });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(mockProcessor).toHaveBeenCalled();
      expect(processedJobs.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle concurrent processing', async () => {
      const concurrentTracker: string[] = [];
      const mockProcessor = jest.fn().mockImplementation(async (job: any) => {
        concurrentTracker.push(`start:${job.taskid}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        concurrentTracker.push(`end:${job.taskid}`);
      });

      const queue = new JobQueue(2, mockProcessor as any);

      // Add 3 jobs
      await queue.addJob({
        taskid: '0xaaa',
        modelConfig: modelRegistry.getAllModels()[0],
        input: { prompt: 'test a' },
      });

      await queue.addJob({
        taskid: '0xbbb',
        modelConfig: modelRegistry.getAllModels()[0],
        input: { prompt: 'test b' },
      });

      await queue.addJob({
        taskid: '0xccc',
        modelConfig: modelRegistry.getAllModels()[0],
        input: { prompt: 'test c' },
      });

      // Wait for all to process
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify jobs were processed
      expect(mockProcessor).toHaveBeenCalled();
      expect(mockProcessor.mock.calls.length).toBeGreaterThanOrEqual(2);

      // Check that at most 2 were running at once
      let maxConcurrent = 0;
      let currentConcurrent = 0;

      for (const event of concurrentTracker) {
        if (event.startsWith('start:')) {
          currentConcurrent++;
          maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
        } else {
          currentConcurrent--;
        }
      }

      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });
  });

  describe('Task Submission and Processing Flow', () => {
    it('should submit task and add to queue', async () => {
      const queue = new JobQueue(1);
      const processor = new TaskProcessor(mockBlockchain, mockMiningConfig, queue);
      (processor as any).jobQueue = queue;

      const modelConfig = modelRegistry.getAllModels()[0];

      const { taskid, job } = await processor.submitAndQueueTask(
        modelConfig,
        { prompt: 'test submission' },
        0n
      );

      expect(taskid).toBe('0xmocktaskid123');
      expect(job).toBeDefined();
      expect(['pending', 'processing']).toContain(job.status); // Can be either due to async processing
      expect(mockBlockchain.submitTask).toHaveBeenCalled();
    });

    it('should retrieve job by taskid', async () => {
      const queue = new JobQueue(1);
      const processor = new TaskProcessor(mockBlockchain, mockMiningConfig, queue);
      (processor as any).jobQueue = queue;

      const modelConfig = modelRegistry.getAllModels()[0];

      const { taskid, job } = await processor.submitAndQueueTask(
        modelConfig,
        { prompt: 'test' },
        0n
      );

      const retrieved = queue.getJobByTaskId(taskid);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(job.id);
    });
  });

  describe('Error Handling', () => {
    it('should handle job processing errors gracefully', async () => {
      const errorQueue = new JobQueue(1, async (job) => {
        throw new Error('Processing failed');
      });

      const job = await errorQueue.addJob({
        taskid: '0xerror',
        modelConfig: modelRegistry.getAllModels()[0],
        input: { prompt: 'error test' },
      });

      // Wait for processing attempt
      await new Promise(resolve => setTimeout(resolve, 200));

      const retrieved = errorQueue.getJob(job.id);
      expect(retrieved?.status).toBe('failed');
    });

    it('should continue processing other jobs after error', async () => {
      let callCount = 0;
      const partialErrorQueue = new JobQueue(1, async (job) => {
        callCount++;
        if (job.taskid === '0xfail') {
          throw new Error('This job fails');
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      await partialErrorQueue.addJob({
        taskid: '0xfail',
        modelConfig: modelRegistry.getAllModels()[0],
        input: { prompt: 'fail' },
      });

      await partialErrorQueue.addJob({
        taskid: '0xsucceed',
        modelConfig: modelRegistry.getAllModels()[0],
        input: { prompt: 'succeed' },
      });

      // Wait for both to process
      await new Promise(resolve => setTimeout(resolve, 300));

      expect(callCount).toBe(2);
    });
  });

  describe('Queue Statistics', () => {
    it('should track queue statistics accurately', async () => {
      const statsQueue = new JobQueue(2, async (job) => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const job1 = await statsQueue.addJob({
        taskid: '0x001',
        modelConfig: modelRegistry.getAllModels()[0],
        input: { prompt: 'test 1' },
      });

      const job2 = await statsQueue.addJob({
        taskid: '0x002',
        modelConfig: modelRegistry.getAllModels()[0],
        input: { prompt: 'test 2' },
      });

      // Check initial stats
      let stats = statsQueue.getQueueStats();
      expect(stats.total).toBe(2);

      // Mark one as completed
      statsQueue.updateJobStatus(job1.id, 'completed');

      stats = statsQueue.getQueueStats();
      expect(stats.completed).toBe(1);
    });
  });
});
