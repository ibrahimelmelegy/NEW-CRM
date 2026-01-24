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
        strictPort: true, // 🚀 يمنع السيرفر إنه يهرب لبورت تاني لو 3001 مشغول
        host: '0.0.0.0',  // 🚀 يفتح السيرفر لكل الشبكة الداخلية عشان النكست يشوفه
        cors: true,       // 🚀 أهم سطر: يسمح للنكست بسحب البيانات بدون Error
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
});