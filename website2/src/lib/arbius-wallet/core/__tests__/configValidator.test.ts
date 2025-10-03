import { validateConfig } from '../configValidator';
import { AAWalletConfig } from '../../types';

describe('configValidator', () => {
  const validConfig: AAWalletConfig = {
    defaultChainId: 42161,
    supportedChainIds: [42161],
    ui: {
      autoConnectOnInit: false,
      theme: 'system',
    },
  };

  describe('validateConfig()', () => {
    it('should not throw for valid configuration', () => {
      expect(() => validateConfig(validConfig)).not.toThrow();
    });

    describe('defaultChainId validation', () => {
      it('should throw if defaultChainId is undefined', () => {
        const config = { ...validConfig, defaultChainId: undefined } as any;
        expect(() => validateConfig(config)).toThrow('defaultChainId is required');
      });

      it('should throw if defaultChainId is not in supportedChainIds', () => {
        const config: AAWalletConfig = {
          ...validConfig,
          defaultChainId: 1,
          supportedChainIds: [42161],
        };
        expect(() => validateConfig(config)).toThrow(
          'defaultChainId (1) must be included in supportedChainIds'
        );
      });
    });

    describe('supportedChainIds validation', () => {
      it('should throw if supportedChainIds is undefined', () => {
        const config = { ...validConfig, supportedChainIds: undefined } as any;
        expect(() => validateConfig(config)).toThrow(
          'supportedChainIds must be a non-empty array'
        );
      });

      it('should throw if supportedChainIds is not an array', () => {
        const config = { ...validConfig, supportedChainIds: 42161 } as any;
        expect(() => validateConfig(config)).toThrow(
          'supportedChainIds must be a non-empty array'
        );
      });

      it('should throw if supportedChainIds is empty', () => {
        const config: AAWalletConfig = {
          ...validConfig,
          supportedChainIds: [],
        };
        expect(() => validateConfig(config)).toThrow(
          'supportedChainIds must be a non-empty array'
        );
      });
    });

    describe('watchERC20s validation', () => {
      it('should accept valid token configuration', () => {
        const config: AAWalletConfig = {
          ...validConfig,
          watchERC20s: [
            {
              address: '0x123',
              symbol: 'TEST',
              decimals: 18,
              chainId: 42161,
            },
          ],
        };
        expect(() => validateConfig(config)).not.toThrow();
      });

      it('should throw if token is missing address', () => {
        const config: AAWalletConfig = {
          ...validConfig,
          watchERC20s: [
            {
              address: '',
              symbol: 'TEST',
              decimals: 18,
              chainId: 42161,
            },
          ],
        };
        expect(() => validateConfig(config)).toThrow('Each token must have an address');
      });

      it('should throw if token is missing symbol', () => {
        const config: AAWalletConfig = {
          ...validConfig,
          watchERC20s: [
            {
              address: '0x123',
              symbol: '',
              decimals: 18,
              chainId: 42161,
            },
          ],
        };
        expect(() => validateConfig(config)).toThrow('Each token must have a symbol');
      });

      it('should throw if token is missing decimals', () => {
        const config: AAWalletConfig = {
          ...validConfig,
          watchERC20s: [
            {
              address: '0x123',
              symbol: 'TEST',
              decimals: undefined as any,
              chainId: 42161,
            },
          ],
        };
        expect(() => validateConfig(config)).toThrow('Each token must have decimals');
      });

      it('should throw if token is missing chainId', () => {
        const config: AAWalletConfig = {
          ...validConfig,
          watchERC20s: [
            {
              address: '0x123',
              symbol: 'TEST',
              decimals: 18,
              chainId: undefined as any,
            },
          ],
        };
        expect(() => validateConfig(config)).toThrow('Each token must have a chainId');
      });

      it('should throw if token chainId is not in supportedChainIds', () => {
        const config: AAWalletConfig = {
          ...validConfig,
          supportedChainIds: [42161],
          watchERC20s: [
            {
              address: '0x123',
              symbol: 'TEST',
              decimals: 18,
              chainId: 1,
            },
          ],
        };
        expect(() => validateConfig(config)).toThrow(
          'Token chainId (1) must be included in supportedChainIds'
        );
      });
    });

    describe('rpc configuration validation', () => {
      it('should accept valid rpc configuration', () => {
        const config: AAWalletConfig = {
          ...validConfig,
          rpc: {
            retryAttempts: 3,
            timeout: 5000,
            urls: {
              42161: ['https://arb1.arbitrum.io/rpc'],
            },
          },
        };
        expect(() => validateConfig(config)).not.toThrow();
      });

      it('should throw if retryAttempts is negative', () => {
        const config: AAWalletConfig = {
          ...validConfig,
          rpc: {
            retryAttempts: -1,
          },
        };
        expect(() => validateConfig(config)).toThrow(
          'rpc.retryAttempts must be a positive integer'
        );
      });

      it('should throw if retryAttempts is not an integer', () => {
        const config: AAWalletConfig = {
          ...validConfig,
          rpc: {
            retryAttempts: 3.5,
          },
        };
        expect(() => validateConfig(config)).toThrow(
          'rpc.retryAttempts must be a positive integer'
        );
      });

      it('should throw if timeout is zero or negative', () => {
        const config: AAWalletConfig = {
          ...validConfig,
          rpc: {
            timeout: 0,
          },
        };
        expect(() => validateConfig(config)).toThrow('rpc.timeout must be a positive number');
      });

      it('should throw if rpc urls are missing for a supported chain', () => {
        const config: AAWalletConfig = {
          ...validConfig,
          supportedChainIds: [42161, 1],
          rpc: {
            urls: {
              42161: ['https://arb1.arbitrum.io/rpc'],
            },
          },
        };
        expect(() => validateConfig(config)).toThrow('No RPC URLs provided for chainId 1');
      });

      it('should throw if rpc urls array is empty for a supported chain', () => {
        const config: AAWalletConfig = {
          ...validConfig,
          rpc: {
            urls: {
              42161: [],
            },
          },
        };
        expect(() => validateConfig(config)).toThrow('No RPC URLs provided for chainId 42161');
      });
    });

    describe('Fallback-related validation', () => {
      it('should cause init to fail and trigger fallback when config is invalid', () => {
        const invalidConfig = { ...validConfig, defaultChainId: undefined } as any;
        expect(() => validateConfig(invalidConfig)).toThrow();
      });

      it('should allow init to proceed when config is valid', () => {
        expect(() => validateConfig(validConfig)).not.toThrow();
      });
    });
  });
});
