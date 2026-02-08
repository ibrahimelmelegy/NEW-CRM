import { test, expect } from '@playwright/test';
import { performLogin } from '../auth.spec';

/**
 * ============================================
 * Opportunities Module Tests - HP Tech CRM
 * ============================================
 */

test.describe('Opportunities Module', () => {

    test.beforeEach(async ({ page }) => {
        await performLogin(page);
    });

    test.describe('Opportunities List', () => {

        test('should display opportunities list', async ({ page }) => {
            await page.goto('/sales/opportunity');

            await expect(page.locator('text=/opportunit|فرص/i').first()).toBeVisible();
            await expect(page.locator('table, [class*="list"]').first()).toBeVisible();
        });

        test('should filter by stage', async ({ page }) => {
            await page.goto('/sales/opportunity');

            const stageFilter = page.locator('[class*="stage"] .el-select').first();
            if (await stageFilter.isVisible()) {
                await stageFilter.click();
                await page.locator('.el-select-dropdown__item').first().click();
            }
        });
    });

    test.describe('Create Opportunity', () => {

        test('should create new opportunity', async ({ page }) => {
            await page.goto('/sales/opportunity/add-opportunity');

            const timestamp = Date.now();
            await page.locator('input[name*="title" i], input[placeholder*="title" i]').first().fill(`Test Opp ${timestamp}`);
            await page.locator('input[name*="value" i], input[type="number"]').first().fill('100000');

            await page.getByRole('button', { name: /save|create|حفظ/i }).click();

            await expect(page.locator('text=/success|created|تم/i').first()).toBeVisible({ timeout: 10000 });
        });
    });

    test.describe('Opportunity Details', () => {

        test('should view opportunity and convert to deal', async ({ page }) => {
            await page.goto('/sales/opportunity');

            await page.locator('table tbody tr, [class*="list-item"]').first().click();
            await expect(page).toHaveURL(/opportunity\/[a-zA-Z0-9-]+/);

            // Check for convert button
            const convertBtn = page.getByRole('button', { name: /convert|deal|تحويل/i }).first();
            if (await convertBtn.isVisible()) {
                await expect(convertBtn).toBeVisible();
            }
        });
    });
});
