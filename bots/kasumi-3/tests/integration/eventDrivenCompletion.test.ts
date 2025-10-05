import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobQueue } from '../../src/services/JobQueue';
import { TaskJob } from '../../src/types';

describe('Event-Driven Job Completion Integration', () => {
  let jobQueue: JobQueue;

  beforeEach(() => {
    jobQueue = new JobQueue(3);
  });

  it('should notify listeners immediately when job completes', async () => {
    const completionPromise = new Promise<TaskJob>((resolve) => {
      jobQueue.on('jobCompleted', (job: TaskJob) => {
        resolve(job);
      });
    });

    const job = await jobQueue.addJob({
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

    // Simulate job completion
    jobQueue.updateJobStatus(job.id, 'completed', { cid: 'QmTest' });

    const completedJob = await completionPromise;

    expect(completedJob.id).toBe(job.id);
    expect(completedJob.status).toBe('completed');
    expect(completedJob.cid).toBe('QmTest');
  });

  it('should handle multiple concurrent jobs with event listeners', async () => {
    const completedJobs: TaskJob[] = [];

    jobQueue.on('jobCompleted', (job: TaskJob) => {
      completedJobs.push(job);
    });

    // Create 3 jobs
    const jobs = await Promise.all([
      jobQueue.addJob({
        taskid: '0x123',
        modelConfig: {
          id: 'model1',
          name: 'test',
          template: {
            meta: { title: 'Test', description: '', git: '', docker: '', version: 1 },
            input: [],
            output: [{ filename: 'out.png', type: 'image' }],
          },
        },
        input: { prompt: 'test1' },
      }),
      jobQueue.addJob({
        taskid: '0x124',
        modelConfig: {
          id: 'model1',
          name: 'test',
          template: {
            meta: { title: 'Test', description: '', git: '', docker: '', version: 1 },
            input: [],
            output: [{ filename: 'out.png', type: 'image' }],
          },
        },
        input: { prompt: 'test2' },
      }),
      jobQueue.addJob({
        taskid: '0x125',
        modelConfig: {
          id: 'model1',
          name: 'test',
          template: {
            meta: { title: 'Test', description: '', git: '', docker: '', version: 1 },
            input: [],
            output: [{ filename: 'out.png', type: 'image' }],
          },
        },
        input: { prompt: 'test3' },
      }),
    ]);

    // Complete all jobs
    jobs.forEach((job) => {
      jobQueue.updateJobStatus(job.id, 'completed', { cid: `QmTest-${job.id}` });
    });

    // Wait a bit for events to propagate
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(completedJobs.length).toBe(3);
    expect(completedJobs.map((j) => j.taskid)).toEqual(['0x123', '0x124', '0x125']);
  });

  it('should clean up listeners to prevent memory leaks', async () => {
    const listener = vi.fn();

    jobQueue.on('jobCompleted', listener);

    const job = await jobQueue.addJob({
      taskid: '0x126',
      modelConfig: {
        id: 'model1',
        name: 'test',
        template: {
          meta: { title: 'Test', description: '', git: '', docker: '', version: 1 },
          input: [],
          output: [{ filename: 'out.png', type: 'image' }],
        },
      },
      input: { prompt: 'test' },
    });

    // Complete job
    jobQueue.updateJobStatus(job.id, 'completed', { cid: 'QmTest' });

    expect(listener).toHaveBeenCalledTimes(1);

    // Remove listener
    jobQueue.off('jobCompleted', listener);

    // Complete another job
    const job2 = await jobQueue.addJob({
      taskid: '0x127',
      modelConfig: {
        id: 'model1',
        name: 'test',
        template: {
          meta: { title: 'Test', description: '', git: '', docker: '', version: 1 },
          input: [],
          output: [{ filename: 'out.png', type: 'image' }],
        },
      },
      input: { prompt: 'test2' },
    });

    jobQueue.updateJobStatus(job2.id, 'completed', { cid: 'QmTest2' });

    // Listener should not be called again
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should handle race condition where job completes before listener attached', async () => {
    const job = await jobQueue.addJob({
      taskid: '0x128',
      modelConfig: {
        id: 'model1',
        name: 'test',
        template: {
          meta: { title: 'Test', description: '', git: '', docker: '', version: 1 },
          input: [],
          output: [{ filename: 'out.png', type: 'image' }],
        },
      },
      input: { prompt: 'test' },
    });

    // Complete job immediately
    jobQueue.updateJobStatus(job.id, 'completed', { cid: 'QmTest' });

    // Now attach listener and check current status
    const currentJob = jobQueue.getJob(job.id);

    expect(currentJob).toBeDefined();
    expect(currentJob?.status).toBe('completed');
    expect(currentJob?.cid).toBe('QmTest');
  });

  it('should timeout jobs that take too long', async () => {
    const shortTimeoutQueue = new JobQueue(1, undefined, 1000); // 1 second timeout

    const failedJobs: TaskJob[] = [];
    shortTimeoutQueue.on('jobFailed', (job: TaskJob) => {
      failedJobs.push(job);
    });

    const job = await shortTimeoutQueue.addJob({
      taskid: '0x129',
      modelConfig: {
        id: 'model1',
        name: 'test',
        template: {
          meta: { title: 'Test', description: '', git: '', docker: '', version: 1 },
          input: [],
          output: [{ filename: 'out.png', type: 'image' }],
        },
      },
      input: { prompt: 'test' },
    });

    // Wait for timeout
    await new Promise((resolve) => setTimeout(resolve, 1500));

    expect(failedJobs.length).toBe(1);
    expect(failedJobs[0].id).toBe(job.id);
    expect(failedJobs[0].error).toContain('timed out');

    shortTimeoutQueue.shutdown();
  });
});
