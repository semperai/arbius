import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HealthCheckServer } from '../../src/services/HealthCheckServer';
import { ethers } from 'ethers';
import * as http from 'http';

/**
 * Comprehensive HealthCheckServer Tests
 *
 * Coverage Target: 95%+
 * Focus: HTTP endpoints, concurrent requests, error handling, timeouts
 */
describe('HealthCheckServer - Comprehensive', () => {
  let server: HealthCheckServer;
  let mockBlockchain: any;
  let mockJobQueue: any;
  const testPort = 13580; // Different port from basic tests
  const startupTime = Math.floor(Date.now() / 1000) - 3600;

  beforeEach(() => {
    // Reset mocks completely for each test
    vi.clearAllMocks();

    mockBlockchain = {
      getEthBalance: vi.fn().mockResolvedValue(ethers.parseEther('0.5')),
      getBalance: vi.fn().mockResolvedValue(ethers.parseEther('100')),
      getValidatorStake: vi.fn().mockResolvedValue(ethers.parseEther('50')),
      getValidatorMinimum: vi.fn().mockResolvedValue(ethers.parseEther('50')),
    } as any;

    mockJobQueue = {
      getQueueStats: vi.fn().mockReturnValue({
        total: 5,
        pending: 2,
        processing: 1,
        completed: 2,
        failed: 0,
      }),
    } as any;

    server = new HealthCheckServer(
      testPort,
      mockBlockchain,
      mockJobQueue,
      startupTime
    );
  });

  afterEach(async () => {
    await server.shutdown();
    // Add small delay to ensure port is released
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  // Helper function to wait for server to be ready
  async function waitForServer(maxAttempts = 10): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await makeRequest('/ping');
        return;
      } catch (err) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    throw new Error('Server did not start in time');
  }

  describe('HTTP Endpoints', () => {
    it('should respond to /health endpoint with healthy status', async () => {
      await server.start();
      await waitForServer();

      const response = await makeRequest('/health');

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('application/json');

      const body = JSON.parse(response.body);
      expect(body.status).toBe('healthy');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('uptime');
      expect(body).toHaveProperty('checks');
      expect(body).toHaveProperty('warnings');
    });

    it('should respond to /health endpoint with degraded status (503)', async () => {
      mockBlockchain.getEthBalance.mockResolvedValue(ethers.parseEther('0.005'));
      await server.start();
      await waitForServer();

      const response = await makeRequest('/health');

      expect(response.statusCode).toBe(503);

      const body = JSON.parse(response.body);
      expect(body.status).toBe('degraded');
    });

    it('should respond to /health endpoint with unhealthy status (503)', async () => {
      mockBlockchain.getEthBalance.mockRejectedValue(new Error('Failed'));
      mockBlockchain.getBalance.mockRejectedValue(new Error('Failed'));
      mockBlockchain.getValidatorStake.mockRejectedValue(new Error('Failed'));
      mockJobQueue.getQueueStats.mockImplementation(() => {
        throw new Error('Failed');
      });

      await server.start();
      await waitForServer();

      const response = await makeRequest('/health');

      expect(response.statusCode).toBe(503);

      const body = JSON.parse(response.body);
      expect(body.status).toBe('unhealthy');
      expect(body.warnings.length).toBeGreaterThan(0);
    });

    it('should respond to /ping endpoint', async () => {
      await server.start();
      await waitForServer();

      const response = await makeRequest('/ping');

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('text/plain');
      expect(response.body).toBe('pong');
    });

    it('should handle 404 for unknown endpoints', async () => {
      await server.start();
      await waitForServer();

      const response = await makeRequest('/unknown');

      expect(response.statusCode).toBe(404);
      expect(response.headers['content-type']).toBe('application/json');

      const body = JSON.parse(response.body);
      expect(body.error).toBe('Not found');
      expect(body.available).toEqual(['/health', '/ping']);
    });

    it('should handle OPTIONS requests (CORS preflight)', async () => {
      await server.start();
      await waitForServer();

      const response = await makeRequest('/health', 'OPTIONS');

      expect(response.statusCode).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toBe('GET, OPTIONS');
      expect(response.headers['access-control-allow-headers']).toBe('Content-Type');
    });

    it('should include CORS headers on all responses', async () => {
      await server.start();
      await waitForServer();

      const response = await makeRequest('/health');

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toBe('GET, OPTIONS');
      expect(response.headers['access-control-allow-headers']).toBe('Content-Type');
    });

    it('should handle errors during health check gracefully', async () => {
      // Mock getHealthStatus to throw an error
      const originalGetHealthStatus = server.getHealthStatus.bind(server);
      server.getHealthStatus = vi.fn().mockRejectedValue(new Error('Unexpected error'));

      await server.start();
      await waitForServer();

      const response = await makeRequest('/health');

      expect(response.statusCode).toBe(500);

      const body = JSON.parse(response.body);
      expect(body.status).toBe('unhealthy');
      expect(body.error).toBe('Unexpected error');

      // Restore original method
      server.getHealthStatus = originalGetHealthStatus;
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      await server.start();
      await waitForServer();

      const requests = [
        makeRequest('/health'),
        makeRequest('/ping'),
        makeRequest('/health'),
        makeRequest('/ping'),
        makeRequest('/health'),
      ];

      const responses = await Promise.all(requests);

      expect(responses).toHaveLength(5);
      responses.forEach((response, index) => {
        if (index % 2 === 0) {
          // /health requests
          expect(response.statusCode).toBe(200);
          expect(response.headers['content-type']).toBe('application/json');
        } else {
          // /ping requests
          expect(response.statusCode).toBe(200);
          expect(response.body).toBe('pong');
        }
      });
    });

    it('should maintain state across concurrent health checks', async () => {
      await server.start();
      await waitForServer();

      const healthRequests = Array(10).fill(null).map(() => makeRequest('/health'));

      const responses = await Promise.all(healthRequests);

      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.status).toBe('healthy');
        expect(body.checks.eth.ok).toBe(true);
        expect(body.checks.aius.ok).toBe(true);
        expect(body.checks.stake.ok).toBe(true);
        expect(body.checks.queue.ok).toBe(true);
      });
    });
  });

  describe('Error Recovery', () => {
    it('should recover from transient blockchain errors', async () => {
      let callCount = 0;
      mockBlockchain.getEthBalance.mockImplementation(() => {
        callCount++;
        if (callCount === 1) { // Only first /health call fails
          return Promise.reject(new Error('Transient error'));
        }
        return Promise.resolve(ethers.parseEther('0.5'));
      });

      await server.start();
      await waitForServer();

      // First request should show error
      const response1 = await makeRequest('/health');
      const body1 = JSON.parse(response1.body);
      expect(body1.checks.eth.ok).toBe(false);
      expect(body1.checks.eth.message).toContain('Error: Transient error');

      // Second request should succeed
      const response2 = await makeRequest('/health');
      const body2 = JSON.parse(response2.body);
      expect(body2.checks.eth.ok).toBe(true);
    });

    it('should handle AIUS balance check errors independently', async () => {
      mockBlockchain.getBalance.mockRejectedValue(new Error('AIUS error'));

      await server.start();
      await waitForServer();

      const response = await makeRequest('/health');
      const body = JSON.parse(response.body);

      expect(body.checks.aius.ok).toBe(false);
      expect(body.checks.aius.message).toContain('Error: AIUS error');
      // Other checks should still work
      expect(body.checks.eth.ok).toBe(true);
      expect(body.checks.stake.ok).toBe(true);
      expect(body.checks.queue.ok).toBe(true);
    });

    it('should handle stake check errors independently', async () => {
      mockBlockchain.getValidatorStake.mockRejectedValue(new Error('Stake error'));

      await server.start();
      await waitForServer();

      const response = await makeRequest('/health');
      const body = JSON.parse(response.body);

      expect(body.checks.stake.ok).toBe(false);
      expect(body.checks.stake.message).toContain('Error: Stake error');
      expect(body.warnings).toContain('Failed to check stake');
      // Other checks should still work
      expect(body.checks.eth.ok).toBe(true);
      expect(body.checks.aius.ok).toBe(true);
      expect(body.checks.queue.ok).toBe(true);
    });

    it('should handle queue check errors independently', async () => {
      mockJobQueue.getQueueStats.mockImplementation(() => {
        throw new Error('Queue error');
      });

      await server.start();
      await waitForServer();

      const response = await makeRequest('/health');
      const body = JSON.parse(response.body);

      expect(body.checks.queue.ok).toBe(false);
      expect(body.checks.queue.message).toContain('Error: Queue error');
      expect(body.warnings).toContain('Failed to check queue');
      // Other checks should still work
      expect(body.checks.eth.ok).toBe(true);
      expect(body.checks.aius.ok).toBe(true);
      expect(body.checks.stake.ok).toBe(true);
    });
  });

  describe('Response Validation', () => {
    it('should return valid JSON with proper formatting', async () => {
      await server.start();
      await waitForServer();

      const response = await makeRequest('/health');

      expect(() => JSON.parse(response.body)).not.toThrow();

      const body = JSON.parse(response.body);
      expect(body).toMatchObject({
        status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
        timestamp: expect.any(Number),
        uptime: expect.any(Number),
        checks: {
          eth: expect.objectContaining({ ok: expect.any(Boolean) }),
          aius: expect.objectContaining({ ok: expect.any(Boolean) }),
          stake: expect.objectContaining({ ok: expect.any(Boolean) }),
          queue: expect.objectContaining({ ok: expect.any(Boolean) }),
        },
        warnings: expect.any(Array),
      });
    });

    it('should include proper timestamp in health response', async () => {
      await server.start();
      await waitForServer();

      const beforeRequest = Math.floor(Date.now() / 1000);
      const response = await makeRequest('/health');
      const afterRequest = Math.floor(Date.now() / 1000);

      const body = JSON.parse(response.body);

      expect(body.timestamp).toBeGreaterThanOrEqual(beforeRequest);
      expect(body.timestamp).toBeLessThanOrEqual(afterRequest);
    });

    it('should calculate uptime correctly', async () => {
      await server.start();
      await waitForServer();

      const response = await makeRequest('/health');
      const body = JSON.parse(response.body);

      const expectedUptime = Math.floor(Date.now() / 1000) - startupTime;

      expect(body.uptime).toBeGreaterThanOrEqual(expectedUptime - 1);
      expect(body.uptime).toBeLessThanOrEqual(expectedUptime + 1);
    });
  });

  describe('Server Lifecycle', () => {
    it('should start server and listen on correct port', async () => {
      await server.start();
      await waitForServer();

      // Verify server is listening by making a request
      const response = await makeRequest('/ping');
      expect(response.statusCode).toBe(200);
    });

    it('should shutdown gracefully', async () => {
      await server.start();
      await waitForServer();

      // Verify server is running
      const response1 = await makeRequest('/ping');
      expect(response1.statusCode).toBe(200);

      // Shutdown
      await server.shutdown();

      // Verify server is no longer accepting requests
      await expect(makeRequest('/ping')).rejects.toThrow();
    });

    it('should handle shutdown when server is not started', async () => {
      // Should not throw error
      await expect(server.shutdown()).resolves.toBeUndefined();
    });

    it('should handle multiple shutdown calls', async () => {
      await server.start();
      await waitForServer();

      await server.shutdown();
      await server.shutdown(); // Second shutdown should not error

      await expect(makeRequest('/ping')).rejects.toThrow();
    });
  });

  // Helper function to make HTTP requests
  function makeRequest(path: string, method: string = 'GET'): Promise<{
    statusCode: number;
    headers: http.IncomingHttpHeaders;
    body: string;
  }> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: testPort,
        path,
        method,
      };

      const req = http.request(options, (res) => {
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers,
            body,
          });
        });
      });

      req.on('error', reject);
      req.end();
    });
  }
});
