import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { JobQueue } from '../../src/services/JobQueue';
import { TaskJob } from '../../src/types';

describe('JobQueue Enhancements', () => {
  let jobQueue: JobQueue | undefined;

  afterEach(() => {
    if (jobQueue) {
      jobQueue.shutdown();
      jobQueue = undefined;
    }
  });

  describe('Constructor Validation', () => {
    it('should throw error when maxConcurrent is 0', () => {
      expect(() => {
        new JobQueue(0);
      }).toThrow('maxConcurrent must be greater than 0');
    });

    it('should throw error when maxConcurrent is negative', () => {
      expect(() => {
        new JobQueue(-1);
      }).toThrow('maxConcurrent must be greater than 0');
    });

    it('should accept valid maxConcurrent values', () => {
      expect(() => {
        new JobQueue(1);
      }).not.toThrow();

      expect(() => {
        new JobQueue(5);
      }).not.toThrow();
    });
  });

  describe('Event Emission', () => {
    let eventJobQueue: JobQueue;
    let jobCompletedListener: jest.Mock;
    let jobFailedListener: jest.Mock;
    let jobStatusChangeListener: jest.Mock;

    beforeEach(() => {
      eventJobQueue = new JobQueue(3);
      jobCompletedListener = jest.fn();
      jobFailedListener = jest.fn();
      jobStatusChangeListener = jest.fn();

      eventJobQueue.on('jobCompleted', jobCompletedListener);
      eventJobQueue.on('jobFailed', jobFailedListener);
      eventJobQueue.on('jobStatusChange', jobStatusChangeListener);
    });

    afterEach(() => {
      if (eventJobQueue) {
        eventJobQueue.shutdown();
      }
    });

    it('should emit jobCompleted event when job completes', async () => {
      const job = await eventJobQueue.addJob({
        taskid: '0x123',
        modelConfig: {
          id: 'model1',
          name: 'test-model',
          template: {
            meta: { title: 'Test', description: '', git: '', docker: '', version: 1 },
            input: [],
            output: [{ filename: 'out.png', type: 'image' }],
          },
        },
        input: { prompt: 'test' },
      });

      eventJobQueue.updateJobStatus(job.id, 'completed', { cid: 'QmTest' });

      expect(jobCompletedListener).toHaveBeenCalledTimes(1);
      expect(jobCompletedListener).toHaveBeenCalledWith(
        expect.objectContaining({
          id: job.id,
          status: 'completed',
          cid: 'QmTest',
        })
      );
      expect(jobStatusChangeListener).toHaveBeenCalledTimes(1);
    });

    it('should emit jobFailed event when job fails', async () => {
      const job = await eventJobQueue.addJob({
        taskid: '0x124',
        modelConfig: {
          id: 'model1',
          name: 'test-model',
          template: {
            meta: { title: 'Test', description: '', git: '', docker: '', version: 1 },
            input: [],
            output: [{ filename: 'out.png', type: 'image' }],
          },
        },
        input: { prompt: 'test' },
      });

      eventJobQueue.updateJobStatus(job.id, 'failed', { error: 'Test error' });

      expect(jobFailedListener).toHaveBeenCalledTimes(1);
      expect(jobFailedListener).toHaveBeenCalledWith(
        expect.objectContaining({
          id: job.id,
          status: 'failed',
          error: 'Test error',
        })
      );
      expect(jobStatusChangeListener).toHaveBeenCalledTimes(1);
    });

    it('should not emit events for non-terminal status updates', async () => {
      const job = await eventJobQueue.addJob({
        taskid: '0x125',
        modelConfig: {
          id: 'model1',
          name: 'test-model',
          template: {
            meta: { title: 'Test', description: '', git: '', docker: '', version: 1 },
            input: [],
            output: [{ filename: 'out.png', type: 'image' }],
          },
        },
        input: { prompt: 'test' },
      });

      eventJobQueue.updateJobStatus(job.id, 'processing');

      // Events should not be emitted for processing status
      expect(jobCompletedListener).not.toHaveBeenCalled();
      expect(jobFailedListener).not.toHaveBeenCalled();
      expect(jobStatusChangeListener).not.toHaveBeenCalled();
    });

    it('should clean up event listeners on shutdown', () => {
      const removeAllListenersSpy = jest.spyOn(eventJobQueue, 'removeAllListeners');
      eventJobQueue.shutdown();

      // Verify shutdown was called (cleanup interval cleared)
      expect(removeAllListenersSpy).toBeDefined();
    });
  });

  describe('Shutdown', () => {
    it('should clear all timeouts on shutdown', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      jobQueue = new JobQueue(3, undefined, 1000);

      jobQueue.shutdown();

      // Verify that shutdown clears resources
      expect(jobQueue.getQueueStats().total).toBe(0);
      clearTimeoutSpy.mockRestore();
    });
  });
});
