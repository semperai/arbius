import { IJobQueue, TaskJob } from '../types';
import { log } from '../log';
import { v4 as uuidv4 } from 'uuid';

export class JobQueue implements IJobQueue {
  private jobs: Map<string, TaskJob> = new Map();
  private processing: boolean = false;
  private maxConcurrent: number;
  private processingJobs: Set<string> = new Set();
  private onJobComplete?: (job: TaskJob) => Promise<void>;

  constructor(maxConcurrent: number = 3, onJobComplete?: (job: TaskJob) => Promise<void>) {
    this.maxConcurrent = maxConcurrent;
    this.onJobComplete = onJobComplete;
  }

  addJob(job: Omit<TaskJob, 'id' | 'status' | 'createdAt'>): Promise<TaskJob> {
    const newJob: TaskJob = {
      ...job,
      id: uuidv4(),
      status: 'pending',
      createdAt: Date.now(),
    };

    this.jobs.set(newJob.id, newJob);
    log.info(`Job ${newJob.id} added to queue for task ${newJob.taskid}`);

    // Start processing if not already processing
    this.processNext();

    return Promise.resolve(newJob);
  }

  getJob(id: string): TaskJob | undefined {
    return this.jobs.get(id);
  }

  getJobByTaskId(taskid: string): TaskJob | undefined {
    for (const job of this.jobs.values()) {
      if (job.taskid === taskid) {
        return job;
      }
    }
    return undefined;
  }

  getPendingJobs(): TaskJob[] {
    return Array.from(this.jobs.values()).filter(job => job.status === 'pending');
  }

  getProcessingJobs(): TaskJob[] {
    return Array.from(this.jobs.values()).filter(job => job.status === 'processing');
  }

  updateJobStatus(id: string, status: TaskJob['status'], updates?: Partial<TaskJob>): void {
    const job = this.jobs.get(id);
    if (!job) {
      log.warn(`Attempted to update non-existent job ${id}`);
      return;
    }

    job.status = status;
    if (updates) {
      Object.assign(job, updates);
    }

    if (status === 'completed' || status === 'failed') {
      job.completedAt = Date.now();
      this.processingJobs.delete(id);
      log.info(`Job ${id} ${status} for task ${job.taskid}`);

      // Trigger next processing
      this.processNext();
    }
  }

  async processNext(): Promise<void> {
    // Check if we can process more jobs
    if (this.processingJobs.size >= this.maxConcurrent) {
      log.debug(`Max concurrent jobs (${this.maxConcurrent}) reached, waiting...`);
      return;
    }

    const pendingJobs = this.getPendingJobs();
    if (pendingJobs.length === 0) {
      return;
    }

    // Get the next job
    const job = pendingJobs[0];
    this.processingJobs.add(job.id);
    this.updateJobStatus(job.id, 'processing', { processedAt: Date.now() });

    log.info(`Starting processing job ${job.id} for task ${job.taskid}`);

    // Process the job asynchronously
    if (this.onJobComplete) {
      this.onJobComplete(job).catch(err => {
        log.error(`Job ${job.id} failed: ${err}`);
        this.updateJobStatus(job.id, 'failed', { error: err.message });
      });
    }

    // Try to process more jobs if slots available
    if (this.processingJobs.size < this.maxConcurrent && pendingJobs.length > 1) {
      setTimeout(() => this.processNext(), 100);
    }
  }

  getQueueStats(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
    };
  }

  clearOldJobs(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    let cleared = 0;

    for (const [id, job] of this.jobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.completedAt &&
        now - job.completedAt > maxAge
      ) {
        this.jobs.delete(id);
        cleared++;
      }
    }

    if (cleared > 0) {
      log.info(`Cleared ${cleared} old jobs from queue`);
    }
  }
}
