import { test, expect } from '@playwright/test';

test.describe('Proposal Module (Micro-frontend Wrapper)', () => {

    test.beforeEach(async ({ page }) => {
        // 1. التوجه لصفحة اللوجن (البورت الأصلي 3060)
        await page.goto('/login', { waitUntil: 'networkidle', timeout: 60000 });

        // 2. الانتظار المرن للحقول باستخدام partial matches لضمان عدم التأثر بتغيير الـ UI البسيط
        const emailInput = page.locator('input[placeholder*="company"]');
        const passwordInput = page.locator('input[placeholder*="••"]');

        await emailInput.waitFor({ state: 'visible', timeout: 20000 });
        await emailInput.fill('admin@hp-tech.com');
        await passwordInput.fill('Heroo@1502');

        // 3. الضغط على زر الدخول والانتظار حتى استجابة السيرفر
        await page.getByRole('button', { name: /sign in/i }).click();

        // 4. الحل الجذري: ننتظر حتى يختفي مسار اللوجن تماماً من الرابط
        // ده أضمن حل في الـ Micro-frontends لضمان عبور مرحلة الـ Redirection
        await expect(page).not.toHaveURL(/.*login.*/, { timeout: 45000 });

        // تأكيد استقرار الـ Session وتحميل ملفات الـ JS في الخلفية
        await page.waitForLoadState('networkidle');
    });

    test('Loads the Proposal React Micro-frontend correctly', async ({ page }) => {
        // ننتقل لصفحة البروبوزال الأساسية
        await page.goto('/sales/proposals', { waitUntil: 'load' });

        // تصوير الصفحة فوراً للتشخيص البصري في مجلد النتائج
        await page.screenshot({ path: 'test-results/proposal-page-load.png', fullPage: true });

        // التحقق من الرابط بشكل مرن مع إعطاء وقت كافٍ للـ SPA Routing
        await expect(page).toHaveURL(/.*sales\/proposals.*/, { timeout: 30000 });

        // البحث عن أي عنوان (Title) يدل على تحميل الصفحة بنجاح
        const mainHeading = page.locator('h1, h2, h3, .title').first();
        await expect(mainHeading).toBeVisible({ timeout: 25000 });

        const text = await mainHeading.textContent();
        console.log(`✅ HPT CRM: Detected Page Title: ${text?.trim()}`);
    });

    test('Proposal Editor loads within iframe (Integration Check)', async ({ page }) => {
        // الانتقال لصفحة المحرر المعتمدة على Iframe (سيرفر بورت 3001)
        await page.goto('/sales/proposals/react-editor', { waitUntil: 'load', timeout: 60000 });

        // استراتيجية البحث المتعدد عن الـ Iframe:
        // نجرب بالـ class المخصص أولاً، وإذا فشل نبحث عن أي iframe في الصفحة
        const iframeSelector = page.locator('iframe.react-iframe, iframe').first();

        try {
            // انتظار ظهور الـ Iframe نفسه (حتى لو لسه بيحمل محتوى)
            await expect(iframeSelector).toBeVisible({ timeout: 45000 });

            // انتظار إضافي لضمان إن سيرفر الـ React (بورت 3001) بدأ يرمي HTML جوه الـ Iframe
            await page.waitForTimeout(5000);

            console.log('✅ HPT CRM: React Iframe is visible and integrated.');
        } catch (e) {
            // سكرين شوت احترافي وشامل للتشخيص في حالة الفشل
            await page.screenshot({ path: 'test-results/iframe-failure-debug.png', fullPage: true });
            console.log('❌ HPT CRM: Iframe failed to load. Check if React Server is running on port 3001');
            throw e;
        }
    });
});