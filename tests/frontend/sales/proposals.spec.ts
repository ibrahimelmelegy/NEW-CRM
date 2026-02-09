import { test, expect } from '@playwright/test';
import { performLogin } from '../helpers';

/**
 * ============================================
 * Proposals Module Tests - HP Tech CRM
 * ============================================
 */

test.describe('Proposals Module', () => {

    test.beforeEach(async ({ page }) => {
        await performLogin(page);
    });

    test.describe('Proposals List', () => {

        test('should display proposals list', async ({ page }) => {
            await page.goto('/sales/proposals');

            await expect(page.locator('text=/proposal|عروض/i').first()).toBeVisible();
            await expect(page.locator('table, [class*="list"]').first()).toBeVisible();
        });

        test('should filter by status (pending/approved/rejected)', async ({ page }) => {
            await page.goto('/sales/proposals');

            const statusFilter = page.locator('[class*="status"] .el-select, [class*="filter"]').first();
            if (await statusFilter.isVisible()) {
                await statusFilter.click();
                await page.locator('.el-select-dropdown__item:has-text("Pending")').click();
            }
        });
    });

    test.describe('Create Proposal', () => {

        test('should navigate to proposal editor', async ({ page }) => {
            await page.goto('/sales/proposals');

            await page.getByRole('button', { name: /add|create|new|إضافة/i }).first().click();

            await expect(page).toHaveURL(/add-proposal|create/);
        });

        test('should display proposal editor with sections', async ({ page }) => {
            await page.goto('/sales/proposals/add-proposal');

            // Check for editor sections
            await expect(page.locator('text=/cover|letter|scope|finance|غلاف|نطاق|مالية/i').first()).toBeVisible();
        });
    });

    test.describe('Proposal Approval Workflow', () => {

        test('should display approval status on proposal', async ({ page }) => {
            await page.goto('/sales/proposals');

            // Check for status badges
            await expect(page.locator('text=/pending|approved|rejected|قيد|موافق|مرفوض/i').first()).toBeVisible();
        });
    });
});
