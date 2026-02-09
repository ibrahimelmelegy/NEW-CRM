import { test, expect } from '@playwright/test';
import { performLogin } from './helpers';

/**
 * ============================================
 * Staff & Roles Tests - HP Tech CRM
 * ============================================
 */

test.describe('Staff & Roles Module', () => {

    test.beforeEach(async ({ page }) => {
        await performLogin(page);
    });

    // ============== STAFF ==============
    test.describe('Staff Management', () => {

        test('should display staff list', async ({ page }) => {
            await page.goto('/staff');

            await expect(page.locator('text=/staff|موظفين|فريق/i').first()).toBeVisible();
            await expect(page.locator('table, [class*="list"]').first()).toBeVisible();
        });

        test('should search staff', async ({ page }) => {
            await page.goto('/staff');

            const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="بحث"]').first();
            await searchInput.fill('admin');
            await page.waitForTimeout(1000);
        });

        test('should create new staff member', async ({ page }) => {
            await page.goto('/staff/add-staff');

            const timestamp = Date.now();
            await page.locator('input[name*="name" i]').first().fill(`Staff ${timestamp}`);
            await page.locator('input[type="email"]').first().fill(`staff${timestamp}@example.com`);
            await page.locator('input[type="password"]').first().fill('Test123456!');

            await page.getByRole('button', { name: /save|create|حفظ/i }).click();

            await expect(page.locator('text=/success|created|تم/i').first()).toBeVisible({ timeout: 10000 });
        });

        test('should view staff details', async ({ page }) => {
            await page.goto('/staff');

            await page.locator('table tbody tr').first().click();
            await expect(page).toHaveURL(/staff\/[a-zA-Z0-9-]+/);
        });
    });

    // ============== ROLES ==============
    test.describe('Roles & Permissions', () => {

        test('should display roles list', async ({ page }) => {
            await page.goto('/roles');

            await expect(page.locator('text=/roles|صلاحيات|أدوار/i').first()).toBeVisible();
        });

        test('should create new role', async ({ page }) => {
            await page.goto('/roles/add-role');

            const timestamp = Date.now();
            await page.locator('input[name*="name" i]').first().fill(`Role_${timestamp}`);

            // Select some permissions
            const permissionCheckbox = page.locator('input[type="checkbox"]').first();
            if (await permissionCheckbox.isVisible()) {
                await permissionCheckbox.check();
            }

            await page.getByRole('button', { name: /save|create|حفظ/i }).click();

            await expect(page.locator('text=/success|created|تم/i').first()).toBeVisible({ timeout: 10000 });
        });

        test('should edit role permissions', async ({ page }) => {
            await page.goto('/roles');

            const roleRow = page.locator('table tbody tr').first();
            if (await roleRow.isVisible()) {
                await roleRow.click();

                // Check for permission checkboxes
                await expect(page.locator('input[type="checkbox"]').first()).toBeVisible();
            }
        });
    });
});
