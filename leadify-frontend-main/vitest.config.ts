import path from 'path';
import { defineConfig } from 'vitest/config';
import Vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [Vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', '.nuxt', 'dist'],
    alias: {
      '@': path.resolve(__dirname, './'),
      '~': path.resolve(__dirname, './')
    },
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: [
        'composables/**/*.ts',
        'utils/**/*.ts',
        'components/**/*.vue'
      ],
      exclude: [
        'node_modules',
        '.nuxt',
        'tests/**',
        '**/*.d.ts',
        '**/*.spec.ts',
        '**/*.test.ts'
      ],
      // Coverage thresholds - Phase 2.3 baseline
      // Target: 20% composables coverage (up from 2.9%)
      // Critical files (useApiFetch, useApiCache) at 95%+
      thresholds: {
        statements: 4,
        branches: 5,
        functions: 3,
        lines: 4
      }
    },
    // Test timeout
    testTimeout: 10000,
    // Retry failed tests
    retry: 1
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '~': path.resolve(__dirname, './')
    }
  }
});
