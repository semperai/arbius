import { useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { type Hex, type PrivateKeyAccount } from 'viem';
import { AAWalletContext } from '../components/AAWalletProvider';
import { initDeterministicWallet, getCachedWalletAddress, getCachedWallet } from '../utils/viemWalletUtils';

export function useAAWallet() {
  const context = useContext(AAWalletContext);
  const { address: connectedAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
  const [derivedAccount, setDerivedAccount] = useState<PrivateKeyAccount | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializingRef = useRef(false);
  const initializedForAddress = useRef<string | null>(null);

  // Initialize derived wallet when connected
  useEffect(() => {
    const initWallet = async () => {
      // Prevent multiple simultaneous initializations or re-init for same address
      if (!connectedAddress || !walletClient || initializingRef.current || initializedForAddress.current === connectedAddress) {
        return;
      }

      // Check if we already have a cached wallet
      const cachedAddress = getCachedWalletAddress(connectedAddress);
      if (cachedAddress) {
        const cachedAccount = getCachedWallet(cachedAddress);
        if (cachedAccount) {
          setSmartAccountAddress(cachedAddress);
          setDerivedAccount(cachedAccount);
          initializedForAddress.current = connectedAddress;
          return;
        }
      }

      initializingRef.current = true;
      setIsInitializing(true);
      setError(null);

      try {
        const signMessage = async (message: string): Promise<Hex> => {
          const signature = await walletClient.signMessage({
            account: connectedAddress,
            message
          });
          return signature;
        };

        const account = await initDeterministicWallet(connectedAddress, signMessage);
        setDerivedAccount(account);
        setSmartAccountAddress(account.address);
        initializedForAddress.current = connectedAddress;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize AA wallet';
        setError(errorMessage);
      } finally {
        setIsInitializing(false);
        initializingRef.current = false;
      }
    };

    initWallet();
  }, [connectedAddress, walletClient]);

  const signMessageWithAAWallet = useCallback(async (message: string): Promise<Hex | null> => {
    if (!derivedAccount) {
      return null;
    }

    try {
      const signature = await derivedAccount.signMessage({ message });
      return signature;
    } catch (err) {
      console.error('Failed to sign message:', err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, [derivedAccount]);

  const estimateGas = useCallback(async (to: `0x${string}`, data: `0x${string}`, value: bigint = BigInt(0)): Promise<bigint | null> => {
    if (!smartAccountAddress || !publicClient) {
      return null;
    }

    try {
      const gasEstimate = await publicClient.estimateGas({
        account: smartAccountAddress as `0x${string}`,
        to,
        data,
        value,
      });
      return gasEstimate;
    } catch (err) {
      console.error('Failed to estimate gas:', err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, [smartAccountAddress, publicClient]);

  return {
    ...context,
    smartAccountAddress,
    derivedAccount,
    signMessageWithAAWallet,
    estimateGas,
    isInitializing,
    error,
  };
}
