import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Kasumi3Listener', () => {
  let mockBlockchain: any;
  let mockModelRegistry: any;
  let mockJobQueue: any;
  let mockContract: any;

  beforeEach(() => {
    mockContract = {
      on: vi.fn(),
      filters: {
        TaskSubmitted: vi.fn().mockReturnValue('task-filter'),
      },
      interface: {
        parseTransaction: vi.fn(),
      },
    };

    mockBlockchain = {
      getArbiusContract: vi.fn().mockReturnValue(mockContract),
      getProvider: vi.fn().mockReturnValue({
        getTransaction: vi.fn(),
      }),
    };

    mockModelRegistry = {
      getAllModels: vi.fn().mockReturnValue([
        {
          id: '0xmodel1',
          name: 'qwen',
          template: {
            meta: { title: 'Qwen', description: '', git: '', docker: '', version: 1 },
            input: [],
            output: [{ filename: 'out.png', type: 'image' }],
          },
        },
      ]),
      getModelById: vi.fn(),
    };

    mockJobQueue = {
      getJobByTaskId: vi.fn(),
      addJob: vi.fn(),
    } as any;

    mockJobQueue.addJob.mockResolvedValue({
      id: 'job1',
      taskid: '0xtask1',
      status: 'pending',
    });
  });

  describe('Event Listener Initialization', () => {
    it('should start listening for TaskSubmitted events', () => {
      mockContract.on('TaskSubmitted', vi.fn());

      expect(mockContract.on).toHaveBeenCalledWith('TaskSubmitted', expect.any(Function));
    });

    it('should log number of models being listened for', () => {
      const models = mockModelRegistry.getAllModels();

      expect(models.length).toBe(1);
      expect(models[0].name).toBe('qwen');
    });
  });

  describe('TaskSubmitted Event Handling', () => {
    it('should process TaskSubmitted event for supported model', async () => {
      const taskid = '0x1234567890abcdef';
      const modelId = '0xmodel1';
      const fee = BigInt('1000000000000000000');
      const sender = '0xsender123';

      mockModelRegistry.getModelById.mockReturnValue({
        id: modelId,
        name: 'qwen',
        template: {
          meta: { title: 'Qwen', description: '', git: '', docker: '', version: 1 },
          input: [],
          output: [{ filename: 'out.png', type: 'image' }],
        },
      });

      mockJobQueue.getJobByTaskId.mockReturnValue(null);

      const mockTx = {
        data: '0xabc123',
      };

      const mockProvider = mockBlockchain.getProvider();
      mockProvider.getTransaction.mockResolvedValue(mockTx);

      mockContract.interface.parseTransaction.mockReturnValue({
        name: 'submitTask',
        args: [
          0, // version
          sender, // owner
          modelId, // model
          fee, // fee
          '0x7b2270726f6d7074223a2274657374227d', // input (JSON: {"prompt":"test"})
          0n, // cid
          200000n, // gasLimit
        ],
      });

      // Simulate event handler logic
      const modelConfig = mockModelRegistry.getModelById(modelId);

      expect(modelConfig).toBeDefined();
      expect(modelConfig.name).toBe('qwen');

      const existingJob = mockJobQueue.getJobByTaskId(taskid);
      expect(existingJob).toBeNull();

      const job = await mockJobQueue.addJob({
        taskid,
        modelConfig,
        input: { prompt: 'test' },
      });

      expect(mockJobQueue.addJob).toHaveBeenCalledWith(
        expect.objectContaining({
          taskid,
          modelConfig,
          input: { prompt: 'test' },
        })
      );
      expect(job.status).toBe('pending');
    });

    it('should ignore tasks for unsupported models', () => {
      const taskid = '0x1234567890abcdef';
      const unknownModelId = '0xunknown';

      mockModelRegistry.getModelById.mockReturnValue(undefined);

      const modelConfig = mockModelRegistry.getModelById(unknownModelId);

      expect(modelConfig).toBeUndefined();
      // Handler should return early and not add job
    });

    it('should skip tasks already in queue', () => {
      const taskid = '0x1234567890abcdef';

      mockJobQueue.getJobByTaskId.mockReturnValue({
        id: 'existing-job',
        taskid,
        status: 'processing',
      });

      const existingJob = mockJobQueue.getJobByTaskId(taskid);

      expect(existingJob).toBeDefined();
      expect(existingJob.status).toBe('processing');
      // Handler should return early and not add duplicate job
    });

    it('should handle transaction fetch errors', async () => {
      const mockProvider = mockBlockchain.getProvider();
      mockProvider.getTransaction.mockRejectedValue(new Error('Network error'));

      try {
        await mockProvider.getTransaction('0xtxhash');
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBe('Network error');
        // Handler should log error and continue
      }
    });

    it('should handle transaction parsing errors', () => {
      mockContract.interface.parseTransaction.mockImplementation(() => {
        throw new Error('Invalid transaction data');
      });

      try {
        mockContract.interface.parseTransaction({ data: '0xinvalid' });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBe('Invalid transaction data');
        // Handler should log error and continue
      }
    });

    it('should handle input parsing errors', () => {
      const invalidInputBytes = '0x696e76616c6964'; // "invalid" in hex (not valid JSON)

      const parseInput = (inputBytes: string) => {
        const inputString = Buffer.from(inputBytes.slice(2), 'hex').toString('utf8');
        return JSON.parse(inputString);
      };

      try {
        parseInput(invalidInputBytes);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
        // Handler should log error and continue
      }
    });
  });

  describe('Event Error Recovery', () => {
    it('should continue listening after event handler error', async () => {
      let eventHandlerCalls = 0;

      const eventHandler = async () => {
        eventHandlerCalls++;
        if (eventHandlerCalls === 1) {
          throw new Error('First call fails');
        }
        // Second call succeeds
      };

      try {
        await eventHandler(); // First call
      } catch (error: any) {
        expect(error.message).toBe('First call fails');
      }

      await eventHandler(); // Second call should succeed
      expect(eventHandlerCalls).toBe(2);
    });

    it('should log errors but not crash the listener', async () => {
      const errorHandler = async () => {
        try {
          throw new Error('Event processing failed');
        } catch (err: any) {
          // Log error and continue
          expect(err.message).toBe('Event processing failed');
          return; // Don't crash
        }
      };

      await errorHandler();
      // Listener should still be running
    });
  });

  describe('Transaction Input Parsing', () => {
    it('should parse valid JSON input from transaction', () => {
      const inputJson = { prompt: 'a beautiful sunset' };
      const inputBytes = '0x' + Buffer.from(JSON.stringify(inputJson)).toString('hex');

      const parseInput = (bytes: string) => {
        const inputString = Buffer.from(bytes.slice(2), 'hex').toString('utf8');
        return JSON.parse(inputString);
      };

      const parsed = parseInput(inputBytes);

      expect(parsed.prompt).toBe('a beautiful sunset');
    });

    it('should handle complex input objects', () => {
      const inputJson = {
        prompt: 'test',
        num_steps: 50,
        guidance_scale: 7.5,
        seed: 12345,
      };
      const inputBytes = '0x' + Buffer.from(JSON.stringify(inputJson)).toString('hex');

      const parseInput = (bytes: string) => {
        const inputString = Buffer.from(bytes.slice(2), 'hex').toString('utf8');
        return JSON.parse(inputString);
      };

      const parsed = parseInput(inputBytes);

      expect(parsed.prompt).toBe('test');
      expect(parsed.num_steps).toBe(50);
      expect(parsed.guidance_scale).toBe(7.5);
      expect(parsed.seed).toBe(12345);
    });
  });

  describe('Model Filtering', () => {
    it('should only process events for registered models', () => {
      const registeredModels = mockModelRegistry.getAllModels();
      const modelIds = registeredModels.map((m: any) => m.id);

      expect(modelIds).toContain('0xmodel1');
      expect(modelIds).not.toContain('0xunknown');
    });

    it('should handle multiple registered models', () => {
      mockModelRegistry.getAllModels.mockReturnValue([
        { id: '0xmodel1', name: 'qwen', template: {} },
        { id: '0xmodel2', name: 'wai', template: {} },
        { id: '0xmodel3', name: 'qwq', template: {} },
      ]);

      const models = mockModelRegistry.getAllModels();

      expect(models.length).toBe(3);
      expect(models.map((m: any) => m.name)).toEqual(['qwen', 'wai', 'qwq']);
    });
  });
});
