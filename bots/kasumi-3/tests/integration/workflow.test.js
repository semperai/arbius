"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const ModelRegistry_1 = require("../../src/services/ModelRegistry");
const JobQueue_1 = require("../../src/services/JobQueue");
const TaskProcessor_1 = require("../../src/services/TaskProcessor");
// Mock blockchain service
// @ts-ignore - Mock service for testing
const createMockBlockchainService = () => ({
    // @ts-ignore
    getWalletAddress: globals_1.jest.fn().mockReturnValue('0x1234567890123456789012345678901234567890'),
    // @ts-ignore
    getBalance: globals_1.jest.fn().mockResolvedValue(1000000000000000000n),
    // @ts-ignore
    getValidatorStake: globals_1.jest.fn().mockResolvedValue(500000000000000000n),
    // @ts-ignore
    submitTask: globals_1.jest.fn().mockResolvedValue('0xmocktaskid123'),
    // @ts-ignore
    submitSolution: globals_1.jest.fn().mockResolvedValue(undefined),
    // @ts-ignore
    signalCommitment: globals_1.jest.fn().mockResolvedValue(undefined),
    // @ts-ignore
    getSolution: globals_1.jest.fn().mockResolvedValue({
        validator: '0x0000000000000000000000000000000000000000',
        cid: '',
    }),
    // @ts-ignore
    findTransactionByTaskId: globals_1.jest.fn().mockResolvedValue({
        txHash: '0xtxhash',
        prompt: 'test prompt',
    }),
    getArbiusContract: globals_1.jest.fn(),
    getProvider: globals_1.jest.fn(),
    // @ts-ignore
    ensureApproval: globals_1.jest.fn().mockResolvedValue(undefined),
    // @ts-ignore
    ensureValidatorStake: globals_1.jest.fn().mockResolvedValue(undefined),
    // @ts-ignore
    getValidatorMinimum: globals_1.jest.fn().mockResolvedValue(100000000000000000n),
    // @ts-ignore
    getEthBalance: globals_1.jest.fn().mockResolvedValue(1000000000000000000n),
});
// Mock mining config
const mockMiningConfig = {
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
(0, globals_1.describe)('Integration: End-to-End Workflow', () => {
    let modelRegistry;
    let jobQueue;
    let taskProcessor;
    let mockBlockchain;
    (0, globals_1.beforeAll)(() => {
        modelRegistry = new ModelRegistry_1.ModelRegistry();
        mockBlockchain = createMockBlockchainService();
    });
    (0, globals_1.describe)('Model Registration and Discovery', () => {
        (0, globals_1.it)('should register and retrieve models', () => {
            const testModel = {
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
            (0, globals_1.expect)(byId).toBeDefined();
            (0, globals_1.expect)(byId?.name).toBe('test-model');
            // Test retrieval by name
            const byName = modelRegistry.getModelByName('test-model');
            (0, globals_1.expect)(byName).toBeDefined();
            (0, globals_1.expect)(byName?.id).toBe('0xtest123');
            // Test case insensitivity
            const byNameUpper = modelRegistry.getModelByName('TEST-MODEL');
            (0, globals_1.expect)(byNameUpper).toBeDefined();
        });
        (0, globals_1.it)('should list all models', () => {
            const allModels = modelRegistry.getAllModels();
            (0, globals_1.expect)(allModels.length).toBeGreaterThan(0);
            const names = modelRegistry.getModelNames();
            (0, globals_1.expect)(names).toContain('test-model');
        });
    });
    (0, globals_1.describe)('Job Queue Workflow', () => {
        (0, globals_1.it)('should queue and process jobs sequentially', async () => {
            const processedJobs = [];
            const mockProcessor = globals_1.jest.fn().mockImplementation(async (job) => {
                processedJobs.push(job.taskid);
                await new Promise(resolve => setTimeout(resolve, 50));
            });
            const queue = new JobQueue_1.JobQueue(1, mockProcessor);
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
            (0, globals_1.expect)(mockProcessor).toHaveBeenCalled();
            (0, globals_1.expect)(processedJobs.length).toBeGreaterThanOrEqual(1);
        });
        (0, globals_1.it)('should handle concurrent processing', async () => {
            const concurrentTracker = [];
            const mockProcessor = globals_1.jest.fn().mockImplementation(async (job) => {
                concurrentTracker.push(`start:${job.taskid}`);
                await new Promise(resolve => setTimeout(resolve, 100));
                concurrentTracker.push(`end:${job.taskid}`);
            });
            const queue = new JobQueue_1.JobQueue(2, mockProcessor);
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
            (0, globals_1.expect)(mockProcessor).toHaveBeenCalled();
            (0, globals_1.expect)(mockProcessor.mock.calls.length).toBeGreaterThanOrEqual(2);
            // Check that at most 2 were running at once
            let maxConcurrent = 0;
            let currentConcurrent = 0;
            for (const event of concurrentTracker) {
                if (event.startsWith('start:')) {
                    currentConcurrent++;
                    maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
                }
                else {
                    currentConcurrent--;
                }
            }
            (0, globals_1.expect)(maxConcurrent).toBeLessThanOrEqual(2);
        });
    });
    (0, globals_1.describe)('Task Submission and Processing Flow', () => {
        (0, globals_1.it)('should submit task and add to queue', async () => {
            const queue = new JobQueue_1.JobQueue(1);
            const processor = new TaskProcessor_1.TaskProcessor(mockBlockchain, mockMiningConfig, queue);
            processor.jobQueue = queue;
            const modelConfig = modelRegistry.getAllModels()[0];
            const { taskid, job } = await processor.submitAndQueueTask(modelConfig, { prompt: 'test submission' }, 0n);
            (0, globals_1.expect)(taskid).toBe('0xmocktaskid123');
            (0, globals_1.expect)(job).toBeDefined();
            (0, globals_1.expect)(['pending', 'processing']).toContain(job.status); // Can be either due to async processing
            (0, globals_1.expect)(mockBlockchain.submitTask).toHaveBeenCalled();
        });
        (0, globals_1.it)('should retrieve job by taskid', async () => {
            const queue = new JobQueue_1.JobQueue(1);
            const processor = new TaskProcessor_1.TaskProcessor(mockBlockchain, mockMiningConfig, queue);
            processor.jobQueue = queue;
            const modelConfig = modelRegistry.getAllModels()[0];
            const { taskid, job } = await processor.submitAndQueueTask(modelConfig, { prompt: 'test' }, 0n);
            const retrieved = queue.getJobByTaskId(taskid);
            (0, globals_1.expect)(retrieved).toBeDefined();
            (0, globals_1.expect)(retrieved?.id).toBe(job.id);
        });
    });
    (0, globals_1.describe)('Error Handling', () => {
        (0, globals_1.it)('should handle job processing errors gracefully', async () => {
            const errorQueue = new JobQueue_1.JobQueue(1, async (job) => {
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
            (0, globals_1.expect)(retrieved?.status).toBe('failed');
        });
        (0, globals_1.it)('should continue processing other jobs after error', async () => {
            let callCount = 0;
            const partialErrorQueue = new JobQueue_1.JobQueue(1, async (job) => {
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
            (0, globals_1.expect)(callCount).toBe(2);
        });
    });
    (0, globals_1.describe)('Queue Statistics', () => {
        (0, globals_1.it)('should track queue statistics accurately', async () => {
            const statsQueue = new JobQueue_1.JobQueue(2, async (job) => {
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
            (0, globals_1.expect)(stats.total).toBe(2);
            // Mark one as completed
            statsQueue.updateJobStatus(job1.id, 'completed');
            stats = statsQueue.getQueueStats();
            (0, globals_1.expect)(stats.completed).toBe(1);
        });
    });
});
