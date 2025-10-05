import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { autoStart, main, app } from '../src/index.js';

describe('autoStart function', () => {
  let originalEnv;
  let server;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    if (server && server.close) {
      server.close();
    }
  });

  test('should not start when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';

    // Spy on app.listen to verify it's not called
    const listenSpy = vi.spyOn(app, 'listen');

    autoStart();

    expect(listenSpy).not.toHaveBeenCalled();

    listenSpy.mockRestore();
  });

  test('should start when NODE_ENV is production', async () => {
    process.env.NODE_ENV = 'production';

    // Mock app.listen to avoid actually starting a server
    const listenSpy = vi.spyOn(app, 'listen').mockImplementation((port, callback) => {
      if (callback) callback();
      return { close: vi.fn() };
    });

    await autoStart();

    expect(listenSpy).toHaveBeenCalled();

    listenSpy.mockRestore();
  });
});
