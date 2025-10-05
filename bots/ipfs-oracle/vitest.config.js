import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js', '__tests__/**/*.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.js'],
      exclude: ['src/**/*.test.js', '**/node_modules/**'],
    },
    setupFiles: ['./tests/setup.js'],
  },
});
