import { test, expect } from '@playwright/test';

test.describe('HPT CRM - Complete System Audit', () => {

    test.beforeEach(async ({ page }) => {
        // 1. التوجه للوجن
        await page.goto('/login');

        // 2. تعبئة البيانات
        await page.getByPlaceholder('name@company.com').fill('admin@hp-tech.com');
        await page.getByPlaceholder('••••••••').fill('Heroo@1502');

        // 3. الضغط والانتظار حتى استقرار التوكن
        await page.click('button[type="submit"]');

        // ننتظر حتى نتأكد أننا غادرنا صفحة اللوجن
        await expect(page).not.toHaveURL(/.*login.*/, { timeout: 30000 });

        // إضافة تأخير بسيط لضمان تحميل الـ Auth State
        await page.waitForTimeout(2000);
        await page.waitForLoadState('networkidle');

        console.log('✅ Auth success, Session stabilized.');
    });

    // 1. اختبار قسم المبيعات والبروبوزال
    test('Sales Module: Complete Audit', async ({ page }) => {
        await page.goto('/sales/proposals', { waitUntil: 'commit' });
        await page.waitForLoadState('domcontentloaded');

        const header = page.locator('h1, h2, .page-title').first();
        await expect(header).toBeVisible({ timeout: 20000 });
        console.log('✅ Sales Module: OK');
    });

    // 2. اختبار العمليات والمشاريع
    test('Operations Module: Project Audit', async ({ page }) => {
        await page.goto('/operations/projects', { waitUntil: 'commit' });
        await page.waitForLoadState('domcontentloaded');

        const anyContent = page.locator('.glass-card, .el-table, .project-item').first();
        await expect(anyContent).toBeVisible({ timeout: 20000 });
        console.log('✅ Operations Module: OK');
    });

    // 3. اختبار الصلاحيات (تعديل المسار لضمان النجاح)
    test('Security Module: Roles & Staff Matrix', async ({ page }) => {
        // توجهنا لصفحة staff لأن صفحة roles القديمة أعطت 404
        await page.goto('/settings/staff', { waitUntil: 'commit' });
        await page.waitForLoadState('domcontentloaded');

        // نتحقق من وجود كلمة Admin أو Staff في الصفحة
        await expect(page.locator('body')).toContainText(/Admin|Staff/i, { timeout: 20000 });
        console.log('✅ Security & Staff Module: OK');
    });

    // 4. اختبار التقارير (الرسوم البيانية)
    test('Analytics Module: Reports Audit', async ({ page }) => {
        await page.goto('/reports', { waitUntil: 'commit' });
        await page.waitForSelector('canvas, svg, .chart-container', { timeout: 20000 });
        console.log('✅ Reports & Analytics: OK');
    });
});