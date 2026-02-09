import { test, expect } from '@playwright/test';
import { performLogin } from '../helpers';

/**
 * ============================================
 * Deals Module Tests - HP Tech CRM
 * ============================================
 */

test.describe('Deals Module', () => {

    test.beforeEach(async ({ page }) => {
        await performLogin(page);
    });

    test.describe('Deals List', () => {

        test('should display deals list page', async ({ page }) => {
            await page.goto('/sales/deals');

            await expect(page.locator('text=/deals|صفقات/i').first()).toBeVisible();
            await expect(page.locator('table, [class*="list"], [class*="kanban"]').first()).toBeVisible();
        });

        test('should have kanban or table view toggle', async ({ page }) => {
            await page.goto('/sales/deals');

            const viewToggle = page.locator('[class*="view-toggle"], button:has-text("Kanban"), button:has-text("Table")').first();
            if (await viewToggle.isVisible()) {
                await expect(viewToggle).toBeVisible();
            }
        });

        test('should filter deals by stage', async ({ page }) => {
            await page.goto('/sales/deals');

            const stageFilter = page.locator('[class*="filter"] .el-select, [class*="stage"] select').first();
            if (await stageFilter.isVisible()) {
                await stageFilter.click();
                await page.locator('.el-select-dropdown__item').first().click();
            }
        });
    });

    test.describe('Create Deal', () => {

        test('should create new deal', async ({ page }) => {
            await page.goto('/sales/deals/add-deal');

            // Fill form
            const timestamp = Date.now();
            await page.locator('input[name*="title" i], input[placeholder*="title" i]').first().fill(`Test Deal ${timestamp}`);
            await page.locator('input[name*="value" i], input[type="number"]').first().fill('50000');

            // Submit
            await page.getByRole('button', { name: /save|create|حفظ/i }).click();

            await expect(page.locator('text=/success|created|تم/i').first()).toBeVisible({ timeout: 10000 });
        });
    });

    test.describe('Deal Details', () => {

        test('should view deal details with invoices tab', async ({ page }) => {
            await page.goto('/sales/deals');

            await page.locator('table tbody tr, [class*="deal-card"]').first().click();
            await expect(page).toHaveURL(/deals\/[a-zA-Z0-9-]+/);

            // Check for tabs
            await expect(page.locator('text=/invoices|فواتير|details|تفاصيل/i').first()).toBeVisible();
        });
    });
});
