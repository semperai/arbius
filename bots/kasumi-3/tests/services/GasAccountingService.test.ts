import { vi } from 'vitest';
import { GasAccountingService } from '../../src/services/GasAccountingService';
import { ethers } from 'ethers';

// Mock ethers provider
const mockProvider = {
  getFeeData: vi.fn(),
  getTransactionReceipt: vi.fn(),
};

// Mock Uniswap pair contract
const mockPairContract = {
  getReserves: vi.fn(),
  token0: vi.fn(),
};

describe('GasAccountingService', () => {
  let gasAccounting: GasAccountingService;
  const ETH_MAINNET_RPC = 'https://eth.llamarpc.com';

  beforeEach(() => {
    vi.clearAllMocks();
    gasAccounting = new GasAccountingService(ETH_MAINNET_RPC);

    // Mock Contract constructor
    vi.spyOn(ethers, 'Contract').mockImplementation(() => mockPairContract as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAiusPerEth', () => {
    it('should fetch price from Uniswap oracle', async () => {
      const mockReserve0 = BigInt('1000000000000000000000'); // 1000 AIUS
      const mockReserve1 = BigInt('10000000000000000000'); // 10 ETH
      const mockToken0 = '0x8AFE4055Ebc86Bd2AFB3940c0095C9aca511d852'; // AIUS address

      mockPairContract.getReserves.mockResolvedValue([mockReserve0, mockReserve1, 0]);
      mockPairContract.token0.mockResolvedValue(mockToken0);

      const aiusPerEth = await gasAccounting.getAiusPerEth();

      // Expected: (1000 * 1e18) / 10 = 100 AIUS per ETH
      expect(aiusPerEth).toBe(BigInt('100000000000000000000'));
    });

    it('should cache price for 1 minute', async () => {
      const mockReserve0 = BigInt('1000000000000000000000');
      const mockReserve1 = BigInt('10000000000000000000');
      const mockToken0 = '0x8AFE4055Ebc86Bd2AFB3940c0095C9aca511d852';

      mockPairContract.getReserves.mockResolvedValue([mockReserve0, mockReserve1, 0]);
      mockPairContract.token0.mockResolvedValue(mockToken0);

      // First call
      await gasAccounting.getAiusPerEth();

      // Second call immediately after
      await gasAccounting.getAiusPerEth();

      // Should only call oracle once due to caching
      expect(mockPairContract.getReserves).toHaveBeenCalledTimes(1);
    });

    it('should handle WETH as token0', async () => {
      const mockReserve0 = BigInt('10000000000000000000'); // 10 WETH
      const mockReserve1 = BigInt('1000000000000000000000'); // 1000 AIUS
      const mockToken0 = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // WETH address

      mockPairContract.getReserves.mockResolvedValue([mockReserve0, mockReserve1, 0]);
      mockPairContract.token0.mockResolvedValue(mockToken0);

      const aiusPerEth = await gasAccounting.getAiusPerEth();

      // Expected: (1000 * 1e18) / 10 = 100 AIUS per ETH
      expect(aiusPerEth).toBe(BigInt('100000000000000000000'));
    });

    it('should throw error on zero liquidity', async () => {
      mockPairContract.getReserves.mockResolvedValue([0n, 0n, 0]);
      mockPairContract.token0.mockResolvedValue('0x8AFE4055Ebc86Bd2AFB3940c0095C9aca511d852');

      await expect(gasAccounting.getAiusPerEth()).rejects.toThrow();
    });

    it('should use stale cache on oracle failure', async () => {
      const mockReserve0 = BigInt('1000000000000000000000');
      const mockReserve1 = BigInt('10000000000000000000');
      const mockToken0 = '0x8AFE4055Ebc86Bd2AFB3940c0095C9aca511d852';

      // First successful call
      mockPairContract.getReserves.mockResolvedValueOnce([mockReserve0, mockReserve1, 0]);
      mockPairContract.token0.mockResolvedValue(mockToken0);
      await gasAccounting.getAiusPerEth();

      // Wait for cache to expire (> 1 minute)
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(Date.now() + 61 * 1000) // Expired fresh cache
        .mockReturnValue(Date.now() + 61 * 1000);

      // Second call fails
      mockPairContract.getReserves.mockRejectedValueOnce(new Error('Oracle error'));

      // Should fall back to stale cache (within 5 min)
      const aiusPerEth = await gasAccounting.getAiusPerEth();
      expect(aiusPerEth).toBe(BigInt('100000000000000000000'));
    });
  });

  describe('calculateGasCostInAius', () => {
    it('should calculate gas cost from receipt', async () => {
      const mockReceipt = {
        gasUsed: BigInt(200000),
        gasPrice: BigInt('50000000000'), // 50 gwei
        effectiveGasPrice: BigInt('50000000000'),
      } as any;

      const mockReserve0 = BigInt('1000000000000000000000'); // 1000 AIUS
      const mockReserve1 = BigInt('10000000000000000000'); // 10 ETH
      const mockToken0 = '0x8AFE4055Ebc86Bd2AFB3940c0095C9aca511d852';

      mockPairContract.getReserves.mockResolvedValue([mockReserve0, mockReserve1, 0]);
      mockPairContract.token0.mockResolvedValue(mockToken0);

      const result = await gasAccounting.calculateGasCostInAius(mockReceipt);

      // Gas cost in wei: 200000 * 50 gwei = 10000000 gwei = 0.01 ETH
      expect(result.gasCostWei).toBe(BigInt('10000000000000000')); // 0.01 ETH in wei

      // AIUS per ETH: 100
      // Gas cost in AIUS: 0.01 ETH * 100 = 1 AIUS
      expect(result.gasCostAius).toBe(BigInt('1000000000000000000'));
      expect(result.aiusPerEth).toBe(BigInt('100000000000000000000'));
      expect(result.gasUsed).toBe(BigInt(200000));
      expect(result.gasPrice).toBe(BigInt('50000000000'));
    });

    it('should use effectiveGasPrice over gasPrice', async () => {
      const mockReceipt = {
        gasUsed: BigInt(200000),
        gasPrice: BigInt('50000000000'),
        effectiveGasPrice: BigInt('45000000000'), // Lower than gasPrice
      } as any;

      const mockReserve0 = BigInt('1000000000000000000000');
      const mockReserve1 = BigInt('10000000000000000000');
      const mockToken0 = '0x8AFE4055Ebc86Bd2AFB3940c0095C9aca511d852';

      mockPairContract.getReserves.mockResolvedValue([mockReserve0, mockReserve1, 0]);
      mockPairContract.token0.mockResolvedValue(mockToken0);

      const result = await gasAccounting.calculateGasCostInAius(mockReceipt);

      // Should use effectiveGasPrice (45 gwei)
      expect(result.gasPrice).toBe(BigInt('45000000000'));
    });

    it('should throw error if no gas price available', async () => {
      const mockReceipt = {
        gasUsed: BigInt(200000),
        gasPrice: 0n,
        effectiveGasPrice: null,
      } as any;

      await expect(gasAccounting.calculateGasCostInAius(mockReceipt)).rejects.toThrow(
        'Cannot determine gas price'
      );
    });
  });

  describe('estimateGasCostInAius', () => {
    it('should estimate gas cost', async () => {
      const mockGasEstimate = BigInt(200000);

      mockProvider.getFeeData.mockResolvedValue({
        gasPrice: BigInt('50000000000'),
        maxFeePerGas: null,
      });

      const mockReserve0 = BigInt('1000000000000000000000');
      const mockReserve1 = BigInt('10000000000000000000');
      const mockToken0 = '0x8AFE4055Ebc86Bd2AFB3940c0095C9aca511d852';

      mockPairContract.getReserves.mockResolvedValue([mockReserve0, mockReserve1, 0]);
      mockPairContract.token0.mockResolvedValue(mockToken0);

      const gasCostAius = await gasAccounting.estimateGasCostInAius(
        mockGasEstimate,
        mockProvider as any
      );

      // Gas cost: 200000 * 50 gwei = 0.01 ETH
      // AIUS cost: 0.01 ETH * 100 AIUS/ETH = 1 AIUS
      expect(gasCostAius).toBe(BigInt('1000000000000000000'));
    });

    it('should use maxFeePerGas if gasPrice not available', async () => {
      const mockGasEstimate = BigInt(200000);

      mockProvider.getFeeData.mockResolvedValue({
        gasPrice: null,
        maxFeePerGas: BigInt('60000000000'),
      });

      const mockReserve0 = BigInt('1000000000000000000000');
      const mockReserve1 = BigInt('10000000000000000000');
      const mockToken0 = '0x8AFE4055Ebc86Bd2AFB3940c0095C9aca511d852';

      mockPairContract.getReserves.mockResolvedValue([mockReserve0, mockReserve1, 0]);
      mockPairContract.token0.mockResolvedValue(mockToken0);

      const gasCostAius = await gasAccounting.estimateGasCostInAius(
        mockGasEstimate,
        mockProvider as any
      );

      // Should use maxFeePerGas
      expect(gasCostAius).toBeGreaterThan(0n);
    });

    it('should throw error if no gas price available', async () => {
      const mockGasEstimate = BigInt(200000);

      mockProvider.getFeeData.mockResolvedValue({
        gasPrice: null,
        maxFeePerGas: null,
      });

      await expect(
        gasAccounting.estimateGasCostInAius(mockGasEstimate, mockProvider as any)
      ).rejects.toThrow('Cannot determine current gas price');
    });
  });

  describe('getCachedPrice', () => {
    it('should return null when no cache', () => {
      const cached = gasAccounting.getCachedPrice();
      expect(cached).toBeNull();
    });

    it('should return cached price with age', async () => {
      const mockReserve0 = BigInt('1000000000000000000000');
      const mockReserve1 = BigInt('10000000000000000000');
      const mockToken0 = '0x8AFE4055Ebc86Bd2AFB3940c0095C9aca511d852';

      mockPairContract.getReserves.mockResolvedValue([mockReserve0, mockReserve1, 0]);
      mockPairContract.token0.mockResolvedValue(mockToken0);

      await gasAccounting.getAiusPerEth();

      const cached = gasAccounting.getCachedPrice();

      expect(cached).not.toBeNull();
      expect(cached!.aiusPerEth).toBe(BigInt('100000000000000000000'));
      expect(cached!.ageMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('refreshPrice', () => {
    it('should force refresh price cache', async () => {
      const mockReserve0 = BigInt('1000000000000000000000');
      const mockReserve1 = BigInt('10000000000000000000');
      const mockToken0 = '0x8AFE4055Ebc86Bd2AFB3940c0095C9aca511d852';

      mockPairContract.getReserves.mockResolvedValue([mockReserve0, mockReserve1, 0]);
      mockPairContract.token0.mockResolvedValue(mockToken0);

      // First call
      await gasAccounting.getAiusPerEth();
      expect(mockPairContract.getReserves).toHaveBeenCalledTimes(1);

      // Refresh should fetch again
      await gasAccounting.refreshPrice();
      expect(mockPairContract.getReserves).toHaveBeenCalledTimes(2);
    });
  });
});
