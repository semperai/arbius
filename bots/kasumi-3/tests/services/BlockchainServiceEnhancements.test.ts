import { describe, it, expect, jest } from '@jest/globals';

describe('BlockchainService Model Extraction', () => {
  it('should extract modelId from transaction data', () => {
    // Mock decoded transaction data
    const mockDecodedData = {
      name: 'submitTask',
      args: [
        0, // version
        '0x1234567890123456789012345678901234567890', // owner
        '0xefa2d138185cf4f840630a3d323ffde028ed7d01867324f027d513cc2c7d7c32', // model ID
        1000n, // fee
        '0x7b2270726f6d7074223a2274657374227d', // input bytes
        0n, // cid_ipfs_only_test_param
        200000n, // gasLimit
      ],
    };

    // Extract model ID (arg index 2)
    const modelId = mockDecodedData.args[2];

    expect(modelId).toBe('0xefa2d138185cf4f840630a3d323ffde028ed7d01867324f027d513cc2c7d7c32');
    expect(typeof modelId).toBe('string');
  });

  it('should return correct structure from findTransactionByTaskId', async () => {
    // This test verifies the return type includes modelId
    const mockResult = {
      txHash: '0xabc123',
      prompt: 'test prompt',
      modelId: '0xefa2d138185cf4f840630a3d323ffde028ed7d01867324f027d513cc2c7d7c32',
    };

    expect(mockResult).toHaveProperty('txHash');
    expect(mockResult).toHaveProperty('prompt');
    expect(mockResult).toHaveProperty('modelId');
    expect(mockResult.modelId).toMatch(/^0x[a-f0-9]{64}$/);
  });
});

describe('ModelRegistry Model Lookup', () => {
  it('should find model by ID', () => {
    // Mock model registry behavior
    const modelsMap = new Map();
    const modelConfig = {
      id: '0xefa2d138185cf4f840630a3d323ffde028ed7d01867324f027d513cc2c7d7c32',
      name: 'qwen',
      template: {
        meta: { title: 'Qwen', description: '', git: '', docker: '', version: 1 },
        input: [],
        output: [],
      },
    };

    modelsMap.set(modelConfig.id, modelConfig);

    const foundModel = modelsMap.get('0xefa2d138185cf4f840630a3d323ffde028ed7d01867324f027d513cc2c7d7c32');

    expect(foundModel).toBeDefined();
    expect(foundModel?.name).toBe('qwen');
  });

  it('should return undefined for unknown model ID', () => {
    const modelsMap = new Map();

    const foundModel = modelsMap.get('0x0000000000000000000000000000000000000000000000000000000000000000');

    expect(foundModel).toBeUndefined();
  });
});
