import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { HealthCheckServer } from '../../src/services/HealthCheckServer';
import { ethers } from 'ethers';
import * as http from 'http';

describe('HealthCheckServer', () => {
  let server: HealthCheckServer;
  let mockBlockchain: any;
  let mockJobQueue: any;
  const testPort = 13579; // Use non-standard port for testing
  const startupTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

  beforeEach(() => {
    mockBlockchain = {
      getEthBalance: jest.fn(),
      getBalance: jest.fn(),
      getValidatorStake: jest.fn(),
      getValidatorMinimum: jest.fn(),
    } as any;

    mockBlockchain.getEthBalance.mockResolvedValue(ethers.parseEther('0.5'));
    mockBlockchain.getBalance.mockResolvedValue(ethers.parseEther('100'));
    mockBlockchain.getValidatorStake.mockResolvedValue(ethers.parseEther('50'));
    mockBlockchain.getValidatorMinimum.mockResolvedValue(ethers.parseEther('50'));

    mockJobQueue = {
      getQueueStats: jest.fn(),
    } as any;

    mockJobQueue.getQueueStats.mockReturnValue({
      total: 5,
      pending: 2,
      processing: 1,
      completed: 2,
      failed: 0,
    });

    server = new HealthCheckServer(
      testPort,
      mockBlockchain,
      mockJobQueue,
      startupTime
    );
  });

  afterEach(async () => {
    await server.shutdown();
  });

  describe('Health Status', () => {
    it('should return healthy status when all checks pass', async () => {
      const health = await server.getHealthStatus();

      expect(health.status).toBe('healthy');
      expect(health.checks.eth.ok).toBe(true);
      expect(health.checks.aius.ok).toBe(true);
      expect(health.checks.stake.ok).toBe(true);
      expect(health.checks.queue.ok).toBe(true);
      expect(health.warnings).toHaveLength(0);
    });

    it('should return degraded status when some checks fail', async () => {
      mockBlockchain.getEthBalance.mockResolvedValue(ethers.parseEther('0.005')); // Low

      const health = await server.getHealthStatus();

      expect(health.status).toBe('degraded');
      expect(health.checks.eth.ok).toBe(false);
      expect(health.warnings).toContain('Low ETH balance');
    });

    it('should detect low ETH balance', async () => {
      mockBlockchain.getEthBalance.mockResolvedValue(ethers.parseEther('0.005'));

      const health = await server.getHealthStatus();

      expect(health.checks.eth.ok).toBe(false);
      expect(health.checks.eth.message).toBe('Low ETH (need gas for transactions)');
      expect(health.warnings).toContain('Low ETH balance');
    });

    it('should detect low AIUS balance', async () => {
      mockBlockchain.getBalance.mockResolvedValue(ethers.parseEther('0.5'));

      const health = await server.getHealthStatus();

      expect(health.checks.aius.ok).toBe(false);
      expect(health.checks.aius.message).toBe('Low AIUS balance');
      expect(health.warnings).toContain('Low AIUS balance');
    });

    it('should detect insufficient stake', async () => {
      mockBlockchain.getValidatorStake.mockResolvedValue(ethers.parseEther('10'));
      mockBlockchain.getValidatorMinimum.mockResolvedValue(ethers.parseEther('50'));

      const health = await server.getHealthStatus();

      expect(health.checks.stake.ok).toBe(false);
      expect(health.checks.stake.message).toBe('Not staked enough for validation');
      expect(health.warnings).toContain('Insufficient stake');
    });

    it('should detect high queue load', async () => {
      mockJobQueue.getQueueStats.mockReturnValue({
        total: 15,
        pending: 5,
        processing: 10, // High load
        completed: 0,
        failed: 0,
      });

      const health = await server.getHealthStatus();

      expect(health.checks.queue.ok).toBe(false);
      expect(health.checks.queue.message).toBe('High queue processing load');
      expect(health.warnings).toContain('Queue overloaded');
    });

    it('should include uptime in status', async () => {
      const health = await server.getHealthStatus();

      expect(health.uptime).toBeGreaterThan(3500); // ~1 hour
      expect(health.uptime).toBeLessThan(3700);
    });

    it('should include balance values', async () => {
      const health = await server.getHealthStatus();

      expect(health.checks.eth.balance).toBe('0.5');
      expect(health.checks.aius.balance).toBe('100.0');
      expect(health.checks.stake.staked).toBe('50.0');
      expect(health.checks.stake.minimum).toBe('50.0');
    });

    it('should include queue statistics', async () => {
      const health = await server.getHealthStatus();

      expect(health.checks.queue.stats).toEqual({
        total: 5,
        pending: 2,
        processing: 1,
        completed: 2,
        failed: 0,
      });
    });

    it('should handle blockchain errors gracefully', async () => {
      mockBlockchain.getEthBalance.mockRejectedValue(new Error('Network error'));

      const health = await server.getHealthStatus();

      expect(health.checks.eth.ok).toBe(false);
      expect(health.checks.eth.message).toContain('Error: Network error');
      expect(health.warnings).toContain('Failed to check ETH balance');
    });

    it('should return unhealthy when all checks fail', async () => {
      mockBlockchain.getEthBalance.mockRejectedValue(new Error('Failed'));
      mockBlockchain.getBalance.mockRejectedValue(new Error('Failed'));
      mockBlockchain.getValidatorStake.mockRejectedValue(new Error('Failed'));
      mockJobQueue.getQueueStats.mockImplementation(() => {
        throw new Error('Failed');
      });

      const health = await server.getHealthStatus();

      expect(health.status).toBe('unhealthy');
      expect(health.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Server Lifecycle', () => {
    it('should start and shutdown cleanly', async () => {
      await server.start();
      expect(server).toBeDefined();

      await server.shutdown();
      expect(server).toBeDefined();
    });
  });
});
