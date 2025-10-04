import { keccak256, toBytes, type Hex } from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { safeLocalStorageGet, safeLocalStorageSet, safeLocalStorageRemove } from './safeStorage';

// Storage keys
const DERIVED_WALLET_STORAGE_KEY = 'arbiuswallet_derivedWalletCache';

interface WalletCache {
  ownerAddress: string;
  derivedPrivateKey: Hex;
  derivedAddress: string;
  signatureVersion: number;
  createdAt: string;
}

function generateDeterministicMessage(ownerAddress: string, title: string): string {
  const hostname = window.location.hostname;
  return `${title} wants you to create a deterministic wallet
Domain: ${hostname}
Wallet address: ${ownerAddress}
Purpose: Create deterministic wallet for AI agent interactions

Warning: Make sure the URL matches the official ${title} website`;
}

export async function initDeterministicWallet(
  ownerAddress: string,
  signMessage: (message: string) => Promise<Hex>,
  title: string = 'Arbius'
): Promise<PrivateKeyAccount> {
  if (!ownerAddress || !signMessage) {
    throw new Error("ownerAddress and signMessage are required.");
  }

  const lowerOwnerAddress = ownerAddress.toLowerCase();
  const cached = safeLocalStorageGet(DERIVED_WALLET_STORAGE_KEY);

  if (cached) {
    try {
      const parsed: WalletCache = JSON.parse(cached);
      if (parsed.ownerAddress.toLowerCase() === lowerOwnerAddress) {
        const account = privateKeyToAccount(parsed.derivedPrivateKey);
        return account;
      }
    } catch (err) {
      console.error('Failed to parse cached wallet, clearing cache:', err instanceof Error ? err.message : 'Unknown error');
      safeLocalStorageRemove(DERIVED_WALLET_STORAGE_KEY);
    }
  }

  // Create new wallet
  const messageToSign = generateDeterministicMessage(lowerOwnerAddress, title);
  const signature = await signMessage(messageToSign);

  // Hash the signature to create a private key
  const hashedSignature = keccak256(toBytes(signature));
  const account = privateKeyToAccount(hashedSignature);

  // Cache the wallet
  const cacheData: WalletCache = {
    ownerAddress: lowerOwnerAddress,
    derivedPrivateKey: hashedSignature,
    derivedAddress: account.address,
    signatureVersion: 1,
    createdAt: new Date().toISOString()
  };

  const cacheSuccess = safeLocalStorageSet(DERIVED_WALLET_STORAGE_KEY, JSON.stringify(cacheData));
  if (!cacheSuccess) {
    console.warn('Failed to cache derived wallet. Wallet will need to be re-derived on page reload.');
  }

  return account;
}

export function getCachedWalletAddress(ownerAddress: string): string | null {
  const cached = safeLocalStorageGet(DERIVED_WALLET_STORAGE_KEY);
  if (!cached) return null;

  try {
    const parsed: WalletCache = JSON.parse(cached);
    if (parsed.ownerAddress.toLowerCase() === ownerAddress.toLowerCase()) {
      return parsed.derivedAddress;
    }
  } catch (err) {
    console.error('Failed to get cached address:', err instanceof Error ? err.message : 'Unknown error');
    return null;
  }

  return null;
}

export function getCachedWallet(address: string): PrivateKeyAccount | null {
  const cached = safeLocalStorageGet(DERIVED_WALLET_STORAGE_KEY);
  if (!cached) return null;

  try {
    const parsed: WalletCache = JSON.parse(cached);
    if (parsed.derivedAddress.toLowerCase() === address.toLowerCase()) {
      return privateKeyToAccount(parsed.derivedPrivateKey);
    }
  } catch (err) {
    console.error('Failed to get cached wallet:', err instanceof Error ? err.message : 'Unknown error');
    return null;
  }

  return null;
}
