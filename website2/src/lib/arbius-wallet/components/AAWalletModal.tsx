import { useState, useEffect, useRef } from 'react';
import { useAccount, useBalance, useWalletClient, usePublicClient, useReadContract } from 'wagmi';
import { parseEther, formatEther, formatUnits, isAddress } from 'viem';
import { arbitrum } from 'viem/chains';
import { XMarkIcon, EyeSlashIcon, KeyIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Copy, Check } from 'lucide-react';
import QRCode from 'react-qr-code';
import { getCachedWallet } from '../utils/viemWalletUtils';
import Image from 'next/image';

const AIUS_TOKEN_ADDRESS = '0x4a24B101728e07A52053c13FB4dB2BcF490CAbc3';
const ARBITRUM_CHAIN_ID = 42161;
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
] as const;

interface AAWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  smartAccountAddress: string;
}

export function AAWalletModal({ isOpen, onClose, smartAccountAddress }: AAWalletModalProps) {
  const { address: connectedAddress, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const isCorrectNetwork = chain?.id === ARBITRUM_CHAIN_ID;
  const { data: aaBalance, refetch: refetchAABalance } = useBalance({
    address: smartAccountAddress as `0x${string}`,
  });
  const { data: connectedBalance } = useBalance({
    address: connectedAddress,
  });
  const { data: aiusBalance, refetch: refetchAiusBalance } = useReadContract({
    address: AIUS_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [smartAccountAddress as `0x${string}`],
  });
  const { data: connectedAiusBalance, refetch: refetchConnectedAiusBalance } = useReadContract({
    address: AIUS_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [connectedAddress as `0x${string}`],
  });

  const [fundAmount, setFundAmount] = useState('');
  const [fundCoin, setFundCoin] = useState<'eth' | 'aius'>('eth');
  const [sendToAddress, setSendToAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendCoin, setSendCoin] = useState<'eth' | 'aius'>('eth');

  // Clear success message when send form is modified (but not when cleared)
  useEffect(() => {
    if (success && activeTab === 'send' && (sendToAddress || sendAmount)) {
      setSuccess(false);
    }
  }, [sendToAddress, sendAmount, sendCoin]);

  // Clear success message when fund form is modified (but not when cleared)
  useEffect(() => {
    if (success && activeTab === 'fund' && fundAmount) {
      setSuccess(false);
    }
  }, [fundAmount, fundCoin]);

  // Estimate gas when send form changes
  useEffect(() => {
    const estimateGasForSend = async () => {
      if (!sendToAddress || !sendAmount || !isAddress(sendToAddress) || !isValidAmount(sendAmount) || !publicClient) {
        setEstimatedGas(null);
        setSimulationError(null);
        return;
      }

      // Only estimate if amount is within available balance (ignoring gas for now)
      const amount = parseFloat(sendAmount);
      const available = sendCoin === 'eth'
        ? (aaBalance ? parseFloat(formatEther(aaBalance.value)) : 0)
        : (aiusBalance ? parseFloat(formatUnits(aiusBalance as bigint, 18)) : 0);

      if (amount > available) {
        setEstimatedGas(null);
        setSimulationError(null);
        return;
      }

      setIsEstimatingGas(true);
      setSimulationError(null);
      try {
        const aaWallet = getCachedWallet(smartAccountAddress);
        if (!aaWallet) {
          setEstimatedGas(null);
          setSimulationError('AA Wallet not found');
          return;
        }

        let gasEstimate: bigint;
        const gasPrice = await publicClient.getGasPrice();

        if (sendCoin === 'eth') {
          gasEstimate = await publicClient.estimateGas({
            account: aaWallet.address,
            to: sendToAddress as `0x${string}`,
            value: parseEther(sendAmount),
          });
        } else {
          gasEstimate = await publicClient.estimateContractGas({
            account: aaWallet.address,
            address: AIUS_TOKEN_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'transfer',
            args: [sendToAddress as `0x${string}`, parseEther(sendAmount)],
          });
        }

        // Add 20% buffer for gas price fluctuations and Arbitrum requirements
        const totalGasCost = (gasEstimate * gasPrice * BigInt(120)) / BigInt(100);
        const gasCostInEth = formatEther(totalGasCost);
        setEstimatedGas(gasCostInEth);
        setSimulationError(null);
      } catch (err: any) {
        console.error('Transaction simulation failed:', err);
        setEstimatedGas(null);

        // Check if it's an insufficient funds error
        const errorMessage = err.message || err.toString();
        const errorDetails = err.details || '';

        if (errorMessage.includes('insufficient funds') ||
            errorMessage.includes('exceeds balance') ||
            errorMessage.includes('gas') ||
            errorDetails.includes('insufficient funds')) {
          setSimulationError('Insufficient ETH for gas. Arbitrum requires ~0.0001 ETH minimum. Fund your wallet with ETH.');
        } else if (errorMessage.includes('transfer amount exceeds balance')) {
          setSimulationError('Insufficient token balance.');
        } else {
          setSimulationError(`Transaction would fail: ${errorMessage.slice(0, 100)}`);
        }
      } finally {
        setIsEstimatingGas(false);
      }
    };

    estimateGasForSend();
  }, [sendToAddress, sendAmount, sendCoin, smartAccountAddress, publicClient, aaBalance, aiusBalance]);
  const [isFunding, setIsFunding] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'fund' | 'send' | 'history'>('overview');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTxs, setIsLoadingTxs] = useState(false);
  const [estimatedGas, setEstimatedGas] = useState<string | null>(null);
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [isRefreshingBalances, setIsRefreshingBalances] = useState(false);
  const [copiedPrivateKey, setCopiedPrivateKey] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartRef = useRef<number | null>(null);
  const HOLD_DURATION = 3000; // 3 seconds

  // Load transactions from localStorage on mount
  useEffect(() => {
    if (!smartAccountAddress) return;

    const storageKey = `amica_wallet_txs_${smartAccountAddress.toLowerCase()}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTransactions(parsed);
      } catch (err) {
        console.error('Failed to parse stored transactions:', err);
      }
    }
  }, [smartAccountAddress]);

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    if (!smartAccountAddress || transactions.length === 0) return;

    const storageKey = `amica_wallet_txs_${smartAccountAddress.toLowerCase()}`;
    localStorage.setItem(storageKey, JSON.stringify(transactions));
  }, [transactions, smartAccountAddress]);

  // Validation
  const isValidAmount = (amount: string) => {
    if (!amount || amount === '') return false;
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  };

  const getAvailableBalance = (coin: 'eth' | 'aius', type: 'fund' | 'send') => {
    if (type === 'fund') {
      if (coin === 'eth') {
        return connectedBalance ? parseFloat(formatEther(connectedBalance.value)) : 0;
      } else {
        return connectedAiusBalance ? parseFloat(formatUnits(connectedAiusBalance as bigint, 18)) : 0;
      }
    } else {
      if (coin === 'eth') {
        return aaBalance ? parseFloat(formatEther(aaBalance.value)) : 0;
      } else {
        return aiusBalance ? parseFloat(formatUnits(aiusBalance as bigint, 18)) : 0;
      }
    }
  };

  const canFund = () => {
    if (!fundAmount || !connectedAddress) return false;
    if (!isCorrectNetwork) return false; // Must be on Arbitrum
    if (!isValidAmount(fundAmount)) return false;
    const amount = parseFloat(fundAmount);
    const available = getAvailableBalance(fundCoin, 'fund');
    return amount <= available;
  };

  const canSend = () => {
    if (!sendAmount || !sendToAddress) return false;
    if (!isValidAmount(sendAmount)) return false;
    if (!isAddress(sendToAddress)) return false;
    if (simulationError) return false; // Don't allow send if simulation failed

    const amount = parseFloat(sendAmount);
    const available = getAvailableBalance(sendCoin, 'send');
    const ethBalance = aaBalance ? parseFloat(formatEther(aaBalance.value)) : 0;
    const gasReserve = estimatedGas ? parseFloat(estimatedGas) : 0.0001; // Fallback to 0.0001 if no estimate

    if (sendCoin === 'eth') {
      // When sending ETH, need to reserve some for gas
      if (amount > (ethBalance - gasReserve)) return false;
    } else {
      // When sending AIUS, need ETH for gas
      if (amount > available) return false;
      if (ethBalance < gasReserve) return false;
    }

    return true;
  };

  const hasInsufficientGas = () => {
    const ethBalance = aaBalance ? parseFloat(formatEther(aaBalance.value)) : 0;
    const gasReserve = estimatedGas ? parseFloat(estimatedGas) : 0.0001;

    if (sendCoin === 'aius') {
      return ethBalance < gasReserve;
    }

    if (sendCoin === 'eth' && sendAmount && isValidAmount(sendAmount)) {
      const amount = parseFloat(sendAmount);
      return amount > (ethBalance - gasReserve);
    }

    return false;
  };

  const handleFund = async () => {
    if (!walletClient || !connectedAddress || !fundAmount) return;

    // Ensure we're on Arbitrum
    if (!isCorrectNetwork) {
      setError('Please switch to Arbitrum One network to fund your wallet');
      return;
    }

    setIsFunding(true);
    setError(null);
    setSuccess(false);

    try {
      let hash;
      if (fundCoin === 'eth') {
        hash = await walletClient.sendTransaction({
          account: connectedAddress,
          to: smartAccountAddress as `0x${string}`,
          value: parseEther(fundAmount),
          chain: arbitrum,
        });
      } else {
        // AIUS transfer
        hash = await walletClient.writeContract({
          account: connectedAddress,
          address: AIUS_TOKEN_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [smartAccountAddress as `0x${string}`, parseEther(fundAmount)],
          chain: arbitrum,
        });
      }

      console.log('Transaction hash:', hash);

      // Add to transaction history
      const newTx = {
        type: 'receive',
        coin: fundCoin,
        amount: fundAmount,
        from: connectedAddress,
        to: smartAccountAddress,
        timestamp: Date.now(),
        hash: hash,
      };
      setTransactions(prev => [newTx, ...prev]);

      setSuccess(true);
      setFundAmount('');
      setError(null);

      // Store the hash for the success message
      sessionStorage.setItem('lastTxHash', hash);

      // Refetch balances immediately
      refetchAABalance();
      refetchAiusBalance();
      refetchConnectedAiusBalance();
    } catch (err: any) {
      setError(err.message || 'Failed to fund wallet');
    } finally {
      setIsFunding(false);
    }
  };

  const handleSendOut = async () => {
    if (!sendToAddress || !sendAmount || !publicClient) return;

    setIsSending(true);
    setError(null);
    setSuccess(false);

    try {
      const aaWallet = getCachedWallet(smartAccountAddress);
      if (!aaWallet) {
        throw new Error('AA Wallet not found. Please reconnect.');
      }

      let hash;
      if (sendCoin === 'eth') {
        hash = await walletClient!.sendTransaction({
          account: aaWallet,
          to: sendToAddress as `0x${string}`,
          value: parseEther(sendAmount),
          chain: arbitrum, // Force Arbitrum One
        });
      } else {
        // AIUS transfer
        hash = await walletClient!.writeContract({
          account: aaWallet,
          address: AIUS_TOKEN_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [sendToAddress as `0x${string}`, parseEther(sendAmount)],
          chain: arbitrum, // Force Arbitrum One
        });
      }

      console.log('Transaction hash:', hash);

      // Add to transaction history
      const newTx = {
        type: 'send',
        coin: sendCoin,
        amount: sendAmount,
        from: smartAccountAddress,
        to: sendToAddress,
        timestamp: Date.now(),
        hash: hash,
      };
      setTransactions(prev => [newTx, ...prev]);

      setSuccess(true);
      setSendAmount('');
      setSendToAddress('');
      setError(null);

      // Store the hash for the success message
      sessionStorage.setItem('lastTxHash', hash);

      // Refetch balances immediately
      refetchAABalance();
      refetchAiusBalance();
    } catch (err: any) {
      setError(err.message || 'Failed to send transaction');
    } finally {
      setIsSending(false);
    }
  };

  const handleMouseDown = () => {
    holdStartRef.current = Date.now();
    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current!;
      const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        setShowPrivateKey(true);
        handleMouseUp();
      }
    }, 50);
  };

  const handleMouseUp = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (holdProgress < 100) {
      setHoldProgress(0);
    }
    holdStartRef.current = null;
  };

  const handleRefreshBalances = async () => {
    setIsRefreshingBalances(true);
    try {
      await Promise.all([
        refetchAABalance(),
        refetchAiusBalance(),
      ]);
    } finally {
      setTimeout(() => setIsRefreshingBalances(false), 500);
    }
  };

  const handleCopyPrivateKey = async () => {
    const pk = getPrivateKey();
    if (pk && pk !== 'Private key not available') {
      await navigator.clipboard.writeText(pk);
      setCopiedPrivateKey(true);
      setTimeout(() => setCopiedPrivateKey(false), 2000);
    }
  };

  const getPrivateKey = () => {
    const cached = localStorage.getItem('arbiuswallet_derivedWalletCache');
    if (!cached) return 'Private key not available';

    try {
      const parsed = JSON.parse(cached);
      if (parsed.derivedAddress.toLowerCase() === smartAccountAddress.toLowerCase()) {
        return parsed.derivedPrivateKey;
      }
    } catch (err) {
      console.error('Failed to retrieve private key:', err instanceof Error ? err.message : 'Unknown error');
      return 'Private key not available';
    }

    return 'Private key not available';
  };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 font-[family-name:var(--font-family-fredoka)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Amica Wallet</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAdvanced(true)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
              title="Private Key"
            >
              <KeyIcon className="h-6 w-6" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('fund')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'fund'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Fund
          </button>
          <button
            onClick={() => setActiveTab('send')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'send'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Send
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'history'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            History
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <a
                    href={`https://arbiscan.io/address/${smartAccountAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-600 hover:text-gray-900 no-underline"
                  >
                    View on Arbiscan →
                  </a>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-900 break-all">
                  {smartAccountAddress}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Balances</label>
                  <button
                    onClick={handleRefreshBalances}
                    disabled={isRefreshingBalances}
                    className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer disabled:opacity-50"
                    title="Refresh balances"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshingBalances ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Image src="https://assets.coingecko.com/coins/images/279/standard/ethereum.png" alt="ETH" className="h-5 w-5 rounded-full" width={20} height={20} unoptimized />
                      <span className="text-sm text-gray-600">ETH</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      {aaBalance ? parseFloat(formatEther(aaBalance.value)).toFixed(5) : '0.00000'}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Image src="https://assets.coingecko.com/coins/images/35246/standard/arbius-200x-logo.png" alt="AIUS" className="h-5 w-5 rounded-full" width={20} height={20} unoptimized />
                      <span className="text-sm text-gray-600">AIUS</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      {aiusBalance ? parseFloat(formatUnits(aiusBalance as bigint, 18)).toFixed(5) : '0.00000'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fund Tab */}
          {activeTab === 'fund' && (
            <div>
              <div className="mb-4">
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="0.0"
                    className={`flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent ${
                      fundAmount && !isValidAmount(fundAmount)
                        ? 'border-red-300 focus:ring-red-500'
                        : fundAmount && parseFloat(fundAmount) > getAvailableBalance(fundCoin, 'fund')
                        ? 'border-orange-300 focus:ring-orange-500'
                        : 'border-gray-300 focus:ring-primary'
                    }`}
                  />
                  <select
                    value={fundCoin}
                    onChange={(e) => setFundCoin(e.target.value as 'eth' | 'aius')}
                    className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-medium"
                  >
                    <option value="eth">ETH</option>
                    <option value="aius">AIUS</option>
                  </select>
                  <button
                    onClick={handleFund}
                    disabled={isFunding || !canFund()}
                    className="px-6 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    {isFunding ? 'Funding...' : 'Fund'}
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  Available: {fundCoin === 'eth'
                    ? (connectedBalance ? `${parseFloat(formatEther(connectedBalance.value)).toFixed(5)} ETH` : '0 ETH')
                    : (connectedAiusBalance ? `${parseFloat(formatUnits(connectedAiusBalance as bigint, 18)).toFixed(5)} AIUS` : '0 AIUS')
                  }
                </div>
                {fundAmount && !isValidAmount(fundAmount) && (
                  <div className="text-xs text-red-600 mt-1">Please enter a valid amount</div>
                )}
                {fundAmount && isValidAmount(fundAmount) && parseFloat(fundAmount) > getAvailableBalance(fundCoin, 'fund') && (
                  <div className="text-xs text-orange-600 mt-1">Insufficient balance</div>
                )}
                {!isCorrectNetwork && (
                  <div className="text-xs text-red-600 mt-1">Please switch to Arbitrum One network</div>
                )}
              </div>

              <div className="mt-6 flex justify-center">
                <QRCode value={smartAccountAddress} size={200} />
              </div>
            </div>
          )}

          {/* Send Tab */}
          {activeTab === 'send' && (
            <div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Address</label>
                  <input
                    type="text"
                    value={sendToAddress}
                    onChange={(e) => setSendToAddress(e.target.value)}
                    placeholder="0x..."
                    className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent ${
                      sendToAddress && !isAddress(sendToAddress)
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-primary'
                    }`}
                  />
                  {sendToAddress && !isAddress(sendToAddress) && (
                    <div className="text-xs text-red-600 mt-1">Invalid Ethereum address</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      placeholder="0.0"
                      className={`flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent ${
                        sendAmount && !isValidAmount(sendAmount)
                          ? 'border-red-300 focus:ring-red-500'
                          : sendAmount && parseFloat(sendAmount) > getAvailableBalance(sendCoin, 'send')
                          ? 'border-orange-300 focus:ring-orange-500'
                          : 'border-gray-300 focus:ring-primary'
                      }`}
                    />
                    <select
                      value={sendCoin}
                      onChange={(e) => setSendCoin(e.target.value as 'eth' | 'aius')}
                      className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-medium"
                    >
                      <option value="eth">ETH</option>
                      <option value="aius">AIUS</option>
                    </select>
                    <button
                      onClick={handleSendOut}
                      disabled={isSending || !canSend()}
                      className="px-6 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      {isSending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    Available: {sendCoin === 'eth'
                      ? (aaBalance ? `${parseFloat(formatEther(aaBalance.value)).toFixed(5)} ETH` : '0 ETH')
                      : (aiusBalance ? `${parseFloat(formatUnits(aiusBalance as bigint, 18)).toFixed(5)} AIUS` : '0 AIUS')
                    }
                  </div>
                  {estimatedGas && (
                    <div className="text-xs text-gray-500">
                      Estimated gas: {parseFloat(estimatedGas).toFixed(8)} ETH
                    </div>
                  )}
                  {isEstimatingGas && (
                    <div className="text-xs text-gray-500">
                      Estimating gas...
                    </div>
                  )}
                  {sendAmount && !isValidAmount(sendAmount) && (
                    <div className="text-xs text-red-600 mt-1">Please enter a valid amount</div>
                  )}
                  {sendAmount && isValidAmount(sendAmount) && parseFloat(sendAmount) > getAvailableBalance(sendCoin, 'send') && !hasInsufficientGas() && (
                    <div className="text-xs text-orange-600 mt-1">Insufficient balance</div>
                  )}
                  {simulationError && (
                    <div className="text-xs text-orange-600 mt-1">{simulationError}</div>
                  )}
                  {!simulationError && hasInsufficientGas() && (
                    <div className="text-xs text-orange-600 mt-1">
                      {sendCoin === 'aius'
                        ? `Insufficient ETH for gas. Need ${estimatedGas ? parseFloat(estimatedGas).toFixed(8) : '~0.0001'} ETH.`
                        : `Amount too high. Reserve ${estimatedGas ? parseFloat(estimatedGas).toFixed(8) : '~0.0001'} ETH for gas.`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {isLoadingTxs ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      <p>Loading transactions...</p>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      <p>No transaction history available yet.</p>
                      <p className="text-xs mt-2">Transactions will appear here after you send funds.</p>
                    </div>
                  ) : (
                    transactions.map((tx, index) => (
                      <a
                        key={index}
                        href={`https://arbiscan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gray-50 rounded-xl p-3 flex items-center justify-between hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${tx.type === 'send' ? 'bg-red-100' : 'bg-green-100'}`}>
                            {tx.type === 'send' ? (
                              <ArrowUpRight className="h-4 w-4 text-red-600" />
                            ) : (
                              <ArrowDownLeft className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-sm text-gray-900">
                              {tx.type === 'send' ? 'Sent' : 'Received'} {tx.coin.toUpperCase()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {tx.type === 'send' ? `To: ${tx.to.slice(0, 6)}...${tx.to.slice(-4)}` : `From: ${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(tx.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold text-sm ${tx.type === 'send' ? 'text-red-600' : 'text-green-600'}`}>
                            {tx.type === 'send' ? '-' : '+'}{parseFloat(tx.amount).toFixed(5)}
                          </div>
                          <div className="text-xs text-gray-500">{tx.coin.toUpperCase()}</div>
                        </div>
                      </a>
                    ))
                  )}
                </div>
            </div>
          )}

          {/* Status Messages - Show on all tabs */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600">
              <div>Transaction sent successfully!</div>
              {sessionStorage.getItem('lastTxHash') && (
                <a
                  href={`https://arbiscan.io/tx/${sessionStorage.getItem('lastTxHash')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-700 hover:text-green-800 no-underline text-xs mt-1 inline-block"
                >
                  View on Arbiscan →
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Advanced Settings Modal */}
      {showAdvanced && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowAdvanced(false);
              setShowPrivateKey(false);
              setHoldProgress(0);
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 font-[family-name:var(--font-family-fredoka)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <LockClosedIcon className="h-6 w-6 text-gray-700" />
                <h3 className="text-xl font-semibold text-gray-900">Private Key</h3>
              </div>
              <button
                onClick={() => {
                  setShowAdvanced(false);
                  setShowPrivateKey(false);
                  setHoldProgress(0);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start space-x-3 mb-3">
                <div className="flex-shrink-0">
                  <XMarkIcon className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-900 mb-1">Danger Zone</h4>
                  <p className="text-xs text-red-700 mb-3">
                    Never share your private key. Anyone with access to it can steal your funds.
                  </p>
                </div>
              </div>

              {!showPrivateKey ? (
                <div>
                  <button
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="relative w-full px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors overflow-hidden cursor-pointer"
                  >
                    <div
                      className="absolute left-0 top-0 h-full bg-red-800 transition-all"
                      style={{ width: `${holdProgress}%` }}
                    />
                    <span className="relative z-10">
                      {holdProgress > 0 ? 'Keep holding...' : 'Hold to Reveal Private Key'}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <div className="bg-white p-3 rounded-xl border border-red-300 font-mono text-xs break-all text-gray-900 pr-10">
                      {getPrivateKey()}
                    </div>
                    <button
                      onClick={handleCopyPrivateKey}
                      className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                      title="Copy private key"
                    >
                      {copiedPrivateKey ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => setShowPrivateKey(false)}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <EyeSlashIcon className="h-4 w-4" />
                    <span>Hide Private Key</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
