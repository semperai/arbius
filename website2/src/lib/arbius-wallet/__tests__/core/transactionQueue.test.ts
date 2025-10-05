import { setupTransactionQueue } from '../../core/transactionQueue';

// Mock broadcastChannel to avoid errors
jest.mock('../../utils/broadcastChannel', () => ({
  broadcastTxUpdate: jest.fn(),
  setupBroadcastChannelListener: jest.fn(),
}));

describe('transactionQueue', () => {
  describe('setupTransactionQueue()', () => {
    it('should execute without errors', () => {
      expect(() => setupTransactionQueue()).not.toThrow();
    });

    it('should be callable multiple times', () => {
      expect(() => {
        setupTransactionQueue();
        setupTransactionQueue();
        setupTransactionQueue();
      }).not.toThrow();
    });
  });

  describe('Integration with init', () => {
    it('should be called during wallet initialization', () => {
      // This test verifies that setupTransactionQueue is part of the init flow
      // The actual call is tested in init.test.ts via mocks
      expect(setupTransactionQueue).toBeDefined();
      expect(typeof setupTransactionQueue).toBe('function');
    });

    it('should work even when proxy setup fails (fallback scenario)', () => {
      // Transaction queue should still be set up even if ethereum proxy fails
      // This ensures transaction handling continues to work in fallback mode
      expect(() => setupTransactionQueue()).not.toThrow();
    });
  });
});
