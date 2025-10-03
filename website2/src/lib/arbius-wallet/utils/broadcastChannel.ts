import { Transaction, WalletState } from '../types';

export function broadcastTxUpdate(transaction: Transaction): void {
  if (typeof BroadcastChannel === 'undefined') {
    return;
  }
  
  const channel = new BroadcastChannel('aa-wallet-tx-queue');
  
  channel.postMessage({
    transaction,
    timestamp: Date.now(),
  });
}

export function broadcastWalletState(state: WalletState): void {
  if (typeof BroadcastChannel === 'undefined') {
    return;
  }
  
  const channel = new BroadcastChannel('aa-wallet-state');
  
  channel.postMessage({
    state,
    timestamp: Date.now(),
  });
}