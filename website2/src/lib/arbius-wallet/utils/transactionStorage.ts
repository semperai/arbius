/**
 * IndexedDB-based transaction storage
 * Stores transaction history per wallet address with automatic pruning
 */

import { Transaction, TransactionStatus } from '../types';

const DB_NAME = 'arbiuswallet_db';
const DB_VERSION = 1;
const STORE_NAME = 'transactions';
const MAX_TRANSACTIONS_PER_ADDRESS = 10000; // Prune when exceeding this

interface TransactionRecord {
  id: string;
  address: string; // Wallet address (indexed)
  chainId: number;
  status: TransactionStatus;
  method: string;
  params: any[];
  hash?: string;
  error?: any;
  createdAt: number;
  updatedAt: number;
}

/**
 * Initialize IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

        // Create index on address for quick lookups
        store.createIndex('address', 'address', { unique: false });

        // Create compound index on address + createdAt for sorting
        store.createIndex('address_createdAt', ['address', 'createdAt'], { unique: false });
      }
    };
  });
}

/**
 * Save a transaction to IndexedDB
 */
export async function saveTransaction(
  transaction: Transaction,
  address: string
): Promise<boolean> {
  try {
    const db = await openDB();

    const record: TransactionRecord = {
      id: transaction.id,
      address: address.toLowerCase(),
      chainId: transaction.chainId,
      status: transaction.status,
      method: transaction.method,
      params: transaction.params,
      hash: transaction.hash,
      error: transaction.error,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => {
        // Check if we need to prune after saving
        pruneOldTransactions(address).catch(console.error);
        resolve(true);
      };
      request.onerror = () => {
        console.error('Failed to save transaction:', request.error);
        resolve(false);
      };
    });
  } catch (error) {
    console.error('Failed to save transaction:', error);
    return false;
  }
}

/**
 * Load pending transactions for an address
 */
export async function loadPendingTransactions(address: string): Promise<Transaction[]> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('address');
      const request = index.getAll(address.toLowerCase());

      request.onsuccess = () => {
        const records = request.result as TransactionRecord[];

        // Filter for pending transactions only
        const pendingTxs = records
          .filter(record => record.status === TransactionStatus.PENDING)
          .map(record => ({
            id: record.id,
            status: record.status,
            method: record.method,
            params: record.params,
            chainId: record.chainId,
            hash: record.hash,
            error: record.error,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
          } as Transaction));

        resolve(pendingTxs);
      };

      request.onerror = () => {
        console.error('Failed to load transactions:', request.error);
        resolve([]);
      };
    });
  } catch (error) {
    console.error('Failed to load transactions:', error);
    return [];
  }
}

/**
 * Load all transactions for an address (for history)
 */
export async function loadTransactionHistory(
  address: string,
  limit: number = 100
): Promise<Transaction[]> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('address_createdAt');

      // Get transactions for this address, sorted by createdAt (newest first)
      const range = IDBKeyRange.bound(
        [address.toLowerCase(), 0],
        [address.toLowerCase(), Date.now()]
      );

      const request = index.openCursor(range, 'prev'); // Reverse order
      const transactions: Transaction[] = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;

        if (cursor && count < limit) {
          const record = cursor.value as TransactionRecord;
          transactions.push({
            id: record.id,
            status: record.status,
            method: record.method,
            params: record.params,
            chainId: record.chainId,
            hash: record.hash,
            error: record.error,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
          });
          count++;
          cursor.continue();
        } else {
          resolve(transactions);
        }
      };

      request.onerror = () => {
        console.error('Failed to load transaction history:', request.error);
        resolve([]);
      };
    });
  } catch (error) {
    console.error('Failed to load transaction history:', error);
    return [];
  }
}

/**
 * Prune old transactions when exceeding limit
 */
async function pruneOldTransactions(address: string): Promise<void> {
  try {
    const db = await openDB();

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('address_createdAt');

    // Get all transactions for this address
    const range = IDBKeyRange.bound(
      [address.toLowerCase(), 0],
      [address.toLowerCase(), Date.now()]
    );

    const request = index.openCursor(range, 'prev'); // Newest first
    let count = 0;
    const toDelete: string[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;

      if (cursor) {
        count++;

        // Keep only MAX_TRANSACTIONS_PER_ADDRESS
        if (count > MAX_TRANSACTIONS_PER_ADDRESS) {
          toDelete.push(cursor.value.id);
        }

        cursor.continue();
      } else {
        // Delete old transactions
        toDelete.forEach(id => {
          store.delete(id);
        });

        if (toDelete.length > 0) {
          console.log(`Pruned ${toDelete.length} old transactions for ${address}`);
        }
      }
    };
  } catch (error) {
    console.error('Failed to prune transactions:', error);
  }
}

/**
 * Update a transaction status
 */
export async function updateTransaction(
  transactionId: string,
  address: string,
  updates: Partial<Transaction>
): Promise<boolean> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getRequest = store.get(transactionId);

      getRequest.onsuccess = () => {
        const record = getRequest.result as TransactionRecord;

        if (!record) {
          resolve(false);
          return;
        }

        // Update the record
        const updated: TransactionRecord = {
          ...record,
          ...updates,
          updatedAt: Date.now(),
        };

        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve(true);
        putRequest.onerror = () => {
          console.error('Failed to update transaction:', putRequest.error);
          resolve(false);
        };
      };

      getRequest.onerror = () => {
        console.error('Failed to get transaction:', getRequest.error);
        resolve(false);
      };
    });
  } catch (error) {
    console.error('Failed to update transaction:', error);
    return false;
  }
}

/**
 * Delete all transactions for an address (for cleanup)
 */
export async function deleteTransactionsForAddress(address: string): Promise<boolean> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('address');
      const request = index.openCursor(IDBKeyRange.only(address.toLowerCase()));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;

        if (cursor) {
          store.delete(cursor.value.id);
          cursor.continue();
        } else {
          resolve(true);
        }
      };

      request.onerror = () => {
        console.error('Failed to delete transactions:', request.error);
        resolve(false);
      };
    });
  } catch (error) {
    console.error('Failed to delete transactions:', error);
    return false;
  }
}

/**
 * Get transaction count for an address
 */
export async function getTransactionCount(address: string): Promise<number> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('address');
      const request = index.count(address.toLowerCase());

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.error('Failed to get transaction count:', request.error);
        resolve(0);
      };
    });
  } catch (error) {
    console.error('Failed to get transaction count:', error);
    return 0;
  }
}

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.indexedDB;
}
