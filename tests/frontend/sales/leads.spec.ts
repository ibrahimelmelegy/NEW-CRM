import { test, expect } from '@playwright/test';
import { performLogin } from '../auth.spec';

/**
 * ============================================
 * Leads Module Tests - HP Tech CRM
 * ============================================
 * Comprehensive tests for Leads CRUD operations
 */

test.describe('Leads Module', () => {

    test.beforeEach(async ({ page }) => {
        await performLogin(page);
    });

    test.describe('Leads List Page', () => {

        test('should display leads list page', async ({ page }) => {
            await page.goto('/sales/leads');

            // Check page loaded correctly
            await expect(page.locator('text=/leads|العملاء المحتملين/i').first()).toBeVisible();

            // Check table or list exists
            await expect(page.locator('table, [class*="list"], [class*="table"]').first()).toBeVisible();
        });

        test('should have "Add Lead" button', async ({ page }) => {
            await page.goto('/sales/leads');

            const addButton = page.getByRole('button', { name: /add|create|new|إضافة|جديد/i }).first();
            await expect(addButton).toBeVisible();
        });

        test('should display search/filter functionality', async ({ page }) => {
            await page.goto('/sales/leads');

            // Check for search input
            await expect(page.locator('input[placeholder*="search" i], input[placeholder*="بحث"]').first()).toBeVisible();
        });

        test('should filter leads by status', async ({ page }) => {
            await page.goto('/sales/leads');

            // Find status filter dropdown
            const statusFilter = page.locator('[class*="filter"] select, [class*="status"] .el-select').first();
            if (await statusFilter.isVisible()) {
                await statusFilter.click();
                await page.locator('.el-select-dropdown__item').first().click();

                // Wait for table to reload
                await page.waitForTimeout(1000);
                await expect(page.locator('table, [class*="list"]').first()).toBeVisible();
            }
        });

        test('should paginate leads list', async ({ page }) => {
            await page.goto('/sales/leads');

            // Check for pagination
            const pagination = page.locator('[class*="pagination"], .el-pagination').first();
            if (await pagination.isVisible()) {
                // Click next page
                await page.locator('[class*="pagination"] button:has-text("Next"), .el-pagination .btn-next').first().click();
                await page.waitForTimeout(1000);
            }
        });
    });

    test.describe('Create Lead', () => {

        test('should navigate to create lead page', async ({ page }) => {
            await page.goto('/sales/leads');

            await page.getByRole('button', { name: /add|create|new|إضافة|جديد/i }).first().click();

            await expect(page).toHaveURL(/add-lead|create|new/);
        });

        test('should display create lead form', async ({ page }) => {
            await page.goto('/sales/leads/add-lead');

            // Check form fields
            await expect(page.locator('input[name*="name" i], input[placeholder*="name" i]').first()).toBeVisible();
            await expect(page.locator('input[type="email"]').first()).toBeVisible();
            await expect(page.locator('input[type="tel"], input[name*="phone" i]').first()).toBeVisible();
        });

        test('should show validation errors on empty submit', async ({ page }) => {
            await page.goto('/sales/leads/add-lead');

            // Submit without filling
            await page.getByRole('button', { name: /save|submit|حفظ|إنشاء/i }).click();

            // Should show validation errors
            await expect(page.locator('text=/required|مطلوب/i').first()).toBeVisible({ timeout: 5000 });
        });

        test('should create new lead successfully', async ({ page }) => {
            await page.goto('/sales/leads/add-lead');

            // Fill form with test data
            const timestamp = Date.now();
            await page.locator('input[name*="name" i], input[placeholder*="name" i]').first().fill(`Test Lead ${timestamp}`);
            await page.locator('input[type="email"]').first().fill(`testlead${timestamp}@example.com`);
            await page.locator('input[type="tel"], input[name*="phone" i]').first().fill('+966501234567');

            // Select source if available
            const sourceSelect = page.locator('[class*="source"] .el-select, select[name*="source"]').first();
            if (await sourceSelect.isVisible()) {
                await sourceSelect.click();
                await page.locator('.el-select-dropdown__item').first().click();
            }

            // Submit form
            await page.getByRole('button', { name: /save|submit|حفظ|إنشاء/i }).click();

            // Should redirect to leads list or show success
            await expect(page.locator('text=/success|saved|created|تم/i').first()).toBeVisible({ timeout: 10000 });
        });
    });

    test.describe('View Lead Details', () => {

        test('should view lead details', async ({ page }) => {
            await page.goto('/sales/leads');

            // Click on first lead in the list
            const firstLead = page.locator('table tbody tr, [class*="list-item"]').first();
            await firstLead.click();

            // Should navigate to lead details
            await expect(page).toHaveURL(/leads\/[a-zA-Z0-9-]+/);

            // Check details are displayed
            await expect(page.locator('text=/contact|details|معلومات/i').first()).toBeVisible();
        });

        test('should display lead activity timeline', async ({ page }) => {
            await page.goto('/sales/leads');

            await page.locator('table tbody tr, [class*="list-item"]').first().click();
            await expect(page).toHaveURL(/leads\/[a-zA-Z0-9-]+/);

            // Check for activity section
            await expect(page.locator('text=/activity|timeline|نشاط/i').first()).toBeVisible({ timeout: 5000 });
        });
    });

    test.describe('Edit Lead', () => {

        test('should edit existing lead', async ({ page }) => {
            await page.goto('/sales/leads');

            // Click on first lead
            await page.locator('table tbody tr, [class*="list-item"]').first().click();
            await expect(page).toHaveURL(/leads\/[a-zA-Z0-9-]+/);

            // Click edit button
            await page.getByRole('button', { name: /edit|تعديل/i }).first().click();

            // Change something
            const nameInput = page.locator('input[name*="name" i], input[placeholder*="name" i]').first();
            await nameInput.clear();
            await nameInput.fill(`Updated Lead ${Date.now()}`);

            // Save
            await page.getByRole('button', { name: /save|update|حفظ|تحديث/i }).click();

            // Should show success
            await expect(page.locator('text=/success|updated|saved|تم/i').first()).toBeVisible({ timeout: 10000 });
        });
    });

    test.describe('Convert Lead', () => {

        test('should convert lead to opportunity', async ({ page }) => {
            await page.goto('/sales/leads');

            // Click on first lead
            await page.locator('table tbody tr, [class*="list-item"]').first().click();
            await expect(page).toHaveURL(/leads\/[a-zA-Z0-9-]+/);

            // Find convert button
            const convertBtn = page.getByRole('button', { name: /convert|تحويل/i }).first();
            if (await convertBtn.isVisible()) {
                await convertBtn.click();

                // Should show conversion dialog or navigate
                await expect(page.locator('[class*="dialog"], [class*="modal"], text=/opportunity|فرصة/i').first()).toBeVisible({ timeout: 5000 });
            }
        });
    });
});
