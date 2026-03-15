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
      include: ['composables/**/*.ts', 'utils/**/*.ts', 'stores/**/*.ts'],
      exclude: [
        'node_modules',
        '.nuxt',
        'tests/**',
        '**/*.d.ts',
        '**/*.spec.ts',
        '**/*.test.ts',
        'components/**'
      ],
      // Coverage thresholds - Phase 3.3 target: 60%+
      thresholds: {
        statements: 15,
        branches: 15,
        functions: 15,
        lines: 15
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
