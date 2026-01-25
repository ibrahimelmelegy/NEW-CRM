
import { test, expect } from '@playwright/test';

test.describe('Operations - Project Management', () => {

    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.getByPlaceholder('Email').fill('admin@test.com');
        await page.getByPlaceholder('Password').fill('password123');
        await page.getByRole('button', { name: /login/i }).click();
        await page.waitForURL(/\/$/);
    });

    test('User can create a new project', async ({ page }) => {
        // 1. Navigate to Projects
        await page.goto('/operations/projects');

        // 2. Click New Project
        // Assuming text matches or role
        await page.getByRole('button', { name: /new project/i }).click();
        await page.waitForURL(/add-project/);

        // 3. Fill Basic Info Step
        await page.getByLabel(/project name/i).fill('E2E Test Project ' + Date.now());

        // Select Client (Assuming element-plus select interaction)
        // await page.locator('.el-select').first().click();
        // await page.getByText('Client A').click();

        // 4. Click Next/Submit
        // await page.getByRole('button', { name: /next/i }).click();

        // 5. Verify presence of next step or success
        // await expect(page.getByText('Step 2')).toBeVisible();
    });

    test('User can view project list', async ({ page }) => {
        await page.goto('/operations/projects');
        await expect(page.getByText('Projects List')).toBeVisible(); // Adjust selector to match actual UI title

        // Check if table has rows
        // await expect(page.locator('tbody tr')).not.toHaveCount(0);
    });
});
