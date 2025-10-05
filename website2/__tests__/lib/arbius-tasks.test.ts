import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  watchTaskSubmitted,
  watchSolutionSubmitted,
  fetchTaskFromIPFS,
  getTaskSolutionCid,
  pollTaskCompletion,
} from '@/lib/arbius-tasks';
import type { PublicClient } from 'viem';

// Mock data
const mockTaskId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
const mockModelId = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
const mockTxHash = '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba';
const mockEngineAddress = '0x1111111111111111111111111111111111111111';
const mockSender = '0x2222222222222222222222222222222222222222';
const mockValidator = '0x3333333333333333333333333333333333333333';

describe('arbius-tasks', () => {
  let mockPublicClient: vi.Mocked<PublicClient>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPublicClient = {
      getTransactionReceipt: vi.fn(),
      getLogs: vi.fn(),
      getBlockNumber: vi.fn(),
      readContract: vi.fn(),
    } as any;
  });

  describe('watchTaskSubmitted', () => {
    it('should extract TaskSubmitted event from transaction receipt', async () => {
      // Mock viem's decodeEventLog globally for this test
      const originalViem = jest.requireActual('viem');
      vi.spyOn(originalViem, 'decodeEventLog').mockReturnValueOnce({
        eventName: 'TaskSubmitted',
        args: {
          id: mockTaskId,
          model: mockModelId,
          fee: BigInt(100),
          sender: mockSender,
        },
      });

      const mockReceipt = {
        blockNumber: BigInt(12345),
        transactionHash: mockTxHash,
        logs: [
          {
            address: mockEngineAddress,
            topics: [
              '0x1234567890abcdef', // TaskSubmitted event signature
              mockTaskId,
              mockModelId,
              mockSender,
            ],
            data: '0x0000000000000000000000000000000000000000000000000000000000000064', // fee = 100
          },
        ],
      };

      mockPublicClient.getTransactionReceipt.mockResolvedValueOnce(mockReceipt as any);

      const result = await watchTaskSubmitted(
        mockPublicClient,
        mockTxHash,
        mockEngineAddress,
        5000
      );

      expect(result).toBeDefined();
      expect(result?.transactionHash).toBe(mockTxHash);
      expect(result?.blockNumber).toBe(BigInt(12345));
      expect(result?.taskId).toBe(mockTaskId);
      expect(mockPublicClient.getTransactionReceipt).toHaveBeenCalledWith({
        hash: mockTxHash,
      });
    });

    it('should timeout if transaction is not found', async () => {
      mockPublicClient.getTransactionReceipt.mockResolvedValue(null as any);

      await expect(
        watchTaskSubmitted(mockPublicClient, mockTxHash, mockEngineAddress, 100)
      ).rejects.toThrow('Timeout waiting for transaction confirmation');
    });

    it('should return null if TaskSubmitted event not found in receipt', async () => {
      const mockReceipt = {
        blockNumber: BigInt(12345),
        transactionHash: mockTxHash,
        logs: [], // No logs
      };

      mockPublicClient.getTransactionReceipt.mockResolvedValueOnce(mockReceipt as any);

      const result = await watchTaskSubmitted(
        mockPublicClient,
        mockTxHash,
        mockEngineAddress,
        5000
      );

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockPublicClient.getTransactionReceipt.mockRejectedValue(
        new Error('RPC error')
      );

      await expect(
        watchTaskSubmitted(mockPublicClient, mockTxHash, mockEngineAddress, 100)
      ).rejects.toThrow('Timeout waiting for transaction confirmation');
    });
  });

  describe('watchSolutionSubmitted', () => {
    it('should watch for SolutionSubmitted event', async () => {
      const mockLogs = [
        {
          args: {
            addr: mockValidator,
            task: mockTaskId,
          },
          blockNumber: BigInt(12350),
          transactionHash: '0xabc123',
        },
      ];

      mockPublicClient.getBlockNumber.mockResolvedValue(BigInt(12355));
      mockPublicClient.getLogs.mockResolvedValueOnce(mockLogs as any);

      const result = await watchSolutionSubmitted(
        mockPublicClient,
        mockTaskId,
        mockEngineAddress,
        BigInt(12345),
        1000
      );

      expect(result).toBeDefined();
      expect(result?.validator).toBe(mockValidator);
      expect(result?.taskId).toBe(mockTaskId);
      expect(result?.blockNumber).toBe(BigInt(12350));
    });

    it('should return null on timeout', async () => {
      mockPublicClient.getBlockNumber.mockResolvedValue(BigInt(12355));
      mockPublicClient.getLogs.mockResolvedValue([]);

      const result = await watchSolutionSubmitted(
        mockPublicClient,
        mockTaskId,
        mockEngineAddress,
        BigInt(12345),
        100
      );

      expect(result).toBeNull();
    });

    it('should handle getLogs errors', async () => {
      mockPublicClient.getBlockNumber.mockResolvedValue(BigInt(12355));
      mockPublicClient.getLogs.mockRejectedValue(new Error('RPC error'));

      const result = await watchSolutionSubmitted(
        mockPublicClient,
        mockTaskId,
        mockEngineAddress,
        BigInt(12345),
        100
      );

      expect(result).toBeNull();
    });
  });

  describe('fetchTaskFromIPFS', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it('should fetch and parse JSON from IPFS', async () => {
      const mockResult = { output: 'test result', cid: 'QmTest' };

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await fetchTaskFromIPFS('QmTest123');

      expect(result).toEqual(mockResult);
      expect(global.fetch).toHaveBeenCalled();
      const fetchCall = (global.fetch as vi.Mock).mock.calls[0];
      expect(fetchCall[0]).toContain('/ipfs/QmTest123');
    });

    it('should fallback to next gateway on failure (parallel)', async () => {
      const mockResult = { output: 'test result', cid: 'QmTest' };

      // With parallel requests, all 4 gateways are called simultaneously
      // First 3 fail, 4th succeeds
      (global.fetch as vi.Mock)
        .mockRejectedValueOnce(new Error('Gateway 1 failed'))
        .mockRejectedValueOnce(new Error('Gateway 2 failed'))
        .mockRejectedValueOnce(new Error('Gateway 3 failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResult,
        });

      const result = await fetchTaskFromIPFS('QmTest123');

      expect(result).toEqual(mockResult);
      expect(global.fetch).toHaveBeenCalledTimes(4); // All gateways tried in parallel
    });

    it('should throw when all gateways fail', async () => {
      (global.fetch as vi.Mock)
        .mockRejectedValueOnce(new Error('Gateway 1 failed'))
        .mockRejectedValueOnce(new Error('Gateway 2 failed'))
        .mockRejectedValueOnce(new Error('Gateway 3 failed'))
        .mockRejectedValueOnce(new Error('Gateway 4 failed'));

      await expect(fetchTaskFromIPFS('QmInvalid')).rejects.toThrow();
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it('should handle network errors', async () => {
      // All gateways fail with network error
      (global.fetch as vi.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(fetchTaskFromIPFS('QmTest')).rejects.toThrow();
    });
  });

  describe('getTaskSolutionCid', () => {
    const mockAbi = [
      {
        name: 'solutions',
        type: 'function',
        inputs: [{ name: 'taskId', type: 'bytes32' }],
        outputs: [{ name: 'cid', type: 'bytes' }],
      },
    ];

    it('should read solution CID from contract', async () => {
      const mockSolution = {
        cid: '0x1220abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
      };

      mockPublicClient.readContract.mockResolvedValueOnce(mockSolution as any);

      const result = await getTaskSolutionCid(
        mockPublicClient,
        mockEngineAddress,
        mockTaskId,
        mockAbi
      );

      expect(result).toBeDefined();
      expect(mockPublicClient.readContract).toHaveBeenCalledWith({
        address: mockEngineAddress,
        abi: mockAbi,
        functionName: 'solutions',
        args: [mockTaskId],
      });
    });

    it('should return null if solution has no CID', async () => {
      mockPublicClient.readContract.mockResolvedValueOnce({ cid: null } as any);

      const result = await getTaskSolutionCid(
        mockPublicClient,
        mockEngineAddress,
        mockTaskId,
        mockAbi
      );

      expect(result).toBeNull();
    });

    it('should handle contract read errors', async () => {
      mockPublicClient.readContract.mockRejectedValueOnce(
        new Error('Contract read failed')
      );

      const result = await getTaskSolutionCid(
        mockPublicClient,
        mockEngineAddress,
        mockTaskId,
        mockAbi
      );

      expect(result).toBeNull();
    });
  });

  describe('pollTaskCompletion', () => {
    const mockAbi = [
      {
        name: 'solutions',
        type: 'function',
        inputs: [{ name: 'taskId', type: 'bytes32' }],
        outputs: [{ name: 'cid', type: 'bytes' }],
      },
    ];

    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it('should poll and return result when solution is found', async () => {
      const mockCid = '0x1220abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab';
      const mockResult = { output: 'AI response', cid: 'QmResult' };

      mockPublicClient.readContract.mockResolvedValueOnce({ cid: mockCid } as any);
      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await pollTaskCompletion(
        mockPublicClient,
        mockTaskId,
        mockEngineAddress,
        mockAbi,
        BigInt(12345),
        2,
        100
      );

      expect(result).toEqual(mockResult);
    });

    it('should return null after max attempts', async () => {
      mockPublicClient.readContract.mockResolvedValue({ cid: null } as any);
      mockPublicClient.getBlockNumber.mockResolvedValue(BigInt(12355));
      mockPublicClient.getLogs.mockResolvedValue([]);

      const result = await pollTaskCompletion(
        mockPublicClient,
        mockTaskId,
        mockEngineAddress,
        mockAbi,
        BigInt(12345),
        2,
        50 // Short interval for test
      );

      expect(result).toBeNull();
      expect(mockPublicClient.readContract).toHaveBeenCalled();
    }, 10000);

    it('should handle errors during polling', async () => {
      mockPublicClient.readContract.mockRejectedValue(new Error('RPC error'));
      mockPublicClient.getBlockNumber.mockResolvedValue(BigInt(12355));
      mockPublicClient.getLogs.mockResolvedValue([]);

      const result = await pollTaskCompletion(
        mockPublicClient,
        mockTaskId,
        mockEngineAddress,
        mockAbi,
        BigInt(12345),
        2,
        50 // Short interval for test
      );

      expect(result).toBeNull();
    }, 10000);
  });
});
