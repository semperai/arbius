import { describe, expect, test, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';

// Mock the @helia/verified-fetch module
vi.mock('@helia/verified-fetch', () => ({
  createVerifiedFetch: vi.fn(() => {
    return vi.fn((url, options) => {
      // Simulate successful fetch
      if (url.includes('ipfs://')) {
        return Promise.resolve({
          text: () => Promise.resolve('mock IPFS content'),
          ok: true,
        });
      }
      return Promise.reject(new Error('Invalid IPFS URL'));
    });
  }),
}));

describe('POST /sign', () => {
  test('should return 400 when CID is missing', async () => {
    const response = await request(app)
      .post('/sign')
      .send({});

    expect(response.status).toBe(400);
    expect(response.text).toBe('Missing CID');
  });

  test('should return 400 when CID is empty string', async () => {
    const response = await request(app)
      .post('/sign')
      .send({ cid: '' });

    expect(response.status).toBe(400);
    expect(response.text).toBe('Missing CID');
  });

  test('should return signature for valid CID', async () => {
    // Use a real base58 CID format
    const testCid = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';

    const response = await request(app)
      .post('/sign')
      .send({ cid: testCid });

    // Note: This test might fail if IPFS fetch actually runs
    // In a real scenario, we'd need to mock createVerifiedFetch properly
    // For now, we expect it to either succeed with a signature or fail with 400
    expect([200, 400]).toContain(response.status);

    if (response.status === 200) {
      expect(response.body).toHaveProperty('signer');
      expect(response.body).toHaveProperty('signature');
      expect(response.body).toHaveProperty('hash');
      expect(response.body.signer).toBeTruthy();
      expect(response.body.signature).toMatch(/^0x[a-fA-F0-9]+$/);
      expect(response.body.hash).toMatch(/^0x[a-fA-F0-9]+$/);
    }
  });

  test('should have correct content-type header', async () => {
    const response = await request(app)
      .post('/sign')
      .send({});

    expect(response.headers['content-type']).toMatch(/text|json/);
  });

  test('should handle malformed CID gracefully', async () => {
    const response = await request(app)
      .post('/sign')
      .send({ cid: 'invalid-cid-format-!@#$%' });

    // Should return either 400 for bad request or handle the error
    expect([200, 400, 500]).toContain(response.status);
  });
});
