import { setupEthereumProxy, isProxyFailed } from '../ethereumProxy';
import * as initModule from '../init';

jest.mock('../init');

describe('ethereumProxy', () => {
  let mockEthereum: any;

  beforeEach(() => {
    // Setup mock ethereum object
    mockEthereum = {
      request: jest.fn(),
      on: jest.fn(),
      removeListener: jest.fn(),
    };

    // Setup minimal window mock
    (global as any).window = {
      ethereum: mockEthereum,
      location: {
        origin: 'https://arbius.xyz',
        hostname: 'arbius.xyz',
      },
      localStorage: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
    };

    jest.clearAllMocks();
  });

  afterEach(() => {
    delete (global as any).window;
  });

  describe('setup Prerequisites', () => {
    it('should return false if wallet is not initialized', () => {
      jest.spyOn(initModule, 'isInitialized').mockReturnValue(false);

      const result = setupEthereumProxy();

      expect(result).toBe(false);
    });

    it('should return false if window.ethereum does not exist', () => {
      jest.spyOn(initModule, 'isInitialized').mockReturnValue(true);
      (global as any).window.ethereum = undefined;

      const result = setupEthereumProxy();

      expect(result).toBe(false);
    });

    it('should log error when initialization check fails', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(initModule, 'isInitialized').mockReturnValue(false);

      setupEthereumProxy();

      expect(consoleErrorSpy).toHaveBeenCalledWith('AA Wallet must be initialized before setting up ethereum proxy');

      consoleErrorSpy.mockRestore();
    });

    it('should log warning when ethereum is not found', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      jest.spyOn(initModule, 'isInitialized').mockReturnValue(true);
      (global as any).window.ethereum = undefined;

      setupEthereumProxy();

      expect(consoleWarnSpy).toHaveBeenCalledWith('window.ethereum not found. Ethereum proxy not set up.');

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Fallback behavior', () => {
    it('should initialize isProxyFailed as false', () => {
      expect(isProxyFailed()).toBe(false);
    });

    it('should handle missing window.ethereum gracefully', () => {
      jest.spyOn(initModule, 'isInitialized').mockReturnValue(true);
      (global as any).window.ethereum = undefined;

      const result = setupEthereumProxy();

      expect(result).toBe(false);
      // When ethereum is simply missing, we don't set the failed flag
      // because it's not a failure to set up proxy, it's just not available
    });

    it('should return false when prerequisites are not met', () => {
      jest.spyOn(initModule, 'isInitialized').mockReturnValue(false);

      const result = setupEthereumProxy();

      expect(result).toBe(false);
    });
  });

  describe('Initialization validation', () => {
    it('should check if wallet is initialized before setup', () => {
      const isInitializedSpy = jest.spyOn(initModule, 'isInitialized').mockReturnValue(false);

      setupEthereumProxy();

      expect(isInitializedSpy).toHaveBeenCalled();
    });

    it('should not attempt proxy setup when not initialized', () => {
      jest.spyOn(initModule, 'isInitialized').mockReturnValue(false);
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      setupEthereumProxy();

      // Should not log success message
      expect(consoleLogSpy).not.toHaveBeenCalledWith('Ethereum proxy set up successfully');

      consoleLogSpy.mockRestore();
    });
  });

  describe('Error handling', () => {
    it('should handle errors during proxy setup gracefully', () => {
      jest.spyOn(initModule, 'isInitialized').mockReturnValue(true);

      // Mock Object.defineProperty to throw
      const originalDefineProperty = Object.defineProperty;
      Object.defineProperty = jest.fn(() => {
        throw new Error('Cannot define property');
      });

      const result = setupEthereumProxy();

      // Should return false on error
      expect(result).toBe(false);

      Object.defineProperty = originalDefineProperty;
    });

    it('should log error message when proxy setup fails', () => {
      jest.spyOn(initModule, 'isInitialized').mockReturnValue(true);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const originalDefineProperty = Object.defineProperty;
      Object.defineProperty = jest.fn(() => {
        throw new Error('Test error');
      });

      setupEthereumProxy();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to setup ethereum proxy:', expect.any(Error));

      Object.defineProperty = originalDefineProperty;
      consoleErrorSpy.mockRestore();
    });

    it('should log fallback warning when proxy setup fails', () => {
      jest.spyOn(initModule, 'isInitialized').mockReturnValue(true);
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const originalDefineProperty = Object.defineProperty;
      Object.defineProperty = jest.fn(() => {
        throw new Error('Test error');
      });

      setupEthereumProxy();

      expect(consoleWarnSpy).toHaveBeenCalledWith('AA Wallet will fall back to using the standard wallet provider');

      Object.defineProperty = originalDefineProperty;
      consoleWarnSpy.mockRestore();
    });
  });
});
