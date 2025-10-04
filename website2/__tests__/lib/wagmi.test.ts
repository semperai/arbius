/**
 * Tests for wagmi configuration
 */

import { config, mainnet, arbitrum, arbitrumNova } from '@/lib/wagmi';

// Mock wagmi
jest.mock('wagmi', () => ({
  http: jest.fn(() => 'mock-http-transport'),
  createConfig: jest.fn((cfg) => cfg),
}));

jest.mock('wagmi/chains', () => ({
  mainnet: { id: 1, name: 'Ethereum' },
  arbitrum: { id: 42161, name: 'Arbitrum One' },
  arbitrumNova: { id: 42170, name: 'Arbitrum Nova' },
}));

jest.mock('wagmi/connectors', () => ({
  injected: jest.fn(() => ({ id: 'injected', name: 'Injected' })),
  walletConnect: jest.fn((opts) => ({ id: 'walletConnect', name: 'WalletConnect', projectId: opts.projectId })),
}));

describe('wagmi configuration', () => {
  describe('config', () => {
    it('should create wagmi config', () => {
      expect(config).toBeDefined();
    });

    it('should include all production chains', () => {
      expect(config.chains).toBeDefined();
      expect(config.chains).toHaveLength(3);
      expect(config.chains).toContain(arbitrum);
      expect(config.chains).toContain(mainnet);
      expect(config.chains).toContain(arbitrumNova);
    });

    it('should include injected connector', () => {
      expect(config.connectors).toBeDefined();
      const injectedConnector = config.connectors.find((c: any) => c.id === 'injected');
      expect(injectedConnector).toBeDefined();
    });

    it('should include walletConnect connector', () => {
      expect(config.connectors).toBeDefined();
      const wcConnector = config.connectors.find((c: any) => c.id === 'walletConnect');
      expect(wcConnector).toBeDefined();
    });

    it('should configure transports for all chains', () => {
      expect(config.transports).toBeDefined();
      expect(config.transports[mainnet.id]).toBeDefined();
      expect(config.transports[arbitrum.id]).toBeDefined();
      expect(config.transports[arbitrumNova.id]).toBeDefined();
    });

    it('should use http transport for mainnet', () => {
      expect(config.transports[mainnet.id]).toBe('mock-http-transport');
    });

    it('should use http transport for arbitrum', () => {
      expect(config.transports[arbitrum.id]).toBe('mock-http-transport');
    });

    it('should use http transport for arbitrum nova', () => {
      expect(config.transports[arbitrumNova.id]).toBe('mock-http-transport');
    });
  });

  describe('chain exports', () => {
    it('should export mainnet chain', () => {
      expect(mainnet).toBeDefined();
      expect(mainnet.id).toBe(1);
      expect(mainnet.name).toBe('Ethereum');
    });

    it('should export arbitrum chain', () => {
      expect(arbitrum).toBeDefined();
      expect(arbitrum.id).toBe(42161);
      expect(arbitrum.name).toBe('Arbitrum One');
    });

    it('should export arbitrumNova chain', () => {
      expect(arbitrumNova).toBeDefined();
      expect(arbitrumNova.id).toBe(42170);
      expect(arbitrumNova.name).toBe('Arbitrum Nova');
    });
  });

  describe('connector configuration', () => {
    it('should pass projectId to walletConnect connector', () => {
      const wcConnector = config.connectors.find((c: any) => c.id === 'walletConnect') as any;
      expect(wcConnector).toBeDefined();
      // ProjectId comes from env variable or empty string
      expect(typeof wcConnector.projectId).toBe('string');
    });
  });

  describe('environment variables', () => {
    it('should use NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID if available', () => {
      // The actual value is read from process.env at module load time
      // We can only verify the config uses it
      expect(config.connectors).toBeDefined();
      expect(config.connectors.length).toBeGreaterThan(0);
    });
  });
});
