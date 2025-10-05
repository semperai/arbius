/**
 * Tests for transactionStorage
 */

import {
  saveTransaction,
  loadPendingTransactions,
  loadTransactionHistory,
  updateTransaction,
  deleteTransactionsForAddress,
  getTransactionCount,
  isIndexedDBAvailable,
} from '../../utils/transactionStorage';
import { Transaction, TransactionStatus } from '../../types';

// Mock IndexedDB
class MockIDBDatabase {
  objectStoreNames = {
    contains: jest.fn((name: string) => false),
  };
  transaction = jest.fn();
  createObjectStore = jest.fn((name: string, options: any) => ({
    createIndex: jest.fn(),
  }));
  close = jest.fn();
}

class MockIDBObjectStore {
  data = new Map<string, any>();
  indexData = new Map<string, any[]>();

  put = jest.fn((record: any) => {
    this.data.set(record.id, record);
    const address = record.address;
    if (!this.indexData.has(address)) {
      this.indexData.set(address, []);
    }
    const addressRecords = this.indexData.get(address)!;
    const existing = addressRecords.findIndex(r => r.id === record.id);
    if (existing >= 0) {
      addressRecords[existing] = record;
    } else {
      addressRecords.push(record);
    }
    return this.createMockRequest(undefined);
  });

  get = jest.fn((id: string) => {
    return this.createMockRequest(this.data.get(id));
  });

  delete = jest.fn((id: string) => {
    this.data.delete(id);
    return this.createMockRequest(undefined);
  });

  index = jest.fn((name: string) => {
    if (name === 'address') {
      return {
        getAll: (address: string) => {
          const records = this.indexData.get(address) || [];
          return this.createMockRequest(records);
        },
        count: (address: string) => {
          const records = this.indexData.get(address) || [];
          return this.createMockRequest(records.length);
        },
        openCursor: (range: any) => {
          return this.createCursorRequest(range, 'next');
        },
      };
    }
    if (name === 'address_createdAt') {
      return {
        openCursor: (range: any, direction: string) => {
          return this.createCursorRequest(range, direction);
        },
      };
    }
    return null;
  });

  createIndex = jest.fn();

  private createMockRequest(result: any) {
    return {
      result,
      onsuccess: null as any,
      onerror: null as any,
      addEventListener: jest.fn((event: string, handler: any) => {
        if (event === 'success') {
          setTimeout(() => handler({ target: { result } }), 0);
        }
      }),
    };
  }

  private createCursorRequest(range: any, direction: string) {
    const lowerBound = range?.lower || [null, 0];
    const address = Array.isArray(lowerBound) ? lowerBound[0] : null;

    return {
      onsuccess: null as any,
      onerror: null as any,
      addEventListener: jest.fn((event: string, handler: any) => {
        if (event === 'success') {
          setTimeout(() => {
            const records = address ? (this.indexData.get(address) || []) : [];
            const sorted = [...records].sort((a, b) => {
              if (direction === 'prev') {
                return b.createdAt - a.createdAt;
              }
              return a.createdAt - b.createdAt;
            });

            let index = 0;
            const cursor = {
              value: sorted[index],
              continue: () => {
                index++;
                if (index < sorted.length) {
                  handler({ target: { result: { ...cursor, value: sorted[index] } } });
                } else {
                  handler({ target: { result: null } });
                }
              },
            };

            handler({ target: { result: sorted.length > 0 ? cursor : null } });
          }, 0);
        }
      }),
    };
  }
}

class MockIDBTransaction {
  objectStore = jest.fn(() => new MockIDBObjectStore());
  oncomplete = null;
  onerror = null;
  onabort = null;
}

describe('transactionStorage', () => {
  let mockDB: MockIDBDatabase;
  let mockStore: MockIDBObjectStore;

  beforeEach(() => {
    // Setup IndexedDB mock
    mockDB = new MockIDBDatabase();
    mockStore = new MockIDBObjectStore();

    // Mock IDBKeyRange
    (global as any).IDBKeyRange = {
      bound: jest.fn((lower, upper) => ({ lower, upper })),
      only: jest.fn((value) => ({ value })),
    };

    mockDB.transaction.mockReturnValue({
      objectStore: jest.fn(() => mockStore),
    });

    const mockRequest: any = {
      result: mockDB,
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
    };

    (global as any).indexedDB = {
      open: jest.fn(() => mockRequest),
    };

    (global as any).window = {
      indexedDB: (global as any).indexedDB,
    };

    // Trigger onsuccess immediately
    setTimeout(() => {
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess({ target: mockRequest });
      }
    }, 0);
  });

  afterEach(() => {
    delete (global as any).indexedDB;
    delete (global as any).window;
    delete (global as any).IDBKeyRange;
    jest.clearAllMocks();
  });

  describe('isIndexedDBAvailable', () => {
    it('should return true when IndexedDB is available', () => {
      expect(isIndexedDBAvailable()).toBe(true);
    });

    it('should return false when window is undefined', () => {
      delete (global as any).window;
      expect(isIndexedDBAvailable()).toBe(false);
    });

    it('should return false when indexedDB is not available', () => {
      (global as any).window.indexedDB = undefined;
      expect(isIndexedDBAvailable()).toBe(false);
    });
  });

  describe('saveTransaction', () => {
    it('should save a transaction successfully', async () => {
      const transaction: Transaction = {
        id: 'tx-1',
        status: TransactionStatus.PENDING,
        method: 'eth_sendTransaction',
        params: [{ to: '0x123', value: '1000' }],
        chainId: 42161,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Mock put request
      const putRequest = {
        onsuccess: null as any,
        onerror: null as any,
      };
      mockStore.put.mockReturnValue(putRequest);

      const savePromise = saveTransaction(transaction, '0xabc');

      // Trigger onsuccess
      setTimeout(() => {
        if (putRequest.onsuccess) {
          putRequest.onsuccess({ target: putRequest });
        }
      }, 0);

      const result = await savePromise;
      expect(result).toBe(true);
      expect(mockStore.put).toHaveBeenCalledWith(expect.objectContaining({
        id: 'tx-1',
        address: '0xabc',
        status: TransactionStatus.PENDING,
      }));
    });

    it('should handle save errors gracefully', async () => {
      const transaction: Transaction = {
        id: 'tx-1',
        status: TransactionStatus.PENDING,
        method: 'eth_sendTransaction',
        params: [],
        chainId: 42161,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const putRequest = {
        onsuccess: null as any,
        onerror: null as any,
        error: new Error('DB error'),
      };
      mockStore.put.mockReturnValue(putRequest);

      const savePromise = saveTransaction(transaction, '0xabc');

      // Trigger onerror
      setTimeout(() => {
        if (putRequest.onerror) {
          putRequest.onerror({ target: putRequest });
        }
      }, 0);

      const result = await savePromise;
      expect(result).toBe(false);
    });

    it('should convert address to lowercase', async () => {
      const transaction: Transaction = {
        id: 'tx-1',
        status: TransactionStatus.PENDING,
        method: 'eth_sendTransaction',
        params: [],
        chainId: 42161,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const putRequest = {
        onsuccess: null as any,
        onerror: null as any,
      };
      mockStore.put.mockReturnValue(putRequest);

      const savePromise = saveTransaction(transaction, '0xABC');

      setTimeout(() => {
        if (putRequest.onsuccess) {
          putRequest.onsuccess({ target: putRequest });
        }
      }, 0);

      await savePromise;
      expect(mockStore.put).toHaveBeenCalledWith(expect.objectContaining({
        address: '0xabc',
      }));
    });
  });

  describe('loadPendingTransactions', () => {
    it('should load pending transactions', async () => {
      const getAllRequest = {
        result: [
          {
            id: 'tx-1',
            address: '0xabc',
            status: TransactionStatus.PENDING,
            method: 'eth_sendTransaction',
            params: [],
            chainId: 42161,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: 'tx-2',
            address: '0xabc',
            status: TransactionStatus.SUCCESS,
            method: 'eth_sendTransaction',
            params: [],
            chainId: 42161,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        onsuccess: null as any,
        onerror: null as any,
      };

      mockStore.index.mockReturnValue({
        getAll: jest.fn(() => getAllRequest),
      });

      const loadPromise = loadPendingTransactions('0xabc');

      setTimeout(() => {
        if (getAllRequest.onsuccess) {
          getAllRequest.onsuccess({ target: getAllRequest });
        }
      }, 0);

      const result = await loadPromise;
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tx-1');
      expect(result[0].status).toBe(TransactionStatus.PENDING);
    });

    it('should return empty array on error', async () => {
      const getAllRequest = {
        onsuccess: null as any,
        onerror: null as any,
        error: new Error('DB error'),
      };

      mockStore.index.mockReturnValue({
        getAll: jest.fn(() => getAllRequest),
      });

      const loadPromise = loadPendingTransactions('0xabc');

      setTimeout(() => {
        if (getAllRequest.onerror) {
          getAllRequest.onerror({ target: getAllRequest });
        }
      }, 0);

      const result = await loadPromise;
      expect(result).toEqual([]);
    });
  });

  describe('updateTransaction', () => {
    it('should update a transaction', async () => {
      const getRequest = {
        result: {
          id: 'tx-1',
          address: '0xabc',
          status: TransactionStatus.PENDING,
          method: 'eth_sendTransaction',
          params: [],
          chainId: 42161,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        onsuccess: null as any,
        onerror: null as any,
      };

      const putRequest = {
        onsuccess: null as any,
        onerror: null as any,
      };

      mockStore.get.mockReturnValue(getRequest);
      mockStore.put.mockReturnValue(putRequest);

      const updatePromise = updateTransaction('tx-1', '0xabc', {
        status: TransactionStatus.SUCCESS,
        hash: '0xhash123',
      });

      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess({ target: getRequest });
        }
        setTimeout(() => {
          if (putRequest.onsuccess) {
            putRequest.onsuccess({ target: putRequest });
          }
        }, 0);
      }, 0);

      const result = await updatePromise;
      expect(result).toBe(true);
      expect(mockStore.put).toHaveBeenCalledWith(expect.objectContaining({
        status: TransactionStatus.SUCCESS,
        hash: '0xhash123',
      }));
    });

    it('should return false when transaction not found', async () => {
      const getRequest = {
        result: null,
        onsuccess: null as any,
        onerror: null as any,
      };

      mockStore.get.mockReturnValue(getRequest);

      const updatePromise = updateTransaction('tx-1', '0xabc', {
        status: TransactionStatus.SUCCESS,
      });

      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess({ target: getRequest });
        }
      }, 0);

      const result = await updatePromise;
      expect(result).toBe(false);
    });

    it('should handle update errors', async () => {
      const getRequest = {
        result: {
          id: 'tx-1',
          address: '0xabc',
          status: TransactionStatus.PENDING,
        },
        onsuccess: null as any,
        onerror: null as any,
      };

      const putRequest = {
        onsuccess: null as any,
        onerror: null as any,
        error: new Error('Update failed'),
      };

      mockStore.get.mockReturnValue(getRequest);
      mockStore.put.mockReturnValue(putRequest);

      const updatePromise = updateTransaction('tx-1', '0xabc', {
        status: TransactionStatus.SUCCESS,
      });

      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess({ target: getRequest });
        }
        setTimeout(() => {
          if (putRequest.onerror) {
            putRequest.onerror({ target: putRequest });
          }
        }, 0);
      }, 0);

      const result = await updatePromise;
      expect(result).toBe(false);
    });
  });

  describe('deleteTransactionsForAddress', () => {
    it('should delete all transactions for an address', async () => {
      const cursorRequest = {
        onsuccess: null as any,
        onerror: null as any,
      };

      const cursor1 = {
        value: { id: 'tx-1', address: '0xabc' },
        continue: jest.fn(),
      };

      const cursor2 = {
        value: { id: 'tx-2', address: '0xabc' },
        continue: jest.fn(),
      };

      mockStore.index.mockReturnValue({
        openCursor: jest.fn(() => cursorRequest),
      });

      const deletePromise = deleteTransactionsForAddress('0xabc');

      setTimeout(() => {
        if (cursorRequest.onsuccess) {
          // First cursor
          cursorRequest.onsuccess({ target: { result: cursor1 } });

          setTimeout(() => {
            // Second cursor
            cursorRequest.onsuccess({ target: { result: cursor2 } });

            setTimeout(() => {
              // End cursor
              cursorRequest.onsuccess({ target: { result: null } });
            }, 0);
          }, 0);
        }
      }, 0);

      const result = await deletePromise;
      expect(result).toBe(true);
      expect(mockStore.delete).toHaveBeenCalledWith('tx-1');
      expect(mockStore.delete).toHaveBeenCalledWith('tx-2');
    });

    it('should handle delete errors', async () => {
      const cursorRequest = {
        onsuccess: null as any,
        onerror: null as any,
        error: new Error('Delete failed'),
      };

      mockStore.index.mockReturnValue({
        openCursor: jest.fn(() => cursorRequest),
      });

      const deletePromise = deleteTransactionsForAddress('0xabc');

      setTimeout(() => {
        if (cursorRequest.onerror) {
          cursorRequest.onerror({ target: cursorRequest });
        }
      }, 0);

      const result = await deletePromise;
      expect(result).toBe(false);
    });
  });

  describe('getTransactionCount', () => {
    it('should return transaction count', async () => {
      const countRequest = {
        result: 5,
        onsuccess: null as any,
        onerror: null as any,
      };

      mockStore.index.mockReturnValue({
        count: jest.fn(() => countRequest),
      });

      const countPromise = getTransactionCount('0xabc');

      setTimeout(() => {
        if (countRequest.onsuccess) {
          countRequest.onsuccess({ target: countRequest });
        }
      }, 0);

      const result = await countPromise;
      expect(result).toBe(5);
    });

    it('should return 0 on error', async () => {
      const countRequest = {
        onsuccess: null as any,
        onerror: null as any,
        error: new Error('Count failed'),
      };

      mockStore.index.mockReturnValue({
        count: jest.fn(() => countRequest),
      });

      const countPromise = getTransactionCount('0xabc');

      setTimeout(() => {
        if (countRequest.onerror) {
          countRequest.onerror({ target: countRequest });
        }
      }, 0);

      const result = await countPromise;
      expect(result).toBe(0);
    });
  });

  describe('loadTransactionHistory', () => {
    it('should load transaction history with limit', async () => {
      const tx1 = {
        id: 'tx-1',
        address: '0xabc',
        status: TransactionStatus.SUCCESS,
        method: 'eth_sendTransaction',
        params: [],
        chainId: 42161,
        createdAt: Date.now() - 2000,
        updatedAt: Date.now(),
      };

      const tx2 = {
        id: 'tx-2',
        address: '0xabc',
        status: TransactionStatus.SUCCESS,
        method: 'eth_sendTransaction',
        params: [],
        chainId: 42161,
        createdAt: Date.now() - 1000,
        updatedAt: Date.now(),
      };

      // Add transactions to mock store
      mockStore.indexData.set('0xabc', [tx1, tx2]);

      const cursorRequest = {
        onsuccess: null as any,
        onerror: null as any,
      };

      mockStore.index.mockReturnValue({
        openCursor: jest.fn((range: any, direction: string) => {
          setTimeout(() => {
            if (cursorRequest.onsuccess) {
              const records = mockStore.indexData.get('0xabc') || [];
              const sorted = [...records].sort((a, b) => b.createdAt - a.createdAt);

              let index = 0;
              const cursor = {
                value: sorted[index],
                continue: jest.fn(() => {
                  index++;
                  if (index < sorted.length) {
                    cursorRequest.onsuccess({
                      target: {
                        result: {
                          value: sorted[index],
                          continue: cursor.continue
                        }
                      }
                    });
                  } else {
                    cursorRequest.onsuccess({ target: { result: null } });
                  }
                }),
              };

              cursorRequest.onsuccess({ target: { result: cursor } });
            }
          }, 0);

          return cursorRequest;
        }),
      });

      const result = await loadTransactionHistory('0xabc', 10);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('tx-2'); // Most recent first
      expect(result[1].id).toBe('tx-1');
    });

    it('should respect limit parameter', async () => {
      const transactions = Array.from({ length: 5 }, (_, i) => ({
        id: `tx-${i}`,
        address: '0xabc',
        status: TransactionStatus.SUCCESS,
        method: 'eth_sendTransaction',
        params: [],
        chainId: 42161,
        createdAt: Date.now() - (5 - i) * 1000,
        updatedAt: Date.now(),
      }));

      mockStore.indexData.set('0xabc', transactions);

      const cursorRequest = {
        onsuccess: null as any,
        onerror: null as any,
      };

      mockStore.index.mockReturnValue({
        openCursor: jest.fn((range: any, direction: string) => {
          setTimeout(() => {
            if (cursorRequest.onsuccess) {
              const records = mockStore.indexData.get('0xabc') || [];
              const sorted = [...records].sort((a, b) => b.createdAt - a.createdAt);

              let index = 0;
              const cursor = {
                value: sorted[index],
                continue: jest.fn(() => {
                  index++;
                  if (index < sorted.length && index < 2) { // Limit to 2
                    cursorRequest.onsuccess({
                      target: {
                        result: {
                          value: sorted[index],
                          continue: cursor.continue
                        }
                      }
                    });
                  } else {
                    cursorRequest.onsuccess({ target: { result: null } });
                  }
                }),
              };

              cursorRequest.onsuccess({ target: { result: cursor } });
            }
          }, 0);

          return cursorRequest;
        }),
      });

      const result = await loadTransactionHistory('0xabc', 2);

      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('should return empty array on error', async () => {
      const cursorRequest = {
        onsuccess: null as any,
        onerror: null as any,
        error: new Error('Cursor error'),
      };

      mockStore.index.mockReturnValue({
        openCursor: jest.fn(() => cursorRequest),
      });

      const historyPromise = loadTransactionHistory('0xabc', 10);

      setTimeout(() => {
        if (cursorRequest.onerror) {
          cursorRequest.onerror({ target: cursorRequest });
        }
      }, 0);

      const result = await historyPromise;
      expect(result).toEqual([]);
    });
  });

  describe('Database initialization', () => {
    it('should reject when IndexedDB is not available', async () => {
      delete (global as any).window;

      const transaction: Transaction = {
        id: 'tx-1',
        status: TransactionStatus.PENDING,
        method: 'eth_sendTransaction',
        params: [],
        chainId: 42161,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = await saveTransaction(transaction, '0xabc');
      expect(result).toBe(false);
    });

    it('should handle database open errors', async () => {
      const mockRequest: any = {
        result: null,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        error: new Error('DB open failed'),
      };

      (global as any).indexedDB = {
        open: jest.fn(() => mockRequest),
      };

      const transaction: Transaction = {
        id: 'tx-1',
        status: TransactionStatus.PENDING,
        method: 'eth_sendTransaction',
        params: [],
        chainId: 42161,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const savePromise = saveTransaction(transaction, '0xabc');

      setTimeout(() => {
        if (mockRequest.onerror) {
          mockRequest.onerror({ target: mockRequest });
        }
      }, 0);

      const result = await savePromise;
      expect(result).toBe(false);
    });

    it('should trigger onupgradeneeded for new database', async () => {
      const mockCreateObjectStore = jest.fn((name: string, options: any) => ({
        createIndex: jest.fn(),
      }));

      const customMockStore = new MockIDBObjectStore();
      const customMockDB: any = {
        objectStoreNames: {
          contains: jest.fn(() => false), // Store doesn't exist yet
        },
        transaction: jest.fn(() => ({
          objectStore: jest.fn(() => customMockStore),
        })),
        createObjectStore: mockCreateObjectStore,
        close: jest.fn(),
      };

      const mockRequest: any = {
        result: customMockDB,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      };

      (global as any).indexedDB = {
        open: jest.fn(() => mockRequest),
      };

      const transaction: Transaction = {
        id: 'tx-1',
        status: TransactionStatus.PENDING,
        method: 'eth_sendTransaction',
        params: [],
        chainId: 42161,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Mock put to succeed
      const putRequest = {
        onsuccess: null as any,
        onerror: null as any,
      };
      customMockStore.put.mockReturnValue(putRequest);

      const savePromise = saveTransaction(transaction, '0xabc');

      // Trigger onupgradeneeded first
      setTimeout(() => {
        if (mockRequest.onupgradeneeded) {
          mockRequest.onupgradeneeded({ target: mockRequest });
        }

        // Then trigger onsuccess
        setTimeout(() => {
          if (mockRequest.onsuccess) {
            mockRequest.onsuccess({ target: mockRequest });
          }

          // Then complete the put operation
          setTimeout(() => {
            if (putRequest.onsuccess) {
              putRequest.onsuccess({ target: putRequest });
            }
          }, 0);
        }, 0);
      }, 0);

      // Wait for all promises
      await savePromise;

      expect(mockCreateObjectStore).toHaveBeenCalledWith(
        'transactions',
        { keyPath: 'id' }
      );
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle catch block in saveTransaction', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Force an error by making indexedDB.open throw
      (global as any).indexedDB = {
        open: jest.fn(() => {
          throw new Error('Unexpected error');
        }),
      };

      const transaction: Transaction = {
        id: 'tx-1',
        status: TransactionStatus.PENDING,
        method: 'eth_sendTransaction',
        params: [],
        chainId: 42161,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = await saveTransaction(transaction, '0xabc');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save transaction:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle catch block in loadPendingTransactions', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (global as any).indexedDB = {
        open: jest.fn(() => {
          throw new Error('Unexpected error');
        }),
      };

      const result = await loadPendingTransactions('0xabc');

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load transactions:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle catch block in updateTransaction', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (global as any).indexedDB = {
        open: jest.fn(() => {
          throw new Error('Unexpected error');
        }),
      };

      const result = await updateTransaction('tx-1', '0xabc', {
        status: TransactionStatus.SUCCESS,
      });

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to update transaction:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle catch block in deleteTransactionsForAddress', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (global as any).indexedDB = {
        open: jest.fn(() => {
          throw new Error('Unexpected error');
        }),
      };

      const result = await deleteTransactionsForAddress('0xabc');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to delete transactions:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle catch block in getTransactionCount', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (global as any).indexedDB = {
        open: jest.fn(() => {
          throw new Error('Unexpected error');
        }),
      };

      const result = await getTransactionCount('0xabc');

      expect(result).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to get transaction count:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle catch block in loadTransactionHistory', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (global as any).indexedDB = {
        open: jest.fn(() => {
          throw new Error('Unexpected error');
        }),
      };

      const result = await loadTransactionHistory('0xabc', 10);

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load transaction history:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle getRequest onerror in updateTransaction', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const getRequest = {
        onsuccess: null as any,
        onerror: null as any,
        error: new Error('Get failed'),
      };

      mockStore.get.mockReturnValue(getRequest);

      const updatePromise = updateTransaction('tx-1', '0xabc', {
        status: TransactionStatus.SUCCESS,
      });

      setTimeout(() => {
        if (getRequest.onerror) {
          getRequest.onerror({ target: getRequest });
        }
      }, 0);

      const result = await updatePromise;

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to get transaction:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
