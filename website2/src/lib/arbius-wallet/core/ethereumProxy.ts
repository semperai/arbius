import { ProxyEthereum } from '../types';
import { getConfig, isInitialized } from './init';
import { sendTransaction } from './transactionQueue';

// Store the original ethereum object
let originalEthereum: any = null;

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
export function setupEthereumProxy(): void {
  // Ensure the wallet is initialized
  if (!isInitialized()) {
    throw new Error('AA Wallet must be initialized before setting up ethereum proxy');
  }
  
  // Check if window.ethereum exists
  if (typeof window === 'undefined' || !window.ethereum) {
    console.warn('window.ethereum not found. Ethereum proxy not set up.');
    return;
  }
  
  // Store the original ethereum object
  originalEthereum = window.ethereum;
  
  // Create the proxy
  const ethereumProxy = createEthereumProxy(originalEthereum);
  
  // Replace window.ethereum with our proxy
  Object.defineProperty(window, 'ethereum', {
    value: ethereumProxy,
    writable: true,
    configurable: true,
  });
  
  console.log('Ethereum proxy set up successfully');
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
            return handlePersonalSign(args[0]);
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
    throw new Error(`Unauthorized domain: ${websiteName}. Please use an official Arbius domain.`);
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
    localStorage.setItem(nonceKey, JSON.stringify({
      address,
      issuedAt,
      expiresAt: expirationTime
    }));
    
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
      chainId: 42161 // Arbitrum
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
    const storedNonce = localStorage.getItem(nonceKey);
    
    if (storedNonce) {
      const { expiresAt } = JSON.parse(storedNonce);
      if (new Date(expiresAt) < new Date()) {
        throw new Error('Message has expired. Please sign a new message.');
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