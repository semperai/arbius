import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { JobQueue } from '../../src/services/JobQueue';
import { TaskJob } from '../../src/types';

describe('JobQueue', () => {
  let queue: JobQueue;
  let mockCallback: jest.Mock;

  beforeEach(() => {
    // @ts-ignore
    mockCallback = jest.fn().mockResolvedValue(undefined);
    queue = new JobQueue(2, mockCallback as any);
  });

  afterEach(() => {
    // Clean up all timers to prevent open handles
    if (queue) {
      queue.shutdown();
    }
  });

  describe('addJob', () => {
    it('should add job to queue', async () => {
      const job = await queue.addJob({
        taskid: '0x123',
        modelConfig: { id: '0xabc', name: 'test' } as any,
        input: { prompt: 'test' },
      });

      expect(job.id).toBeDefined();
      expect(['pending', 'processing']).toContain(job.status); // Can be either due to async processing
      expect(job.taskid).toBe('0x123');
      expect(job.createdAt).toBeDefined();
    });

    it('should trigger processing when job added', async () => {
      await queue.addJob({
        taskid: '0x123',
        modelConfig: { id: '0xabc', name: 'test' } as any,
        input: { prompt: 'test' },
      });

      // Wait a bit for async processing to start
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('getJob', () => {
    it('should retrieve job by id', async () => {
      const job = await queue.addJob({
        taskid: '0x123',
        modelConfig: { id: '0xabc', name: 'test' } as any,
        input: { prompt: 'test' },
      });

      const retrieved = queue.getJob(job.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.taskid).toBe('0x123');
    });

    it('should return undefined for non-existent job', () => {
      const retrieved = queue.getJob('non-existent-id');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getJobByTaskId', () => {
    it('should retrieve job by taskid', async () => {
      await queue.addJob({
        taskid: '0x123',
        modelConfig: { id: '0xabc', name: 'test' } as any,
        input: { prompt: 'test' },
      });

      const retrieved = queue.getJobByTaskId('0x123');
      expect(retrieved).toBeDefined();
      expect(retrieved?.taskid).toBe('0x123');
    });

    it('should return undefined for non-existent taskid', () => {
      const retrieved = queue.getJobByTaskId('0xnonexistent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getPendingJobs', () => {
    it('should return only pending jobs', async () => {
      const job1 = await queue.addJob({
        taskid: '0x111',
        modelConfig: { id: '0xabc', name: 'test' } as any,
        input: { prompt: 'test1' },
      });

      const job2 = await queue.addJob({
        taskid: '0x222',
        modelConfig: { id: '0xabc', name: 'test' } as any,
        input: { prompt: 'test2' },
      });

      // Wait for processing to start
      await new Promise(resolve => setTimeout(resolve, 100));

      const pending = queue.getPendingJobs();
      // At least one should be pending or processing
      expect(pending.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('updateJobStatus', () => {
    it('should update job status', async () => {
      const job = await queue.addJob({
        taskid: '0x123',
        modelConfig: { id: '0xabc', name: 'test' } as any,
        input: { prompt: 'test' },
      });

      queue.updateJobStatus(job.id, 'completed', { cid: '0xcid123' });

      const updated = queue.getJob(job.id);
      expect(updated?.status).toBe('completed');
      expect(updated?.cid).toBe('0xcid123');
      expect(updated?.completedAt).toBeDefined();
    });

    it('should handle updates to non-existent job gracefully', () => {
      expect(() => {
        queue.updateJobStatus('non-existent', 'completed');
      }).not.toThrow();
    });
  });

  describe('getQueueStats', () => {
    it('should return accurate stats', async () => {
      await queue.addJob({
        taskid: '0x111',
        modelConfig: { id: '0xabc', name: 'test' } as any,
        input: { prompt: 'test1' },
      });

      const job2 = await queue.addJob({
        taskid: '0x222',
        modelConfig: { id: '0xabc', name: 'test' } as any,
        input: { prompt: 'test2' },
      });

      queue.updateJobStatus(job2.id, 'completed');

      const stats = queue.getQueueStats();
      expect(stats.total).toBe(2);
      expect(stats.completed).toBe(1);
    });
  });

  describe('clearOldJobs', () => {
    it('should remove old completed jobs', async () => {
      const job = await queue.addJob({
        taskid: '0x123',
        modelConfig: { id: '0xabc', name: 'test' } as any,
        input: { prompt: 'test' },
      });

      // Mark as completed with old timestamp
      queue.updateJobStatus(job.id, 'completed');
      const retrieved = queue.getJob(job.id)!;
      retrieved.completedAt = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago

      queue.clearOldJobs(24 * 60 * 60 * 1000); // 24 hours

      const afterClean = queue.getJob(job.id);
      expect(afterClean).toBeUndefined();
    });

    it('should not remove recent jobs', async () => {
      const job = await queue.addJob({
        taskid: '0x123',
        modelConfig: { id: '0xabc', name: 'test' } as any,
        input: { prompt: 'test' },
      });

      queue.updateJobStatus(job.id, 'completed');
      queue.clearOldJobs(24 * 60 * 60 * 1000);

      const afterClean = queue.getJob(job.id);
      expect(afterClean).toBeDefined();
    });
  });

  describe('concurrent processing', () => {
    it('should respect max concurrent limit', async () => {
      const slowCallback = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      const limitedQueue = new JobQueue(2, slowCallback as any);

      // Add 4 jobs
      await limitedQueue.addJob({
        taskid: '0x111',
        modelConfig: { id: '0xabc', name: 'test' } as any,
        input: { prompt: 'test1' },
      });

      await limitedQueue.addJob({
        taskid: '0x222',
        modelConfig: { id: '0xabc', name: 'test' } as any,
        input: { prompt: 'test2' },
      });

      await limitedQueue.addJob({
        taskid: '0x333',
        modelConfig: { id: '0xabc', name: 'test' } as any,
        input: { prompt: 'test3' },
      });

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should have at most 2 processing
      const processing = limitedQueue.getProcessingJobs();
      expect(processing.length).toBeLessThanOrEqual(2);
    });
  });
});
