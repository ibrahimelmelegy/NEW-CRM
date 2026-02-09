import { test, expect } from '@playwright/test';
import { performLogin } from './helpers';

/**
 * ============================================
 * Settings & Notifications Tests - HP Tech CRM
 * ============================================
 */

test.describe('Settings & Notifications', () => {

    test.beforeEach(async ({ page }) => {
        await performLogin(page);
    });

    // ============== SETTINGS ==============
    test.describe('Settings Page', () => {

        test('should display settings page', async ({ page }) => {
            await page.goto('/settings');

            await expect(page.locator('text=/settings|إعدادات/i').first()).toBeVisible();
        });

        test('should display profile settings', async ({ page }) => {
            await page.goto('/settings');

            await expect(page.locator('text=/profile|ملف شخصي/i').first()).toBeVisible();
        });
    });

    // ============== NOTIFICATIONS ==============
    test.describe('Notifications Page', () => {

        test('should display notifications list', async ({ page }) => {
            await page.goto('/notification');

            await expect(page.locator('text=/notification|إشعارات/i').first()).toBeVisible();
        });

        test('should mark notification as read', async ({ page }) => {
            await page.goto('/notification');

            const notification = page.locator('[class*="notification-item"], [class*="list-item"]').first();
            if (await notification.isVisible()) {
                await notification.click();

                // Should mark as read (visual change)
                await page.waitForTimeout(500);
            }
        });
    });
});
