import { Contract, Wallet, ethers } from 'ethers';
import { IBlockchainService } from '../types';
import { log } from '../log';
import { expretry, generateCommitment } from '../utils';
import ArbiusAbi from '../abis/arbius.json';
import ArbiusRouterAbi from '../abis/arbiusRouter.json';
import ERC20Abi from '../abis/erc20.json';

export class BlockchainService implements IBlockchainService {
  private provider: ethers.FallbackProvider;
  private wallet: Wallet;
  private arbius: Contract;
  private arbiusRouter: Contract;
  private token: Contract;
  private rpcUrls: string[];
  private nonceCache: { nonce: number; timestamp: number } | null = null;
  private readonly NONCE_CACHE_TTL = 5000; // 5 seconds

  constructor(
    rpcUrl: string,
    privateKey: string,
    arbiusAddress: string,
    arbiusRouterAddress: string,
    tokenAddress: string
  ) {
    // Support multiple RPC URLs separated by commas
    this.rpcUrls = rpcUrl.split(',').map(url => url.trim());

    // Create fallback provider with multiple RPCs
    if (this.rpcUrls.length === 1) {
      // Single RPC - use standard provider
      const singleProvider = new ethers.JsonRpcProvider(this.rpcUrls[0]);
      this.provider = new ethers.FallbackProvider([{
        provider: singleProvider,
        priority: 1,
        stallTimeout: 2000,
        weight: 1
      }]);
    } else {
      // Multiple RPCs - create fallback provider
      const configs = this.rpcUrls.map((url, index) => ({
        provider: new ethers.JsonRpcProvider(url),
        priority: index + 1,
        stallTimeout: 2000,
        weight: 1
      }));
      this.provider = new ethers.FallbackProvider(configs);
      log.info(`Initialized FallbackProvider with ${this.rpcUrls.length} RPC endpoints`);
    }

    this.wallet = new Wallet(privateKey, this.provider);
    this.arbius = new Contract(arbiusAddress, ArbiusAbi, this.wallet);
    this.arbiusRouter = new Contract(arbiusRouterAddress, ArbiusRouterAbi, this.wallet);
    this.token = new Contract(tokenAddress, ERC20Abi, this.wallet);
  }

  getWalletAddress(): string {
    return this.wallet.address;
  }

  /**
   * Get nonce with retry logic for out-of-sync nodes
   * Tries multiple strategies:
   * 1. Use cached nonce if fresh
   * 2. Query all RPC nodes and use highest nonce
   * 3. Add pending transaction count
   */
  private async getNonceWithRetry(): Promise<number> {
    // Check cache first
    if (this.nonceCache && Date.now() - this.nonceCache.timestamp < this.NONCE_CACHE_TTL) {
      const cachedNonce = this.nonceCache.nonce;
      this.nonceCache.nonce++; // Increment for next tx
      return cachedNonce;
    }

    // Query nonce from all available RPC endpoints and use the highest
    const noncePromises = this.rpcUrls.map(async (url) => {
      try {
        const provider = new ethers.JsonRpcProvider(url);
        const nonce = await provider.getTransactionCount(this.wallet.address, 'pending');
        return nonce;
      } catch (err) {
        log.warn(`Failed to get nonce from ${url}: ${err}`);
        return 0;
      }
    });

    const nonces = await Promise.all(noncePromises);
    const maxNonce = Math.max(...nonces.filter(n => n > 0));

    if (maxNonce === 0) {
      throw new Error('Failed to get nonce from any RPC endpoint');
    }

    // Update cache
    this.nonceCache = { nonce: maxNonce + 1, timestamp: Date.now() };

    log.debug(`Nonce retrieved: ${maxNonce} (from ${nonces.length} RPCs: ${nonces.join(', ')})`);
    return maxNonce;
  }

  /**
   * Execute transaction with nonce error handling
   */
  private async executeTransaction(
    txFunction: (nonce: number) => Promise<ethers.ContractTransactionResponse>,
    maxRetries: number = 3
  ): Promise<ethers.ContractTransactionResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const nonce = await this.getNonceWithRetry();
        log.debug(`Attempting transaction with nonce ${nonce} (attempt ${attempt + 1}/${maxRetries})`);

        const tx = await txFunction(nonce);
        return tx;
      } catch (error: any) {
        lastError = error;
        const errorMsg = error.message?.toLowerCase() || '';

        // Check for nonce-related errors
        if (
          errorMsg.includes('nonce') ||
          errorMsg.includes('already known') ||
          errorMsg.includes('replacement transaction underpriced')
        ) {
          log.warn(`Nonce error detected (attempt ${attempt + 1}): ${error.message}`);

          // Clear nonce cache to force fresh lookup
          this.nonceCache = null;

          // Wait before retry with exponential backoff
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 5000);
          await new Promise(resolve => setTimeout(resolve, backoffMs));

          continue;
        }

        // Non-nonce error, throw immediately
        throw error;
      }
    }

    throw new Error(`Transaction failed after ${maxRetries} attempts: ${lastError?.message}`);
  }

  async getBalance(): Promise<bigint> {
    return await expretry('getBalance', async () =>
      await this.token.balanceOf(this.wallet.address)
    ) || 0n;
  }

  async getEthBalance(): Promise<bigint> {
    return await expretry('getEthBalance', async () =>
      await this.provider.getBalance(this.wallet.address)
    ) || 0n;
  }

  async getValidatorStake(): Promise<bigint> {
    const validator = await expretry('getValidatorStake', async () =>
      await this.arbius.validators(this.wallet.address)
    );
    return validator ? validator.staked : 0n;
  }

  async getValidatorMinimum(): Promise<bigint> {
    return await expretry('getValidatorMinimum', async () =>
      await this.arbius.getValidatorMinimum()
    ) || 0n;
  }

  async ensureApproval(): Promise<void> {
    const balance = await this.getBalance();
    const allowance = await expretry('getAllowance', async () =>
      await this.token.allowance(this.wallet.address, this.arbius.target)
    ) || 0n;

    if (allowance < balance) {
      log.info('Approving Arbius contract to spend tokens');
      const tx = await this.executeTransaction(async (nonce) =>
        await this.token.approve(this.arbius.target, ethers.MaxUint256, { nonce })
      );
      await tx.wait();
      log.info(`Approval tx: ${tx.hash}`);
    }
  }

  async ensureValidatorStake(): Promise<void> {
    const validatorMinimum = await this.getValidatorMinimum();
    const validatorStaked = await this.getValidatorStake();

    if (validatorStaked < validatorMinimum) {
      log.info('Validator needs to stake more tokens');
      const balance = await this.getBalance();

      if (balance < validatorMinimum) {
        throw new Error(`Insufficient balance to stake. Need ${ethers.formatEther(validatorMinimum)} AIUS`);
      }

      const tx = await this.executeTransaction(async (nonce) =>
        await this.arbius.validatorDeposit(this.wallet.address, balance, { nonce })
      );
      await tx.wait();
      log.info(`Staked tokens, tx: ${tx.hash}`);
    }
  }

  async submitTask(modelId: string, input: string, fee: bigint): Promise<string> {
    const bytes = ethers.hexlify(ethers.toUtf8Bytes(input));
    const modelFee = (await this.arbius.models(modelId)).fee;
    const totalFee = modelFee + fee;

    log.debug(`Submitting task for model ${modelId} with fee ${ethers.formatEther(totalFee)}`);

    const tx = await this.executeTransaction(async (nonce) =>
      await this.arbiusRouter.submitTask(
        0, // version
        this.wallet.address, // owner
        modelId,
        totalFee,
        bytes,
        0, // ipfs incentive
        200_000, // gas limit
        { nonce }
      )
    );

    const receipt = await tx.wait();
    log.info(`submitTask tx: ${tx.hash}`);

    // Extract taskid from logs
    let taskid: string | null = null;
    for (const ev of receipt.logs) {
      try {
        const parsed = this.arbius.interface.parseLog(ev);
        if (parsed && parsed.name === 'TaskSubmitted') {
          taskid = parsed.args[0];
          break;
        }
      } catch (e) {
        // ignore logs we can't parse
      }
    }

    if (!taskid) {
      throw new Error('Failed to extract taskid from transaction receipt');
    }

    return taskid;
  }

  async signalCommitment(commitment: string): Promise<void> {
    try {
      const tx = await this.executeTransaction(async (nonce) =>
        await this.arbius.signalCommitment(commitment, {
          gasLimit: 450_000,
          nonce
        })
      );
      log.info(`signalCommitment tx: ${tx.hash}`);
      await tx.wait();
    } catch (e) {
      log.warn(`signalCommitment failed: ${e}`);
      throw e;
    }
  }

  async submitSolution(taskid: string, cid: string): Promise<void> {
    const commitment = generateCommitment(this.wallet.address, taskid, cid);
    log.debug(`Generated commitment: ${commitment}`);

    // Signal commitment first
    try {
      await this.signalCommitment(commitment);
    } catch (e) {
      log.warn(`signalCommitment failed, continuing: ${e}`);
    }

    // Sleep to avoid nonce issues
    await new Promise(r => setTimeout(r, 1000));

    // Submit solution
    try {
      const tx = await this.executeTransaction(async (nonce) =>
        await this.arbius.submitSolution(taskid, cid, {
          gasLimit: 500_000,
          nonce
        })
      );
      const receipt = await tx.wait();
      log.info(`submitSolution tx: ${receipt.hash}`);
    } catch (e) {
      log.error(`submitSolution failed: ${e}`);
      throw e;
    }
  }

  async getSolution(taskid: string): Promise<{ validator: string; cid: string }> {
    const solution = await expretry('getSolution', async () =>
      await this.arbius.solutions(taskid)
    );

    if (!solution) {
      throw new Error(`Failed to get solution for task ${taskid}`);
    }

    return {
      validator: solution.validator,
      cid: solution.cid,
    };
  }

  async findTransactionByTaskId(taskid: string): Promise<{ txHash: string; prompt: string } | null> {
    try {
      const filter = this.arbius.filters.TaskSubmitted(taskid);
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000);

      log.debug(`Searching for taskid ${taskid} from block ${fromBlock} to ${currentBlock}`);

      const logs = await this.arbius.queryFilter(filter, fromBlock, currentBlock);

      if (logs.length === 0) {
        log.warn(`No TaskSubmitted event found for taskid: ${taskid}`);
        return null;
      }

      const txHash = logs[0].transactionHash;
      const tx = await this.provider.getTransaction(txHash);

      if (!tx || !tx.data) {
        log.error(`Could not fetch transaction data for hash: ${txHash}`);
        return null;
      }

      try {
        const decodedData = this.arbiusRouter.interface.parseTransaction({ data: tx.data });

        if (decodedData?.name !== 'submitTask') {
          log.error(`Transaction is not a submitTask call: ${decodedData?.name}`);
          return null;
        }

        const inputBytes = decodedData.args[4];
        const inputString = ethers.toUtf8String(inputBytes);
        const inputJson = JSON.parse(inputString);
        const prompt = inputJson.prompt;

        return { txHash, prompt };
      } catch (decodeError) {
        log.error(`Failed to decode transaction data: ${decodeError}`);
        return null;
      }
    } catch (error) {
      log.error(`Error finding transaction by taskid: ${error}`);
      return null;
    }
  }

  getArbiusContract(): Contract {
    return this.arbius;
  }

  getProvider(): ethers.FallbackProvider {
    return this.provider;
  }
}
