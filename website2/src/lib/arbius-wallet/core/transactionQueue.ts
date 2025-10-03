import { v4 as uuidv4 } from 'uuid';
import { Transaction, TransactionStatus } from '../types';
// import { getConfig } from './init'; // unused
import { broadcastTxUpdate } from '../utils/broadcastChannel';

/**
 * Simple mutex implementation for queue processing
 */
class Mutex {
  private locked = false;
  private waitQueue: Array<() => void> = [];
  
  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return Promise.resolve();
    }
    
    return new Promise(resolve => {
      this.waitQueue.push(resolve);
    });
  }
  
  release(): void {
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;
      resolve();
    } else {
      this.locked = false;
    }
  }
}

// Store pending transactions
const transactionQueue: Transaction[] = [];
let isProcessing = false;
const mutex = new Mutex();

/**
 * Set up the transaction queue and broadcast channel
 */
export function setupTransactionQueue(): void {
  setupBroadcastChannelListener();
}

/**
 * Send a transaction through the queue
 * @param txParams Transaction parameters
 * @returns Promise resolving to the transaction hash
 */
export async function sendTransaction(txParams: Omit<Transaction, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const txId = uuidv4();
  
  // Create a transaction object
  const transaction: Transaction = {
    id: txId,
    status: TransactionStatus.PENDING,
    method: txParams.method,
    params: txParams.params,
    chainId: txParams.chainId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  // Add to queue
  transactionQueue.push(transaction);
  
  // Broadcast the transaction
  broadcastTxUpdate(transaction);
  
  // Process the queue
  processQueue();
  
  // Return a promise that resolves when the transaction is processed
  return new Promise((resolve, reject) => {
    const checkStatus = setInterval(() => {
      const tx = transactionQueue.find(tx => tx.id === txId);
      if (!tx) {
        clearInterval(checkStatus);
        reject(new Error('Transaction removed from queue'));
        return;
      }
      
      if (tx.status === TransactionStatus.SUCCESS) {
        clearInterval(checkStatus);
        resolve(tx.hash as string);
      } else if (tx.status === TransactionStatus.ERROR) {
        clearInterval(checkStatus);
        reject(tx.error);
      }
    }, 100);
  });
}

/**
 * Process the transaction queue
 */
async function processQueue(): Promise<void> {
  // Use mutex to prevent concurrent processing
  if (isProcessing) {
    return;
  }
  
  await mutex.acquire();
  
  try {
    isProcessing = true;
    
    while (transactionQueue.length > 0) {
      const tx = transactionQueue[0];
      
      // Skip already processed transactions
      if (tx.status !== TransactionStatus.PENDING) {
        transactionQueue.shift();
        continue;
      }
      
      try {
        if (!window.ethereum) {
          throw new Error('Ethereum provider not found');
        }
        
        // Process the transaction
        const result = await window.ethereum.request({
          method: tx.method,
          params: tx.params,
        });
        
        // Update the transaction with the result
        tx.hash = result;
        tx.status = TransactionStatus.SUCCESS;
        tx.updatedAt = Date.now();
        
        // Broadcast the update
        broadcastTxUpdate(tx);
      } catch (error: any) {
        // Handle specific error types
        if (isNonceError(error)) {
          // For nonce errors, we want to retry
          console.log('Nonce error, retrying transaction');
          continue;
        }
        
        // For other errors, mark as failed
        tx.status = TransactionStatus.ERROR;
        tx.error = error;
        tx.updatedAt = Date.now();
        
        // Broadcast the update
        broadcastTxUpdate(tx);
      }
      
      // Remove the transaction from the queue
      transactionQueue.shift();
    }
  } finally {
    isProcessing = false;
    mutex.release();
  }
}

/**
 * Check if an error is a nonce error
 * @param error The error to check
 * @returns True if it's a nonce error, false otherwise
 */
function isNonceError(error: any): boolean {
  return (
    error.message?.includes('nonce') ||
    error.message?.includes('transaction underpriced') ||
    error.code === -32000
  );
}

/**
 * Set up the broadcast channel listener
 */
function setupBroadcastChannelListener(): void {
  if (typeof BroadcastChannel === 'undefined') {
    console.warn('BroadcastChannel not supported. Cross-tab communication disabled.');
    return;
  }
  
  const channel = new BroadcastChannel('aa-wallet-tx-queue');
  
  channel.onmessage = (event) => {
    const { transaction } = event.data;
    
    // Find the transaction in our queue
    const existingTxIndex = transactionQueue.findIndex(tx => tx.id === transaction.id);
    
    if (existingTxIndex >= 0) {
      // Update the existing transaction
      transactionQueue[existingTxIndex] = transaction;
    } else {
      // Add the transaction to our queue
      transactionQueue.push(transaction);
    }
    
    // Process the queue
    processQueue();
  };
}