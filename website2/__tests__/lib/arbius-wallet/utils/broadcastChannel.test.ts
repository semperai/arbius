import { broadcastTxUpdate, broadcastWalletState } from '@/lib/arbius-wallet/utils/broadcastChannel';
import { Transaction, WalletState } from '@/lib/arbius-wallet/types';

describe('broadcastChannel', () => {
  let mockBroadcastChannel: {
    postMessage: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockBroadcastChannel = {
      postMessage: jest.fn(),
    };

    // Mock BroadcastChannel
    (global as any).BroadcastChannel = jest.fn().mockImplementation(() => mockBroadcastChannel);
  });

  afterEach(() => {
    delete (global as any).BroadcastChannel;
  });

  describe('broadcastTxUpdate', () => {
    it('should broadcast transaction update when BroadcastChannel is available', () => {
      const mockTransaction: Transaction = {
        hash: '0x123',
        status: 'pending',
        from: '0xfrom',
        to: '0xto',
        value: BigInt(100),
        data: '0xdata',
        chainId: 1,
        createdAt: Date.now(),
      } as Transaction;

      broadcastTxUpdate(mockTransaction);

      expect((global as any).BroadcastChannel).toHaveBeenCalledWith('aa-wallet-tx-queue');
      expect(mockBroadcastChannel.postMessage).toHaveBeenCalledWith({
        transaction: mockTransaction,
        timestamp: expect.any(Number),
      });
    });

    it('should not throw error when BroadcastChannel is undefined', () => {
      delete (global as any).BroadcastChannel;

      const mockTransaction: Transaction = {
        hash: '0x123',
        status: 'pending',
      } as Transaction;

      expect(() => broadcastTxUpdate(mockTransaction)).not.toThrow();
    });

    it('should use current timestamp', () => {
      const mockTransaction: Transaction = {
        hash: '0x123',
        status: 'pending',
      } as Transaction;

      const before = Date.now();
      broadcastTxUpdate(mockTransaction);
      const after = Date.now();

      const callArgs = mockBroadcastChannel.postMessage.mock.calls[0][0];
      expect(callArgs.timestamp).toBeGreaterThanOrEqual(before);
      expect(callArgs.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('broadcastWalletState', () => {
    it('should broadcast wallet state when BroadcastChannel is available', () => {
      const mockState: WalletState = {
        isConnected: true,
        address: '0x123',
        chainId: 1,
      };

      broadcastWalletState(mockState);

      expect((global as any).BroadcastChannel).toHaveBeenCalledWith('aa-wallet-state');
      expect(mockBroadcastChannel.postMessage).toHaveBeenCalledWith({
        state: mockState,
        timestamp: expect.any(Number),
      });
    });

    it('should not throw error when BroadcastChannel is undefined', () => {
      delete (global as any).BroadcastChannel;

      const mockState: WalletState = {
        isConnected: false,
        address: null,
        chainId: null,
      };

      expect(() => broadcastWalletState(mockState)).not.toThrow();
    });

    it('should use current timestamp', () => {
      const mockState: WalletState = {
        isConnected: true,
        address: '0x123',
        chainId: 1,
      };

      const before = Date.now();
      broadcastWalletState(mockState);
      const after = Date.now();

      const callArgs = mockBroadcastChannel.postMessage.mock.calls[0][0];
      expect(callArgs.timestamp).toBeGreaterThanOrEqual(before);
      expect(callArgs.timestamp).toBeLessThanOrEqual(after);
    });

    it('should work with disconnected state', () => {
      const mockState: WalletState = {
        isConnected: false,
        address: null,
        chainId: null,
      };

      broadcastWalletState(mockState);

      expect(mockBroadcastChannel.postMessage).toHaveBeenCalledWith({
        state: mockState,
        timestamp: expect.any(Number),
      });
    });
  });
});
