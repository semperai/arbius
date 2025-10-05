import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}', '__tests__/**/*.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/app/**/layout.tsx',
        'src/app/**/page.tsx',
        'src/app/**/page.client.tsx',
        'src/app/api/**',
        'src/instrumentation*.ts',
        'src/lib/metadata.ts',
        'sentry.*.config.ts',
      ],
    },
    css: {
      include: /.+/,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
});
