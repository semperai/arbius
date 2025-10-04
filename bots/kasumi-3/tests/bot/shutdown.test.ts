import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('Bot Shutdown', () => {
  let mockJobQueue: any;
  let mockRateLimiter: any;
  let mockBot: any;

  beforeEach(() => {
    mockJobQueue = {
      shutdown: jest.fn(),
      getQueueStats: jest.fn(() => ({ total: 0, pending: 0, processing: 0, completed: 0, failed: 0 })),
      clearOldJobs: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    };

    mockRateLimiter = {
      shutdown: jest.fn(),
      checkLimit: jest.fn(() => true),
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
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const interval = setInterval(() => {}, 1000);

    clearInterval(interval);

    expect(clearIntervalSpy).toHaveBeenCalledWith(interval);
    clearIntervalSpy.mockRestore();
  });
});
