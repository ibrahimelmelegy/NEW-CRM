import { defineConfig, devices } from '@playwright/test';

/**
 * ملف إعدادات Playwright الشامل لمشروع HPT CRM - إصدار الحل الجذري
 * تم توحيد البورتات وتعديل المسارات لضمان استقرار الربط بين السيرفر والتيست
 */
export default defineConfig({
    testDir: './test/e2e',
    /* زيادة الوقت الإجمالي للاختبار لتجنب التوقف المفاجئ في العمليات الثقيلة */
    timeout: 90000,
    expect: {
        timeout: 15000,
    },
    fullyParallel: false, // تم تعطيل التوازي لتقليل ضغط الرامات (4GB RAM Safe)
    workers: 1,

    /* تقارير النتائج - دعم الـ HTML والـ JSON للداشبورد */
    reporter: [
        ['html'],
        ['json', { outputFile: 'test-results/results.json' }]
    ],

    use: {
        /* التعديل الجذري: استخدام بورت 3060 لضمان الوصول للسيرفر المتاح دائمًا */
        baseURL: 'http://localhost:3060', // Reverted to 3060 as requested
        navigationTimeout: 45000,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
        headless: true,
    },

    /* إعدادات تشغيل السيرفرات تلقائياً */
    webServer: [
        {
            // 1. تشغيل الـ Backend
            command: 'cd ../leadify-backend-main && npx ts-node src/server.ts',
            port: 5000,
            reuseExistingServer: true,
            stdout: 'pipe',
            stderr: 'pipe',
            timeout: 120000,
        },
        {
            // 2. تشغيل الـ Frontend على بورت 3060 لتجنب التعارض
            command: 'npm run dev', // Removed -- --port 3000 override
            url: 'http://localhost:3060',
            reuseExistingServer: true,
            timeout: 180000,
            stdout: 'pipe',
            stderr: 'pipe',
        },
        {
            // 3. تشغيل الـ React Proposal Editor (Micro-frontend)
            command: 'cd "../React proposal" && npm run dev',
            url: 'http://localhost:3001',
            reuseExistingServer: true,
            timeout: 120000,
            stdout: 'pipe',
            stderr: 'pipe',
        }
    ],

    /* المتصفحات التي سيتم الاختبار عليها */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        }
    ],
});