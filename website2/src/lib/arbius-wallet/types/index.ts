export interface ProxyEthereum {
  isAA: boolean;
  request: (args: any) => Promise<any>;
  [key: string]: any;
}

export enum TransactionStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error',
}

export interface Token {
  address: string;
  decimals: number;
  symbol: string;
  name: string;
  chainId: number;
  logo?: string;
}

export interface MulticallConfig {
  chainId: number;
  address?: string;
}

export interface AAWalletConfig {
  defaultChainId: number;
  supportedChainIds: number[];
  multicall?: MulticallConfig;
  watchERC20s?: Token[];
  ui?: {
    toastPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    theme?: 'light' | 'dark' | 'system';
    autoConnectOnInit?: boolean;
  };
  rpc?: {
    retryAttempts?: number;
    timeout?: number;
    urls?: Record<number, string[]>;
  };
}

export interface Transaction {
  id: string;
  hash?: string;
  status: TransactionStatus;
  method: string;
  params: any[];
  chainId: number;
  createdAt: number;
  updatedAt: number;
  error?: Error;
  receipt?: any;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  transactions: Transaction[];
}

export interface AAWalletContextValue extends WalletState {
  connect: () => Promise<string>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
  sendTransaction: (transaction: Omit<Transaction, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  signMessageWithAAWallet?: (message: string) => Promise<string | null>;
}