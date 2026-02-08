import { test, expect } from '@playwright/test';
import { performLogin } from '../auth.spec';

/**
 * ============================================
 * Clients Module Tests - HP Tech CRM
 * ============================================
 */

test.describe('Clients Module', () => {

    test.beforeEach(async ({ page }) => {
        await performLogin(page);
    });

    test.describe('Clients List', () => {

        test('should display clients list', async ({ page }) => {
            await page.goto('/sales/clients');

            await expect(page.locator('text=/clients|عملاء/i').first()).toBeVisible();
            await expect(page.locator('table, [class*="list"]').first()).toBeVisible();
        });

        test('should search clients', async ({ page }) => {
            await page.goto('/sales/clients');

            const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="بحث"]').first();
            await searchInput.fill('test');
            await page.waitForTimeout(1000);
        });
    });

    test.describe('Create Client', () => {

        test('should create new client', async ({ page }) => {
            await page.goto('/sales/clients/add-client');

            const timestamp = Date.now();
            await page.locator('input[name*="name" i], input[placeholder*="name" i]').first().fill(`Test Client ${timestamp}`);
            await page.locator('input[type="email"]').first().fill(`client${timestamp}@example.com`);
            await page.locator('input[type="tel"], input[name*="phone" i]').first().fill('+966501234567');

            await page.getByRole('button', { name: /save|create|حفظ/i }).click();

            await expect(page.locator('text=/success|created|تم/i').first()).toBeVisible({ timeout: 10000 });
        });
    });

    test.describe('Client Details', () => {

        test('should view client details and projects', async ({ page }) => {
            await page.goto('/sales/clients');

            await page.locator('table tbody tr').first().click();
            await expect(page).toHaveURL(/clients\/[a-zA-Z0-9-]+/);

            // Check for projects/deals sections
            await expect(page.locator('text=/project|deal|مشروع|صفقة/i').first()).toBeVisible();
        });
    });
});
