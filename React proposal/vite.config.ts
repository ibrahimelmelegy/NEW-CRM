import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3001,
        strictPort: true, // 🚀 Port for Proposal server - MUST be 3001 for iframe integration
        host: '0.0.0.0',  // 🚀 يفتح السيرفر لكل الشبكة الداخلية عشان النكست يشوفه
        cors: true,       // 🚀 أهم سطر: يسمح للنكست بسحب البيانات بدون Error
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:5000',
                changeOrigin: true,
                secure: false,
            },
            '/assets': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
});