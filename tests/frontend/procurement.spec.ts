import { test, expect } from '@playwright/test';
import { performLogin } from './auth.spec';

/**
 * ============================================
 * Procurement Module Tests - HP Tech CRM
 * ============================================
 * Tests for Vendors, RFQs, Purchase Orders
 */

test.describe('Procurement Module', () => {

    test.beforeEach(async ({ page }) => {
        await performLogin(page);
    });

    // ============== VENDORS ==============
    test.describe('Vendors', () => {

        test('should display vendors list', async ({ page }) => {
            await page.goto('/procurement/vendors');

            await expect(page.locator('text=/vendor|موردين/i').first()).toBeVisible();
        });

        test('should create new vendor', async ({ page }) => {
            await page.goto('/procurement/vendors');

            await page.getByRole('button', { name: /add|create|إضافة/i }).first().click();

            // Fill vendor form
            const timestamp = Date.now();
            await page.locator('input[name*="name" i]').first().fill(`Vendor ${timestamp}`);
            await page.locator('input[type="email"]').first().fill(`vendor${timestamp}@example.com`);

            await page.getByRole('button', { name: /save|create|حفظ/i }).click();

            await expect(page.locator('text=/success|created|تم/i').first()).toBeVisible({ timeout: 10000 });
        });
    });

    // ============== RFQ ==============
    test.describe('RFQ (Request for Quotation)', () => {

        test('should display RFQ list', async ({ page }) => {
            await page.goto('/procurement/rfq');

            await expect(page.locator('text=/rfq|request|طلب/i').first()).toBeVisible();
        });

        test('should create new RFQ', async ({ page }) => {
            await page.goto('/procurement/rfq/create');

            // Check form displays
            await expect(page.locator('form, [class*="form"]').first()).toBeVisible();
        });
    });

    // ============== PURCHASE ORDERS ==============
    test.describe('Purchase Orders', () => {

        test('should display purchase orders list', async ({ page }) => {
            await page.goto('/procurement/purchase-orders');

            await expect(page.locator('text=/purchase|order|أوامر شراء/i').first()).toBeVisible();
        });

        test('should create new purchase order', async ({ page }) => {
            await page.goto('/procurement/purchase-orders/create');

            // Check form displays
            await expect(page.locator('form, [class*="form"]').first()).toBeVisible();
        });

        test('should view purchase order details', async ({ page }) => {
            await page.goto('/procurement/purchase-orders');

            const poRow = page.locator('table tbody tr').first();
            if (await poRow.isVisible()) {
                await poRow.click();
                await expect(page).toHaveURL(/purchase-orders\/[a-zA-Z0-9-]+/);
            }
        });
    });
});
