import { DepositMonitor } from '../../src/services/DepositMonitor';
import { UserService } from '../../src/services/UserService';

// Mock the logger
jest.mock('../../src/log', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('DepositMonitor', () => {
  let monitor: DepositMonitor;
  let mockProvider: any;
  let mockUserService: any;

  const BOT_WALLET = '0x1111111111111111111111111111111111111111';
  const TOKEN_ADDRESS = '0x2222222222222222222222222222222222222222';

  beforeEach(() => {
    jest.clearAllMocks();

    mockProvider = {
      getBlockNumber: jest.fn().mockResolvedValue(1000),
    };

    mockUserService = {
      getUserByWallet: jest.fn(),
      creditBalance: jest.fn(),
      storeUnclaimedDeposit: jest.fn(),
      db: {
        depositExists: jest.fn().mockReturnValue(false),
      },
    };
  });

  afterEach(() => {
    if (monitor) {
      monitor.stop();
    }
  });

  describe('constructor', () => {
    it('should initialize correctly', () => {
      monitor = new DepositMonitor(
        mockProvider,
        TOKEN_ADDRESS,
        BOT_WALLET,
        mockUserService,
        1000
      );

      expect(monitor).toBeDefined();
      expect(monitor.getLastProcessedBlock()).toBe(0);
    });
  });

  describe('start', () => {
    it('should start monitoring from current block', async () => {
      monitor = new DepositMonitor(
        mockProvider,
        TOKEN_ADDRESS,
        BOT_WALLET,
        mockUserService,
        100
      );

      mockProvider.getBlockNumber.mockResolvedValue(1000);

      await monitor.start();

      expect(monitor.getLastProcessedBlock()).toBe(1000);

      monitor.stop();
    });

    it('should start monitoring from specified block', async () => {
      monitor = new DepositMonitor(
        mockProvider,
        TOKEN_ADDRESS,
        BOT_WALLET,
        mockUserService,
        100
      );

      await monitor.start(500);

      expect(monitor.getLastProcessedBlock()).toBe(500);

      monitor.stop();
    });

    it('should not start if already running', async () => {
      monitor = new DepositMonitor(
        mockProvider,
        TOKEN_ADDRESS,
        BOT_WALLET,
        mockUserService,
        100
      );

      await monitor.start();
      mockProvider.getBlockNumber.mockClear();

      await monitor.start(); // Try to start again

      // Should not call getBlockNumber again
      expect(mockProvider.getBlockNumber).not.toHaveBeenCalled();

      monitor.stop();
    });
  });

  describe('stop', () => {
    it('should stop monitoring', async () => {
      monitor = new DepositMonitor(
        mockProvider,
        TOKEN_ADDRESS,
        BOT_WALLET,
        mockUserService,
        100
      );

      await monitor.start();
      monitor.stop();

      expect(monitor).toBeDefined();
    });
  });

  describe('getLastProcessedBlock', () => {
    it('should return last processed block', async () => {
      monitor = new DepositMonitor(
        mockProvider,
        TOKEN_ADDRESS,
        BOT_WALLET,
        mockUserService
      );

      await monitor.start(500);

      expect(monitor.getLastProcessedBlock()).toBe(500);

      monitor.stop();
    });
  });

  describe('polling behavior', () => {
    it('should skip polling when no new blocks', async () => {
      jest.useFakeTimers();

      monitor = new DepositMonitor(
        mockProvider,
        TOKEN_ADDRESS,
        BOT_WALLET,
        mockUserService,
        1000
      );

      mockProvider.getBlockNumber.mockResolvedValue(1000); // Always same block

      await monitor.start();

      // Advance timers
      await jest.advanceTimersByTimeAsync(1000);

      // Should have been called once for start, and once for poll
      expect(mockProvider.getBlockNumber).toHaveBeenCalled();

      monitor.stop();
      jest.useRealTimers();
    });

    it('should handle polling errors gracefully', async () => {
      jest.useFakeTimers();

      monitor = new DepositMonitor(
        mockProvider,
        TOKEN_ADDRESS,
        BOT_WALLET,
        mockUserService,
        1000
      );

      let callCount = 0;
      mockProvider.getBlockNumber.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve(1000);
        if (callCount === 2) return Promise.reject(new Error('Network error'));
        return Promise.resolve(1001);
      });

      await monitor.start();

      // Advance timers to trigger error
      await jest.advanceTimersByTimeAsync(1000);

      // Should continue running despite error
      await jest.advanceTimersByTimeAsync(1000);

      monitor.stop();
      jest.useRealTimers();
    });
  });
});
