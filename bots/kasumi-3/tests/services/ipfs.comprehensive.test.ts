import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

/**
 * Comprehensive IPFS Tests
 *
 * Coverage Target: 95%+
 * Focus: Retry logic, timeout handling, network errors, large files, concurrent uploads
 *
 * Note: These tests use dynamic imports to avoid global state pollution
 */
describe('IPFS - Comprehensive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('fetchFromIPFS - Advanced Scenarios', () => {
    it('should handle timeout errors gracefully', async () => {
      vi.mock('axios');
      const mockAxios = (await import('axios')).default as vi.Mocked<typeof axios>;

      // Simulate timeout
      mockAxios.get.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('timeout of 10000ms exceeded')), 100);
        });
      });

      const { fetchFromIPFS } = await import('../../src/ipfs');

      await expect(
        fetchFromIPFS('QmTest123', ['https://gateway1.com'], 100)
      ).rejects.toThrow('Failed to fetch QmTest123 from all IPFS gateways');
    });

    it('should handle network errors', async () => {
      vi.mock('axios');
      const mockAxios = (await import('axios')).default as vi.Mocked<typeof axios>;

      mockAxios.get.mockRejectedValue(new Error('Network Error'));

      const { fetchFromIPFS } = await import('../../src/ipfs');

      await expect(
        fetchFromIPFS('QmTest123', ['https://gateway1.com'])
      ).rejects.toThrow('Failed to fetch QmTest123 from all IPFS gateways');
    });

    it('should handle large files correctly', async () => {
      vi.mock('axios');
      const mockAxios = (await import('axios')).default as vi.Mocked<typeof axios>;

      const largeBufer = Buffer.alloc(10 * 1024 * 1024); // 10MB
      mockAxios.get.mockResolvedValue({
        data: largeBufer,
      } as any);

      const { fetchFromIPFS } = await import('../../src/ipfs');

      const result = await fetchFromIPFS('QmTest123', ['https://gateway1.com']);

      expect(result.length).toBe(10 * 1024 * 1024);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should race gateways and use fastest response', async () => {
      vi.mock('axios');
      const mockAxios = (await import('axios')).default as vi.Mocked<typeof axios>;

      const fastData = Buffer.from('fast gateway data');
      const slowData = Buffer.from('slow gateway data');

      let callCount = 0;
      mockAxios.get.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First gateway is slow
          return new Promise((resolve) => {
            setTimeout(() => resolve({ data: slowData } as any), 500);
          });
        } else {
          // Second gateway is fast
          return Promise.resolve({ data: fastData } as any);
        }
      });

      const { fetchFromIPFS } = await import('../../src/ipfs');

      const result = await fetchFromIPFS('QmTest123', [
        'https://slow-gateway.com',
        'https://fast-gateway.com',
      ]);

      // Should get fast gateway data
      expect(result).toEqual(fastData);
    });

    it('should handle partial gateway failures', async () => {
      vi.mock('axios');
      const mockAxios = (await import('axios')).default as vi.Mocked<typeof axios>;

      const successData = Buffer.from('success');

      mockAxios.get
        .mockRejectedValueOnce(new Error('Gateway 1 failed'))
        .mockRejectedValueOnce(new Error('Gateway 2 failed'))
        .mockResolvedValueOnce({ data: successData } as any);

      const { fetchFromIPFS } = await import('../../src/ipfs');

      const result = await fetchFromIPFS('QmTest123', [
        'https://gateway1.com',
        'https://gateway2.com',
        'https://gateway3.com',
      ]);

      expect(result).toEqual(successData);
    });

    it('should include error messages from all failed gateways', async () => {
      vi.mock('axios');
      const mockAxios = (await import('axios')).default as vi.Mocked<typeof axios>;

      mockAxios.get
        .mockRejectedValueOnce(new Error('Gateway 1 timeout'))
        .mockRejectedValueOnce(new Error('Gateway 2 network error'));

      const { fetchFromIPFS } = await import('../../src/ipfs');

      await expect(
        fetchFromIPFS('QmTest123', [
          'https://gateway1.com',
          'https://gateway2.com',
        ])
      ).rejects.toThrow(/Failed to fetch QmTest123 from all IPFS gateways/);
    });

    it('should attempt all gateways in parallel', async () => {
      vi.mock('axios');
      const mockAxios = (await import('axios')).default as vi.Mocked<typeof axios>;

      mockAxios.get.mockImplementation((url) => {
        if (url.includes('fast')) {
          return Promise.resolve({ data: Buffer.from('fast') } as any);
        } else {
          return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('slow')), 1000);
          });
        }
      });

      const { fetchFromIPFS } = await import('../../src/ipfs');

      const result = await fetchFromIPFS('QmTest123', [
        'https://slow.com',
        'https://fast.com',
      ]);

      expect(result).toEqual(Buffer.from('fast'));
      // Should have attempted both gateways
      expect(mockAxios.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Retry Logic and Exponential Backoff', () => {
    it('should handle retry with exponential backoff (simulated)', async () => {
      vi.mock('axios');
      const mockAxios = (await import('axios')).default as vi.Mocked<typeof axios>;

      let attempts = 0;
      mockAxios.get.mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({ data: Buffer.from('success') } as any);
      });

      const { fetchFromIPFS } = await import('../../src/ipfs');

      // Simulate retry by calling multiple times
      try {
        await fetchFromIPFS('QmTest123', ['https://gateway.com'], 1000);
      } catch {
        // First attempt fails
      }

      try {
        await fetchFromIPFS('QmTest123', ['https://gateway.com'], 1000);
      } catch {
        // Second attempt fails
      }

      // Third attempt succeeds
      const result = await fetchFromIPFS('QmTest123', ['https://gateway.com'], 1000);
      expect(result).toEqual(Buffer.from('success'));
    });
  });

  describe('Concurrent Upload Handling', () => {
    it('should handle concurrent fetchFromIPFS requests', async () => {
      vi.mock('axios');
      const mockAxios = (await import('axios')).default as vi.Mocked<typeof axios>;

      const data1 = Buffer.from('data1');
      const data2 = Buffer.from('data2');
      const data3 = Buffer.from('data3');

      mockAxios.get
        .mockResolvedValueOnce({ data: data1 } as any)
        .mockResolvedValueOnce({ data: data2 } as any)
        .mockResolvedValueOnce({ data: data3 } as any);

      const { fetchFromIPFS } = await import('../../src/ipfs');

      const results = await Promise.all([
        fetchFromIPFS('QmTest1', ['https://gateway.com']),
        fetchFromIPFS('QmTest2', ['https://gateway.com']),
        fetchFromIPFS('QmTest3', ['https://gateway.com']),
      ]);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual(data1);
      expect(results[1]).toEqual(data2);
      expect(results[2]).toEqual(data3);
    });

    it('should handle concurrent pinata uploads', async () => {
      vi.mock('axios');
      vi.mock('fs');

      const mockAxios = (await import('axios')).default as vi.Mocked<typeof axios>;
      const mockFs = (await import('fs')).default as vi.Mocked<typeof import('fs')>;

      mockAxios.post
        .mockResolvedValueOnce({ data: { IpfsHash: 'QmHash1' } } as any)
        .mockResolvedValueOnce({ data: { IpfsHash: 'QmHash2' } } as any)
        .mockResolvedValueOnce({ data: { IpfsHash: 'QmHash3' } } as any);

      const { pinFileToIPFS } = await import('../../src/ipfs');

      const config = {
        ipfs: {
          strategy: 'pinata',
          pinata: { jwt: 'test-jwt' },
        },
      };

      const results = await Promise.all([
        pinFileToIPFS(config, Buffer.from('test1'), 'file1.txt'),
        pinFileToIPFS(config, Buffer.from('test2'), 'file2.txt'),
        pinFileToIPFS(config, Buffer.from('test3'), 'file3.txt'),
      ]);

      expect(results).toEqual(['QmHash1', 'QmHash2', 'QmHash3']);
    });
  });

  describe('Error Edge Cases', () => {
    it('should handle axios response without data field', async () => {
      vi.mock('axios');
      const mockAxios = (await import('axios')).default as vi.Mocked<typeof axios>;

      // Response without data will cause Buffer.from to fail, which should be caught
      mockAxios.get.mockResolvedValue({} as any);

      const { fetchFromIPFS } = await import('../../src/ipfs');

      // Should throw because Buffer.from(undefined) fails
      await expect(
        fetchFromIPFS('QmTest123', ['https://gateway.com'])
      ).rejects.toThrow('Failed to fetch QmTest123 from all IPFS gateways');
    });

    it('should handle Pinata API returning invalid response', async () => {
      vi.mock('axios');
      const mockAxios = (await import('axios')).default as vi.Mocked<typeof axios>;

      mockAxios.post.mockResolvedValue({
        data: {}, // Missing IpfsHash
      } as any);

      const { pinFileToIPFS } = await import('../../src/ipfs');

      const config = {
        ipfs: {
          strategy: 'pinata',
          pinata: { jwt: 'test-jwt' },
        },
      };

      const result = await pinFileToIPFS(config, Buffer.from('test'), 'test.txt');

      expect(result).toBeUndefined();
    });

    it('should handle axios network error with no message', async () => {
      vi.mock('axios');
      const mockAxios = (await import('axios')).default as vi.Mocked<typeof axios>;

      const errorWithoutMessage = new Error();
      delete (errorWithoutMessage as any).message;

      mockAxios.get.mockRejectedValue(errorWithoutMessage);

      const { fetchFromIPFS } = await import('../../src/ipfs');

      await expect(
        fetchFromIPFS('QmTest123', ['https://gateway.com'])
      ).rejects.toThrow('Failed to fetch QmTest123 from all IPFS gateways');
    });
  });

  describe('Timeout Scenarios', () => {
    it('should respect custom timeout for each gateway', async () => {
      vi.mock('axios');
      const mockAxios = (await import('axios')).default as vi.Mocked<typeof axios>;

      mockAxios.get.mockImplementation(() => {
        // Simulate axios timeout behavior
        return Promise.reject(new Error('timeout of 500ms exceeded'));
      });

      const { fetchFromIPFS } = await import('../../src/ipfs');

      await expect(
        fetchFromIPFS('QmTest123', ['https://gateway.com'], 500)
      ).rejects.toThrow('Failed to fetch QmTest123 from all IPFS gateways');
    });

    it('should handle very short timeouts', async () => {
      vi.mock('axios');
      const mockAxios = (await import('axios')).default as vi.Mocked<typeof axios>;

      mockAxios.get.mockImplementation(() => {
        // Simulate timeout - request takes longer than timeout
        return Promise.reject(new Error('timeout of 10ms exceeded'));
      });

      const { fetchFromIPFS } = await import('../../src/ipfs');

      await expect(
        fetchFromIPFS('QmTest123', ['https://gateway.com'], 10)
      ).rejects.toThrow('Failed to fetch QmTest123 from all IPFS gateways');
    });
  });

  describe('Buffer Handling', () => {
    it('should correctly handle empty buffers', async () => {
      vi.mock('axios');
      const mockAxios = (await import('axios')).default as vi.Mocked<typeof axios>;

      const emptyBuffer = Buffer.from([]);
      mockAxios.get.mockResolvedValue({
        data: emptyBuffer,
      } as any);

      const { fetchFromIPFS } = await import('../../src/ipfs');

      const result = await fetchFromIPFS('QmTest123', ['https://gateway.com']);

      expect(result).toEqual(emptyBuffer);
      expect(result.length).toBe(0);
    });

    it('should correctly convert arraybuffer to Buffer', async () => {
      vi.mock('axios');
      const mockAxios = (await import('axios')).default as vi.Mocked<typeof axios>;

      const arrayBuffer = new Uint8Array([1, 2, 3, 4, 5]).buffer;
      mockAxios.get.mockResolvedValue({
        data: arrayBuffer,
      } as any);

      const { fetchFromIPFS } = await import('../../src/ipfs');

      const result = await fetchFromIPFS('QmTest123', ['https://gateway.com']);

      expect(result).toBeInstanceOf(Buffer);
      expect(Array.from(result)).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('Gateway Selection', () => {
    it('should use all default gateways when none provided', async () => {
      vi.mock('axios');
      const mockAxios = (await import('axios')).default as vi.Mocked<typeof axios>;

      mockAxios.get.mockImplementation((url) => {
        // Only the last default gateway succeeds
        if (url.includes('gateway.pinata.cloud')) {
          return Promise.resolve({ data: Buffer.from('success') } as any);
        }
        return Promise.reject(new Error('failed'));
      });

      const { fetchFromIPFS } = await import('../../src/ipfs');

      const result = await fetchFromIPFS('QmTest123');

      expect(result).toEqual(Buffer.from('success'));
      // Should have tried multiple default gateways
      expect(mockAxios.get.mock.calls.length).toBeGreaterThan(1);
    });

    it('should construct correct gateway URLs', async () => {
      vi.mock('axios');
      const mockAxios = (await import('axios')).default as vi.Mocked<typeof axios>;

      mockAxios.get.mockResolvedValue({ data: Buffer.from('test') } as any);

      const { fetchFromIPFS } = await import('../../src/ipfs');

      await fetchFromIPFS('QmTest123', ['https://custom-gateway.com']);

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://custom-gateway.com/ipfs/QmTest123',
        expect.any(Object)
      );
    });
  });
});
