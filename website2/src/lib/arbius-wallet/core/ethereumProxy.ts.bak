import { ProxyEthereum } from '../types';
import { getConfig, isInitialized } from './init';
import { sendTransaction } from './transactionQueue';
import { safeLocalStorageSet, safeLocalStorageGet } from '../utils/safeStorage';
import toast from 'react-hot-toast';

// Store the original ethereum object
let originalEthereum: any = null;
let proxySetupFailed: boolean = false;

// Constants for message signing
const ALLOWED_DOMAINS = ['arbius.xyz', 'playground.arbius.xyz']; // Add your domains
const MESSAGE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Add legacy message format constant
const LEGACY_MESSAGE_PREFIX = 'Create deterministic wallet for';

interface SignedMessage {
  domain: string;
  address: string;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  statement?: string;
  uri?: string;
  version?: string;
  chainId?: number;
}

/**
 * Setup the ethereum proxy to intercept window.ethereum calls
 */
export function setupEthereumProxy(): boolean {
  // Ensure the wallet is initialized
  if (!isInitialized()) {
    console.error('AA Wallet must be initialized before setting up ethereum proxy');
    return false;
  }

  // Check if window.ethereum exists
  if (typeof window === 'undefined' || !window.ethereum) {
    console.warn('window.ethereum not found. Ethereum proxy not set up.');
    return false;
  }

  // Check if proxy is already set up (prevent double-wrapping)
  if (window.ethereum.isAA) {
    console.log('Ethereum proxy already set up, skipping re-initialization');
    return true;
  }

  // Store the original ethereum object first
  originalEthereum = window.ethereum;

  try {
    // Create the proxy
    const ethereumProxy = createEthereumProxy(originalEthereum);

    // Replace window.ethereum with our proxy
    Object.defineProperty(window, 'ethereum', {
      value: ethereumProxy,
      writable: true,
      configurable: true,
    });

    console.log('Ethereum proxy set up successfully');
    return true;
  } catch (error) {
    console.error('Failed to setup ethereum proxy:', error);
    console.warn('AA Wallet will fall back to using the standard wallet provider');
    proxySetupFailed = true;

    // Restore original ethereum if it was saved
    if (originalEthereum) {
      try {
        Object.defineProperty(window, 'ethereum', {
          value: originalEthereum,
          writable: true,
          configurable: true,
        });
        console.log('Original ethereum provider restored successfully');
      } catch (restoreError) {
        console.error('Failed to restore original ethereum:', restoreError);
        // If we can't restore via defineProperty, the original should still be accessible
        // since we stored it before the failed attempt
      }
    }
    return false;
  }
}

/**
 * Check if the proxy setup failed and we're in fallback mode
 */
export function isProxyFailed(): boolean {
  return proxySetupFailed;
}

/**
 * Create an ethereum proxy object
 * @param target The original ethereum object
 * @returns The proxied ethereum object
 */
function createEthereumProxy(target: any): ProxyEthereum {
  return new Proxy(target, {
    get(target, prop, receiver) {
      // Add the isAA flag
      if (prop === 'isAA') {
        return true;
      }
      
      // Get the original property
      const originalProp = Reflect.get(target, prop, receiver);
      
      // If the property is a function, we might need to intercept it
      if (typeof originalProp === 'function') {
        return function(this: any, ...args: any[]) {
          // Intercept eth_sendTransaction requests
          if (prop === 'request' && args[0]?.method === 'eth_sendTransaction') {
            return handleSendTransaction(args[0]);
          }
          
          // Intercept personal_sign requests
          if (prop === 'request' && args[0]?.method === 'personal_sign') {
            return handlePersonalSign(args[0]).catch((error) => {
              // Toast for user-facing errors (if not already shown)
              const errorMsg = error instanceof Error ? error.message : 'Unknown error';
              if (!errorMsg.includes('User rejected') && !errorMsg.includes('Signature rejected')) {
                toast.error(`Signature failed: ${errorMsg}`);
              }
              throw error;
            });
          }
          
          // Pass through all other requests
          return originalProp.apply(this, args);
        };
      }
      
      // Return the original property for everything else
      return originalProp;
    }
  });
}

/**
 * Handle eth_sendTransaction requests
 * @param request The original request
 * @returns Promise resolving to the transaction hash
 */
async function handleSendTransaction(request: { method: string; params: any[] }): Promise<string> {
  console.log('Intercepted eth_sendTransaction:', request);
  
  // Get the current chain ID
  const chainId = await getCurrentChainId();
  
  // Create a transaction object
  const transaction = {
    method: request.method,
    params: request.params,
    chainId,
  };
  
  // Send the transaction through our transaction queue
  return sendTransaction(transaction);
}

/**
 * Format message according to EIP-4361
 */
function formatEIP4361Message(message: SignedMessage): string {
  const {
    domain,
    address,
    nonce,
    issuedAt,
    expirationTime,
    statement = 'Arbius Wallet wants you to create a deterministic wallet',
    uri = window.location.origin,
    version = '1',
    chainId = 42161 // Arbitrum
  } = message;

  return `${domain} wants you to sign in with your Ethereum account:
${address}

${statement}

URI: ${uri}
Version: ${version}
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}${expirationTime ? `\nExpiration Time: ${expirationTime}` : ''}`;
}

/**
 * Validate domain against whitelist
 */
function validateDomain(domain: string): boolean {
  return ALLOWED_DOMAINS.includes(domain);
}

/**
 * Validate message format and content
 */
function validateMessage(message: string): boolean {
  const requiredFields = [
    'wants you to sign in with your Ethereum account:',
    'URI:',
    'Version:',
    'Chain ID:',
    'Nonce:',
    'Issued At:'
  ];
  
  return requiredFields.every(field => message.includes(field));
}

/**
 * Handle personal_sign requests
 */
async function handlePersonalSign(request: { method: string; params: any[] }): Promise<string> {
  console.log('Intercepted personal_sign:', request);
  
  // Get the current website URL and metadata
  const websiteUrl = window.location.origin;
  const websiteName = new URL(websiteUrl).hostname;
  
  // Get the original message and address
  const [message, address] = request.params;
  
  // Check if this is a legacy format message
  if (message.startsWith(LEGACY_MESSAGE_PREFIX)) {
    // Pass through legacy messages without modification
    return originalEthereum.request(request);
  }
  
  // Validate domain
  if (!validateDomain(websiteName)) {
    const error = `Unauthorized domain: ${websiteName}`;
    toast.error(`Signature rejected: ${error}`);
    throw new Error(`${error}. Please use an official Arbius domain.`);
  }
  
  // Check if the message already follows EIP-4361 format
  const isEIP4361Format = validateMessage(message);
  
  if (!isEIP4361Format) {
    // Generate a unique nonce and store it
    const nonce = crypto.randomUUID();
    const issuedAt = new Date().toISOString();
    const expirationTime = new Date(Date.now() + MESSAGE_EXPIRY_MS).toISOString();
    
    // Store nonce in localStorage with expiration
    const nonceKey = `arbiuswallet_nonce_${nonce}`;
    const nonceStored = safeLocalStorageSet(nonceKey, JSON.stringify({
      address,
      issuedAt,
      expiresAt: expirationTime
    }));

    if (!nonceStored) {
      console.warn('Failed to store nonce. Signature validation may not work properly.');
    }
    
    // Get current chain ID dynamically
    const currentChainId = await getCurrentChainId();

    // Create EIP-4361 compliant message
    const signedMessage: SignedMessage = {
      domain: websiteName,
      address,
      nonce,
      issuedAt,
      expirationTime,
      statement: 'Arbius Wallet wants you to create a deterministic wallet',
      uri: websiteUrl,
      version: '1',
      chainId: currentChainId // Dynamic chain ID
    };
    
    const enhancedMessage = formatEIP4361Message(signedMessage);
    
    // Create a new request with the enhanced message
    const enhancedRequest = {
      ...request,
      params: [enhancedMessage, address]
    };
    
    // Pass through to the original ethereum object with enhanced message
    return originalEthereum.request(enhancedRequest);
  }
  
  // If the message is already in EIP-4361 format, validate it
  const messageLines = message.split('\n');
  const nonceLine = messageLines.find((line: string) => line.startsWith('Nonce:'));
  if (nonceLine) {
    const nonce = nonceLine.split('Nonce:')[1].trim();
    const nonceKey = `arbiuswallet_nonce_${nonce}`;
    const storedNonce = safeLocalStorageGet(nonceKey);

    if (storedNonce) {
      try {
        const { expiresAt } = JSON.parse(storedNonce);
        if (new Date(expiresAt) < new Date()) {
          const errorMsg = 'Message has expired. Please sign a new message.';
          toast.error(`Signature error: ${errorMsg}`);
          throw new Error(errorMsg);
        }
      } catch (error) {
        console.warn('Failed to parse stored nonce:', error);
        if (error instanceof Error && error.message.includes('expired')) {
          throw error; // Re-throw if it's our expiry error
        }
      }
    }
  }
  
  // Pass through the validated message
  return originalEthereum.request(request);
}

/**
 * Get the current chain ID
 * @returns Promise resolving to the current chain ID
 */
async function getCurrentChainId(): Promise<number> {
  // Try to get from the original ethereum object
  try {
    const chainIdHex = await originalEthereum.request({ method: 'eth_chainId' });
    return parseInt(chainIdHex, 16);
  } catch (err) {
    console.error('Failed to get chain ID:', err instanceof Error ? err.message : 'Unknown error');
    // Fall back to the default chain ID from config
    const config = getConfig();
    if (config) {
      return config.defaultChainId;
    }

    // Default to Ethereum mainnet if all else fails
    return 1;
  }
}