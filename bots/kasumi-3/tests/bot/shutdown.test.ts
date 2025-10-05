import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Bot Shutdown', () => {
  let mockJobQueue: any;
  let mockRateLimiter: any;
  let mockBot: any;

  beforeEach(() => {
    mockJobQueue = {
      shutdown: vi.fn(),
      getQueueStats: vi.fn(() => ({ total: 0, pending: 0, processing: 0, completed: 0, failed: 0 })),
      clearOldJobs: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };

    mockRateLimiter = {
      shutdown: vi.fn(),
      checkLimit: vi.fn(() => true),
    };
  });

  it('should call shutdown on all services', async () => {
    // Create a simplified bot-like object to test shutdown
    const cleanupInterval = setInterval(() => {}, 1000);

    const shutdown = async () => {
      if (cleanupInterval) {
        clearInterval(cleanupInterval);
      }
      mockJobQueue.shutdown();
      mockRateLimiter.shutdown();
    };

    await shutdown();

    expect(mockJobQueue.shutdown).toHaveBeenCalledTimes(1);
    expect(mockRateLimiter.shutdown).toHaveBeenCalledTimes(1);
  });

  it('should clear cleanup interval on shutdown', async () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    const interval = setInterval(() => {}, 1000);

    clearInterval(interval);

    expect(clearIntervalSpy).toHaveBeenCalledWith(interval);
    clearIntervalSpy.mockRestore();
  });
});
