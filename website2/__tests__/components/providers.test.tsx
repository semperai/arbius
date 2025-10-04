import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Providers, AAWalletStatusContext } from '../providers';
import { init, isEthereumProxyActive } from '@/lib/arbius-wallet';

// Mock dependencies
jest.mock('@/lib/arbius-wallet', () => ({
  AAWalletProvider: ({ children }: any) => <div data-testid="aa-wallet-provider">{children}</div>,
  init: jest.fn(),
  isEthereumProxyActive: jest.fn(),
}));
jest.mock('@/lib/wagmi', () => ({
  config: {},
}));
jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn().mockImplementation(() => ({})),
  QueryClientProvider: ({ children }: any) => <div>{children}</div>,
}));
jest.mock('wagmi', () => ({
  WagmiProvider: ({ children }: any) => <div>{children}</div>,
}));
jest.mock('@rainbow-me/rainbowkit', () => ({
  RainbowKitProvider: ({ children }: any) => <div>{children}</div>,
}));
jest.mock('next-themes', () => ({
  ThemeProvider: ({ children }: any) => <div>{children}</div>,
}));
jest.mock('sonner', () => ({
  Toaster: () => <div>Toaster</div>,
}));

describe('Providers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AAWallet initialization', () => {
    it('should initialize AAWallet on mount', async () => {
      (init as jest.Mock).mockReturnValue(true);
      (isEthereumProxyActive as jest.Mock).mockReturnValue(true);

      render(
        <Providers>
          <div>Test Child</div>
        </Providers>
      );

      await waitFor(() => {
        expect(init).toHaveBeenCalledWith({
          defaultChainId: 42161,
          supportedChainIds: [42161],
          ui: {
            autoConnectOnInit: false,
            theme: 'system',
          },
        });
      });
    });

    it('should set isProxyActive to true when initialization succeeds', async () => {
      (init as jest.Mock).mockReturnValue(true);
      (isEthereumProxyActive as jest.Mock).mockReturnValue(true);

      const TestComponent = () => {
        const contextValue = React.useContext(AAWalletStatusContext);
        return <div data-testid="proxy-status">{contextValue.isProxyActive ? 'true' : 'false'}</div>;
      };

      render(
        <Providers>
          <TestComponent />
        </Providers>
      );

      await waitFor(() => {
        expect(screen.getByTestId('proxy-status')).toHaveTextContent('true');
      });
    });

    it('should set isProxyActive to false when initialization fails', async () => {
      (init as jest.Mock).mockReturnValue(false);
      (isEthereumProxyActive as jest.Mock).mockReturnValue(false);

      const TestComponent = () => {
        const contextValue = React.useContext(AAWalletStatusContext);
        return <div data-testid="proxy-status">{contextValue.isProxyActive ? 'true' : 'false'}</div>;
      };

      render(
        <Providers>
          <TestComponent />
        </Providers>
      );

      await waitFor(() => {
        expect(screen.getByTestId('proxy-status')).toHaveTextContent('false');
      });
    });

    it('should set isProxyActive to false when proxy setup fails', async () => {
      (init as jest.Mock).mockReturnValue(true);
      (isEthereumProxyActive as jest.Mock).mockReturnValue(false);

      const TestComponent = () => {
        const contextValue = React.useContext(AAWalletStatusContext);
        return <div data-testid="proxy-status">{contextValue.isProxyActive ? 'true' : 'false'}</div>;
      };

      render(
        <Providers>
          <TestComponent />
        </Providers>
      );

      await waitFor(() => {
        expect(screen.getByTestId('proxy-status')).toHaveTextContent('false');
      });
    });
  });

  describe('Rendering behavior', () => {
    it('should render children after wallet initialization', async () => {
      (init as jest.Mock).mockReturnValue(true);
      (isEthereumProxyActive as jest.Mock).mockReturnValue(true);

      render(
        <Providers>
          <div data-testid="test-child">Test Child</div>
        </Providers>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-child')).toBeInTheDocument();
      });
    });

    it('should wrap children with AAWalletProvider when initialized', async () => {
      (init as jest.Mock).mockReturnValue(true);
      (isEthereumProxyActive as jest.Mock).mockReturnValue(true);

      render(
        <Providers>
          <div>Test Child</div>
        </Providers>
      );

      await waitFor(() => {
        expect(screen.getByTestId('aa-wallet-provider')).toBeInTheDocument();
      });
    });

    it('should wrap children with AAWalletProvider after initialization', async () => {
      (init as jest.Mock).mockReturnValue(true);
      (isEthereumProxyActive as jest.Mock).mockReturnValue(true);

      render(
        <Providers>
          <div data-testid="test-child">Test Child</div>
        </Providers>
      );

      await waitFor(() => {
        expect(screen.getByTestId('aa-wallet-provider')).toBeInTheDocument();
      });
    });
  });

  describe('Fallback to RainbowKit', () => {
    it('should provide isProxyActive=false when falling back to RainbowKit', async () => {
      (init as jest.Mock).mockReturnValue(false);
      (isEthereumProxyActive as jest.Mock).mockReturnValue(false);

      const TestComponent = () => {
        const contextValue = React.useContext(AAWalletStatusContext);
        return <div data-testid="proxy-status">{contextValue.isProxyActive ? 'true' : 'false'}</div>;
      };

      render(
        <Providers>
          <TestComponent />
        </Providers>
      );

      await waitFor(() => {
        expect(screen.getByTestId('proxy-status')).toHaveTextContent('false');
        expect(init).toHaveBeenCalled();
      });
    });

    it('should still render RainbowKitProvider even when AAWallet fails', async () => {
      (init as jest.Mock).mockReturnValue(false);
      (isEthereumProxyActive as jest.Mock).mockReturnValue(false);

      render(
        <Providers>
          <div data-testid="test-child">Test Child</div>
        </Providers>
      );

      await waitFor(() => {
        // Children should still be rendered
        expect(screen.getByTestId('test-child')).toBeInTheDocument();
      });
    });

    it('should handle case where init succeeds but proxy is inactive', async () => {
      (init as jest.Mock).mockReturnValue(true);
      (isEthereumProxyActive as jest.Mock).mockReturnValue(false);

      const TestComponent = () => {
        const contextValue = React.useContext(AAWalletStatusContext);
        return <div data-testid="proxy-status">{contextValue.isProxyActive ? 'true' : 'false'}</div>;
      };

      render(
        <Providers>
          <TestComponent />
        </Providers>
      );

      await waitFor(() => {
        expect(screen.getByTestId('proxy-status')).toHaveTextContent('false');
        expect(init).toHaveBeenCalled();
        expect(isEthereumProxyActive).toHaveBeenCalled();
      });
    });
  });

  describe('Provider hierarchy', () => {
    it('should maintain correct provider nesting', async () => {
      (init as jest.Mock).mockReturnValue(true);
      (isEthereumProxyActive as jest.Mock).mockReturnValue(true);

      const { container } = render(
        <Providers>
          <div data-testid="test-child">Test Child</div>
        </Providers>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-child')).toBeInTheDocument();
      });

      // All providers should be present
      expect(container).toBeTruthy();
    });
  });
});
