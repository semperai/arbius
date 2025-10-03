import { ethers } from 'ethers';
import { log } from '../log';

interface PriceCache {
  aiusPerEth: bigint;
  timestamp: number;
}

/**
 * Service for calculating gas costs in AIUS using Uniswap V2 price oracle
 */
export class GasAccountingService {
  private ethProvider: ethers.JsonRpcProvider;
  private priceCache: PriceCache | null = null;
  private readonly CACHE_MAX_AGE = 60 * 1000; // 1 minute - use cached price
  private readonly STALE_MAX_AGE = 5 * 60 * 1000; // 5 minutes - fallback tolerance

  // Uniswap V2 pair on Ethereum mainnet (AIUS/WETH)
  private readonly PAIR_ADDRESS = '0xcb37089fc6a6faff231b96e000300a6994d7a625';
  private readonly AIUS_ETH_ADDRESS = '0x8AFE4055Ebc86Bd2AFB3940c0095C9aca511d852';

  private readonly pairAbi = [
    'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
    'function token0() view returns (address)',
    'function token1() view returns (address)',
  ];

  constructor(ethMainnetRpcUrl: string) {
    this.ethProvider = new ethers.JsonRpcProvider(ethMainnetRpcUrl);
  }

  /**
   * Get AIUS per ETH exchange rate from Uniswap V2 on Ethereum mainnet
   */
  async getAiusPerEth(): Promise<bigint> {
    // Return cached price if fresh
    if (this.priceCache && Date.now() - this.priceCache.timestamp < this.CACHE_MAX_AGE) {
      return this.priceCache.aiusPerEth;
    }

    try {
      // Fetch fresh price from oracle
      const aiusPerEth = await this.fetchPriceFromOracle();

      // Update cache
      this.priceCache = { aiusPerEth, timestamp: Date.now() };

      log.info(`Price oracle: ${ethers.formatEther(aiusPerEth)} AIUS per ETH`);

      return aiusPerEth;
    } catch (error: any) {
      log.error(`Price oracle failed: ${error.message}`);

      // Use stale cached price as fallback
      if (this.priceCache && Date.now() - this.priceCache.timestamp < this.STALE_MAX_AGE) {
        const ageSeconds = Math.floor((Date.now() - this.priceCache.timestamp) / 1000);
        log.warn(`Using stale price cache (${ageSeconds}s old)`);
        return this.priceCache.aiusPerEth;
      }

      throw new Error('Price oracle unavailable and no cached price available');
    }
  }

  /**
   * Fetch price from Uniswap V2 oracle
   */
  private async fetchPriceFromOracle(): Promise<bigint> {
    const pair = new ethers.Contract(this.PAIR_ADDRESS, this.pairAbi, this.ethProvider);

    const [reserve0, reserve1] = await pair.getReserves();
    const token0 = await pair.token0();

    // Determine which reserve is AIUS vs WETH
    const aiusIsToken0 =
      token0.toLowerCase() === this.AIUS_ETH_ADDRESS.toLowerCase();
    const aiusReserve = aiusIsToken0 ? reserve0 : reserve1;
    const wethReserve = aiusIsToken0 ? reserve1 : reserve0;

    // Validate reserves are non-zero
    if (wethReserve === 0n || aiusReserve === 0n) {
      throw new Error(
        `Pool has no liquidity: AIUS=${aiusReserve.toString()}, WETH=${wethReserve.toString()}`
      );
    }

    // Price = AIUS per 1 ETH = aiusReserve / wethReserve
    // Scale to 18 decimals: (aiusReserve * 1e18) / wethReserve
    return (aiusReserve * BigInt(1e18)) / wethReserve;
  }

  /**
   * Calculate gas cost in AIUS from transaction receipt
   */
  async calculateGasCostInAius(
    receipt: ethers.TransactionReceipt
  ): Promise<{
    gasCostWei: bigint;
    gasCostAius: bigint;
    aiusPerEth: bigint;
    gasUsed: bigint;
    gasPrice: bigint;
  }> {
    // Calculate gas cost in ETH (wei)
    const gasUsed = receipt.gasUsed;

    // Use effectiveGasPrice (EIP-1559) as primary, fallback to gasPrice
    const gasPrice = (receipt as any).effectiveGasPrice || receipt.gasPrice;

    if (!gasPrice || gasPrice === 0n) {
      throw new Error('Cannot determine gas price from transaction receipt');
    }

    const gasCostWei = gasUsed * gasPrice;

    // Get current AIUS/ETH exchange rate from Ethereum mainnet
    const aiusPerEth = await this.getAiusPerEth();

    // Convert to AIUS: (gasCostWei * aiusPerEth) / 1e18
    const gasCostAius = (gasCostWei * aiusPerEth) / BigInt(1e18);

    log.debug(
      `Gas cost: ${Number(gasUsed)} units @ ${ethers.formatUnits(gasPrice, 'gwei')} gwei = ` +
      `${ethers.formatEther(gasCostWei)} ETH = ` +
      `${ethers.formatEther(gasCostAius)} AIUS`
    );

    return {
      gasCostWei,
      gasCostAius,
      aiusPerEth,
      gasUsed,
      gasPrice,
    };
  }

  /**
   * Estimate gas cost in AIUS for a transaction
   * Uses a gas estimate and current gas price
   */
  async estimateGasCostInAius(
    gasEstimate: bigint,
    provider: ethers.Provider
  ): Promise<bigint> {
    // Get current gas price (use getFeeData for EIP-1559 support)
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || feeData.maxFeePerGas || 0n;

    if (gasPrice === 0n) {
      throw new Error('Cannot determine current gas price');
    }

    // Calculate estimated gas cost in wei
    const gasCostWei = gasEstimate * gasPrice;

    // Get AIUS/ETH rate
    const aiusPerEth = await this.getAiusPerEth();

    // Convert to AIUS
    const gasCostAius = (gasCostWei * aiusPerEth) / BigInt(1e18);

    return gasCostAius;
  }

  /**
   * Get cached price (for display purposes)
   */
  getCachedPrice(): { aiusPerEth: bigint; ageMs: number } | null {
    if (!this.priceCache) {
      return null;
    }

    return {
      aiusPerEth: this.priceCache.aiusPerEth,
      ageMs: Date.now() - this.priceCache.timestamp,
    };
  }

  /**
   * Force refresh price cache
   */
  async refreshPrice(): Promise<bigint> {
    this.priceCache = null;
    return await this.getAiusPerEth();
  }
}
