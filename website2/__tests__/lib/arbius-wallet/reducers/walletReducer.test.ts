/**
 * Tests for wallet reducer
 */

import { walletReducer, initialState } from '@/lib/arbius-wallet/reducers/walletReducer';
import {
  WALLET_CONNECT,
  WALLET_DISCONNECT,
  WALLET_SWITCH_CHAIN,
  WALLET_SET_CONFIG,
  WALLET_SET_STATE,
  TRANSACTION_ADD,
  TRANSACTION_UPDATE,
  WalletAction
} from '@/lib/arbius-wallet/reducers/walletActions';
import { WalletState, Transaction, TransactionStatus } from '@/lib/arbius-wallet/types';

describe('walletReducer', () => {
  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(initialState).toEqual({
        isConnected: false,
        address: null,
        chainId: null,
        transactions: []
      });
    });
  });

  describe('WALLET_CONNECT', () => {
    it('should update state with wallet connection data', () => {
      const connectAction: WalletAction = {
        type: WALLET_CONNECT,
        payload: {
          isConnected: true,
          address: '0x1234567890123456789012345678901234567890',
          chainId: 42161,
          transactions: []
        }
      };

      const newState = walletReducer(initialState, connectAction);

      expect(newState.isConnected).toBe(true);
      expect(newState.address).toBe('0x1234567890123456789012345678901234567890');
      expect(newState.chainId).toBe(42161);
    });

    it('should merge payload with existing state', () => {
      const existingState: WalletState = {
        isConnected: false,
        address: null,
        chainId: null,
        transactions: [{
          id: 'tx-1',
          status: TransactionStatus.PENDING,
          method: 'eth_sendTransaction',
          params: [],
          chainId: 42161,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }]
      };

      const connectAction: WalletAction = {
        type: WALLET_CONNECT,
        payload: {
          isConnected: true,
          address: '0x1234567890123456789012345678901234567890',
          chainId: 42161,
          transactions: []
        }
      };

      const newState = walletReducer(existingState, connectAction);

      expect(newState.isConnected).toBe(true);
      expect(newState.address).toBe('0x1234567890123456789012345678901234567890');
      expect(newState.chainId).toBe(42161);
      // Payload should override
      expect(newState.transactions).toEqual([]);
    });
  });

  describe('WALLET_DISCONNECT', () => {
    it('should disconnect wallet and clear connection data', () => {
      const connectedState: WalletState = {
        isConnected: true,
        address: '0x1234567890123456789012345678901234567890',
        chainId: 42161,
        transactions: [{
          id: 'tx-1',
          status: TransactionStatus.PENDING,
          method: 'eth_sendTransaction',
          params: [],
          chainId: 42161,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }]
      };

      const disconnectAction: WalletAction = {
        type: WALLET_DISCONNECT
      };

      const newState = walletReducer(connectedState, disconnectAction);

      expect(newState.isConnected).toBe(false);
      expect(newState.address).toBeNull();
      expect(newState.chainId).toBeNull();
      // Transactions should be preserved
      expect(newState.transactions).toHaveLength(1);
    });

    it('should handle disconnect when already disconnected', () => {
      const disconnectAction: WalletAction = {
        type: WALLET_DISCONNECT
      };

      const newState = walletReducer(initialState, disconnectAction);

      expect(newState.isConnected).toBe(false);
      expect(newState.address).toBeNull();
      expect(newState.chainId).toBeNull();
    });
  });

  describe('WALLET_SWITCH_CHAIN', () => {
    it('should update chain ID', () => {
      const connectedState: WalletState = {
        isConnected: true,
        address: '0x1234567890123456789012345678901234567890',
        chainId: 42161,
        transactions: []
      };

      const switchChainAction: WalletAction = {
        type: WALLET_SWITCH_CHAIN,
        payload: 1
      };

      const newState = walletReducer(connectedState, switchChainAction);

      expect(newState.chainId).toBe(1);
      expect(newState.isConnected).toBe(true);
      expect(newState.address).toBe('0x1234567890123456789012345678901234567890');
    });

    it('should preserve other state when switching chain', () => {
      const stateWithTransactions: WalletState = {
        isConnected: true,
        address: '0x1234567890123456789012345678901234567890',
        chainId: 42161,
        transactions: [{
          id: 'tx-1',
          status: TransactionStatus.PENDING,
          method: 'eth_sendTransaction',
          params: [],
          chainId: 42161,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }]
      };

      const switchChainAction: WalletAction = {
        type: WALLET_SWITCH_CHAIN,
        payload: 10
      };

      const newState = walletReducer(stateWithTransactions, switchChainAction);

      expect(newState.chainId).toBe(10);
      expect(newState.transactions).toHaveLength(1);
    });
  });

  describe('WALLET_SET_CONFIG', () => {
    it('should return state unchanged', () => {
      const connectedState: WalletState = {
        isConnected: true,
        address: '0x1234567890123456789012345678901234567890',
        chainId: 42161,
        transactions: []
      };

      const setConfigAction: WalletAction = {
        type: WALLET_SET_CONFIG,
        payload: {
          defaultChainId: 1,
          supportedChainIds: [1, 42161],
          ui: { autoConnectOnInit: false, theme: 'system' }
        }
      };

      const newState = walletReducer(connectedState, setConfigAction);

      expect(newState).toBe(connectedState);
      expect(newState).toEqual(connectedState);
    });
  });

  describe('WALLET_SET_STATE', () => {
    it('should replace entire state with payload', () => {
      const existingState: WalletState = {
        isConnected: true,
        address: '0x1234567890123456789012345678901234567890',
        chainId: 42161,
        transactions: [{
          id: 'tx-1',
          status: TransactionStatus.PENDING,
          method: 'eth_sendTransaction',
          params: [],
          chainId: 42161,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }]
      };

      const newStatePayload: WalletState = {
        isConnected: false,
        address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        chainId: 1,
        transactions: []
      };

      const setStateAction: WalletAction = {
        type: WALLET_SET_STATE,
        payload: newStatePayload
      };

      const newState = walletReducer(existingState, setStateAction);

      expect(newState).toEqual(newStatePayload);
      expect(newState.isConnected).toBe(false);
      expect(newState.address).toBe('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd');
      expect(newState.chainId).toBe(1);
      expect(newState.transactions).toEqual([]);
    });
  });

  describe('TRANSACTION_ADD', () => {
    it('should add transaction to empty transactions array', () => {
      const transaction: Transaction = {
        id: 'tx-1',
        status: TransactionStatus.PENDING,
        method: 'eth_sendTransaction',
        params: [],
        chainId: 42161,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const addTxAction: WalletAction = {
        type: TRANSACTION_ADD,
        payload: transaction
      };

      const newState = walletReducer(initialState, addTxAction);

      expect(newState.transactions).toHaveLength(1);
      expect(newState.transactions[0]).toEqual(transaction);
    });

    it('should append transaction to existing transactions', () => {
      const existingTx: Transaction = {
        id: 'tx-1',
        status: TransactionStatus.COMPLETED,
        method: 'eth_sendTransaction',
        params: [],
        chainId: 42161,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const stateWithTx: WalletState = {
        ...initialState,
        transactions: [existingTx]
      };

      const newTx: Transaction = {
        id: 'tx-2',
        status: TransactionStatus.PENDING,
        method: 'personal_sign',
        params: [],
        chainId: 42161,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const addTxAction: WalletAction = {
        type: TRANSACTION_ADD,
        payload: newTx
      };

      const newState = walletReducer(stateWithTx, addTxAction);

      expect(newState.transactions).toHaveLength(2);
      expect(newState.transactions[0]).toEqual(existingTx);
      expect(newState.transactions[1]).toEqual(newTx);
    });

    it('should preserve other state when adding transaction', () => {
      const connectedState: WalletState = {
        isConnected: true,
        address: '0x1234567890123456789012345678901234567890',
        chainId: 42161,
        transactions: []
      };

      const transaction: Transaction = {
        id: 'tx-1',
        status: TransactionStatus.PENDING,
        method: 'eth_sendTransaction',
        params: [],
        chainId: 42161,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const addTxAction: WalletAction = {
        type: TRANSACTION_ADD,
        payload: transaction
      };

      const newState = walletReducer(connectedState, addTxAction);

      expect(newState.isConnected).toBe(true);
      expect(newState.address).toBe('0x1234567890123456789012345678901234567890');
      expect(newState.chainId).toBe(42161);
      expect(newState.transactions).toHaveLength(1);
    });
  });

  describe('TRANSACTION_UPDATE', () => {
    it('should update matching transaction', () => {
      const originalTx: Transaction = {
        id: 'tx-1',
        status: TransactionStatus.PENDING,
        method: 'eth_sendTransaction',
        params: [],
        chainId: 42161,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const stateWithTx: WalletState = {
        ...initialState,
        transactions: [originalTx]
      };

      const updatedTx: Transaction = {
        ...originalTx,
        status: TransactionStatus.COMPLETED,
        hash: '0xabcdef',
        updatedAt: Date.now() + 1000
      };

      const updateTxAction: WalletAction = {
        type: TRANSACTION_UPDATE,
        payload: updatedTx
      };

      const newState = walletReducer(stateWithTx, updateTxAction);

      expect(newState.transactions).toHaveLength(1);
      expect(newState.transactions[0].status).toBe(TransactionStatus.COMPLETED);
      expect(newState.transactions[0].hash).toBe('0xabcdef');
    });

    it('should update only matching transaction in array', () => {
      const tx1: Transaction = {
        id: 'tx-1',
        status: TransactionStatus.COMPLETED,
        method: 'eth_sendTransaction',
        params: [],
        chainId: 42161,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const tx2: Transaction = {
        id: 'tx-2',
        status: TransactionStatus.PENDING,
        method: 'eth_sendTransaction',
        params: [],
        chainId: 42161,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const tx3: Transaction = {
        id: 'tx-3',
        status: TransactionStatus.PENDING,
        method: 'personal_sign',
        params: [],
        chainId: 42161,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const stateWithTxs: WalletState = {
        ...initialState,
        transactions: [tx1, tx2, tx3]
      };

      const updatedTx2: Transaction = {
        ...tx2,
        status: TransactionStatus.COMPLETED,
        hash: '0x123456'
      };

      const updateTxAction: WalletAction = {
        type: TRANSACTION_UPDATE,
        payload: updatedTx2
      };

      const newState = walletReducer(stateWithTxs, updateTxAction);

      expect(newState.transactions).toHaveLength(3);
      expect(newState.transactions[0]).toEqual(tx1);
      expect(newState.transactions[1].status).toBe(TransactionStatus.COMPLETED);
      expect(newState.transactions[1].hash).toBe('0x123456');
      expect(newState.transactions[2]).toEqual(tx3);
    });

    it('should not modify state if transaction ID not found', () => {
      const tx1: Transaction = {
        id: 'tx-1',
        status: TransactionStatus.PENDING,
        method: 'eth_sendTransaction',
        params: [],
        chainId: 42161,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const stateWithTx: WalletState = {
        ...initialState,
        transactions: [tx1]
      };

      const nonExistentTx: Transaction = {
        id: 'tx-999',
        status: TransactionStatus.COMPLETED,
        method: 'eth_sendTransaction',
        params: [],
        chainId: 42161,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const updateTxAction: WalletAction = {
        type: TRANSACTION_UPDATE,
        payload: nonExistentTx
      };

      const newState = walletReducer(stateWithTx, updateTxAction);

      expect(newState.transactions).toHaveLength(1);
      expect(newState.transactions[0]).toEqual(tx1);
    });
  });

  describe('Unknown Action', () => {
    it('should return unchanged state for unknown action type', () => {
      const connectedState: WalletState = {
        isConnected: true,
        address: '0x1234567890123456789012345678901234567890',
        chainId: 42161,
        transactions: []
      };

      const unknownAction = {
        type: 'UNKNOWN_ACTION',
        payload: {}
      } as any;

      const newState = walletReducer(connectedState, unknownAction);

      expect(newState).toBe(connectedState);
      expect(newState).toEqual(connectedState);
    });
  });

  describe('State Immutability', () => {
    it('should not mutate original state on WALLET_CONNECT', () => {
      const originalState = { ...initialState };

      const connectAction: WalletAction = {
        type: WALLET_CONNECT,
        payload: {
          isConnected: true,
          address: '0x1234567890123456789012345678901234567890',
          chainId: 42161,
          transactions: []
        }
      };

      walletReducer(initialState, connectAction);

      expect(initialState).toEqual(originalState);
    });

    it('should not mutate original state on TRANSACTION_ADD', () => {
      const stateWithTx: WalletState = {
        ...initialState,
        transactions: [{
          id: 'tx-1',
          status: TransactionStatus.PENDING,
          method: 'eth_sendTransaction',
          params: [],
          chainId: 42161,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }]
      };

      const originalLength = stateWithTx.transactions.length;

      const newTx: Transaction = {
        id: 'tx-2',
        status: TransactionStatus.PENDING,
        method: 'personal_sign',
        params: [],
        chainId: 42161,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const addTxAction: WalletAction = {
        type: TRANSACTION_ADD,
        payload: newTx
      };

      walletReducer(stateWithTx, addTxAction);

      expect(stateWithTx.transactions.length).toBe(originalLength);
    });
  });
});
