import { AAWalletConfig } from '../types';

/**
 * Validates the AA wallet configuration
 * @param config Configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateConfig(config: AAWalletConfig): void {
  // Check required fields
  if (config.defaultChainId === undefined) {
    throw new Error('Configuration error: defaultChainId is required');
  }
  
  if (!config.supportedChainIds || !Array.isArray(config.supportedChainIds) || config.supportedChainIds.length === 0) {
    throw new Error('Configuration error: supportedChainIds must be a non-empty array');
  }
  
  // Check if defaultChainId is in supportedChainIds
  if (!config.supportedChainIds.includes(config.defaultChainId)) {
    throw new Error(`Configuration error: defaultChainId (${config.defaultChainId}) must be included in supportedChainIds`);
  }
  
  // Validate tokens if provided
  if (config.watchERC20s) {
    for (const token of config.watchERC20s) {
      if (!token.address) {
        throw new Error('Configuration error: Each token must have an address');
      }
      
      if (!token.symbol) {
        throw new Error('Configuration error: Each token must have a symbol');
      }
      
      if (token.decimals === undefined) {
        throw new Error('Configuration error: Each token must have decimals');
      }
      
      if (!token.chainId) {
        throw new Error('Configuration error: Each token must have a chainId');
      }
      
      // Check if token chainId is supported
      if (!config.supportedChainIds.includes(token.chainId)) {
        throw new Error(`Configuration error: Token chainId (${token.chainId}) must be included in supportedChainIds`);
      }
    }
  }
  
  // Validate RPC configuration if provided
  if (config.rpc) {
    if (config.rpc.retryAttempts !== undefined && (config.rpc.retryAttempts < 0 || !Number.isInteger(config.rpc.retryAttempts))) {
      throw new Error('Configuration error: rpc.retryAttempts must be a positive integer');
    }
    
    if (config.rpc.timeout !== undefined && config.rpc.timeout <= 0) {
      throw new Error('Configuration error: rpc.timeout must be a positive number');
    }
    
    if (config.rpc.urls) {
      // Check that URLs are provided for all supported chains
      for (const chainId of config.supportedChainIds) {
        if (!config.rpc.urls[chainId] || config.rpc.urls[chainId].length === 0) {
          throw new Error(`Configuration error: No RPC URLs provided for chainId ${chainId}`);
        }
      }
    }
  }
}