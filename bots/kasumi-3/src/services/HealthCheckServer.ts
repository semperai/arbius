import * as http from 'http';
import { log } from '../log';
import { BlockchainService } from './BlockchainService';
import { JobQueue } from './JobQueue';
import { ethers } from 'ethers';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  uptime: number;
  checks: {
    eth: { ok: boolean; balance?: string; message?: string };
    aius: { ok: boolean; balance?: string; message?: string };
    stake: { ok: boolean; staked?: string; minimum?: string; message?: string };
    queue: { ok: boolean; stats?: any; message?: string };
  };
  warnings: string[];
}

export class HealthCheckServer {
  private server: http.Server | null = null;
  private port: number;
  private blockchain: BlockchainService;
  private jobQueue: JobQueue;
  private startupTime: number;

  constructor(
    port: number,
    blockchain: BlockchainService,
    jobQueue: JobQueue,
    startupTime: number
  ) {
    this.port = port;
    this.blockchain = blockchain;
    this.jobQueue = jobQueue;
    this.startupTime = startupTime;
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const warnings: string[] = [];
    const checks: HealthStatus['checks'] = {
      eth: { ok: false },
      aius: { ok: false },
      stake: { ok: false },
      queue: { ok: false }
    };

    try {
      // Check ETH balance
      const ethBalance = await this.blockchain.getEthBalance();
      const ethBalanceFormatted = ethers.formatEther(ethBalance);
      checks.eth.balance = ethBalanceFormatted;

      if (ethBalance > ethers.parseEther('0.01')) {
        checks.eth.ok = true;
        checks.eth.message = 'Sufficient gas';
      } else {
        checks.eth.message = 'Low ETH (need gas for transactions)';
        warnings.push('Low ETH balance');
      }
    } catch (err: any) {
      checks.eth.message = `Error: ${err.message}`;
      warnings.push('Failed to check ETH balance');
    }

    try {
      // Check AIUS balance
      const aiusBalance = await this.blockchain.getBalance();
      const aiusBalanceFormatted = ethers.formatEther(aiusBalance);
      checks.aius.balance = aiusBalanceFormatted;

      if (aiusBalance > ethers.parseEther('1')) {
        checks.aius.ok = true;
        checks.aius.message = 'Sufficient AIUS';
      } else {
        checks.aius.message = 'Low AIUS balance';
        warnings.push('Low AIUS balance');
      }
    } catch (err: any) {
      checks.aius.message = `Error: ${err.message}`;
      warnings.push('Failed to check AIUS balance');
    }

    try {
      // Check validator stake
      const validatorStaked = await this.blockchain.getValidatorStake();
      const validatorMinimum = await this.blockchain.getValidatorMinimum();
      const stakedFormatted = ethers.formatEther(validatorStaked);
      const minimumFormatted = ethers.formatEther(validatorMinimum);

      checks.stake.staked = stakedFormatted;
      checks.stake.minimum = minimumFormatted;

      if (validatorStaked >= validatorMinimum) {
        checks.stake.ok = true;
        checks.stake.message = 'Staked enough for validation';
      } else {
        checks.stake.message = 'Not staked enough for validation';
        warnings.push('Insufficient stake');
      }
    } catch (err: any) {
      checks.stake.message = `Error: ${err.message}`;
      warnings.push('Failed to check stake');
    }

    try {
      // Check queue health
      const queueStats = this.jobQueue.getQueueStats();
      checks.queue.stats = queueStats;

      if (queueStats.processing < 10) {
        checks.queue.ok = true;
        checks.queue.message = 'Queue healthy';
      } else {
        checks.queue.message = 'High queue processing load';
        warnings.push('Queue overloaded');
      }
    } catch (err: any) {
      checks.queue.message = `Error: ${err.message}`;
      warnings.push('Failed to check queue');
    }

    // Determine overall status
    const allOk = Object.values(checks).every(check => check.ok);
    const anyOk = Object.values(checks).some(check => check.ok);

    let status: HealthStatus['status'];
    if (allOk) {
      status = 'healthy';
    } else if (anyOk) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      timestamp: Math.floor(Date.now() / 1000),
      uptime: Math.floor(Date.now() / 1000) - this.startupTime,
      checks,
      warnings
    };
  }

  async start(): Promise<void> {
    this.server = http.createServer(async (req, res) => {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      if (req.url === '/health' && req.method === 'GET') {
        try {
          const health = await this.getHealthStatus();

          // Return 200 for healthy, 503 for degraded/unhealthy
          const statusCode = health.status === 'healthy' ? 200 : 503;

          res.writeHead(statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(health, null, 2));
        } catch (err: any) {
          log.error(`Health check error: ${err.message}`);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'unhealthy',
            error: err.message
          }));
        }
      } else if (req.url === '/ping' && req.method === 'GET') {
        // Simple ping endpoint
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('pong');
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Not found',
          available: ['/health', '/ping']
        }));
      }
    });

    this.server.listen(this.port, () => {
      log.info(`Health check server listening on port ${this.port}`);
      log.info(`Health endpoint: http://localhost:${this.port}/health`);
      log.info(`Ping endpoint: http://localhost:${this.port}/ping`);
    });
  }

  async shutdown(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          log.info('Health check server shut down');
          resolve();
        });
      });
    }
  }
}
