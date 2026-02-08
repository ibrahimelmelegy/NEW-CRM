import { test, expect } from '@playwright/test';
import { performLogin } from './auth.spec';

/**
 * ============================================
 * Operations Module Tests - HP Tech CRM
 * ============================================
 * Tests for Projects, Daily Tasks, Manpower, Vehicles, Assets
 */

test.describe('Operations Module', () => {

    test.beforeEach(async ({ page }) => {
        await performLogin(page);
    });

    // ============== PROJECTS ==============
    test.describe('Projects', () => {

        test('should display projects list', async ({ page }) => {
            await page.goto('/operations/projects');

            await expect(page.locator('text=/projects|مشاريع/i').first()).toBeVisible();
            await expect(page.locator('table, [class*="list"]').first()).toBeVisible();
        });

        test('should create new project', async ({ page }) => {
            await page.goto('/operations/projects/add-project');

            const timestamp = Date.now();
            await page.locator('input[name*="name" i], input[placeholder*="name" i]').first().fill(`Test Project ${timestamp}`);

            await page.getByRole('button', { name: /save|create|حفظ/i }).click();

            await expect(page.locator('text=/success|created|تم/i').first()).toBeVisible({ timeout: 10000 });
        });

        test('should view project details with tabs', async ({ page }) => {
            await page.goto('/operations/projects');

            await page.locator('table tbody tr').first().click();
            await expect(page).toHaveURL(/projects\/[a-zA-Z0-9-]+/);

            // Check for tabs (Manpower, Vehicles, Assets, etc)
            await expect(page.locator('text=/manpower|vehicle|asset|قوى عاملة|مركبات/i').first()).toBeVisible();
        });
    });

    // ============== DAILY TASKS ==============
    test.describe('Daily Tasks', () => {

        test('should display daily tasks list', async ({ page }) => {
            await page.goto('/operations/daily-task');

            await expect(page.locator('text=/daily|task|مهام/i').first()).toBeVisible();
        });

        test('should create new daily task', async ({ page }) => {
            await page.goto('/operations/daily-task/add-daily-task');

            const timestamp = Date.now();
            await page.locator('input[name*="title" i], textarea').first().fill(`Test Task ${timestamp}`);

            await page.getByRole('button', { name: /save|create|حفظ/i }).click();

            await expect(page.locator('text=/success|created|تم/i').first()).toBeVisible({ timeout: 10000 });
        });
    });

    // ============== MANPOWER ==============
    test.describe('Manpower', () => {

        test('should display manpower list', async ({ page }) => {
            await page.goto('/operations/manpower');

            await expect(page.locator('text=/manpower|قوى عاملة|عمال/i').first()).toBeVisible();
            await expect(page.locator('table, [class*="list"]').first()).toBeVisible();
        });

        test('should create new manpower entry', async ({ page }) => {
            await page.goto('/operations/manpower/add-manpower');

            const timestamp = Date.now();
            await page.locator('input[name*="name" i]').first().fill(`Worker ${timestamp}`);

            await page.getByRole('button', { name: /save|create|حفظ/i }).click();

            await expect(page.locator('text=/success|created|تم/i').first()).toBeVisible({ timeout: 10000 });
        });
    });

    // ============== VEHICLES ==============
    test.describe('Vehicles', () => {

        test('should display vehicles list', async ({ page }) => {
            await page.goto('/operations/vehicle');

            await expect(page.locator('text=/vehicle|مركبات|سيارات/i').first()).toBeVisible();
        });

        test('should view vehicle details', async ({ page }) => {
            await page.goto('/operations/vehicle');

            const vehicleRow = page.locator('table tbody tr').first();
            if (await vehicleRow.isVisible()) {
                await vehicleRow.click();
                await expect(page).toHaveURL(/vehicle\/[a-zA-Z0-9-]+/);
            }
        });
    });

    // ============== ASSETS ==============
    test.describe('Assets', () => {

        test('should display assets list', async ({ page }) => {
            await page.goto('/operations/assets');

            await expect(page.locator('text=/assets|أصول|معدات/i').first()).toBeVisible();
        });

        test('should create new asset', async ({ page }) => {
            await page.goto('/operations/assets/add-asset');

            const timestamp = Date.now();
            await page.locator('input[name*="name" i]').first().fill(`Asset ${timestamp}`);

            await page.getByRole('button', { name: /save|create|حفظ/i }).click();

            await expect(page.locator('text=/success|created|تم/i').first()).toBeVisible({ timeout: 10000 });
        });
    });

    // ============== SERVICES ==============
    test.describe('Services', () => {

        test('should display services list', async ({ page }) => {
            await page.goto('/operations/services');

            await expect(page.locator('text=/services|خدمات/i').first()).toBeVisible();
        });
    });

    // ============== ADDITIONAL MATERIAL ==============
    test.describe('Additional Material', () => {

        test('should display materials list', async ({ page }) => {
            await page.goto('/operations/additional-material');

            await expect(page.locator('text=/material|مواد/i').first()).toBeVisible();
        });
    });
});
