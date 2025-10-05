import { Telegraf } from 'telegraf';
import { DatabaseService } from './services/DatabaseService';
import { UserService } from './services/UserService';
import { GasAccountingService } from './services/GasAccountingService';
import { DepositMonitor } from './services/DepositMonitor';
import { BlockchainService } from './services/BlockchainService';
import { registerPaymentCommands } from './bot/paymentCommands';
import { DEPOSIT_MONITOR } from './constants';
import { log } from './log';
import path from 'path';

export interface PaymentSystemConfig {
  dbPath: string;
  ethMainnetRpc: string;
  botWalletAddress: string;
  tokenAddress: string;
  adminTelegramIds?: number[];
}

export interface PaymentSystem {
  db: DatabaseService;
  userService: UserService;
  gasAccounting: GasAccountingService;
  depositMonitor: DepositMonitor;
}

/**
 * Initialize the payment system
 *
 * @example
 * ```typescript
 * const paymentSystem = initializePaymentSystem({
 *   dbPath: './data/kasumi3.db',
 *   ethMainnetRpc: process.env.ETH_MAINNET_RPC!,
 *   botWalletAddress: wallet.address,
 *   tokenAddress: config.blockchain.token_address,
 *   adminTelegramIds: [123456789],
 * }, bot, blockchain);
 *
 * // Start deposit monitoring
 * await paymentSystem.depositMonitor.start();
 * ```
 */
export function initializePaymentSystem(
  config: PaymentSystemConfig,
  bot: Telegraf,
  blockchain: BlockchainService
): PaymentSystem {
  log.info('Initializing payment system...');

  // Initialize database
  const db = new DatabaseService(config.dbPath);
  log.info('✅ Database initialized');

  // Initialize user service
  const userService = new UserService(db);
  log.info('✅ UserService initialized');

  // Initialize gas accounting with price oracle
  const gasAccounting = new GasAccountingService(config.ethMainnetRpc);
  log.info('✅ GasAccountingService initialized');

  // Initialize deposit monitor with bot for notifications
  const depositMonitor = new DepositMonitor(
    blockchain.getProvider(),
    config.tokenAddress,
    config.botWalletAddress,
    userService,
    DEPOSIT_MONITOR.POLL_INTERVAL_MS,
    bot
  );
  log.info('✅ DepositMonitor initialized');

  // Register Telegram bot commands
  registerPaymentCommands(
    bot,
    userService,
    gasAccounting,
    config.botWalletAddress,
    config.adminTelegramIds || []
  );
  log.info('✅ Payment commands registered');

  log.info('Payment system initialized successfully');

  return {
    db,
    userService,
    gasAccounting,
    depositMonitor,
  };
}

/**
 * Example usage in main index.ts:
 *
 * ```typescript
 * import { initializePaymentSystem } from './initPaymentSystem';
 *
 * // ... existing setup code ...
 *
 * // Initialize payment system
 * const paymentSystem = initializePaymentSystem({
 *   dbPath: path.join(__dirname, '../data/kasumi3.db'),
 *   ethMainnetRpc: process.env.ETH_MAINNET_RPC || 'https://eth.llamarpc.com',
 *   botWalletAddress: blockchain.getWalletAddress(),
 *   tokenAddress: config.blockchain.token_address,
 *   adminTelegramIds: process.env.ADMIN_TELEGRAM_IDS?.split(',').map(Number) || [],
 * }, bot, blockchain);
 *
 * // Start deposit monitoring
 * await paymentSystem.depositMonitor.start();
 *
 * // Update TaskProcessor to use payment system
 * const taskProcessor = new TaskProcessor(
 *   blockchain,
 *   config,
 *   jobQueue,
 *   paymentSystem.userService,      // Add userService
 *   paymentSystem.gasAccounting      // Add gasAccounting
 * );
 * ```
 */
