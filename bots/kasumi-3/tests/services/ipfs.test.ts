import {
  fetchFromIPFS,
  initializeIpfsClient,
  pinFilesToIPFS,
  pinFileToIPFS,
} from '../../src/ipfs';
import axios from 'axios';
import * as fs from 'fs';
import { create } from 'ipfs-http-client';

jest.mock('axios');
jest.mock('fs');
jest.mock('ipfs-http-client');

const mockAxios = axios as jest.Mocked<typeof axios>;
const mockFs = fs as jest.Mocked<typeof fs>;
const mockCreate = create as jest.Mock;

describe('ipfs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchFromIPFS', () => {
    it('should fetch from first successful gateway', async () => {
      const mockData = Buffer.from('test data');

      mockAxios.get.mockResolvedValueOnce({
        data: mockData,
      } as any);

      const result = await fetchFromIPFS('QmTest123');

      expect(result).toEqual(mockData);
      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('QmTest123'),
        expect.objectContaining({
          responseType: 'arraybuffer',
          timeout: 10000,
        })
      );
    });

    it('should try multiple gateways and return first success', async () => {
      const mockData = Buffer.from('test data');

      mockAxios.get
        .mockRejectedValueOnce(new Error('Gateway 1 failed'))
        .mockResolvedValueOnce({ data: mockData } as any);

      const result = await fetchFromIPFS('QmTest123', [
        'https://gateway1.com',
        'https://gateway2.com',
      ]);

      expect(result).toEqual(mockData);
      expect(mockAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should throw error when all gateways fail', async () => {
      mockAxios.get.mockRejectedValue(new Error('Failed'));

      await expect(
        fetchFromIPFS('QmTest123', ['https://gateway1.com'])
      ).rejects.toThrow('Failed to fetch QmTest123 from all IPFS gateways');
    });

    it('should use custom timeout', async () => {
      const mockData = Buffer.from('test data');
      mockAxios.get.mockResolvedValueOnce({ data: mockData } as any);

      await fetchFromIPFS('QmTest123', ['https://gateway1.com'], 5000);

      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          timeout: 5000,
        })
      );
    });

    it('should use default gateways when none provided', async () => {
      const mockData = Buffer.from('test data');
      mockAxios.get.mockResolvedValueOnce({ data: mockData } as any);

      await fetchFromIPFS('QmTest123');

      expect(mockAxios.get).toHaveBeenCalled();
      const callUrl = mockAxios.get.mock.calls[0][0];
      expect(callUrl).toContain('ipfs');
      expect(callUrl).toContain('QmTest123');
    });
  });

  describe('initializeIpfsClient', () => {
    it('should initialize IPFS client', () => {
      const mockClient = { add: jest.fn(), addAll: jest.fn() };
      mockCreate.mockReturnValue(mockClient as any);

      const config = {
        ipfs: {
          http_client: {
            url: 'http://localhost:5001',
          },
        },
      };

      initializeIpfsClient(config);

      expect(mockCreate).toHaveBeenCalledWith({
        url: 'http://localhost:5001',
      });
    });

    it('should not reinitialize if client already exists', () => {
      const mockClient = { add: jest.fn(), addAll: jest.fn() };
      mockCreate.mockReturnValue(mockClient as any);

      const config = {
        ipfs: {
          http_client: {
            url: 'http://localhost:5001',
          },
        },
      };

      initializeIpfsClient(config);
      const callCount1 = mockCreate.mock.calls.length;

      initializeIpfsClient(config);
      const callCount2 = mockCreate.mock.calls.length;

      expect(callCount2).toBe(callCount1); // Should not increase
    });
  });

  describe('pinFilesToIPFS', () => {

    describe('pinata strategy', () => {
      const pinataConfig = {
        cache_path: 'cache',
        ipfs: {
          strategy: 'pinata',
          pinata: {
            jwt: 'test-jwt-token',
          },
        },
      };

      it('should pin files to Pinata successfully', async () => {
        const { Readable } = require('stream');
        const mockStream = new Readable();
        mockStream.push('test data');
        mockStream.push(null);
        mockStream.on = jest.fn().mockImplementation((event: string, handler: Function) => {
          if (event === 'end') {
            setTimeout(() => handler(), 0);
          }
          return mockStream;
        });

        jest.spyOn(fs, 'createReadStream').mockReturnValue(mockStream as any);

        mockAxios.post.mockResolvedValueOnce({
          data: { IpfsHash: 'QmPinataHash123' },
        } as any);

        const result = await pinFilesToIPFS(
          pinataConfig,
          '0xtask123',
          ['file1.png', 'file2.png']
        );

        expect(result).toBe('QmPinataHash123');
        expect(mockAxios.post).toHaveBeenCalledWith(
          'https://api.pinata.cloud/pinning/pinFileToIPFS',
          expect.any(Object),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer test-jwt-token',
            }),
          })
        );
      });

      it('should throw error on Pinata API failure', async () => {
        const { Readable } = require('stream');
        const mockStream = new Readable();
        mockStream.push('test data');
        mockStream.push(null);
        mockStream.on = jest.fn().mockImplementation((event: string, handler: Function) => {
          if (event === 'end') {
            setTimeout(() => handler(), 0);
          }
          return mockStream;
        });

        jest.spyOn(fs, 'createReadStream').mockReturnValue(mockStream as any);
        mockAxios.post.mockRejectedValueOnce(new Error('Pinata error'));

        await expect(
          pinFilesToIPFS(pinataConfig, '0xtask123', ['file1.png'])
        ).rejects.toThrow('Pinata error');
      });
    });

    it('should throw error for unknown strategy', async () => {
      const unknownConfig = {
        cache_path: 'cache',
        ipfs: {
          strategy: 'unknown',
        },
      };

      await expect(
        pinFilesToIPFS(unknownConfig, '0xtask123', ['file1.png'])
      ).rejects.toThrow('unknown ipfs strategy');
    });
  });

  describe('pinFileToIPFS', () => {

    describe('pinata strategy', () => {
      const pinataConfig = {
        ipfs: {
          strategy: 'pinata',
          pinata: {
            jwt: 'test-jwt-token',
          },
        },
      };

      it('should pin single file to Pinata successfully', async () => {
        // Clear previous mock to avoid test pollution
        mockAxios.post.mockClear();
        mockAxios.post.mockResolvedValueOnce({
          data: { IpfsHash: 'QmSingleFile123' },
        } as any);

        const content = Buffer.from('test content');
        const result = await pinFileToIPFS(
          pinataConfig,
          content,
          'test.json'
        );

        expect(result).toBe('QmSingleFile123');
        expect(mockAxios.post).toHaveBeenCalledWith(
          'https://api.pinata.cloud/pinning/pinFileToIPFS',
          expect.any(Object),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer test-jwt-token',
            }),
          })
        );
      });

      it('should throw error on Pinata API failure', async () => {
        mockAxios.post.mockRejectedValueOnce(new Error('Pinata error'));

        await expect(
          pinFileToIPFS(pinataConfig, Buffer.from('test'), 'test.json')
        ).rejects.toThrow('Pinata error');
      });
    });

    it('should throw error for unknown strategy', async () => {
      const unknownConfig = {
        ipfs: {
          strategy: 'unknown',
        },
      };

      await expect(
        pinFileToIPFS(unknownConfig, Buffer.from('test'), 'test.json')
      ).rejects.toThrow('unknown ipfs strategy');
    });
  });
});
