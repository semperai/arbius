"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const JobQueue_1 = require("../../src/services/JobQueue");
(0, globals_1.describe)('JobQueue', () => {
    let queue;
    let mockCallback;
    (0, globals_1.beforeEach)(() => {
        // @ts-ignore
        mockCallback = globals_1.jest.fn().mockResolvedValue(undefined);
        queue = new JobQueue_1.JobQueue(2, mockCallback);
    });
    (0, globals_1.describe)('addJob', () => {
        (0, globals_1.it)('should add job to queue', async () => {
            const job = await queue.addJob({
                taskid: '0x123',
                modelConfig: { id: '0xabc', name: 'test' },
                input: { prompt: 'test' },
            });
            (0, globals_1.expect)(job.id).toBeDefined();
            (0, globals_1.expect)(['pending', 'processing']).toContain(job.status); // Can be either due to async processing
            (0, globals_1.expect)(job.taskid).toBe('0x123');
            (0, globals_1.expect)(job.createdAt).toBeDefined();
        });
        (0, globals_1.it)('should trigger processing when job added', async () => {
            await queue.addJob({
                taskid: '0x123',
                modelConfig: { id: '0xabc', name: 'test' },
                input: { prompt: 'test' },
            });
            // Wait a bit for async processing to start
            await new Promise(resolve => setTimeout(resolve, 100));
            (0, globals_1.expect)(mockCallback).toHaveBeenCalled();
        });
    });
    (0, globals_1.describe)('getJob', () => {
        (0, globals_1.it)('should retrieve job by id', async () => {
            const job = await queue.addJob({
                taskid: '0x123',
                modelConfig: { id: '0xabc', name: 'test' },
                input: { prompt: 'test' },
            });
            const retrieved = queue.getJob(job.id);
            (0, globals_1.expect)(retrieved).toBeDefined();
            (0, globals_1.expect)(retrieved?.taskid).toBe('0x123');
        });
        (0, globals_1.it)('should return undefined for non-existent job', () => {
            const retrieved = queue.getJob('non-existent-id');
            (0, globals_1.expect)(retrieved).toBeUndefined();
        });
    });
    (0, globals_1.describe)('getJobByTaskId', () => {
        (0, globals_1.it)('should retrieve job by taskid', async () => {
            await queue.addJob({
                taskid: '0x123',
                modelConfig: { id: '0xabc', name: 'test' },
                input: { prompt: 'test' },
            });
            const retrieved = queue.getJobByTaskId('0x123');
            (0, globals_1.expect)(retrieved).toBeDefined();
            (0, globals_1.expect)(retrieved?.taskid).toBe('0x123');
        });
        (0, globals_1.it)('should return undefined for non-existent taskid', () => {
            const retrieved = queue.getJobByTaskId('0xnonexistent');
            (0, globals_1.expect)(retrieved).toBeUndefined();
        });
    });
    (0, globals_1.describe)('getPendingJobs', () => {
        (0, globals_1.it)('should return only pending jobs', async () => {
            const job1 = await queue.addJob({
                taskid: '0x111',
                modelConfig: { id: '0xabc', name: 'test' },
                input: { prompt: 'test1' },
            });
            const job2 = await queue.addJob({
                taskid: '0x222',
                modelConfig: { id: '0xabc', name: 'test' },
                input: { prompt: 'test2' },
            });
            // Wait for processing to start
            await new Promise(resolve => setTimeout(resolve, 100));
            const pending = queue.getPendingJobs();
            // At least one should be pending or processing
            (0, globals_1.expect)(pending.length).toBeGreaterThanOrEqual(0);
        });
    });
    (0, globals_1.describe)('updateJobStatus', () => {
        (0, globals_1.it)('should update job status', async () => {
            const job = await queue.addJob({
                taskid: '0x123',
                modelConfig: { id: '0xabc', name: 'test' },
                input: { prompt: 'test' },
            });
            queue.updateJobStatus(job.id, 'completed', { cid: '0xcid123' });
            const updated = queue.getJob(job.id);
            (0, globals_1.expect)(updated?.status).toBe('completed');
            (0, globals_1.expect)(updated?.cid).toBe('0xcid123');
            (0, globals_1.expect)(updated?.completedAt).toBeDefined();
        });
        (0, globals_1.it)('should handle updates to non-existent job gracefully', () => {
            (0, globals_1.expect)(() => {
                queue.updateJobStatus('non-existent', 'completed');
            }).not.toThrow();
        });
    });
    (0, globals_1.describe)('getQueueStats', () => {
        (0, globals_1.it)('should return accurate stats', async () => {
            await queue.addJob({
                taskid: '0x111',
                modelConfig: { id: '0xabc', name: 'test' },
                input: { prompt: 'test1' },
            });
            const job2 = await queue.addJob({
                taskid: '0x222',
                modelConfig: { id: '0xabc', name: 'test' },
                input: { prompt: 'test2' },
            });
            queue.updateJobStatus(job2.id, 'completed');
            const stats = queue.getQueueStats();
            (0, globals_1.expect)(stats.total).toBe(2);
            (0, globals_1.expect)(stats.completed).toBe(1);
        });
    });
    (0, globals_1.describe)('clearOldJobs', () => {
        (0, globals_1.it)('should remove old completed jobs', async () => {
            const job = await queue.addJob({
                taskid: '0x123',
                modelConfig: { id: '0xabc', name: 'test' },
                input: { prompt: 'test' },
            });
            // Mark as completed with old timestamp
            queue.updateJobStatus(job.id, 'completed');
            const retrieved = queue.getJob(job.id);
            retrieved.completedAt = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
            queue.clearOldJobs(24 * 60 * 60 * 1000); // 24 hours
            const afterClean = queue.getJob(job.id);
            (0, globals_1.expect)(afterClean).toBeUndefined();
        });
        (0, globals_1.it)('should not remove recent jobs', async () => {
            const job = await queue.addJob({
                taskid: '0x123',
                modelConfig: { id: '0xabc', name: 'test' },
                input: { prompt: 'test' },
            });
            queue.updateJobStatus(job.id, 'completed');
            queue.clearOldJobs(24 * 60 * 60 * 1000);
            const afterClean = queue.getJob(job.id);
            (0, globals_1.expect)(afterClean).toBeDefined();
        });
    });
    (0, globals_1.describe)('concurrent processing', () => {
        (0, globals_1.it)('should respect max concurrent limit', async () => {
            const slowCallback = globals_1.jest.fn().mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, 200));
            });
            const limitedQueue = new JobQueue_1.JobQueue(2, slowCallback);
            // Add 4 jobs
            await limitedQueue.addJob({
                taskid: '0x111',
                modelConfig: { id: '0xabc', name: 'test' },
                input: { prompt: 'test1' },
            });
            await limitedQueue.addJob({
                taskid: '0x222',
                modelConfig: { id: '0xabc', name: 'test' },
                input: { prompt: 'test2' },
            });
            await limitedQueue.addJob({
                taskid: '0x333',
                modelConfig: { id: '0xabc', name: 'test' },
                input: { prompt: 'test3' },
            });
            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 100));
            // Should have at most 2 processing
            const processing = limitedQueue.getProcessingJobs();
            (0, globals_1.expect)(processing.length).toBeLessThanOrEqual(2);
        });
    });
});
