import { AAWalletConfig } from '../types';
import { setupEthereumProxy } from './ethereumProxy';
import { setupTransactionQueue } from './transactionQueue';
import { validateConfig } from './configValidator';
import { startPeriodicNonceCleanup } from '../utils/nonceCleanup';
import { toast } from 'sonner';

// Global state to store the configuration
let globalConfig: AAWalletConfig | null = null;
let ethereumProxySuccess: boolean = false;

/**
 * Initialize the AA wallet with configuration
 * @param config The wallet configuration
 * @returns True if initialization was successful, false otherwise
 */
export function init(config: AAWalletConfig): boolean {
  try {
    // Validate the configuration
    validateConfig(config);

    // Store the configuration globally
    globalConfig = config;

    // Setup the ethereum proxy
    ethereumProxySuccess = setupEthereumProxy();

    if (!ethereumProxySuccess) {
      toast.error('Failed to initialize wallet: Ethereum provider not found');
    }

    // Setup the transaction queue (even if proxy fails, for fallback mode)
    setupTransactionQueue();

    // Start periodic nonce cleanup
    startPeriodicNonceCleanup();

    console.log('AA Wallet initialized with config:', config);
    console.log('Ethereum proxy setup:', ethereumProxySuccess ? 'successful' : 'failed');

    return ethereumProxySuccess;
  } catch (error) {
    console.error('Failed to initialize AA Wallet:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    toast.error(`Failed to initialize wallet: ${errorMessage}`);

    globalConfig = null;
    ethereumProxySuccess = false;
    return false;
  }
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

/**
 * Check if the ethereum proxy was successfully set up
 * @returns True if ethereum proxy is working, false otherwise
 */
export function isEthereumProxyActive(): boolean {
  return ethereumProxySuccess;
}