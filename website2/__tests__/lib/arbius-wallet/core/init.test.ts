import { init, isInitialized, getConfig, isEthereumProxyActive } from '../init';
import { setupEthereumProxy } from '../ethereumProxy';
import { setupTransactionQueue } from '../transactionQueue';
import { validateConfig } from '../configValidator';
import { AAWalletConfig } from '../../types';

// Mock dependencies
jest.mock('../ethereumProxy');
jest.mock('../transactionQueue');
jest.mock('../configValidator');

describe('init', () => {
  const mockConfig: AAWalletConfig = {
    defaultChainId: 42161,
    supportedChainIds: [42161],
    ui: {
      autoConnectOnInit: false,
      theme: 'system',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('init()', () => {
    it('should initialize successfully when ethereum proxy setup succeeds', () => {
      (validateConfig as jest.Mock).mockImplementation(() => {});
      (setupEthereumProxy as jest.Mock).mockReturnValue(true);
      (setupTransactionQueue as jest.Mock).mockImplementation(() => {});

      const result = init(mockConfig);

      expect(result).toBe(true);
      expect(validateConfig).toHaveBeenCalledWith(mockConfig);
      expect(setupEthereumProxy).toHaveBeenCalled();
      expect(setupTransactionQueue).toHaveBeenCalled();
    });

    it('should return false when ethereum proxy setup fails', () => {
      (validateConfig as jest.Mock).mockImplementation(() => {});
      (setupEthereumProxy as jest.Mock).mockReturnValue(false);
      (setupTransactionQueue as jest.Mock).mockImplementation(() => {});

      const result = init(mockConfig);

      expect(result).toBe(false);
      expect(setupEthereumProxy).toHaveBeenCalled();
      expect(setupTransactionQueue).toHaveBeenCalled();
    });

    it('should handle config validation errors and return false', () => {
      (validateConfig as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid config');
      });

      const result = init(mockConfig);

      expect(result).toBe(false);
      expect(validateConfig).toHaveBeenCalledWith(mockConfig);
      expect(setupEthereumProxy).not.toHaveBeenCalled();
      expect(setupTransactionQueue).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors during initialization', () => {
      (validateConfig as jest.Mock).mockImplementation(() => {});
      (setupEthereumProxy as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = init(mockConfig);

      expect(result).toBe(false);
    });

    it('should log initialization status', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      (validateConfig as jest.Mock).mockImplementation(() => {});
      (setupEthereumProxy as jest.Mock).mockReturnValue(true);
      (setupTransactionQueue as jest.Mock).mockImplementation(() => {});

      init(mockConfig);

      expect(consoleSpy).toHaveBeenCalledWith('AA Wallet initialized with config:', mockConfig);
      expect(consoleSpy).toHaveBeenCalledWith('Ethereum proxy setup:', 'successful');

      consoleSpy.mockRestore();
    });

    it('should log failure when proxy setup fails', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      (validateConfig as jest.Mock).mockImplementation(() => {});
      (setupEthereumProxy as jest.Mock).mockReturnValue(false);
      (setupTransactionQueue as jest.Mock).mockImplementation(() => {});

      init(mockConfig);

      expect(consoleSpy).toHaveBeenCalledWith('Ethereum proxy setup:', 'failed');

      consoleSpy.mockRestore();
    });
  });

  describe('isInitialized()', () => {
    it('should return false after failed initialization', () => {
      (validateConfig as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid config');
      });

      init(mockConfig);

      expect(isInitialized()).toBe(false);
    });

    it('should return true after successful initialization', () => {
      (validateConfig as jest.Mock).mockImplementation(() => {});
      (setupEthereumProxy as jest.Mock).mockReturnValue(true);
      (setupTransactionQueue as jest.Mock).mockImplementation(() => {});

      init(mockConfig);

      expect(isInitialized()).toBe(true);
    });
  });

  describe('getConfig()', () => {
    it('should return null after failed initialization', () => {
      (validateConfig as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid config');
      });

      init(mockConfig);

      expect(getConfig()).toBeNull();
    });

    it('should return config after successful initialization', () => {
      (validateConfig as jest.Mock).mockImplementation(() => {});
      (setupEthereumProxy as jest.Mock).mockReturnValue(true);
      (setupTransactionQueue as jest.Mock).mockImplementation(() => {});

      init(mockConfig);

      expect(getConfig()).toEqual(mockConfig);
    });
  });

  describe('isEthereumProxyActive()', () => {
    it('should return false when initialization fails', () => {
      (validateConfig as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid config');
      });

      init(mockConfig);

      expect(isEthereumProxyActive()).toBe(false);
    });

    it('should return true when proxy setup succeeds', () => {
      (validateConfig as jest.Mock).mockImplementation(() => {});
      (setupEthereumProxy as jest.Mock).mockReturnValue(true);
      (setupTransactionQueue as jest.Mock).mockImplementation(() => {});

      init(mockConfig);

      expect(isEthereumProxyActive()).toBe(true);
    });

    it('should return false when proxy setup fails', () => {
      (validateConfig as jest.Mock).mockImplementation(() => {});
      (setupEthereumProxy as jest.Mock).mockReturnValue(false);
      (setupTransactionQueue as jest.Mock).mockImplementation(() => {});

      init(mockConfig);

      expect(isEthereumProxyActive()).toBe(false);
    });
  });

  describe('Fallback behavior', () => {
    it('should return false when proxy fails (signals fallback to RainbowKit)', () => {
      (validateConfig as jest.Mock).mockImplementation(() => {});
      (setupEthereumProxy as jest.Mock).mockReturnValue(false);
      (setupTransactionQueue as jest.Mock).mockImplementation(() => {});

      const result = init(mockConfig);

      expect(result).toBe(false); // Returns false to indicate fallback needed
      expect(isInitialized()).toBe(true); // Config is still stored
      expect(isEthereumProxyActive()).toBe(false); // Proxy is not active
      expect(setupTransactionQueue).toHaveBeenCalled(); // Still sets up queue
    });
  });
});
