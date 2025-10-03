import React, { createContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { Address } from 'viem';
import { AAWalletContextValue, Transaction, TransactionStatus, WalletState } from '../types';
import { isInitialized, getConfig } from '../core/init';
import { walletReducer, initialState } from '../reducers/walletReducer';
import { WALLET_CONNECT, WALLET_DISCONNECT, WALLET_SWITCH_CHAIN, TRANSACTION_ADD, TRANSACTION_UPDATE } from '../reducers/walletActions';
import { broadcastWalletState } from '../utils/broadcastChannel';

export const AAWalletContext = createContext<AAWalletContextValue>({
  isConnected: false,
  address: null,
  chainId: null,
  transactions: [],
  connect: async () => '',
  disconnect: () => {},
  switchChain: async () => {},
  sendTransaction: async () => '',
});

interface AAWalletProviderProps {
  children: React.ReactNode;
}

export const AAWalletProvider: React.FC<AAWalletProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(walletReducer, initialState);
  
  useEffect(() => {
    if (!isInitialized()) {
      console.warn('AA Wallet not initialized. Call init() before rendering AAWalletProvider.');
      return () => {};
    }
    
    const config = getConfig();
    if (config) {
      dispatch({ type: 'WALLET_SET_CONFIG', payload: config });
      
      if (config.ui?.autoConnectOnInit) {
        connect();
      }
    }
    
    if (!window.ethereum) {
      return () => {};
    }

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        dispatch({ type: WALLET_DISCONNECT });
      } else {
        const newState: WalletState = {
          address: accounts[0] as Address,
          chainId: state.chainId ?? null,
          isConnected: true,
          transactions: state.transactions
        };
        
        dispatch({ type: WALLET_CONNECT, payload: newState });
      }
    };
    
    const handleChainChanged = (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      dispatch({ type: WALLET_SWITCH_CHAIN, payload: chainId });
    };

    const ethereum = window.ethereum;
    if (ethereum) {
      try {
        // Use the ethereum object directly for event listeners
        // Some providers use Proxy which can cause issues with .on()
        const provider = ethereum;
        if (typeof provider.on === 'function') {
          provider.on('accountsChanged', handleAccountsChanged);
          provider.on('chainChanged', handleChainChanged);
        }
      } catch (error) {
        console.warn('Failed to attach ethereum event listeners:', error);
      }
    }

    return () => {
      if (ethereum) {
        try {
          const provider = ethereum;
          if (typeof provider.removeListener === 'function') {
            provider.removeListener('accountsChanged', handleAccountsChanged);
            provider.removeListener('chainChanged', handleChainChanged);
          }
        } catch (error) {
          console.warn('Failed to remove ethereum event listeners:', error);
        }
      }
    };
  }, []);
  
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') {
      return () => {};
    }
    
    const channel = new BroadcastChannel('aa-wallet-state');
    
    channel.onmessage = (event) => {
      const { state: newState } = event.data;
      dispatch({ type: 'WALLET_SET_STATE', payload: newState });
    };
    
    return () => {
      channel.close();
    };
  }, []);
  
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') {
      return () => {};
    }
    
    const channel = new BroadcastChannel('aa-wallet-tx-queue');
    
    channel.onmessage = (event) => {
      const { transaction } = event.data;
      const existingTx = state.transactions.find(tx => tx.id === transaction.id);
      
      if (existingTx) {
        dispatch({ type: TRANSACTION_UPDATE, payload: transaction });
      } else {
        dispatch({ type: TRANSACTION_ADD, payload: transaction });
      }
    };
    
    return () => {
      channel.close();
    };
  }, [state.transactions]);
  
  const connect = useCallback(async (): Promise<string> => {
    if (!window.ethereum) {
      throw new Error('No Ethereum provider found');
    }
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }
      
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const chainId = parseInt(chainIdHex, 16);
      
      const newState: WalletState = {
        address: accounts[0] as Address,
        chainId,
        isConnected: true,
        transactions: state.transactions
      };

      dispatch({
        type: WALLET_CONNECT,
        payload: newState
      });
      
      broadcastWalletState(newState);
      
      return accounts[0];
    } catch (error) {
      const err = error as Error;
      console.error('Error connecting to wallet:', err);
      throw err;
    }
  }, [state.transactions]);
  
  const disconnect = useCallback(() => {
    const newState: WalletState = {
      isConnected: false,
      address: null,
      chainId: null,
      transactions: state.transactions
    };
    dispatch({ type: WALLET_DISCONNECT });
    broadcastWalletState(newState);
  }, [state.transactions]);
  
  const switchChain = useCallback(async (chainId: number) => {
    if (!window.ethereum) {
      throw new Error('No Ethereum provider found');
    }
    
    if (!state.isConnected) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const chainIdHex = `0x${chainId.toString(16)}`;
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
      
      const newState: WalletState = {
        ...state,
        chainId
      };
      dispatch({ type: WALLET_SWITCH_CHAIN, payload: chainId });
      broadcastWalletState(newState);
    } catch (error) {
      const err = error as { code?: number };
      if (err.code === 4902) {
        throw new Error('Chain not supported by wallet');
      }
      throw error;
    }
  }, [state]);
  
  const sendTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!window.ethereum) {
      throw new Error('No Ethereum provider found');
    }
    
    if (!state.isConnected) {
      throw new Error('Wallet not connected');
    }
    
    const txId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const tx: Transaction = {
      id: txId,
      status: TransactionStatus.PENDING,
      method: transaction.method,
      params: transaction.params,
      chainId: transaction.chainId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const newState: WalletState = {
      ...state,
      transactions: [...state.transactions, tx]
    };
    
    dispatch({ type: TRANSACTION_ADD, payload: tx });
    
    try {
      const hash = await window.ethereum.request({
        method: transaction.method,
        params: transaction.params,
      });
      
      const updatedTx: Transaction = {
        ...tx,
        hash: hash as Address,
        status: TransactionStatus.SUCCESS,
        updatedAt: Date.now(),
      };
      
      const finalState: WalletState = {
        ...newState,
        transactions: newState.transactions.map(t => 
          t.id === txId ? updatedTx : t
        )
      };
      
      dispatch({ type: TRANSACTION_UPDATE, payload: updatedTx });
      broadcastWalletState(finalState);
      
      return hash;
    } catch (error) {
      const err = error as Error;
      const updatedTx: Transaction = {
        ...tx,
        status: TransactionStatus.ERROR,
        error: err,
        updatedAt: Date.now(),
      };
      
      const finalState: WalletState = {
        ...newState,
        transactions: newState.transactions.map(t => 
          t.id === txId ? updatedTx : t
        )
      };
      
      dispatch({ type: TRANSACTION_UPDATE, payload: updatedTx });
      broadcastWalletState(finalState);
      
      throw err;
    }
  }, [state]);
  
  const contextValue = useMemo<AAWalletContextValue>(() => ({
    ...state,
    connect,
    disconnect,
    switchChain,
    sendTransaction,
  }), [state, connect, disconnect, switchChain, sendTransaction]);
  
  return (
    <AAWalletContext.Provider value={contextValue}>
      {children}
    </AAWalletContext.Provider>
  );
};