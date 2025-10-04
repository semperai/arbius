import React from 'react';
import { render, screen } from '@testing-library/react';
import { AAWalletProvider, AAWalletContext } from '@/lib/arbius-wallet/components/AAWalletProvider';
import * as initModule from '@/lib/arbius-wallet/core/init';
import { AAWalletConfig } from '@/lib/arbius-wallet/types';

jest.mock('@/lib/arbius-wallet/core/init');

describe('AAWalletProvider', () => {
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
    // Mock window.ethereum
    (global as any).window = {
      ethereum: {
        on: jest.fn(),
        removeListener: jest.fn(),
        request: jest.fn(),
      },
    };
  });

  afterEach(() => {
    delete (global as any).window;
  });

  describe('Initialization check', () => {
    it('should warn when wallet is not initialized', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      jest.spyOn(initModule, 'isInitialized').mockReturnValue(false);

      render(
        <AAWalletProvider>
          <div>Test Child</div>
        </AAWalletProvider>
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'AA Wallet not initialized. Call init() before rendering AAWalletProvider.'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should not warn when wallet is initialized', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      jest.spyOn(initModule, 'isInitialized').mockReturnValue(true);
      jest.spyOn(initModule, 'getConfig').mockReturnValue(mockConfig);

      render(
        <AAWalletProvider>
          <div>Test Child</div>
        </AAWalletProvider>
      );

      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        'AA Wallet not initialized. Call init() before rendering AAWalletProvider.'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should still render children when not initialized', () => {
      jest.spyOn(console, 'warn').mockImplementation();
      jest.spyOn(initModule, 'isInitialized').mockReturnValue(false);

      render(
        <AAWalletProvider>
          <div data-testid="test-child">Test Child</div>
        </AAWalletProvider>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
  });

  describe('Fallback scenario', () => {
    it('should handle scenario where init failed and isInitialized returns false', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Simulate fallback: init returned false, wallet not initialized
      jest.spyOn(initModule, 'isInitialized').mockReturnValue(false);
      jest.spyOn(initModule, 'getConfig').mockReturnValue(null);

      render(
        <AAWalletProvider>
          <div data-testid="child">Child</div>
        </AAWalletProvider>
      );

      // Should warn about not being initialized
      expect(consoleWarnSpy).toHaveBeenCalled();
      // Should still render children (graceful degradation)
      expect(screen.getByTestId('child')).toBeInTheDocument();

      consoleWarnSpy.mockRestore();
    });

    it('should provide default context when not initialized', () => {
      jest.spyOn(console, 'warn').mockImplementation();
      jest.spyOn(initModule, 'isInitialized').mockReturnValue(false);

      let contextValue: any;

      const TestComponent = () => {
        contextValue = React.useContext(AAWalletContext);
        return <div>Test</div>;
      };

      render(
        <AAWalletProvider>
          <TestComponent />
        </AAWalletProvider>
      );

      // Context should have default values
      expect(contextValue.isConnected).toBe(false);
      expect(contextValue.address).toBeNull();
      expect(contextValue.chainId).toBeNull();
    });
  });

  describe('Config loading', () => {
    it('should load config when initialized', () => {
      jest.spyOn(initModule, 'isInitialized').mockReturnValue(true);
      const getConfigSpy = jest.spyOn(initModule, 'getConfig').mockReturnValue(mockConfig);

      render(
        <AAWalletProvider>
          <div>Test</div>
        </AAWalletProvider>
      );

      expect(getConfigSpy).toHaveBeenCalled();
    });

    it('should handle null config gracefully', () => {
      jest.spyOn(initModule, 'isInitialized').mockReturnValue(true);
      jest.spyOn(initModule, 'getConfig').mockReturnValue(null);

      render(
        <AAWalletProvider>
          <div data-testid="child">Test</div>
        </AAWalletProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  describe('Ethereum provider handling', () => {
    it('should handle missing window.ethereum gracefully', () => {
      jest.spyOn(initModule, 'isInitialized').mockReturnValue(true);
      jest.spyOn(initModule, 'getConfig').mockReturnValue(mockConfig);

      // Remove window.ethereum
      delete (global as any).window.ethereum;

      render(
        <AAWalletProvider>
          <div data-testid="child">Test</div>
        </AAWalletProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should attach event listeners when ethereum is available', () => {
      const mockOn = jest.fn();
      (global as any).window.ethereum = {
        on: mockOn,
        removeListener: jest.fn(),
      };

      jest.spyOn(initModule, 'isInitialized').mockReturnValue(true);
      jest.spyOn(initModule, 'getConfig').mockReturnValue(mockConfig);

      render(
        <AAWalletProvider>
          <div>Test</div>
        </AAWalletProvider>
      );

      expect(mockOn).toHaveBeenCalledWith('accountsChanged', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('chainChanged', expect.any(Function));
    });

    it('should handle ethereum providers without .on method', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Ethereum object without .on method
      (global as any).window.ethereum = {
        request: jest.fn(),
      };

      jest.spyOn(initModule, 'isInitialized').mockReturnValue(true);
      jest.spyOn(initModule, 'getConfig').mockReturnValue(mockConfig);

      render(
        <AAWalletProvider>
          <div data-testid="child">Test</div>
        </AAWalletProvider>
      );

      // Should still render
      expect(screen.getByTestId('child')).toBeInTheDocument();

      consoleWarnSpy.mockRestore();
    });

    it('should handle errors when attaching event listeners', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const mockOn = jest.fn().mockImplementation(() => {
        throw new Error('Event listener error');
      });

      (global as any).window.ethereum = {
        on: mockOn,
      };

      jest.spyOn(initModule, 'isInitialized').mockReturnValue(true);
      jest.spyOn(initModule, 'getConfig').mockReturnValue(mockConfig);

      render(
        <AAWalletProvider>
          <div data-testid="child">Test</div>
        </AAWalletProvider>
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to attach ethereum event listeners:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Integration with fallback', () => {
    it('should work when init succeeded but proxy is inactive', () => {
      // This simulates: init() returns false, but some state is preserved
      jest.spyOn(initModule, 'isInitialized').mockReturnValue(true);
      jest.spyOn(initModule, 'getConfig').mockReturnValue(mockConfig);

      render(
        <AAWalletProvider>
          <div data-testid="child">Test</div>
        </AAWalletProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });
});
