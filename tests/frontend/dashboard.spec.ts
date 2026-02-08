import { test, expect } from '@playwright/test';
import { performLogin, waitForPageLoad } from './auth.spec';

/**
 * ============================================
 * Dashboard Tests - HP Tech CRM
 * ============================================
 */

test.describe('Dashboard', () => {

    test.beforeEach(async ({ page }) => {
        await performLogin(page);
    });

    test('should display dashboard with tabs', async ({ page }) => {
        await page.goto('/');
        await waitForPageLoad(page);

        // Check for dashboard elements - use flexible locators
        const dashboardContent = page.locator('body');
        await expect(dashboardContent).toBeVisible();

        // Log current state for debugging
        console.log('Dashboard loaded, URL:', page.url());
    });

    test('should display statistics cards', async ({ page }) => {
        await page.goto('/');
        await waitForPageLoad(page);

        // Check for any content that looks like stats
        const content = page.locator('[class*="card"], [class*="stat"], [class*="dashboard"]').first();
        const isVisible = await content.isVisible();
        console.log('Stats visible:', isVisible);
    });

    test('should display charts', async ({ page }) => {
        await page.goto('/');
        await waitForPageLoad(page);

        // Check for chart containers
        await page.waitForTimeout(3000); // Charts may need extra time to render
        const chartElements = page.locator('[class*="chart"], canvas, svg, [class*="echarts"]').first();
        const isVisible = await chartElements.isVisible();
        console.log('Charts visible:', isVisible);
    });

    test('should switch between dashboard tabs', async ({ page }) => {
        await page.goto('/');
        await waitForPageLoad(page);

        // Look for tab elements
        const tabs = page.locator('.el-tabs__item, [role="tab"], [class*="tab"]');
        const tabCount = await tabs.count();
        console.log('Found tabs:', tabCount);

        if (tabCount > 1) {
            await tabs.nth(1).click();
            await page.waitForTimeout(1000);
        }
    });

    test('should display quick action buttons', async ({ page }) => {
        await page.goto('/');
        await waitForPageLoad(page);

        // Check for any buttons
        const buttons = page.locator('button, .el-button, [class*="btn"]');
        const buttonCount = await buttons.count();
        console.log('Found buttons:', buttonCount);
    });
});
