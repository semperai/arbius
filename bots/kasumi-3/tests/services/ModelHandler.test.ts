import { vi } from 'vitest';
import {
  BaseModelHandler,
  ReplicateModelHandler,
  CogModelHandler,
  ModelHandlerFactory,
} from '../../src/services/ModelHandler';
import { ModelConfig, MiningConfig } from '../../src/types';
import axios from 'axios';
import * as fs from 'fs';
import * as ipfs from '../../src/ipfs';
import * as utils from '../../src/utils';

vi.mock('../../src/log');
vi.mock('axios');
vi.mock('fs');
vi.mock('../../src/ipfs');

const mockAxios = axios as vi.Mocked<typeof axios>;
const mockFs = fs as vi.Mocked<typeof fs>;

describe('ModelHandler', () => {
  const mockMiningConfig: MiningConfig = {
    cache_path: '/tmp/cache',
    ml: {
      strategy: 'replicate',
      replicate: {
        api_token: 'test-replicate-token',
      },
    },
    ipfs: {
      strategy: 'pinata',
      pinata: {
        jwt: 'test-jwt',
      },
    },
    log_path: './test.log',
    db_path: './test.db',
    rpc_url: 'http://test-rpc',
    private_key: '0x1234',
    arbius_address: '0xarbius',
    token_address: '0xtoken',
  } as any;

  const mockModelConfig: ModelConfig = {
    id: '0xmodel123',
    name: 'test-model',
    template: {
      meta: {
        title: 'Test Model',
        description: 'Test',
        git: '',
        docker: '',
        version: 1,
      },
      input: [
        {
          variable: 'prompt',
          type: 'string',
          required: true,
          default: '',
          description: 'Prompt',
        },
      ],
      output: [
        {
          filename: 'out-1.png',
          type: 'image',
        },
      ],
    },
    replicateModel: 'owner/model',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock utils functions
    vi.spyOn(utils, 'hydrateInput').mockReturnValue({
      err: false,
      errmsg: '',
      input: { prompt: 'test prompt' },
    });
    vi.spyOn(utils, 'taskid2Seed').mockReturnValue(12345);
    vi.spyOn(utils, 'expretry').mockImplementation(async (name: string, fn: () => any) => {
      return await fn();
    });

    // Mock IPFS
    vi.spyOn(ipfs, 'pinFilesToIPFS').mockResolvedValue('QmTest123');

    // Mock fs
    mockFs.writeFileSync.mockImplementation(() => {});
  });

  describe('ReplicateModelHandler', () => {
    let handler: ReplicateModelHandler;

    beforeEach(() => {
      handler = new ReplicateModelHandler(mockModelConfig, mockMiningConfig, 'test-token');
    });

    it('should throw error if no replicate model configured', () => {
      const invalidConfig = { ...mockModelConfig, replicateModel: undefined };
      expect(() => {
        new ReplicateModelHandler(invalidConfig, mockMiningConfig, 'test-token');
      }).toThrow('does not have a Replicate model configured');
    });

    it('should call Replicate API and download single image output', async () => {
      const mockOutput = 'https://example.com/output.png';
      mockAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { output: mockOutput },
      } as any);

      mockAxios.get.mockResolvedValueOnce({
        status: 200,
        data: Buffer.from('image data'),
      } as any);

      const files = await handler.getFiles('0xtask123', { prompt: 'test' });

      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://api.replicate.com/v1/models/owner/model/predictions',
        { input: { prompt: 'test prompt', seed: 12345 } },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );

      expect(mockAxios.get).toHaveBeenCalledWith(
        mockOutput,
        expect.objectContaining({ responseType: 'arraybuffer' })
      );

      expect(files).toEqual(['out-1.png']);
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should handle array output with multiple images', async () => {
      const mockConfig = {
        ...mockModelConfig,
        template: {
          ...mockModelConfig.template,
          output: [
            { filename: 'out-1.png', type: 'image' as const },
            { filename: 'out-2.png', type: 'image' as const },
          ],
        },
      };
      const multiHandler = new ReplicateModelHandler(mockConfig, mockMiningConfig, 'test-token');

      const mockOutput = [
        'https://example.com/out1.png',
        'https://example.com/out2.png',
      ];

      mockAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { output: mockOutput },
      } as any);

      mockAxios.get
        .mockResolvedValueOnce({ status: 200, data: Buffer.from('image1') } as any)
        .mockResolvedValueOnce({ status: 200, data: Buffer.from('image2') } as any);

      const files = await multiHandler.getFiles('0xtask123', { prompt: 'test' });

      expect(files).toEqual(['out-1.png', 'out-2.png']);
      expect(mockAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should handle text output', async () => {
      const mockConfig = {
        ...mockModelConfig,
        template: {
          ...mockModelConfig.template,
          output: [{ filename: 'output.txt', type: 'text' as const }],
        },
      };
      const textHandler = new ReplicateModelHandler(mockConfig, mockMiningConfig, 'test-token');

      mockAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { output: 'Generated text response' },
      } as any);

      const files = await textHandler.getFiles('0xtask123', { prompt: 'test' });

      expect(files).toEqual(['output.txt']);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        '/tmp/cache/output.txt',
        Buffer.from('Generated text response', 'utf-8')
      );
    });

    it('should throw error on Replicate API failure', async () => {
      mockAxios.post.mockRejectedValueOnce(new Error('API error'));

      await expect(handler.getFiles('0xtask123', { prompt: 'test' })).rejects.toThrow(
        'Replicate API failed: API error'
      );
    });

    it('should throw error if response missing output', async () => {
      mockAxios.post.mockResolvedValueOnce({
        status: 200,
        data: {},
      } as any);

      await expect(handler.getFiles('0xtask123', { prompt: 'test' })).rejects.toThrow(
        'Replicate response missing output'
      );
    });

    it('should throw error on download failure', async () => {
      mockAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { output: 'https://example.com/image.png' },
      } as any);

      mockAxios.get.mockResolvedValueOnce({
        status: 404,
        data: null,
      } as any);

      await expect(handler.getFiles('0xtask123', { prompt: 'test' })).rejects.toThrow(
        'Failed to download file: status 404'
      );
    });

    it('should throw error on input validation failure', async () => {
      vi.spyOn(utils, 'hydrateInput').mockReturnValueOnce({
        err: true,
        errmsg: 'Missing required field: prompt',
        input: {},
      });

      await expect(handler.getFiles('0xtask123', {})).rejects.toThrow(
        'Input validation failed: Missing required field: prompt'
      );
    });

    it('should successfully get CID from files', async () => {
      mockAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { output: 'https://example.com/output.png' },
      } as any);

      mockAxios.get.mockResolvedValueOnce({
        status: 200,
        data: Buffer.from('image data'),
      } as any);

      const cid = await handler.getCid('0xtask123', { prompt: 'test' });

      expect(cid).toContain('0x'); // Should be hex-encoded CID
      expect(ipfs.pinFilesToIPFS).toHaveBeenCalledWith(
        mockMiningConfig,
        '0xtask123',
        ['out-1.png']
      );
    });

    it('should throw error if pinning fails', async () => {
      mockAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { output: 'https://example.com/output.png' },
      } as any);

      mockAxios.get.mockResolvedValueOnce({
        status: 200,
        data: Buffer.from('image data'),
      } as any);

      vi.spyOn(ipfs, 'pinFilesToIPFS').mockResolvedValueOnce(null as any);

      await expect(handler.getCid('0xtask123', { prompt: 'test' })).rejects.toThrow(
        'Failed to pin files to IPFS'
      );
    });

    it('should throw error if getFiles fails', async () => {
      vi.spyOn(utils, 'expretry').mockImplementationOnce(async () => null);

      await expect(handler.getCid('0xtask123', { prompt: 'test' })).rejects.toThrow(
        'Failed to get files from model'
      );
    });
  });

  describe('CogModelHandler', () => {
    let handler: CogModelHandler;
    const cogUrl = 'http://localhost:5000/predictions';

    beforeEach(() => {
      const cogConfig = { ...mockModelConfig, cogUrl };
      handler = new CogModelHandler(cogConfig, mockMiningConfig, cogUrl);
    });

    it('should call Cog API and handle single output', async () => {
      mockAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { output: 'base64-encoded-image-data' },
      } as any);

      const files = await handler.getFiles('0xtask123', { prompt: 'test' });

      expect(mockAxios.post).toHaveBeenCalledWith(cogUrl, {
        input: { prompt: 'test prompt', seed: 12345 },
      });

      expect(files).toEqual(['out-1.png']);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        '/tmp/cache/out-1.png',
        Buffer.from('base64-encoded-image-data', 'utf-8')
      );
    });

    it('should handle array output', async () => {
      const mockConfig = {
        ...mockModelConfig,
        template: {
          ...mockModelConfig.template,
          output: [
            { filename: 'out-1.png', type: 'image' as const },
            { filename: 'out-2.png', type: 'image' as const },
          ],
        },
        cogUrl,
      };
      const multiHandler = new CogModelHandler(mockConfig, mockMiningConfig, cogUrl);

      mockAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { output: ['data1', 'data2'] },
      } as any);

      const files = await multiHandler.getFiles('0xtask123', { prompt: 'test' });

      expect(files).toEqual(['out-1.png', 'out-2.png']);
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2);
    });

    it('should throw error on Cog API failure', async () => {
      mockAxios.post.mockRejectedValueOnce(new Error('Connection refused'));

      await expect(handler.getFiles('0xtask123', { prompt: 'test' })).rejects.toThrow(
        'Cog API failed: Connection refused'
      );
    });

    it('should throw error if response missing output', async () => {
      mockAxios.post.mockResolvedValueOnce({
        status: 200,
        data: {},
      } as any);

      await expect(handler.getFiles('0xtask123', { prompt: 'test' })).rejects.toThrow(
        'Cog response missing output'
      );
    });

    it('should successfully get CID from files', async () => {
      mockAxios.post.mockResolvedValueOnce({
        status: 200,
        data: { output: 'image-data' },
      } as any);

      const cid = await handler.getCid('0xtask123', { prompt: 'test' });

      expect(cid).toContain('0x');
      expect(ipfs.pinFilesToIPFS).toHaveBeenCalled();
    });
  });

  describe('ModelHandlerFactory', () => {
    it('should create ReplicateModelHandler for replicate strategy', () => {
      const config: MiningConfig = {
        ...mockMiningConfig,
        ml: {
          strategy: 'replicate',
          replicate: {
            api_token: 'test-token',
          },
        },
      };

      const handler = ModelHandlerFactory.createHandler(mockModelConfig, config);

      expect(handler).toBeInstanceOf(ReplicateModelHandler);
    });

    it('should throw error if replicate token missing', () => {
      const config: MiningConfig = {
        ...mockMiningConfig,
        ml: {
          strategy: 'replicate',
          replicate: undefined,
        },
      } as any;

      expect(() => {
        ModelHandlerFactory.createHandler(mockModelConfig, config);
      }).toThrow('Replicate API token not configured');
    });

    it('should create CogModelHandler for cog strategy with model cogUrl', () => {
      const config: MiningConfig = {
        ...mockMiningConfig,
        ml: {
          strategy: 'cog',
        },
      };

      const modelConfig = {
        ...mockModelConfig,
        cogUrl: 'http://localhost:5000',
      };

      const handler = ModelHandlerFactory.createHandler(modelConfig, config);

      expect(handler).toBeInstanceOf(CogModelHandler);
    });

    it('should create CogModelHandler from cog config lookup', () => {
      const config: MiningConfig = {
        ...mockMiningConfig,
        ml: {
          strategy: 'cog',
          cog: {
            '0xmodel123': {
              url: 'http://localhost:5000',
            },
          },
        },
      };

      const handler = ModelHandlerFactory.createHandler(mockModelConfig, config);

      expect(handler).toBeInstanceOf(CogModelHandler);
    });

    it('should throw error if no handler available', () => {
      const config: MiningConfig = {
        ...mockMiningConfig,
        ml: {
          strategy: 'cog',
        },
      };

      const modelConfig = {
        ...mockModelConfig,
        replicateModel: undefined,
        cogUrl: undefined,
      };

      expect(() => {
        ModelHandlerFactory.createHandler(modelConfig, config);
      }).toThrow('No handler available for model test-model');
    });
  });
});
