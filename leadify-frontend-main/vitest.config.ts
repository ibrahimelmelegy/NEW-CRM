import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'url';
import path from 'path';

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    plugins: [vue()],
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: ['./test/setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
        },
        include: ['test/**/*.test.ts'],
        ui: true,
        api: {
            port: 51204,
        },
        server: {
            deps: {
                inline: ['nuxt-icon']
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
            '~': path.resolve(__dirname, './'),
            '#imports': path.resolve(__dirname, './test/mocks/nuxt-imports.ts'),
            '#app': path.resolve(__dirname, './test/mocks/nuxt-app.ts'),
        },
    },
});
