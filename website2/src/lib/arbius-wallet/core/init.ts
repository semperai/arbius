import { AAWalletConfig } from '../types';
import { setupEthereumProxy } from './ethereumProxy';
import { setupTransactionQueue } from './transactionQueue';
import { validateConfig } from './configValidator';

// Global state to store the configuration
let globalConfig: AAWalletConfig | null = null;

/**
 * Initialize the AA wallet with configuration
 * @param config The wallet configuration
 */
export function init(config: AAWalletConfig): void {
  // Validate the configuration
  validateConfig(config);
  
  // Store the configuration globally
  globalConfig = config;
  
  // Setup the ethereum proxy
  setupEthereumProxy();
  
  // Setup the transaction queue
  setupTransactionQueue();
  
  console.log('AA Wallet initialized with config:', config);
}

/**
 * Get the current configuration
 * @returns The current configuration or null if not initialized
 */
export function getConfig(): AAWalletConfig | null {
  return globalConfig;
}

/**
 * Check if the wallet is initialized
 * @returns True if initialized, false otherwise
 */
export function isInitialized(): boolean {
  return globalConfig !== null;
}